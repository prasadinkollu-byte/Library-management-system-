const $ = id => document.getElementById(id);
const api = (url, options={}) => fetch(url,{headers:{'Content-Type':'application/json'},...options}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d});

document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));

function showPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  $(page).classList.add('active');
  document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.page===page));
  $('pageTitle').textContent=page==='loans'?'Issue / Return':page[0].toUpperCase()+page.slice(1);
  if(page==='dashboard') loadDashboard();
  if(page==='books') loadBooks();
  if(page==='members') loadMembers();
  if(page==='loans') loadLoans();
}

function toast(msg){$('toast').textContent=msg;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',2500)}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

async function loadDashboard(){
  const d=await api('/api/dashboard');
  $('bookCount').textContent=d.books.total;
  $('availableCount').textContent=d.books.available;
  $('memberCount').textContent=d.members.total;
  $('issuedCount').textContent=Number(d.issued.total)+Number(d.overdue.total);
}
async function loadBooks(){
  const rows=await api('/api/books');
  $('booksTable').innerHTML=rows.map(b=>`<tr><td>${b.id}</td><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${escapeHtml(b.category||'-')}</td><td>${b.available_quantity}/${b.quantity}</td><td><button class="edit" onclick='editBook(${JSON.stringify(b)})'>Edit</button><button class="danger" onclick="deleteBook(${b.id})">Delete</button></td></tr>`).join('');
}
function openBookForm(){ $('bookForm').hidden=false; }
function closeBookForm(){ $('bookForm').hidden=true; $('bookId').value=''; ['bookTitle','bookAuthor','bookIsbn','bookCategory','bookQty'].forEach(id=>$(id).value='');}
function editBook(b){openBookForm();$('bookId').value=b.id;$('bookTitle').value=b.title;$('bookAuthor').value=b.author;$('bookIsbn').value=b.isbn||'';$('bookCategory').value=b.category||'';$('bookQty').value=b.quantity;}
async function saveBook(){
  try{
    const body={title:$('bookTitle').value,author:$('bookAuthor').value,isbn:$('bookIsbn').value,category:$('bookCategory').value,quantity:$('bookQty').value};
    const id=$('bookId').value;
    await api(id?`/api/books/${id}`:'/api/books',{method:id?'PUT':'POST',body:JSON.stringify(body)});
    closeBookForm();toast('Book saved successfully');loadBooks();loadDashboard();
  }catch(e){toast(e.message)}
}
async function deleteBook(id){if(!confirm('Delete this book?'))return;try{await api('/api/books/'+id,{method:'DELETE'});toast('Book deleted');loadBooks();loadDashboard()}catch(e){toast(e.message)}}

async function loadMembers(){
  const rows=await api('/api/members');
  $('membersTable').innerHTML=rows.map(m=>`<tr><td>${m.id}</td><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.email)}</td><td>${escapeHtml(m.phone||'-')}</td><td>${escapeHtml(m.address||'-')}</td><td><button class="edit" onclick='editMember(${JSON.stringify(m)})'>Edit</button><button class="danger" onclick="deleteMember(${m.id})">Delete</button></td></tr>`).join('');
}
function openMemberForm(){$('memberForm').hidden=false}
function closeMemberForm(){$('memberForm').hidden=true;$('memberId').value='';['memberName','memberEmail','memberPhone','memberAddress'].forEach(id=>$(id).value='')}
function editMember(m){openMemberForm();$('memberId').value=m.id;$('memberName').value=m.name;$('memberEmail').value=m.email;$('memberPhone').value=m.phone||'';$('memberAddress').value=m.address||''}
async function saveMember(){
  try{const body={name:$('memberName').value,email:$('memberEmail').value,phone:$('memberPhone').value,address:$('memberAddress').value};const id=$('memberId').value;await api(id?`/api/members/${id}`:'/api/members',{method:id?'PUT':'POST',body:JSON.stringify(body)});closeMemberForm();toast('Member saved successfully');loadMembers();loadDashboard()}catch(e){toast(e.message)}
}
async function deleteMember(id){if(!confirm('Delete this member?'))return;try{await api('/api/members/'+id,{method:'DELETE'});toast('Member deleted');loadMembers();loadDashboard()}catch(e){toast(e.message)}}

async function openLoanForm(){
  $('loanForm').hidden=false;
  const [books,members]=await Promise.all([api('/api/books'),api('/api/members')]);
  $('loanBook').innerHTML=books.filter(b=>b.available_quantity>0).map(b=>`<option value="${b.id}">${escapeHtml(b.title)} (${b.available_quantity} available)</option>`).join('');
  $('loanMember').innerHTML=members.map(m=>`<option value="${m.id}">${escapeHtml(m.name)} - ${escapeHtml(m.email)}</option>`).join('');
  const d=new Date();d.setDate(d.getDate()+14);$('loanDue').value=d.toISOString().slice(0,10);
}
function closeLoanForm(){$('loanForm').hidden=true}
async function issueBook(){try{await api('/api/loans',{method:'POST',body:JSON.stringify({book_id:$('loanBook').value,member_id:$('loanMember').value,due_date:$('loanDue').value})});toast('Book issued');closeLoanForm();loadLoans();loadDashboard()}catch(e){toast(e.message)}}
async function loadLoans(){
  const rows=await api('/api/loans');
  $('loansTable').innerHTML=rows.map(l=>`<tr><td>${l.id}</td><td>${escapeHtml(l.book_title)}</td><td>${escapeHtml(l.member_name)}</td><td>${new Date(l.issue_date).toLocaleDateString()}</td><td>${new Date(l.due_date).toLocaleDateString()}</td><td><span class="badge ${l.status==='Overdue'?'overdue':''}">${l.status}</span></td><td>${l.status!=='Returned'?`<button class="primary" onclick="returnBook(${l.id})">Return</button>`:'—'}</td></tr>`).join('');
}
async function returnBook(id){try{await api(`/api/loans/${id}/return`,{method:'PUT'});toast('Book returned');loadLoans();loadDashboard()}catch(e){toast(e.message)}}

$('globalSearch').addEventListener('input',async e=>{
  if($('books').classList.contains('active') && e.target.value.trim()){
    try{const rows=await api('/api/search?q='+encodeURIComponent(e.target.value));$('booksTable').innerHTML=rows.map(b=>`<tr><td>${b.id}</td><td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${escapeHtml(b.category||'-')}</td><td>${b.available_quantity}/${b.quantity}</td><td><button class="edit" onclick='editBook(${JSON.stringify(b)})'>Edit</button></td></tr>`).join('')}catch{}
  } else if($('books').classList.contains('active')) loadBooks();
});

loadDashboard();