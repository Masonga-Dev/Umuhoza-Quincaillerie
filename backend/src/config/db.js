import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umuhoza_quincaillerie',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDb() {
  const connection = await pool.getConnection();
  try {
    await connection.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_rw TEXT DEFAULT NULL AFTER description`);
    await connection.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS description_fr TEXT DEFAULT NULL AFTER description_rw`);
  } catch (_) {
    // columns may already exist on older MySQL — safe to ignore
  } finally {
    connection.release();
  }
}

export default pool;
