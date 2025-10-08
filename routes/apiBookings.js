const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Booking = require('../models/Booking');
const Listing = require('../models/Listing');

// POST /api/bookings
// body: { userId, propertyId, checkIn, checkOut, guests }
router.post('/', async (req, res) => {
  try {
    const { userId, propertyId, checkIn, checkOut, guests = 1 } = req.body || {};

    if (!userId || !propertyId || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'userId, propertyId, checkIn, and checkOut are required' });
    }

    const listing = await Listing.findById(propertyId).lean();
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const msPerDay = 1000 * 60 * 60 * 24;
    const totalNights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / msPerDay));

    const basePrice = Number(listing.pricePerNight || 0) * totalNights;
    const cleaningFee = 0;
    const serviceFee = 0;
    const taxes = 0;
    const total = basePrice + cleaningFee + serviceFee + taxes;

    const booking = await Booking.create({
      listing: new mongoose.Types.ObjectId(propertyId),
      guest: new mongoose.Types.ObjectId(userId),
      host: listing.owner ? new mongoose.Types.ObjectId(listing.owner) : new mongoose.Types.ObjectId(userId),
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests) || 1,
      totalNights,
      pricing: { basePrice, cleaningFee, serviceFee, taxes, total },
      status: 'pending',
      paymentStatus: 'pending'
    });

    return res.status(201).json({
      success: true,
      bookingId: booking._id,
      totalPrice: total,
      totalNights
    });
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


