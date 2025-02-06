const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const auth = require('../middleware/auth');

// Get all orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, userId } = req.query;
    console.log('Query params:', { status, userId });
    console.log('User:', { role: req.user.role, _id: req.user._id });
    
    const query = {};
    
    if (status) query.status = status;
    
    // If user is a customer, only show their orders
    if (req.user.role === 'CUSTOMER') {
      query['customer._id'] = req.user._id;
      console.log('Customer query:', query);
    } else if (userId) {
      // For non-customer users, apply userId filter if provided
      try {
        // Ensure userId is a string before converting to ObjectId
        query['customer._id'] = mongoose.Types.ObjectId(userId.toString());
        console.log('Admin query:', query);
      } catch (err) {
        console.error('Error converting userId to ObjectId:', err);
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
    }
    
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user has permission to view this order
    if (req.user.role === 'CUSTOMER' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const order = new Order({
      ...req.body,
      customer: {
        _id: req.user._id,
        name: req.user.username
      }
    });
    
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Only allow status updates by staff or admin
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    order.status = status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
