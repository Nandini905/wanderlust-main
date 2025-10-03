const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  guest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  guests: {
    type: Number,
    required: true,
    min: 1
  },
  totalNights: {
    type: Number,
    required: true,
    min: 1
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    cleaningFee: {
      type: Number,
      default: 0
    },
    serviceFee: {
      type: Number,
      default: 0
    },
    taxes: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentIntentId: {
    type: String
  },
  cancellationPolicy: {
    type: String,
    enum: ['flexible', 'moderate', 'strict'],
    default: 'moderate'
  },
  specialRequests: {
    type: String,
    maxlength: 500
  },
  guestMessage: {
    type: String,
    maxlength: 1000
  },
  hostMessage: {
    type: String,
    maxlength: 1000
  },
  cancellationReason: {
    type: String,
    maxlength: 500
  },
  cancelledBy: {
    type: String,
    enum: ['guest', 'host', 'admin']
  },
  cancelledAt: {
    type: Date
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
bookingSchema.index({ listing: 1 });
bookingSchema.index({ guest: 1 });
bookingSchema.index({ host: 1 });
bookingSchema.index({ checkIn: 1, checkOut: 1 });
bookingSchema.index({ status: 1 });

// Virtual for booking duration in days
bookingSchema.virtual('duration').get(function() {
  const diffTime = Math.abs(this.checkOut - this.checkIn);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Check if booking is active (not cancelled or completed)
bookingSchema.virtual('isActive').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Check if booking can be cancelled
bookingSchema.virtual('canCancel').get(function() {
  if (!this.isActive) return false;
  const now = new Date();
  const daysUntilCheckIn = Math.ceil((this.checkIn - now) / (1000 * 60 * 60 * 24));
  
  switch (this.cancellationPolicy) {
    case 'flexible':
      return daysUntilCheckIn >= 1;
    case 'moderate':
      return daysUntilCheckIn >= 5;
    case 'strict':
      return daysUntilCheckIn >= 7;
    default:
      return false;
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
