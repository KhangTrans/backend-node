const express = require('express');
const cors = require('cors');
const http = require('http');
const passport = require('passport');
require('dotenv').config();
const { connectMongoDB } = require('./config/mongodb');
const { connectRedis, disconnectRedis } = require('./config/redis');
const { initializeSocket } = require('./config/socket');

const app = express();
const server = http.createServer(app);

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://khangtrandev.id.vn',
    process.env.FRONTEND_URL
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/products', require('./routes/product.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/cart', require('./routes/cart.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/addresses', require('./routes/address.routes'));
app.use('/api/vouchers', require('./routes/voucher.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/messages', require('./routes/chat.routes'));
app.use('/api/chatbot', require('./routes/chatbot.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/reviews', require('./routes/review.routes'));
app.use('/api/recommendations', require('./routes/recommendation.routes'));

// Payment routes - Load on all environments
app.use('/api/payment', require('./routes/payment.routes'));

app.use('/api', require('./routes/sitemap.routes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Backend API',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'MongoDB',
    hasDatabaseUrl: !!process.env.MONGODB_URI
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: process.env.MONGODB_URI ? 'MongoDB configured' : 'NOT CONFIGURED - Please add MONGODB_URI'
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

// Initialize connections
const initializeServer = async () => {
  try {
    // Connect to MongoDB
    if (process.env.MONGODB_URI) {
      await connectMongoDB();
    } else {
      console.warn('⚠️  MONGODB_URI not configured');
    }

    // Initialize Redis connection
    await connectRedis().catch(err => {
      console.error('Failed to connect to Redis:', err);
    });

    // Initialize Socket.IO (only for non-Vercel environments)
    if (process.env.VERCEL !== '1') {
      initializeSocket(server);
    }
  } catch (error) {
    console.error('Failed to initialize server:', error);
  }
};

// Start initialization
initializeServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await disconnectRedis();
  process.exit(0);
});

// For Vercel serverless, don't start server
if (process.env.VERCEL !== '1') {
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
