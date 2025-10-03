const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wanderlust', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    if (String(process.env.ALLOW_NO_DB).toLowerCase() === 'true') {
      console.warn('ALLOW_NO_DB=true set — continuing to run without MongoDB. API endpoints that require DB will fail.');
      return; // do not exit; allow server to start for front-end pages
    }
    process.exit(1);
  }
};

module.exports = connectDB;
