const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false  // Don't include password by default in queries
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['ADMIN', 'CUSTOMER', 'INVENTORY_STAFF', 'LOGISTICS_MANAGER'],
    required: true
  },
  address: String,
  contact: String
}, {
  timestamps: true
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Create a simple index on username only
userSchema.index({ username: 1 });

module.exports = mongoose.model('User', userSchema);
