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

module.exports = router;