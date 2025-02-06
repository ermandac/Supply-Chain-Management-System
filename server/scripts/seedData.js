const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Delivery = require('../models/delivery');
const seedUsers = require('../seed/users');
const seedProducts = require('../seed/products');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Constants for data generation
const NUM_ORDERS_PER_MONTH = 30;
const START_DATE = new Date('2023-02-06'); // 2 years ago
const END_DATE = new Date('2025-02-06'); // today

const ORDER_STATUS = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
const DELIVERY_STATUS = ['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

// Helper function to generate random date between start and end
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to generate address in Philippines
const generatePhAddress = () => {
  const cities = ['Manila', 'Quezon City', 'Cebu', 'Davao', 'Makati', 'Pasig', 'Taguig'];
  const streets = ['Rizal Ave', 'EDSA', 'Ayala Ave', 'McKinley Road', 'C5 Road'];
  return `${faker.number.int({ min: 1, max: 999 })} ${faker.helpers.arrayElement(streets)}, ${faker.helpers.arrayElement(cities)}`;
};

// Clear existing data
const clearData = async () => {
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Delivery.deleteMany({});
  console.log('Cleared existing data');
};

// Generate users
const generateUsers = async () => {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  await User.create({
    username: 'admin',
    password: adminPassword,
    email: 'admin@megaion.com',
    role: 'ADMIN',
    name: 'System Administrator'
  });

  // Create customers
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const password = await bcrypt.hash('password123', 10);
    await User.create({
      username: faker.internet.userName(),
      password: password,
      email: faker.internet.email(),
      role: 'CUSTOMER',
      name: faker.person.fullName(),
      address: generatePhAddress(),
      contact: faker.phone.number('+63 ### ### ####')
    });
  }

  // Create staff
  const staffRoles = ['INVENTORY_STAFF', 'LOGISTICS_MANAGER'];
  for (let i = 0; i < NUM_STAFF; i++) {
    const password = await bcrypt.hash('password123', 10);
    await User.create({
      username: faker.internet.userName(),
      password: password,
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(staffRoles),
      name: faker.person.fullName(),
      contact: faker.phone.number('+63 ### ### ####')
    });
  }

  console.log('Generated users');
};

// Generate products
const generateProducts = async () => {
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    await Product.create({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      category: faker.helpers.arrayElement(CATEGORIES),
      status: faker.helpers.arrayElement(PRODUCT_STATUS),
      serialNumber: faker.string.alphanumeric(10).toUpperCase(),
      quantity: faker.number.int({ min: 0, max: 100 }),
      price: faker.number.float({ min: 1000, max: 100000, precision: 0.01 }),
      location: generatePhAddress(),
      lastUpdated: randomDate(START_DATE, END_DATE)
    });
  }
  console.log('Generated products');
};

// Generate orders and deliveries
const generateOrdersAndDeliveries = async () => {
  const customers = await User.find({ role: 'CUSTOMER' });
  const products = await Product.find({});
  const months = (END_DATE.getFullYear() - START_DATE.getFullYear()) * 12 + 
                (END_DATE.getMonth() - START_DATE.getMonth());

  for (let m = 0; m < months; m++) {
    const monthDate = new Date(START_DATE);
    monthDate.setMonth(START_DATE.getMonth() + m);
    
    for (let i = 0; i < NUM_ORDERS_PER_MONTH; i++) {
      // Create order
      const customer = faker.helpers.arrayElement(customers);
      const numProducts = faker.number.int({ min: 1, max: 5 });
      const orderProducts = [];
      let totalAmount = 0;

      for (let j = 0; j < numProducts; j++) {
        const product = faker.helpers.arrayElement(products);
        const quantity = faker.number.int({ min: 1, max: 10 });
        orderProducts.push({
          productId: product._id,
          name: product.name,
          quantity: quantity,
          price: product.price
        });
        totalAmount += quantity * product.price;
      }

      const orderDate = randomDate(monthDate, new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0));
      const order = await Order.create({
        orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
        products: orderProducts,
        status: faker.helpers.arrayElement(ORDER_STATUS),
        totalAmount: totalAmount,
        customer: {
          _id: customer._id,
          name: customer.name
        },
        createdAt: orderDate,
        updatedAt: orderDate
      });

      // Create delivery for non-cancelled orders
      if (order.status !== 'CANCELLED') {
        const deliveryDate = new Date(orderDate);
        deliveryDate.setDate(deliveryDate.getDate() + faker.number.int({ min: 1, max: 14 }));
        
        await Delivery.create({
          trackingNumber: `DEL-${faker.string.alphanumeric(8).toUpperCase()}`,
          order: {
            id: order._id,
            orderNumber: order.orderNumber,
            customer: {
              name: customer.name,
              address: customer.address,
              contact: customer.contact
            }
          },
          status: faker.helpers.arrayElement(DELIVERY_STATUS),
          estimatedDeliveryDate: deliveryDate,
          actualDeliveryDate: faker.helpers.arrayElement([deliveryDate, null]),
          currentLocation: generatePhAddress(),
          notes: faker.helpers.arrayElement([faker.lorem.sentence(), null]),
          createdAt: orderDate,
          updatedAt: orderDate
        });
      }
    }
  }
  console.log('Generated orders and deliveries');
};

// Main seeding function
const seedData = async () => {
  try {
    await clearData();
    await seedUsers();
    await seedProducts();
    await generateOrdersAndDeliveries();
    console.log('Data seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

// Run the seeder
seedData();
