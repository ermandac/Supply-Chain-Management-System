require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function verifyPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const admin = await User.findOne({ username: 'admin' });
        if (admin) {
            console.log('Admin user found:');
            console.log('Username:', admin.username);
            console.log('Stored hashed password:', admin.password);
            
            // Test password
            const testPassword = 'admin123';
            const isMatch = await bcrypt.compare(testPassword, admin.password);
            console.log('\nTesting password:', testPassword);
            console.log('Password matches:', isMatch);
            
            // Let's also create a new hash of 'admin123' to compare
            const salt = await bcrypt.genSalt(10);
            const newHash = await bcrypt.hash('admin123', salt);
            console.log('\nNewly hashed admin123:', newHash);
            console.log('Note: This will be different from stored hash due to different salt, but should still match when compared');
        } else {
            console.log('Admin user not found');
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyPassword();
