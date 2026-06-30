import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import makeUpload from '../middleware/upload.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();
router.use(authMiddleware);

const uploadGallery  = makeUpload('gallery');
const uploadHero     = makeUpload('hero');
const uploadAvatar   = makeUpload('avatars');
const uploadPageHero = makeUpload('page-heroes');

async function removeFile(filePath) {
  if (!filePath) return;
  try {
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      const match = filePath.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
      if (match) await cloudinary.uploader.destroy(match[1]);
    }
  } catch {}
}

// ── Admin profile ─────────────────────────────────────────────────────────────
router.get('/me', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, phone, role, avatar_path, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/me', uploadAvatar.single('avatar'), async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const [existing] = await pool.query('SELECT avatar_path FROM users WHERE id = ?', [req.user.id]);
    let avatar_path = existing[0]?.avatar_path;
    if (req.body.remove_avatar === 'true' && !req.file) {
      await removeFile(avatar_path);
      avatar_path = null;
    } else if (req.file) {
      await removeFile(avatar_path);
      avatar_path = req.file.path;
    }
    await pool.query(
      'UPDATE users SET name = ?, email = ?, phone = ?, avatar_path = ? WHERE id = ?',
      [name, email, phone || null, avatar_path || null, req.user.id]
    );
    const [updated] = await pool.query(
      'SELECT id, name, email, phone, role, avatar_path, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json(updated[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/me/password', async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password)
      return res.status(400).json({ message: 'Both current and new password are required' });
    if (new_password.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    const [rows] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const match = await bcrypt.compare(current_password, rows[0].password);
    if (!match) return res.status(400).json({ message: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// ── Hero image upload ─────────────────────────────────────────────────────────
router.post('/upload/hero', uploadHero.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Upload failed' });
  res.json({ image_path: req.file.path });
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
  const { title, title_rw, title_fr, content, content_rw, content_fr, status } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (title, title_rw, title_fr, content, content_rw, content_fr, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [title, title_rw || '', title_fr || '', content || '', content_rw || '', content_fr || '', status || 'Draft']
    );
    res.status(201).json({ id: result.insertId, message: 'Announcement created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  const { title, title_rw, title_fr, content, content_rw, content_fr, status } = req.body;
  try {
    await pool.query(
      'UPDATE announcements SET title=?, title_rw=?, title_fr=?, content=?, content_rw=?, content_fr=?, status=? WHERE id=?',
      [title, title_rw || '', title_fr || '', content || '', content_rw || '', content_fr || '', status, req.params.id]
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
  const image_path = req.file.path;
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

// ── Page Hero Sections ────────────────────────────────────────────────────────
router.get('/heroes/:page', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM page_heroes WHERE page_key = ? LIMIT 1', [req.params.page]);
    res.json(rows[0] || null);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error fetching hero' }); }
});

router.put('/heroes/:page', uploadPageHero.single('image'), async (req, res) => {
  const { title_en, title_rw, title_fr, subtitle_en, subtitle_rw, subtitle_fr, is_active } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM page_heroes WHERE page_key = ? LIMIT 1', [req.params.page]);
    let image_path = existing[0]?.image_path || null;
    if (req.file) {
      if (image_path) await removeFile(image_path);
      image_path = req.file.path;
    }
    await pool.query(
      `INSERT INTO page_heroes (page_key, title_en, title_rw, title_fr, subtitle_en, subtitle_rw, subtitle_fr, image_path, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE title_en=VALUES(title_en), title_rw=VALUES(title_rw), title_fr=VALUES(title_fr),
         subtitle_en=VALUES(subtitle_en), subtitle_rw=VALUES(subtitle_rw), subtitle_fr=VALUES(subtitle_fr),
         image_path=VALUES(image_path), is_active=VALUES(is_active), updated_at=NOW()`,
      [req.params.page, title_en || '', title_rw || '', title_fr || '', subtitle_en || '', subtitle_rw || '', subtitle_fr || '', image_path, is_active ?? 1]
    );
    const [rows] = await pool.query('SELECT * FROM page_heroes WHERE page_key = ? LIMIT 1', [req.params.page]);
    res.json(rows[0]);
  } catch (e) { console.error(e); res.status(500).json({ message: 'Error saving hero' }); }
});

export default router;
