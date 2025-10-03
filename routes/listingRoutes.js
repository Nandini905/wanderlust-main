const express = require('express');
const router = express.Router();

// Listing routes
router.get('/', (req, res) => {
  res.render('listings/index', { title: 'All Listings', user: req.user || null });
});

router.get('/new', (req, res) => {
  res.render('listings/new', { title: 'New Listing', user: req.user || null });
});

router.get('/edit/:id', (req, res) => {
  res.render('listings/edit', { title: 'Edit Listing', user: req.user || null });
});

router.get('/myListings', (req, res) => {
  res.render('listings/myListings', { title: 'My Listings', user: req.user || null });
});

router.get('/:id', (req, res) => {
  res.render('listings/show', { title: 'Listing Details', user: req.user || null });
});

module.exports = router;