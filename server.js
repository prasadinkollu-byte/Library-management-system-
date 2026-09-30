require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_db',
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const [[books]] = await pool.query('SELECT COUNT(*) total, COALESCE(SUM(quantity),0) copies, COALESCE(SUM(available_quantity),0) available FROM books');
    const [[members]] = await pool.query('SELECT COUNT(*) total FROM members');
    const [[issued]] = await pool.query("SELECT COUNT(*) total FROM loans WHERE status IN ('Issued','Overdue')");
    const [[overdue]] = await pool.query("SELECT COUNT(*) total FROM loans WHERE status='Overdue' OR (status='Issued' AND due_date < CURDATE())");
    res.json({books, members, issued, overdue});
  } catch (e) { res.status(500).json({error:e.message}); }
});

app.get('/api/books', async (req,res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ORDER BY id DESC');
    res.json(rows);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/books', async (req,res) => {
  try {
    const {title, author, isbn, category, quantity} = req.body;
    const qty = Number(quantity);
    if(!title || !author || !Number.isInteger(qty) || qty < 1) return res.status(400).json({error:'Title, author and a valid quantity are required.'});
    const [r] = await pool.query(
      'INSERT INTO books(title,author,isbn,category,quantity,available_quantity) VALUES (?,?,?,?,?,?)',
      [title,author,isbn || null,category || null,qty,qty]
    );
    res.status(201).json({id:r.insertId});
  } catch(e){ res.status(500).json({error:e.code === 'ER_DUP_ENTRY' ? 'ISBN already exists.' : e.message}); }
});

app.put('/api/books/:id', async (req,res) => {
  try {
    const {title, author, isbn, category, quantity} = req.body;
    const id = Number(req.params.id);
    const [[old]] = await pool.query('SELECT quantity, available_quantity FROM books WHERE id=?',[id]);
    if(!old) return res.status(404).json({error:'Book not found.'});
    const qty = Number(quantity);
    const borrowed = old.quantity - old.available_quantity;
    if(!Number.isInteger(qty) || qty < borrowed) return res.status(400).json({error:`Quantity cannot be less than borrowed copies (${borrowed}).`});
    const available = qty - borrowed;
    await pool.query('UPDATE books SET title=?,author=?,isbn=?,category=?,quantity=?,available_quantity=? WHERE id=?',
      [title,author,isbn || null,category || null,qty,available,id]);
    res.json({message:'Book updated.'});
  } catch(e){ res.status(500).json({error:e.code === 'ER_DUP_ENTRY' ? 'ISBN already exists.' : e.message}); }
});

app.delete('/api/books/:id', async (req,res) => {
  try {
    await pool.query('DELETE FROM books WHERE id=?',[Number(req.params.id)]);
    res.json({message:'Book deleted.'});
  } catch(e){ res.status(400).json({error:'Cannot delete a book that has loan records.'}); }
});

app.get('/api/members', async (req,res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM members ORDER BY id DESC');
    res.json(rows);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/members', async (req,res) => {
  try {
    const {name,email,phone,address}=req.body;
    if(!name || !email) return res.status(400).json({error:'Name and email are required.'});
    const [r]=await pool.query('INSERT INTO members(name,email,phone,address) VALUES(?,?,?,?)',[name,email,phone||null,address||null]);
    res.status(201).json({id:r.insertId});
  } catch(e){ res.status(500).json({error:e.code==='ER_DUP_ENTRY'?'Email already exists.':e.message}); }
});

app.put('/api/members/:id', async (req,res) => {
  try {
    const {name,email,phone,address}=req.body;
    await pool.query('UPDATE members SET name=?,email=?,phone=?,address=? WHERE id=?',[name,email,phone||null,address||null,Number(req.params.id)]);
    res.json({message:'Member updated.'});
  } catch(e){ res.status(500).json({error:e.code==='ER_DUP_ENTRY'?'Email already exists.':e.message}); }
});

app.delete('/api/members/:id', async (req,res) => {
  try { await pool.query('DELETE FROM members WHERE id=?',[Number(req.params.id)]); res.json({message:'Member deleted.'}); }
  catch(e){ res.status(400).json({error:'Cannot delete a member with loan records.'}); }
});

app.get('/api/loans', async (req,res) => {
  try {
    await pool.query("UPDATE loans SET status='Overdue' WHERE status='Issued' AND due_date < CURDATE()");
    const [rows]=await pool.query(`
      SELECT l.id,l.book_id,l.member_id,l.issue_date,l.due_date,l.return_date,l.status,
             b.title book_title,m.name member_name,m.email member_email
      FROM loans l JOIN books b ON b.id=l.book_id JOIN members m ON m.id=l.member_id
      ORDER BY l.id DESC`);
    res.json(rows);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.post('/api/loans', async (req,res) => {
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {book_id,member_id,due_date}=req.body;
    const [[book]]=await conn.query('SELECT available_quantity FROM books WHERE id=? FOR UPDATE',[book_id]);
    if(!book || book.available_quantity < 1) throw new Error('Book is not available.');
    const [[member]]=await conn.query('SELECT id FROM members WHERE id=?',[member_id]);
    if(!member) throw new Error('Member not found.');
    await conn.query("INSERT INTO loans(book_id,member_id,issue_date,due_date,status) VALUES(?,?,CURDATE(),?,'Issued')",[book_id,member_id,due_date]);
    await conn.query('UPDATE books SET available_quantity=available_quantity-1 WHERE id=?',[book_id]);
    await conn.commit();
    res.status(201).json({message:'Book issued successfully.'});
  } catch(e){ await conn.rollback(); res.status(400).json({error:e.message}); }
  finally { conn.release(); }
});

app.put('/api/loans/:id/return', async (req,res) => {
  const conn=await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[loan]]=await conn.query('SELECT book_id,status FROM loans WHERE id=? FOR UPDATE',[Number(req.params.id)]);
    if(!loan) throw new Error('Loan not found.');
    if(loan.status==='Returned') throw new Error('Book is already returned.');
    await conn.query("UPDATE loans SET return_date=CURDATE(),status='Returned' WHERE id=?",[Number(req.params.id)]);
    await conn.query('UPDATE books SET available_quantity=available_quantity+1 WHERE id=?',[loan.book_id]);
    await conn.commit();
    res.json({message:'Book returned successfully.'});
  } catch(e){ await conn.rollback(); res.status(400).json({error:e.message}); }
  finally { conn.release(); }
});

app.get('/api/search', async (req,res) => {
  try {
    const q=`%${req.query.q || ''}%`;
    const [rows]=await pool.query(
      `SELECT * FROM books WHERE title LIKE ? OR author LIKE ? OR category LIKE ? OR isbn LIKE ? ORDER BY title`,
      [q,q,q,q]
    );
    res.json(rows);
  } catch(e){ res.status(500).json({error:e.message}); }
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, ()=>console.log(`Library Management System running at http://localhost:${PORT}`));