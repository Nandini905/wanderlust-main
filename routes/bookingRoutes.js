const express = require('express');
const router = express.Router();

// Booking routes
router.get('/', (req, res) => {
  res.render('bookings/index', { title: 'My Bookings', user: req.user || null });
});

router.get('/:id', (req, res) => {
  res.render('bookings/show', { title: 'Booking Details', user: req.user || null });
});

module.exports = router;