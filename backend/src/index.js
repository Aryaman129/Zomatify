const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: Log if environment variables are loaded
console.log('🔧 Environment variables loaded:');
console.log('   RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('   RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');

// Import routes AFTER environment variables are loaded
let paymentRoutes;
let orderRoutes;
let vendorRoutes;
try { 
  paymentRoutes = require('./routes/payments');
  console.log('✅ Payment routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load payment routes:', error.message);
  console.error('❌ Payment routes not available - skipping registration');
}

try { 
  orderRoutes = require('./routes/orders');
  console.log('✅ Order routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load order routes:', error.message);
  console.error('❌ Order routes not available - skipping registration');
}

try { 
  vendorRoutes = require('./routes/vendor');
  console.log('✅ Vendor routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load vendor routes:', error.message);
  console.error('❌ Vendor routes not available - skipping registration');
}

const app = express();
const PORT = process.env.PORT || 5001; // Temporarily use 5001 to test

// Security middleware
app.use(helmet());

// CORS configuration for mobile and network access
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://10.3.55.170:3000', // Network IP for mobile access
  'http://192.168.1.100:3000', // Common local network IP
  'http://192.168.0.100:3000', // Another common local network IP
  'http://172.16.0.100:3000', // Docker/container network IP
];

// Add production origins from environment variable
if (process.env.ALLOWED_ORIGINS) {
  const productionOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...productionOrigins);
  console.log('✅ Added production origins:', productionOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Allow any localhost or local network IP
    if (origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.includes('10.') ||
        origin.includes('192.168.') ||
        origin.includes('172.16.')) {
      return callback(null, true);
    }

    // Allow specific origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel domains
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }

    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    console.log('❌ Origin not allowed:', origin);
    console.log('   Allowed origins:', allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Zomatify Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
if (paymentRoutes) {
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes registered at /api/payments');
} else {
  console.log('❌ Payment routes not available - skipping registration');
}

if (orderRoutes) {
  app.use('/api/orders', orderRoutes);
  console.log('✅ Order routes registered at /api/orders');
} else {
  console.log('❌ Order routes not available - skipping registration');
}

if (vendorRoutes) {
  app.use('/api/vendor', vendorRoutes);
  console.log('✅ Vendor routes registered at /api/vendor');
} else {
  console.log('❌ Vendor routes not available - skipping registration');
}

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Zomatify API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      orders: '/api/orders',
      payments: '/api/payments',
      vendor: '/api/vendor',
      menu: '/api/menu',
      analytics: '/api/analytics'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Zomatify Backend Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base URL: http://0.0.0.0:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`📱 Network Access: Available on all network interfaces`);
});

module.exports = app;
