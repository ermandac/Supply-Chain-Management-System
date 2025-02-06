const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

const users = [
  {
    username: 'admin',
    name: 'System Administrator',
    email: 'admin@megaion.com',
    password: 'admin123',
    role: 'ADMIN'
  },
  {
    username: 'customer1',
    name: 'John Customer',
    email: 'customer1@example.com',
    password: 'customer123',
    role: 'CUSTOMER'
  },
  {
    username: 'inventory1',
    name: 'Sarah Inventory',
    email: 'inventory1@megaion.com',
    password: 'inventory123',
    role: 'INVENTORY_STAFF'
  },
  {
    username: 'logistics1',
    name: 'Mike Logistics',
    email: 'logistics1@megaion.com',
    password: 'logistics123',
    role: 'LOGISTICS_MANAGER'
  }
];

async function createUserWithHashedPassword(userData) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);
  
  const user = new User({
    ...userData,
    password: hashedPassword
  });
  
  return user.save();
}

async function seedUsers() {
  try {
    // Clear existing users
    await User.deleteMany({});

    // Create users one by one with hashed passwords
    for (const userData of users) {
      await createUserWithHashedPassword(userData);
    }

    console.log('Users seeded successfully');
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

module.exports = seedUsers;
