const Listing = require('../models/Listing');
const { validationResult } = require('express-validator');

// Get all listings with filters
const getListings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      minPrice,
      maxPrice,
      propertyType,
      roomType,
      minGuests,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filters = { isActive: true };

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
        { 'location.state': { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      filters.pricePerNight = {};
      if (minPrice) filters.pricePerNight.$gte = parseInt(minPrice);
      if (maxPrice) filters.pricePerNight.$lte = parseInt(maxPrice);
    }

    if (propertyType) {
      filters.propertyType = propertyType;
    }

    if (roomType) {
      filters.roomType = roomType;
    }

    if (minGuests) {
      filters.maxGuests = { $gte: parseInt(minGuests) };
    }

    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      filters.amenities = { $all: amenityArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const listings = await Listing.find(filters)
      .populate('owner', 'username firstName lastName avatar')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Listing.countDocuments(filters);

    res.json({
      success: true,
      count: listings.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      listings
    });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get single listing
const getListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('owner', 'username firstName lastName avatar bio')
      .populate({
        path: 'reviews',
        populate: {
          path: 'author',
          select: 'username firstName lastName avatar'
        }
      });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Increment view count
    listing.views += 1;
    await listing.save();

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Create listing
const createListing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const listingData = {
      ...req.body,
      owner: req.user._id
    };

    // Add processed images if any
    if (req.processedImages && req.processedImages.length > 0) {
      listingData.images = req.processedImages.map((img, index) => ({
        url: img.url,
        isPrimary: index === 0
      }));
    }

    const listing = await Listing.create(listingData);

    // Populate owner data
    await listing.populate('owner', 'username firstName lastName avatar');

    res.status(201).json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Update listing
const updateListing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this listing'
      });
    }

    // Update listing data
    const updateData = { ...req.body };

    // Add new images if any
    if (req.processedImages && req.processedImages.length > 0) {
      const newImages = req.processedImages.map((img, index) => ({
        url: img.url,
        isPrimary: index === 0
      }));
      updateData.images = [...listing.images, ...newImages];
    }

    listing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'username firstName lastName avatar');

    res.json({
      success: true,
      listing
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Delete listing
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: 'Listing not found'
      });
    }

    // Check ownership
    if (listing.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }

    // Soft delete
    listing.isActive = false;
    await listing.save();

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get user's listings
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ owner: req.user._id })
      .populate('owner', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: listings.length,
      listings
    });
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Get featured listings
const getFeaturedListings = async (req, res) => {
  try {
    const listings = await Listing.find({ 
      isActive: true, 
      featured: true 
    })
      .populate('owner', 'username firstName lastName avatar')
      .sort({ rating: -1, views: -1 })
      .limit(6);

    res.json({
      success: true,
      listings
    });
  } catch (error) {
    console.error('Get featured listings error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
  getFeaturedListings
};
