const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const auth = require('../middleware/auth');

// Get all products
router.get('/', auth, async (req, res) => {
  try {
    // Check MongoDB connection state
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected in products route. State:', mongoose.connection.readyState);
      return res.status(503).json({ message: 'Database service temporarily unavailable' });
    }

    // Verify Product model exists
    if (!mongoose.models.Product) {
      console.error('Product model not found');
      return res.status(500).json({ message: 'Product model not initialized' });
    }

    console.log('Fetching products...');
    const products = await Product.find().lean();
    console.log(`Found ${products.length} products`);
    res.json(products);
  } catch (error) {
    console.error('Error in GET /products:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      message: 'Error fetching products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

module.exports = router;
