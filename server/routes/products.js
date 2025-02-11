const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/product');
const auth = require('../middleware/auth');

// Get all products with optional filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const { 
      status, 
      category, 
      page = 1, 
      limit = 50,  
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.itemStatus = status;
    if (category) filter.category = category;

    // Convert page and limit to numbers and ensure they're positive
    const pageNumber = Math.max(1, Number(page));
    const pageLimit = Math.min(Math.max(1, Number(limit)), 100);

    // Calculate skip value for pagination
    const skipValue = (pageNumber - 1) * pageLimit;

    // Determine sort direction
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Retrieve products with pagination and sorting
    const products = await Product.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skipValue)
      .limit(pageLimit);

    // Count total matching documents for pagination info
    const totalProducts = await Product.countDocuments(filter);

    // Prepare pagination metadata
    const totalPages = Math.ceil(totalProducts / pageLimit);

    res.json({
      products,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        pageSize: pageLimit,
        totalProducts
      }
    });
  } catch (error) {
    console.error('Error retrieving products:', error);
    res.status(500).json({ message: 'Error retrieving products', error: error.message });
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
    const { serialNumber, currentLocation } = req.body;
    
    // Prepare update object
    const updateData = {};
    
    // Add serial number if provided
    if (serialNumber) {
      updateData.serialNumber = serialNumber;
    }
    
    // Add current location if provided
    if (currentLocation) {
      updateData.currentLocation = currentLocation;
      updateData.updatedAt = new Date();
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: updateData 
      }, 
      { 
        new: true,
        runValidators: true
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

// Create a new product instance
router.post('/instances', auth, async (req, res) => {
  try {
    const { productModelId, instanceId, name, sku } = req.body;

    // Validate required fields
    if (!productModelId || !instanceId || !name || !sku) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if product model exists
    const productModel = await Product.findById(productModelId);
    if (!productModel) {
      return res.status(404).json({ message: 'Product model not found' });
    }

    // Create new product instance
    const newProductInstance = new Product({
      ...req.body,
      productModelId,
      instanceId,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newProductInstance.save();
    res.status(201).json(newProductInstance);
  } catch (error) {
    console.error('Error creating product instance:', error);
    res.status(500).json({ message: 'Error creating product instance' });
  }
});

// Get product instances with optional filtering
router.get('/instances', auth, async (req, res) => {
  try {
    const { productModelId, status, category } = req.query;
    
    const filter = {};
    if (productModelId) filter.productModelId = productModelId;
    if (status) filter.status = status;
    if (category) filter.category = category;

    const productInstances = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(1000);

    res.json(productInstances);
  } catch (error) {
    console.error('Error retrieving product instances:', error);
    res.status(500).json({ message: 'Error retrieving product instances' });
  }
});

// Update product location
router.patch('/:id/location', auth, async (req, res) => {
  try {
    const { currentLocation } = req.body;
    
    // Validate input
    if (!currentLocation) {
      return res.status(400).json({ message: 'Current location is required' });
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: { 
          currentLocation: currentLocation,
          updatedAt: new Date()
        } 
      }, 
      { 
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product location:', error);
    res.status(500).json({ message: 'Error updating product location' });
  }
});

// Update product instance serial number
router.patch('/:id/serial-number', auth, async (req, res) => {
  try {
    const { serialNumber } = req.body;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        serialNumber,
        updatedAt: new Date()
      }, 
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product instance not found' });
    }

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating serial number:', error);
    res.status(500).json({ message: 'Error updating serial number' });
  }
});

// Update product purchase date
router.patch('/:id/purchase-date', auth, async (req, res) => {
  try {
    const { purchaseDate } = req.body;
    
    // Validate input
    if (!purchaseDate) {
      return res.status(400).json({ message: 'Purchase date is required' });
    }

    // Validate date format
    const parsedDate = new Date(purchaseDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: { 
          purchaseDate: parsedDate,
          updatedAt: new Date()
        } 
      }, 
      { 
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product purchase date:', error);
    res.status(500).json({ message: 'Error updating product purchase date' });
  }
});

// Update product warranty expiration date
router.patch('/:id/warranty-expiration', auth, async (req, res) => {
  try {
    const { warrantyExpirationDate } = req.body;
    
    // Validate input
    if (!warrantyExpirationDate) {
      return res.status(400).json({ message: 'Warranty expiration date is required' });
    }

    // Validate date format
    const parsedDate = new Date(warrantyExpirationDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Update product
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: { 
          warrantyExpirationDate: parsedDate,
          updatedAt: new Date()
        } 
      }, 
      { 
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error updating product warranty expiration date:', error);
    res.status(500).json({ message: 'Error updating product warranty expiration date' });
  }
});

// Count products by specific criteria
router.get('/count', auth, async (req, res) => {
  try {
    const { name, category, status } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Add name filter if provided (case-insensitive partial match)
    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }
    
    // Add category filter if provided
    if (category) {
      filter.category = category;
    }
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Count products matching the filter
    const count = await Product.countDocuments(filter);

    res.json({ count });
  } catch (error) {
    console.error('Error counting products:', error);
    res.status(500).json({ 
      message: 'Error counting products', 
      error: error.message 
    });
  }
});

module.exports = router;
