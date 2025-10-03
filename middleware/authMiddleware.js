const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user is host
const requireHost = (req, res, next) => {
  if (!req.user || !req.user.isHost) {
    return res.status(403).json({ error: 'Host access required' });
  }
  next();
};

// Check if user owns resource
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      let resource;
      const resourceId = req.params.id;
      
      switch (resourceType) {
        case 'listing':
          const Listing = require('../models/Listing');
          resource = await Listing.findById(resourceId);
          break;
        case 'booking':
          const Booking = require('../models/Booking');
          resource = await Booking.findById(resourceId);
          break;
        case 'review':
          const Review = require('../models/Review');
          resource = await Review.findById(resourceId);
          break;
        default:
          return res.status(400).json({ error: 'Invalid resource type' });
      }

      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      // Check ownership based on resource type
      let isOwner = false;
      switch (resourceType) {
        case 'listing':
          isOwner = resource.owner.toString() === req.user._id.toString();
          break;
        case 'booking':
          isOwner = resource.guest.toString() === req.user._id.toString() || 
                   resource.host.toString() === req.user._id.toString();
          break;
        case 'review':
          isOwner = resource.author.toString() === req.user._id.toString();
          break;
      }

      if (!isOwner) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireHost,
  requireOwnership
};
