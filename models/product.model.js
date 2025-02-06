const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['CARDIOLOGY', 'LABORATORY', 'OR_ER_ICU', 'OB_GYNE', 'FURNITURE', 'ECG_PATCH']
    },
    status: {
        type: String,
        required: true,
        enum: ['DEMO', 'IN_STOCK', 'IN_DELIVERY'],
        default: 'IN_STOCK'
    },
    serialNumber: {
        type: String,
        unique: true,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    location: {
        type: String,
        required: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Index for faster queries
productSchema.index({ status: 1 });
productSchema.index({ category: 1 });
productSchema.index({ serialNumber: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
