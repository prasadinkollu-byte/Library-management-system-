# Library Management System — Local HTTPS Version

Full-stack Library Management System using:
- HTML/CSS/JavaScript frontend
- Node.js + Express backend
- MySQL database
- Local HTTPS with a self-signed localhost certificate

## Requirements

- Node.js 18+
- MySQL 8+
- OpenSSL
- VS Code or another editor

## 1. Extract the ZIP

Open the project folder in VS Code.

## 2. Install Node packages

```bash
npm install
```

## 3. Create the MySQL database

Open MySQL Workbench or MySQL command line and run:

```text
database.sql
```

This creates `library_db` and the required tables.

## 4. Configure the database

Copy `.env.example` to `.env` and set your MySQL password:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=library_db
PORT=3000
```

Do not upload `.env` to GitHub.

## 5. Create the local HTTPS certificate

Run:

```bash
npm run cert
```

This creates:

```text
certs/
├── localhost-key.pem
└── localhost-cert.pem
```

The certificate is valid for 365 days.

### If `npm run cert` says OpenSSL is missing

Install OpenSSL and make sure the `openssl` command is available in your terminal PATH, then reopen the terminal and run:

```bash
npm run cert
```

## 6. Start the application

```bash
npm start
```

Open Chrome/Edge/Firefox:

```text
https://localhost:3000
```

## Browser certificate warning

Because this is a self-signed development certificate, the browser may display a warning such as:

> Your connection is not private

For local development, this is expected. Use the browser's advanced option to continue to `localhost` if you trust the certificate you generated yourself.

Do NOT use this self-signed certificate for a public production website.

## 7. Application flow

```text
Browser
   |
   | HTTPS
   v
Node.js + Express
   |
   | MySQL
   v
library_db
```

## Features

- Dashboard
- Book CRUD
- Member CRUD
- Issue books
- Return books
- Automatic overdue status
- Search books
- MySQL transactions
- Responsive frontend
- Local HTTPS

## Production HTTPS

For a public deployment, use a proper domain and a trusted TLS certificate (for example, through your hosting provider or Let's Encrypt). Do not expose your MySQL database directly to the browser.
