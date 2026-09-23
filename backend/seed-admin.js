import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

dotenv.config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Umuhoza Company Ltd';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'admin';

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL and/or ADMIN_PASSWORD.');
  console.error('Set them in backend/.env — note the previously hardcoded password was committed to git history and must be rotated.');
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umuhoza_quincaillerie',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...(process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && { ssl: { rejectUnauthorized: false } }),
});

try {
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [ADMIN_EMAIL]);
  if (existing.length) {
    console.log(`Admin user already exists with email: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role, created_at) VALUES (?, ?, ?, ?, NOW())',
    [ADMIN_NAME, ADMIN_EMAIL, hashedPassword, ADMIN_ROLE]
  );

  console.log('Admin user created successfully!');
  console.log('ID:', result.insertId);
  console.log('Email:', ADMIN_EMAIL);
  console.log('Password:', ADMIN_PASSWORD);
} catch (error) {
  console.error('Failed to create admin user:', error);
  process.exit(1);
} finally {
  await pool.end();
}
