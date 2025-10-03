# Wanderlust Travel Website

A comprehensive travel booking platform with apartment listings and unique experiences.

## Features

- **Apartment Listings**: Browse and book apartments (IDs 1-19)
- **Experience Pages**: Discover unique travel experiences (IDs 20-43)
- **User Authentication**: Login and signup functionality
- **Booking System**: Reserve apartments and experiences
- **Review System**: Rate and review your stays

## Deployment Instructions

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/wanderlust

# Session Secret
SESSION_SECRET=your-session-secret-here

# JWT Secret
JWT_SECRET=your-jwt-secret-here

# Port
PORT=3000
```

### Render.com Deployment

1. Connect your GitHub repository to Render
2. Set the following environment variables in Render dashboard:
   - `MONGODB_URI`: Your MongoDB connection string
   - `SESSION_SECRET`: A random secret string
   - `JWT_SECRET`: A random secret string
   - `PORT`: 3000 (or leave default)

3. Deploy settings:
   - **Build Command**: `npm install`
   - **Start Command**: `node app.js`
   - **Node Version**: 18 or higher

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your environment variables

3. Start the server:
   ```bash
   node app.js
   ```

## Project Structure

- `app.js` - Main Express application
- `config/db.js` - Database connection
- `routes/` - API routes
- `views/` - EJS templates
- `public/` - Static assets (CSS, images, JS)
- `models/` - Mongoose models
- `controllers/` - Route controllers
- `middleware/` - Custom middleware

## Experience Pages

The website includes 24 unique experience pages (20-43) featuring:
- Heritage walks
- Street food tours
- Yoga sessions
- Cooking classes
- Photography walks
- And many more!

Each experience page follows a consistent Airbnb-style design with:
- Hero sections with host information
- Image galleries
- Pricing and booking information
- Responsive design
