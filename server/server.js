require('dotenv').config();

// Configure Node.js memory management
const v8 = require('v8');
v8.setFlagsFromString('--max-old-space-size=4096');

// Enable garbage collection logging in development
if (process.env.NODE_ENV === 'development') {
  v8.setFlagsFromString('--trace-gc');
}

// Handle memory warnings
process.on('warning', (warning) => {
  if (warning.name === 'HeapSizeWarning') {
    console.warn('Memory warning:', warning.message);
    global.gc && global.gc();
  }
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const productsRoutes = require('./routes/products');
const deliveriesRoutes = require('./routes/deliveries');

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/deliveries', deliveriesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// MongoDB connection configuration
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10,
  minPoolSize: 0,
  autoIndex: true,
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true
  }
};

// MongoDB connection with retry logic
const connectWithRetry = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB already connected');
      return;
    }

    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017/megaion-scms', MONGO_OPTIONS);
    
    // Log connection details
    console.log('MongoDB connected successfully');
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Database name:', mongoose.connection.name);
    return;
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Full error:', JSON.stringify(err, null, 2));
    
    // Schedule a retry
    console.log('Scheduling reconnection attempt in 5 seconds...');
    setTimeout(connectWithRetry, 5000);
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
  console.log('Connection state:', mongoose.connection.readyState);
  console.log('Database name:', mongoose.connection.name);
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  console.error('Connection state:', mongoose.connection.readyState);
  console.error('Full error details:', JSON.stringify(err, null, 2));
});

// Track connection state to prevent multiple reconnection attempts
let isConnecting = false;

mongoose.connection.on('disconnected', async () => {
  console.log('MongoDB disconnected');
  
  if (!isConnecting) {
    isConnecting = true;
    console.log('Attempting to reconnect...');
    
    try {
      await connectWithRetry();
    } finally {
      isConnecting = false;
    }
  } else {
    console.log('Reconnection already in progress...');
  }
});

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during MongoDB disconnect:', err);
    process.exit(1);
  }
});

// Connect to MongoDB
connectWithRetry()
.then(() => {
  console.log('Connected to MongoDB');
  
  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});
