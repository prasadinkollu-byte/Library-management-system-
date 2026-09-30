const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, 'certs');
fs.mkdirSync(certDir, { recursive: true });

const key = path.join(certDir, 'localhost-key.pem');
const cert = path.join(certDir, 'localhost-cert.pem');

try {
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048',
    '-keyout', key,
    '-out', cert,
    '-days', '365',
    '-nodes',
    '-subj', '/CN=localhost'
  ], { stdio: 'inherit' });

  console.log('\nLocal HTTPS certificate created.');
  console.log('Key : ' + key);
  console.log('Cert: ' + cert);
  console.log('\nNext run: npm start');
  console.log('Then open: https://localhost:3000');
} catch (err) {
  console.error('\nCould not create the certificate.');
  console.error('Make sure OpenSSL is installed and available in PATH.');
  console.error('Windows: install OpenSSL, reopen the terminal, then run npm run cert.');
  console.error('macOS/Linux: install OpenSSL with your package manager if needed.');
  process.exit(1);
}