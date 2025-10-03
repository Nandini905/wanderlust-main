const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors());

// Core middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// View engine & layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// View Routes
app.get('/', (req, res) => {
  res.render('home', { 
    title: 'Home', 
    user: req.user || null, 
    listings: [
      {
        _id: '1',
        title: 'Beautiful Beach House',
        location: 'Malibu, CA',
        pricePerNight: 250,
        coverImage: '/images/placeholder-room.jpg',
        rating: 4.8
      }
    ]
  });
});

// Services view route
app.get('/services', (req, res) => {
  res.render('services/index', {
    title: 'Services',
    user: req.user || null
  });
});

// Backward-compatible alias
app.get('/service', (req, res) => {
  res.redirect(301, '/services');
});

// Experiences view route (aliases only)
app.get(['/experiences', '/experience'], (req, res) => {
  res.render('experiences/index', {
    title: 'Experiences',
    user: req.user || null
  });
});

// Listings view routes
app.get(['/apartments/varanasi', '/apartment/varanasi', '/varanasi/apartment'], (req, res) => {
  res.render('listings/varanasi-apartment', {
    title: 'Apartment in Varanasi',
    user: req.user || null
  });
});
// // Apartment demo page served from views/listings/appartments lists/1.ejs
// app.get("/apartments/5", (req, res) => {
//   res.render("listings/appartments lists/5");
// });

// app.get(['/apartments/1', '/listings/appartments/1', '/listings/apartments/1'], (req, res) => {
//   res.render('listings/appartments lists/1', {
//     title: 'Samyak Modern Apartment',
//     user: req.user || null
//   });
// });

// Generic apartments route: serve demo for id=1
app.get('/apartments/:id', (req, res, next) => {
  const id = req.params.id;
  const validIds = ['1', '2', '3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47']; // add as many as you have

  if (validIds.includes(id)) {
    return res.render(`listings/appartments lists/${id}`, {
      title: `Apartment ${id}`,
      user: req.user || null
    });
  }

  return next();
});

app.get('/listings', (req, res) => {
  res.render('listings/index', { 
    title: 'Browse Listings',
    user: req.user || null,
    listings: [
      {
        _id: '1',
        title: 'Beautiful Beach House',
        location: 'Malibu, CA',
        pricePerNight: 250,
        coverImage: '/images/placeholder-room.jpg',
        rating: 4.8
      },
      {
        _id: '2',
        title: 'Mountain Cabin',
        location: 'Aspen, CO',
        pricePerNight: 180,
        coverImage: '/images/placeholder-room.jpg',
        rating: 4.6
      }
    ]
  });
});

app.get('/listings/:id', (req, res) => {
  const listing = {
    _id: req.params.id,
    title: 'Beautiful Beach House',
    location: 'Malibu, CA',
    pricePerNight: 250,
    coverImage: '/images/placeholder-room.jpg',
    rating: 4.8,
    description: 'A stunning beachfront property with ocean views and modern amenities.',
    maxGuests: 6,
    owner: { _id: 'owner1', username: 'John Doe' }
  };
  
  res.render('listings/show', { 
    title: listing.title,
    user: req.user || null,
    listing: listing,
    reviews: [
      {
        _id: '1',
        rating: 5,
        comment: 'Amazing place! Perfect for a weekend getaway.',
        author: { username: 'Jane Smith' }
      }
    ]
  });
});

// Auth view routes
app.get('/users/login', (req, res) => {
  res.render('users/login', { title: 'Login' });
});

app.get('/users/signup', (req, res) => {
  res.render('users/signup', { title: 'Sign Up' });
});

app.get('/users/profile', (req, res) => {
  res.render('users/profile', { 
    title: 'Profile',
    user: req.user || null,
    bookings: []
  });
});

// Bookings view routes
app.get('/bookings', (req, res) => {
  res.render('bookings/index', { 
    title: 'My Bookings',
    user: req.user || null,
    bookings: []
  });
});

app.get('/bookings/:id', (req, res) => {
  res.render('bookings/show', { 
    title: 'Booking Details',
    user: req.user || null,
    booking: null
  });
});

// Reviews view routes
app.get('/listings/:id/reviews/new', (req, res) => {
  res.render('reviews/new', { 
    title: 'Write Review',
    user: req.user || null,
    listing: { _id: req.params.id, title: 'Sample Listing' }
  });
});

app.get('/listings/:id/reviews/:reviewId/edit', (req, res) => {
  res.render('reviews/edit', { 
    title: 'Edit Review',
    user: req.user || null,
    listing: { _id: req.params.id, title: 'Sample Listing' },
    review: { _id: req.params.reviewId, rating: 5, comment: 'Great place!' }
  });
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Error handling middleware
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Server (only start if run directly)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    try {
      const routes = [];
      app._router.stack.forEach((m) => {
        if (m.route && m.route.path) {
          routes.push({ method: Object.keys(m.route.methods)[0].toUpperCase(), path: m.route.path });
        }
      });
      console.log('Registered routes:', routes);
    } catch (e) {}
  });
}

module.exports = app;


