require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function checkAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const admin = await User.findOne({ username: 'admin' });
        if (admin) {
            console.log('Admin user found:');
            console.log('Username:', admin.username);
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            console.log('Hashed Password:', admin.password);
        } else {
            console.log('Admin user not found');
        }
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdmin();
