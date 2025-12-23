const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Database connection (async for serverless)
connectDB().catch(err => console.error('Database connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Backend API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// For Vercel serverless, don't start server
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
