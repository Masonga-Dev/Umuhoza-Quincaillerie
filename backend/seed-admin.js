import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

dotenv.config();

const ADMIN_EMAIL = 'umuhozacompanyltd@gmail.com';
const ADMIN_PASSWORD = 'Umuhoza@02';
const ADMIN_NAME = 'Umuhoza Admin';
const ADMIN_ROLE = 'admin';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umuhoza_quincaillerie',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
