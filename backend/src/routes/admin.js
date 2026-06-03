import express from 'express';
import pool from '../config/db.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

// Homepage Content
router.get('/homepage-content', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM homepage_content ORDER BY display_order ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching homepage content' });
  }
});

router.put('/homepage-content/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, image_path, is_active } = req.body;
  try {
    await pool.query(
      'UPDATE homepage_content SET title = ?, description = ?, image_path = ?, is_active = ? WHERE id = ?',
      [title, description, image_path, is_active, id]
    );
    res.json({ message: 'Homepage content updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating homepage content' });
  }
});

// Announcements
router.get('/announcements', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM announcements ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

router.post('/announcements', async (req, res) => {
  const { title, content, status } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO announcements (title, content, status, created_at) VALUES (?, ?, ?, NOW())',
      [title, content, status || 'Draft']
    );
    res.json({ id: result.insertId, message: 'Announcement created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

router.put('/announcements/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, status } = req.body;
  try {
    await pool.query(
      'UPDATE announcements SET title = ?, content = ?, status = ? WHERE id = ?',
      [title, content, status, id]
    );
    res.json({ message: 'Announcement updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating announcement' });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [id]);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

// Gallery
router.get('/gallery', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM gallery ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching gallery' });
  }
});

router.post('/gallery', async (req, res) => {
  const { title, image_path } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO gallery (title, image_path, created_at) VALUES (?, ?, NOW())',
      [title, image_path]
    );
    res.json({ id: result.insertId, message: 'Gallery image added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding gallery image' });
  }
});

router.delete('/gallery/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM gallery WHERE id = ?', [id]);
    res.json({ message: 'Gallery image deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting gallery image' });
  }
});

// Settings
router.get('/settings', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
      );
    }
    res.json({ message: 'Settings saved' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error saving settings' });
  }
});

export default router;
