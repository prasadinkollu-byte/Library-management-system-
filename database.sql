CREATE DATABASE IF NOT EXISTS library_db;
USE library_db;

CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  author VARCHAR(120) NOT NULL,
  isbn VARCHAR(30) UNIQUE,
  category VARCHAR(80),
  quantity INT NOT NULL DEFAULT 1,
  available_quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(25),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS loans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  book_id INT NOT NULL,
  member_id INT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE NULL,
  status ENUM('Issued','Returned','Overdue') NOT NULL DEFAULT 'Issued',
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT
);

INSERT IGNORE INTO books (title, author, isbn, category, quantity, available_quantity) VALUES
('Clean Code', 'Robert C. Martin', '9780132350884', 'Programming', 5, 5),
('The Alchemist', 'Paulo Coelho', '9780062315007', 'Fiction', 4, 4),
('Database System Concepts', 'Abraham Silberschatz', '9780078022159', 'Database', 3, 3);

INSERT IGNORE INTO members (name, email, phone, address) VALUES
('Demo Student', 'student@example.com', '9876543210', 'Kadapa');