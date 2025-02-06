const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Diagnostic Imaging', 'Patient Monitoring', 'Surgical Equipment', 'Sterilization',
           'Respiratory', 'Rehabilitation', 'Emergency', 'Laboratory', 'Dental',
           'Hospital Furniture', 'Consumables', 'Wound Care']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['unit', 'set', 'kit', 'box', 'pack', 'case', 'pair']
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  manufacturer: {
    type: String,
    required: true
  },
  specifications: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update status based on stock quantity
productSchema.pre('save', function(next) {
  if (this.stockQuantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.stockQuantity <= 5) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
