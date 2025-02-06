require('dotenv').config();
const mongoose = require('mongoose');
const seedUsers = require('./seed/users');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms');
    console.log('Connected to MongoDB');

    await seedUsers();
    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
