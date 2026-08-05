import { v2 as cloudinary } from 'cloudinary';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port:     Number(process.env.DB_PORT) || 3306,
  ssl: { rejectUnauthorized: false },
  supportBigNumbers: true,
  bigNumberStrings: false,
});

// Table → column mappings (only tables that actually have image columns)
const TABLE_COLUMNS = [
  { table: 'product_images',  col: 'image_path' },
  { table: 'categories',      col: 'image_path' },
  { table: 'subcategories',   col: 'image_path' },
  { table: 'product_variants',col: 'image_path' },
  { table: 'gallery',         col: 'image_path' },
  { table: 'homepage_content',col: 'image_path' },
  { table: 'page_heroes',     col: 'image_path' },
  { table: 'users',           col: 'avatar_path' },
  { table: 'settings',        col: 'setting_value' },
];

const FOLDERS = ['products', 'categories', 'subcategories', 'variants', 'gallery', 'hero', 'page-heroes', 'avatars'];
const MAX_SIZE = 9.5 * 1024 * 1024; // 9.5 MB

async function updateDb(conn, oldPath, newUrl) {
  let total = 0;
  for (const { table, col } of TABLE_COLUMNS) {
    try {
      const [r] = await conn.execute(
        `UPDATE ${table} SET ${col} = ? WHERE ${col} = ?`,
        [newUrl, oldPath]
      );
      total += r.affectedRows;
    } catch (_) { /* column doesn't exist in this table, skip */ }
  }
  return total;
}

async function run() {
  const conn = await pool.getConnection();
  let uploaded = 0, skipped = 0, updated = 0;

  for (const folder of FOLDERS) {
    const dir = path.join(__dirname, 'uploads', folder);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const localPath = path.join(dir, file);
      const stat = fs.statSync(localPath);
      const dbPath = `uploads/${folder}/${file}`;

      if (stat.size > MAX_SIZE) {
        console.warn(`⚠ SKIP (too large ${(stat.size/1024/1024).toFixed(1)}MB): ${folder}/${file}`);
        skipped++;
        continue;
      }

      try {
        const result = await cloudinary.uploader.upload(localPath, {
          folder: `umuhoza/${folder}`,
          use_filename: true,
          unique_filename: false,
          overwrite: false,
        });
        const cloudUrl = result.secure_url;
        const rows = await updateDb(conn, dbPath, cloudUrl);
        console.log(`✓ ${folder}/${file} → ${rows} rows updated`);
        uploaded++;
        updated += rows;
      } catch (err) {
        console.error(`✗ ${folder}/${file}: ${err.message}`);
        skipped++;
      }
    }
  }

  conn.release();
  await pool.end();
  console.log(`\nDone: ${uploaded} uploaded, ${skipped} skipped, ${updated} DB rows updated.`);
}

run().catch(console.error);
