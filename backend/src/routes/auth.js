import express from 'express';
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(200).json({ message: 'If that email exists, a reset has been initiated.' });
    }

    const temporaryPassword = `Umuhoza!${Math.random().toString(36).slice(2, 10)}`;
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id]);

    res.json({
      message: 'Temporary password has been set. Use it to login and then change your password.',
      temporaryPassword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Unable to reset password at this time.' });
  }
});

export default router;
