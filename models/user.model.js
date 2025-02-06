const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        required: true,
        enum: ['ADMIN', 'CUSTOMER', 'INVENTORY_STAFF', 'LOGISTICS_MANAGER'],
        default: 'CUSTOMER'
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has required role
userSchema.methods.hasRole = function(requiredRole) {
    const roleHierarchy = {
        'ADMIN': 4,
        'LOGISTICS_MANAGER': 3,
        'INVENTORY_STAFF': 2,
        'CUSTOMER': 1
    };
    
    return roleHierarchy[this.role] >= roleHierarchy[requiredRole];
};

module.exports = mongoose.model('User', userSchema);
