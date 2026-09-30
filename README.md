# Library Management System

## Features
- Dashboard with book/member/loan counts
- Book CRUD: add, view, edit, delete
- Member CRUD: add, view, edit, delete
- Issue books to members
- Return books
- Automatic overdue status
- Book search
- MySQL transactions for issue/return operations
- Responsive HTML/CSS/JavaScript frontend
- Node.js + Express REST API

## Requirements
- Node.js 18+
- MySQL 8+
- VS Code or another editor

## Setup

1. Create the database:
   - Open MySQL Workbench or MySQL command line.
   - Run `database.sql`.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` from `.env.example` and set your MySQL password:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=library_db
   PORT=3000
   ```

4. Start:
   ```bash
   npm start
   ```

5. Open:
   http://localhost:3000

## Project structure

library_management_system/
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── database.sql
├── server.js
├── package.json
├── .env.example
└── README.md

## Important
Do not commit your real `.env` file or database password to GitHub. Add `.env` to `.gitignore` for a real project.
