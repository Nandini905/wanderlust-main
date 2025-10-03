const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const { validationResult } = require('express-validator');

// Create booking
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { listingId, checkIn, checkOut, guests, specialRequests } = req.body;

    // Get listing
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Check if user is trying to book their own listing
    if (listing.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book your own listing'
      });
    }

    // Check availability
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const totalNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

    // Check for existing bookings in the date range
    const conflictingBookings = await Booking.find({
      listing: listingId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lte: checkInDate },
          checkOut: { $gt: checkInDate }
        },
        {
          checkIn: { $lt: checkOutDate },
          checkOut: { $gte: checkOutDate }
        },
        {
          checkIn: { $gte: checkInDate },
          checkOut: { $lte: checkOutDate }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Listing is not available for the selected dates'
      });
    }

    // Calculate pricing
    const basePrice = listing.pricePerNight * totalNights;
    const cleaningFee = listing.cleaningFee || 0;
    const serviceFee = Math.round(basePrice * 0.1); // 10% service fee
    const taxes = Math.round((basePrice + cleaningFee + serviceFee) * 0.08); // 8% tax
    const total = basePrice + cleaningFee + serviceFee + taxes;

    // Create booking
    const booking = await Booking.create({
      listing: listingId,
      guest: req.user._id,
      host: listing.owner,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: parseInt(guests),
      totalNights,
      pricing: {
        basePrice,
        cleaningFee,
        serviceFee,
        taxes,
        total
      },
      specialRequests,
      status: listing.instantBook ? 'confirmed' : 'pending'
    });

    // Populate related data
    await booking.populate([
      { path: 'listing', select: 'title location images pricePerNight' },
      { path: 'guest', select: 'username firstName lastName email' },
      { path: 'host', select: 'username firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get user's bookings
const getMyBookings = async (req, res) => {
  try {
    const { status, type = 'guest' } = req.query;

    let query = {};
    if (type === 'guest') {
      query.guest = req.user._id;
    } else if (type === 'host') {
      query.host = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('listing', 'title location images pricePerNight')
      .populate('guest', 'username firstName lastName avatar')
      .populate('host', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get single booking
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'title location images pricePerNight owner')
      .populate('guest', 'username firstName lastName avatar email phone')
      .populate('host', 'username firstName lastName avatar email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is authorized to view this booking
    const isGuest = booking.guest._id.toString() === req.user._id.toString();
    const isHost = booking.host._id.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update booking status (host only)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, message } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate('listing', 'owner');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user is the host
    if (booking.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the host can update booking status'
      });
    }

    // Update booking
    booking.status = status;
    if (message) {
      booking.hostMessage = message;
    }

    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    // Check if user can cancel this booking
    const isGuest = booking.guest.toString() === req.user._id.toString();
    const isHost = booking.host.toString() === req.user._id.toString();

    if (!isGuest && !isHost) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canCancel) {
      return res.status(400).json({
        success: false,
        error: 'Booking cannot be cancelled at this time'
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancelledBy = isGuest ? 'guest' : 'host';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;

    await booking.save();

    res.json({
      success: true,
      booking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get booking availability
const getAvailability = async (req, res) => {
  try {
    const { listingId, month, year } = req.query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const bookings = await Booking.find({
      listing: listingId,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lte: endDate },
          checkOut: { $gt: startDate }
        }
      ]
    }).select('checkIn checkOut status');

    // Generate availability calendar
    const availability = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const isBooked = bookings.some(booking => {
        const checkIn = new Date(booking.checkIn);
        const checkOut = new Date(booking.checkOut);
        return currentDate >= checkIn && currentDate < checkOut;
      });

      availability.push({
        date: dateStr,
        available: !isBooked
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBooking,
  updateBookingStatus,
  cancelBooking,
  getAvailability
};
