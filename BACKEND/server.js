require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./config/database');

// Import routes
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const paymentRoutes = require('./routes/payments');
const uploadRoutes = require('./routes/uploads');

// Create Express app
const app = express();

// ========================================
// MIDDLEWARE
// ========================================

// CORS configuration
const defaultOrigins = ['http://localhost:3000', 'http://127.0.0.1:5501', 'http://localhost:5501'];
const envOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('null')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked by server: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ========================================
// ROUTES
// ========================================

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ========================================
// ERROR HANDLING
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ========================================
// START SERVER
// ========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║     AGROMART BACKEND API SERVER       ║
╠════════════════════════════════════════╣
║ Server running on port: ${PORT}          ║
║ Environment: ${process.env.NODE_ENV || 'development'}  ║
║ Database: ${process.env.DB_NAME || 'agromart_db'}      ║
╚════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  GET  /api/products');
  console.log('  GET  /api/products/:productId');
  console.log('  GET  /api/products/category/:categoryName');
  console.log('  GET  /api/products/search/:query');
  console.log('  POST /api/orders');
  console.log('  GET  /api/orders/:orderId');
  console.log('  GET  /api/orders/user/:userId');
  console.log('  POST /api/users/register');
  console.log('  POST /api/users/login');
  console.log('  GET  /api/cart/:userId');
  console.log('  POST /api/cart/:userId/add');
  console.log('  GET  /api/wishlist/:userId');
  console.log('  POST /api/wishlist/:userId/add');
  console.log('  GET  /api/health');
});

module.exports = app;
