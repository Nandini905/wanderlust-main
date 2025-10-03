const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    checkIn: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracy: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    },
    value: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  comment: {
    type: String,
    required: true,
    maxlength: 2000
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  hostResponse: {
    message: {
      type: String,
      maxlength: 1000
    },
    respondedAt: {
      type: Date
    }
  },
  helpful: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    helpful: {
      type: Boolean
    }
  }],
  isVerified: {
    type: Boolean,
    default: true // Only verified guests can review
  }
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ listing: 1 });
reviewSchema.index({ author: 1 });
reviewSchema.index({ booking: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for average rating
reviewSchema.virtual('averageRating').get(function() {
  const ratings = Object.values(this.rating).filter(r => typeof r === 'number');
  return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
});

// Virtual for helpful count
reviewSchema.virtual('helpfulCount').get(function() {
  return this.helpful.filter(h => h.helpful).length;
});

// Static method to get average ratings for a listing
reviewSchema.statics.getAverageRatings = async function(listingId) {
  const result = await this.aggregate([
    { $match: { listing: listingId, isPublic: true } },
    {
      $group: {
        _id: null,
        averageOverall: { $avg: '$rating.overall' },
        averageCleanliness: { $avg: '$rating.cleanliness' },
        averageCommunication: { $avg: '$rating.communication' },
        averageCheckIn: { $avg: '$rating.checkIn' },
        averageAccuracy: { $avg: '$rating.accuracy' },
        averageLocation: { $avg: '$rating.location' },
        averageValue: { $avg: '$rating.value' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return result[0] || {
    averageOverall: 0,
    averageCleanliness: 0,
    averageCommunication: 0,
    averageCheckIn: 0,
    averageAccuracy: 0,
    averageLocation: 0,
    averageValue: 0,
    count: 0
  };
};

module.exports = mongoose.model('Review', reviewSchema);
