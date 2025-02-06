const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/user');

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for username:', username);
  try {
    // Validate input
    if (!username || !password) {
      console.log('Missing credentials in login attempt');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. Current state:', mongoose.connection.readyState);
      return res.status(503).json({
        message: 'Database service temporarily unavailable. Please try again.'
      });
    }

    // Find user by username with retry
    let user;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Use lean() for better performance, but only after selecting password
        user = await User.findOne({ username })
          .select('+password')
          .maxTimeMS(5000)  // Reduce timeout to fail faster
          .exec();
        break;
      } catch (err) {
        console.error(`Error finding user (attempt ${attempt + 1}/${MAX_RETRIES}):`, err.message);
        
        if (attempt === MAX_RETRIES - 1) {
          if (err.name === 'MongooseError' || err.message.includes('buffering timed out')) {
            return res.status(503).json({
              message: 'Database operation timed out. Please try again.'
            });
          }
          throw err;
        }
        
        console.log(`Retrying in ${RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }

    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        _id: user._id.toString(), 
        role: user.role,
        username: user.username,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Create response object
    const response = {
      _id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      token
    };

    console.log('Login successful for user:', username);
    console.log('Response:', { ...response, token: token.substring(0, 20) + '...' });

    // Return user info and token
    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    console.error('Stack trace:', error.stack);
    
    // Handle specific error types
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(503).json({ 
        message: 'Database service temporarily unavailable. Please try again.'
      });
    }
    
    if (error.name === 'MongooseError' || error.message.includes('buffering timed out')) {
      return res.status(503).json({ 
        message: 'Database connection timed out. Please try again.'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid input data provided.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(500).json({ 
        message: 'Error generating authentication token.'
      });
    }
    
    // For development, include error details
    res.status(500).json({ 
      message: 'An unexpected error occurred. Please try again later.',
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
});

// Get current user route
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
