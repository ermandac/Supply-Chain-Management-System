const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/user');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    console.log('Extracted token:', token);
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected in auth middleware. State:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Database service temporarily unavailable' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    // Get user from database
    try {
      const user = await User.findById(decoded._id).select('-password');
      console.log('Found user:', user ? { _id: user._id, role: user.role } : null);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (dbError) {
      console.error('Database error in auth middleware:', dbError);
      return res.status(500).json({ message: 'Error accessing user data' });
    }
  } catch (error) {
    console.error('Unexpected error in auth middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
