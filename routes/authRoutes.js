const express = require('express');
const router = express.Router();

// Simple auth routes for basic functionality
router.get('/login', (req, res) => {
  res.render('users/login', { title: 'Login' });
});

router.get('/signup', (req, res) => {
  res.render('users/signup', { title: 'Sign Up' });
});

router.get('/profile', (req, res) => {
  res.render('users/profile', { title: 'Profile', user: req.user || null });
});

// --- JSON API endpoints for signup/login ---
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 chars'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, details: errors.array() });
    }

    try {
      const { username, email, password } = req.body;
      const existing = await User.findOne({ $or: [{ email }, { username }] });
      if (existing) {
        return res.status(409).json({ success: false, error: 'User already exists' });
      }

      const user = await User.create({ username, email, password });
      const payload = { sub: String(user._id), email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.status(201).json({ success: true, user: { id: user._id, username, email }, token });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 1 }).withMessage('Password required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, details: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const ok = await user.comparePassword(password);
      if (!ok) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      const payload = { sub: String(user._id), email: user.email };
      const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.json({ success: true, user: { id: user._id, username: user.username, email }, token });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

module.exports = router;