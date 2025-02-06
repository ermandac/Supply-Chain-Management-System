const express = require('express');
const router = express.Router();
const Delivery = require('../models/delivery');
const auth = require('../middleware/auth');

// Get all deliveries
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If customer is logged in, only show their deliveries
    if (req.user.role === 'CUSTOMER') {
      const deliveries = await Delivery.find()
        .populate({
          path: 'order',
          match: { customer: req.user._id },
          select: 'orderNumber customer products status'
        })
        .exec();
      
      // Filter out deliveries where order didn't match (customer filter)
      const filteredDeliveries = deliveries.filter(delivery => delivery.order !== null);
      return res.json(filteredDeliveries);
    }
    
    // For staff and admin, show all deliveries
    const deliveries = await Delivery.find(query)
      .populate('order', 'orderNumber customer products status')
      .exec();
    
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Error fetching deliveries' });
  }
});

// Get delivery by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate('order', 'orderNumber customer products status');
    
    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // If customer is logged in, verify ownership
    if (req.user.role === 'CUSTOMER' && delivery.order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ message: 'Error fetching delivery' });
  }
});

// Update delivery
router.put('/:id', auth, async (req, res) => {
  try {
    // Only staff and admin can update deliveries
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const delivery = await Delivery.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('order', 'orderNumber customer products status');

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Error updating delivery' });
  }
});

// Create delivery
router.post('/', auth, async (req, res) => {
  try {
    // Only staff and admin can create deliveries
    if (req.user.role === 'CUSTOMER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const delivery = new Delivery(req.body);
    await delivery.save();
    
    const populatedDelivery = await Delivery.findById(delivery._id)
      .populate('order', 'orderNumber customer products status');
    
    res.status(201).json(populatedDelivery);
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Error creating delivery' });
  }
});

module.exports = router;
