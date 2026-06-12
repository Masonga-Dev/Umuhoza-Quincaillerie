import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const galleryDir = path.join(__dirname, '../../uploads/gallery');
if (!fs.existsSync(galleryDir)) fs.mkdirSync(galleryDir, { recursive: true });

const heroDir = path.join(__dirname, '../../uploads/hero');
if (!fs.existsSync(heroDir)) fs.mkdirSync(heroDir, { recursive: true });

function makeStorage(dir) {
  return multer.diskStorage({
    destination: dir,
    filename: (req, file, cb) => {
      const safe = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.-]/g, '');
      cb(null, `${Date.now()}-${safe}`);
    },
  });
}

const uploadGallery = multer({ storage: makeStorage(galleryDir) });
const uploadHero = multer({ storage: makeStorage(heroDir) });

async function removeFile(filePath) {
  if (!filePath) return;
  try {
    const full = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(full)) await fs.promises.unlink(full);
  } catch {}
}

// ── Hero image upload ─────────────────────────────────────────────────────────
router.post('/upload/hero', uploadHero.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Upload failed' });
  res.json({ image_path: `uploads/hero/${req.file.filename}` });
});

// ── Homepage Content ──────────────────────────────────────────────────────────
router.get('/homepage-content', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM homepage_content ORDER BY display_order ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching homepage content' });
  }
});

router.post('/homepage-content', async (req, res) => {
  const { section_name, title, description, image_path, display_order, is_active } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO homepage_content (section_name, title, description, image_path, display_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [section_name, title, description, image_path, display_order ?? 0, is_active ?? 1]
    );
    res.status(201).json({ id: result.insertId, message: 'Section created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating section' });
  }
});

router.put('/homepage-content/:id', async (req, res) => {
  const { section_name, title, description, image_path, display_order, is_active } = req.body;
  try {
    await pool.query(
      'UPDATE homepage_content SET section_name=?, title=?, description=?, image_path=?, display_order=?, is_active=? WHERE id=?',
      [section_name, title, description, image_path, display_order ?? 0, is_active ?? 1, req.params.id]
    );
    res.json({ message: 'Section updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating section' });
  }
});

router.delete('/homepage-content/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM homepage_content WHERE id = ?', [req.params.id]);
    res.json({ message: 'Section deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting section' });
  }
});

// ── Announcements ─────────────────────────────────────────────────────────────
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

router.post('/announcements', async (req, res) => {
  const { title, content, status } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (title, content, status, created_at) VALUES (?, ?, ?, NOW())',
      [title, content || '', status || 'Draft']
    );
    res.status(201).json({ id: result.insertId, message: 'Announcement created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  const { title, content, status } = req.body;
  try {
    await pool.query(
      'UPDATE announcements SET title=?, content=?, status=? WHERE id=?',
      [title, content || '', status, req.params.id]
    );
    res.json({ message: 'Announcement updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating announcement' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

// ── Gallery ───────────────────────────────────────────────────────────────────
router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gallery ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching gallery' });
  }
});

router.post('/gallery/upload', uploadGallery.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Upload failed' });
  const image_path = `uploads/gallery/${req.file.filename}`;
  const { title } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO gallery (title, image_path, created_at) VALUES (?, ?, NOW())',
      [title || '', image_path]
    );
    res.status(201).json({ id: result.insertId, image_path, message: 'Image uploaded' });
  } catch (error) {
    await removeFile(image_path);
    console.error(error);
    res.status(500).json({ message: 'Error saving gallery image' });
  }
});

router.delete('/gallery/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT image_path FROM gallery WHERE id = ?', [req.params.id]);
    if (rows.length) await removeFile(rows[0].image_path);
    await pool.query('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting image' });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach((r) => { settings[r.setting_key] = r.setting_value; });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    for (const [key, value] of Object.entries(req.body)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value ?? '', value ?? '']
      );
    }
    res.json({ message: 'Settings saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving settings' });
  }
});

export default router;
