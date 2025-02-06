const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  status: {
    type: String,
    enum: ['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
    default: 'PREPARING'
  },
  address: {
    type: String,
    required: true
  },
  estimatedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: Date,
  currentLocation: String,
  notes: String,
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Delivery', deliverySchema);
