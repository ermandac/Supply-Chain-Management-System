require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
// Import routes
const authRoutes = require('./server/routes/auth');
const orderRoutes = require('./server/routes/orders');
const productRoutes = require('./server/routes/products');
const deliveryRoutes = require('./server/routes/deliveries');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the Angular app
app.use(express.static(path.join(__dirname, 'dist/megaion-scms')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/deliveries', deliveryRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  res.status(500).json({ 
    message: 'Something broke!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// For any other routes, redirect to the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/megaion-scms/index.html'));
});

// MongoDB connection state listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
  console.log('Database name:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
  console.error('Connection state:', mongoose.connection.readyState);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  console.log('Connection state:', mongoose.connection.readyState);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT. Closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

// Log all MongoDB events for debugging
mongoose.connection.on('connecting', () => {
  console.log('Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('disconnecting', () => {
  console.log('Disconnecting from MongoDB...');
});

mongoose.connection.on('reconnected', () => {
  console.log('Reconnected to MongoDB');
});

mongoose.connection.on('close', () => {
  console.log('MongoDB connection closed');
});

// MongoDB connection with retries
async function connectWithRetry(retries = 5, delay = 2000) {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Connection attempt ${i + 1}/${retries}`);
      console.log('Current connection state:', mongoose.connection.readyState);

      if (mongoose.connection.readyState === 1) {
        console.log('Already connected to MongoDB');
        return true;
      }

      // Close any existing connection
      if (mongoose.connection.readyState !== 0) {
        console.log('Closing existing connection...');
        await mongoose.connection.close();
      }

      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms';
      console.log('Connecting to MongoDB at:', uri);

      await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 1000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        family: 4 // Force IPv4
      });

      // Verify connection by trying to execute a command
      console.log('Verifying connection with ping...');
      await mongoose.connection.db.admin().ping();
      
      console.log('=== MongoDB Connection Details ===');
      console.log(`Connected successfully (attempt ${i + 1}/${retries})`);
      console.log('Connection state:', mongoose.connection.readyState);
      console.log('Database name:', mongoose.connection.name);
      console.log('Host:', mongoose.connection.host);
      console.log('Port:', mongoose.connection.port);
      console.log('================================');
      
      return true;
    } catch (err) {
      lastError = err;
      console.error(`MongoDB connection attempt ${i + 1}/${retries} failed:`);
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Stack trace:', err.stack);
      
      if (i === retries - 1) {
        console.error('All connection attempts failed');
        console.error('Last error:', lastError);
        return false;
      }
      
      console.log(`Waiting ${delay}ms before next attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
}

// Initialize server only after MongoDB connects
async function startServer() {
  // Try to connect to MongoDB first
  const connected = await connectWithRetry();
  if (!connected) {
    console.error('Could not establish MongoDB connection. Server will not start.');
    process.exit(1);
  }

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Start the server
startServer();
