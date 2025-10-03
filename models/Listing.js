const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    zipCode: {
      type: String
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  cleaningFee: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceFee: {
    type: Number,
    default: 0,
    min: 0
  },
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  bedrooms: {
    type: Number,
    required: true,
    min: 0
  },
  beds: {
    type: Number,
    required: true,
    min: 0
  },
  bathrooms: {
    type: Number,
    required: true,
    min: 0
  },
  propertyType: {
    type: String,
    required: true,
    enum: ['apartment', 'house', 'condo', 'villa', 'cabin', 'loft', 'studio', 'other']
  },
  roomType: {
    type: String,
    required: true,
    enum: ['entire_place', 'private_room', 'shared_room']
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  amenities: [{
    type: String,
    enum: [
      'wifi', 'kitchen', 'parking', 'pool', 'gym', 'hot_tub', 'fireplace',
      'air_conditioning', 'heating', 'tv', 'washer', 'dryer', 'balcony',
      'garden', 'beach_access', 'mountain_view', 'city_view', 'pets_allowed',
      'smoking_allowed', 'elevator', 'security', 'concierge'
    ]
  }],
  houseRules: [{
    type: String,
    maxlength: 200
  }],
  availability: {
    calendar: [{
      date: Date,
      available: Boolean,
      price: Number
    }],
    minimumStay: {
      type: Number,
      default: 1
    },
    maximumStay: {
      type: Number,
      default: 365
    },
    advanceNotice: {
      type: Number,
      default: 1 // days
    }
  },
  instantBook: {
    type: Boolean,
    default: false
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  views: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
listingSchema.index({ 'location.coordinates': '2dsphere' });
listingSchema.index({ pricePerNight: 1 });
listingSchema.index({ owner: 1 });
listingSchema.index({ isActive: 1 });
listingSchema.index({ featured: 1 });

// Virtual for cover image
listingSchema.virtual('coverImage').get(function() {
  const primaryImage = this.images.find(img => img.isPrimary);
  return primaryImage ? primaryImage.url : (this.images[0] ? this.images[0].url : null);
});

// Virtual for full location
listingSchema.virtual('fullLocation').get(function() {
  return `${this.location.city}, ${this.location.state}, ${this.location.country}`;
});

module.exports = mongoose.model('Listing', listingSchema);
