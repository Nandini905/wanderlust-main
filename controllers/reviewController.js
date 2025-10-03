const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Listing = require('../models/Listing');
const { validationResult } = require('express-validator');

// Create review
const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { listingId, bookingId, rating, comment } = req.body;

    // Check if booking exists and user is the guest
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    if (booking.guest.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the guest can review this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Can only review completed bookings'
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      booking: bookingId,
      author: req.user._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Review already exists for this booking'
      });
    }

    // Create review
    const review = await Review.create({
      listing: listingId,
      booking: bookingId,
      author: req.user._id,
      rating: {
        overall: rating.overall,
        cleanliness: rating.cleanliness,
        communication: rating.communication,
        checkIn: rating.checkIn,
        accuracy: rating.accuracy,
        location: rating.location,
        value: rating.value
      },
      comment
    });

    // Update listing ratings
    await updateListingRatings(listingId);

    // Populate review data
    await review.populate([
      { path: 'author', select: 'username firstName lastName avatar' },
      { path: 'listing', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get listing reviews
const getListingReviews = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reviews = await Review.find({ 
      listing: listingId, 
      isPublic: true 
    })
      .populate('author', 'username firstName lastName avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ 
      listing: listingId, 
      isPublic: true 
    });

    // Get average ratings
    const averageRatings = await Review.getAverageRatings(listingId);

    res.json({
      success: true,
      count: reviews.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      reviews,
      averageRatings
    });
  } catch (error) {
    console.error('Get listing reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get user's reviews
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ author: req.user._id })
      .populate('listing', 'title location images')
      .populate('booking', 'checkIn checkOut')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update review
const updateReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check ownership
    if (review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this review'
      });
    }

    // Update review
    review.rating = {
      overall: rating.overall,
      cleanliness: rating.cleanliness,
      communication: rating.communication,
      checkIn: rating.checkIn,
      accuracy: rating.accuracy,
      location: rating.location,
      value: rating.value
    };
    review.comment = comment;

    await review.save();

    // Update listing ratings
    await updateListingRatings(review.listing);

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Delete review
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check ownership
    if (review.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this review'
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update listing ratings
    await updateListingRatings(review.listing);

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Host response to review
const addHostResponse = async (req, res) => {
  try {
    const { message } = req.body;

    const review = await Review.findById(req.params.id)
      .populate('listing', 'owner');

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if user is the host of the listing
    if (review.listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Only the host can respond to this review'
      });
    }

    // Update host response
    review.hostResponse = {
      message,
      respondedAt: new Date()
    };

    await review.save();

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Add host response error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Mark review as helpful
const markHelpful = async (req, res) => {
  try {
    const { helpful } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    // Check if user already marked this review
    const existingHelpful = review.helpful.find(
      h => h.user.toString() === req.user._id.toString()
    );

    if (existingHelpful) {
      // Update existing helpful mark
      existingHelpful.helpful = helpful;
    } else {
      // Add new helpful mark
      review.helpful.push({
        user: req.user._id,
        helpful
      });
    }

    await review.save();

    res.json({
      success: true,
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Helper function to update listing ratings
const updateListingRatings = async (listingId) => {
  try {
    const averageRatings = await Review.getAverageRatings(listingId);
    
    await Listing.findByIdAndUpdate(listingId, {
      'rating.average': averageRatings.averageOverall,
      'rating.count': averageRatings.count
    });
  } catch (error) {
    console.error('Update listing ratings error:', error);
  }
};

module.exports = {
  createReview,
  getListingReviews,
  getMyReviews,
  updateReview,
  deleteReview,
  addHostResponse,
  markHelpful
};
