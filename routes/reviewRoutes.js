const express = require('express');
const router = express.Router();

// Review routes
router.get('/new', (req, res) => {
  res.render('reviews/new', { title: 'Write Review', user: req.user || null });
});

router.get('/edit/:id', (req, res) => {
  res.render('reviews/edit', { title: 'Edit Review', user: req.user || null });
});

module.exports = router;