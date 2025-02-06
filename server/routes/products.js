const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const auth = require('../middleware/auth');

// Get all products with optional filtering
router.get('/', auth, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.itemStatus = status;
    if (category) filter.category = category;

    // Retrieve products with optional filtering
    const products = await Product.find(filter)
      .sort({ createdAt: -1 }) // Sort by most recently created
      .limit(1000); // Limit to prevent overwhelming response

    res.json(products);
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Create new product
router.post('/', auth, async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Update product status and tracking
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { itemStatus, trackingDetails } = req.body;
    
    // Validate input
    if (!['demo', 'inventory', 'delivery', 'sold', 'returned', 'maintenance'].includes(itemStatus)) {
      return res.status(400).json({ message: 'Invalid item status' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        itemStatus,
        'trackingDetails.serialNumber': trackingDetails?.serialNumber,
        'trackingDetails.barcodeId': trackingDetails?.barcodeId,
        'trackingDetails.locationTracking': {
          currentLocation: trackingDetails?.locationTracking?.currentLocation,
          lastUpdated: new Date()
        }
      }, 
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ message: 'Error updating product status' });
  }
});

// Update item status
router.patch('/:id/item-status', auth, async (req, res) => {
  try {
    const { itemStatus } = req.body;
    
    // Validate input
    const validStatuses = ['demo', 'inventory', 'delivery', 'sold', 'returned', 'maintenance'];
    if (!validStatuses.includes(itemStatus)) {
      return res.status(400).json({ message: 'Invalid item status' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { itemStatus }, 
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ message: 'Error updating item status' });
  }
});

// Update product tracking details
router.patch('/:id/tracking', auth, async (req, res) => {
  try {
    const { serialNumber, locationTracking } = req.body;
    
    // Prepare update object
    const updateData = {};
    
    // Add serial number if provided
    if (serialNumber) {
      updateData['trackingDetails.serialNumber'] = serialNumber;
    }
    
    // Add location tracking if provided
    if (locationTracking && locationTracking.currentLocation) {
      updateData['trackingDetails.locationTracking.currentLocation'] = locationTracking.currentLocation;
      updateData['trackingDetails.locationTracking.lastUpdated'] = new Date();
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: updateData 
      }, 
      { 
        new: true,
        // Ensure the update creates the nested objects if they don't exist
        setDefaultsOnInsert: true 
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product tracking details:', error);
    res.status(500).json({ message: 'Error updating product tracking details' });
  }
});

// Get products by specific status
router.get('/status/:status', auth, async (req, res) => {
  try {
    const { status } = req.params;
    
    // Validate status
    if (!['demo', 'inventory', 'delivery', 'sold', 'returned', 'maintenance'].includes(status)) {
      return res.status(400).json({ message: 'Invalid item status' });
    }

    const products = await Product.find({ itemStatus: status }).lean();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by status:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

module.exports = router;
