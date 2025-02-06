const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Product = require('../models/product');
const Order = require('../models/order');
const Delivery = require('../models/delivery');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

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
  try {
    // Create admin user
    const adminUser = new User({
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      email: 'admin@megaion.com',
      role: 'ADMIN',
      name: 'System Administrator'
    });
    await adminUser.save();

    // Generate customer users
    const NUM_CUSTOMERS = 10;
    for (let i = 0; i < NUM_CUSTOMERS; i++) {
      const customerUser = new User({
        username: faker.internet.userName(),
        password: await bcrypt.hash('customer123', 10),
        email: faker.internet.email(),
        role: 'CUSTOMER',
        name: faker.person.fullName(),
        address: generatePhAddress(),
        contact: faker.phone.number('+63 ### ### ####')
      });
      await customerUser.save();
    }

    // Generate staff users
    const NUM_STAFF = 5;
    for (let i = 0; i < NUM_STAFF; i++) {
      const staffUser = new User({
        username: faker.internet.userName(),
        password: await bcrypt.hash('staff123', 10),
        email: faker.internet.email(),
        role: faker.helpers.arrayElement(['INVENTORY_STAFF', 'LOGISTICS_MANAGER']),
        name: faker.person.fullName()
      });
      await staffUser.save();
    }

    console.log('Generated users');
  } catch (error) {
    console.error('Error generating users:', error);
  }
};

// Generate products
const generateProducts = async () => {
  try {
    // Medical equipment products
    const products = [
      // Diagnostic Imaging
      {
        name: 'GE Logiq F8 Ultrasound',
        sku: 'GE-LOGIQ-F8',
        description: 'Advanced diagnostic ultrasound system with excellent image quality and comprehensive measurement tools.',
        category: 'Diagnostic Imaging',
        price: 35000.00,
        unit: 'unit',
        stockQuantity: 5,
        manufacturer: 'GE Healthcare',
        specifications: {
          display: '21.5" LED',
          probes: '2-8',
          imageStorage: '500GB HDD',
          dimensions: '55 x 70 x 140 cm',
          weight: '85 kg'
        }
      },
      {
        name: 'Philips BV Endura C-Arm',
        sku: 'PHIL-BV-END',
        description: 'Mobile C-arm system for versatile imaging in surgical procedures with excellent image quality.',
        category: 'Diagnostic Imaging',
        price: 75000.00,
        unit: 'unit',
        stockQuantity: 2,
        manufacturer: 'Philips Healthcare',
        specifications: {
          generator: '2.4 kW',
          tubeVoltage: '40-110 kV',
          imaging: 'Digital Flat Panel',
          fieldOfView: '23 x 23 cm',
          mobility: 'Fully mobile'
        }
      },
      // Patient Monitoring
      {
        name: 'Mindray iMEC8 Patient Monitor',
        sku: 'MR-IMEC8',
        description: 'Compact patient monitor for vital signs monitoring with touchscreen interface.',
        category: 'Patient Monitoring',
        price: 2800.00,
        unit: 'unit',
        stockQuantity: 20,
        manufacturer: 'Mindray',
        specifications: {
          display: '8.4" Color TFT',
          parameters: 'ECG, NIBP, SpO2, Temp',
          battery: '2 hours backup',
          weight: '3.2 kg',
          connectivity: 'LAN, HL7'
        }
      },
      {
        name: 'Welch Allyn Spot Vital Signs 4400',
        sku: 'WA-4400',
        description: 'Automated vital signs device with touch screen operation and connectivity options.',
        category: 'Patient Monitoring',
        price: 1999.99,
        unit: 'unit',
        stockQuantity: 15,
        manufacturer: 'Welch Allyn',
        specifications: {
          parameters: 'NIBP, SpO2, Temp',
          display: '7" Touchscreen',
          memory: '400 readings',
          connectivity: 'USB, Bluetooth',
          batteryLife: '100 readings'
        }
      },
      // Surgical Equipment
      {
        name: 'Stryker Surgical Table 3008',
        sku: 'STR-3008',
        description: 'Advanced surgical table with electric height adjustment and multiple positioning options.',
        category: 'Surgical Equipment',
        price: 45000.00,
        unit: 'unit',
        stockQuantity: 3,
        manufacturer: 'Stryker',
        specifications: {
          height: '585-1085mm',
          capacity: '454 kg',
          movements: '5 articulations',
          control: 'Hand pendant',
          power: 'Battery/AC'
        }
      },
      {
        name: 'LED Surgical Light ML700',
        sku: 'MIND-ML700',
        description: 'High-performance LED surgical light with excellent shadow control and color rendering.',
        category: 'Surgical Equipment',
        price: 12000.00,
        unit: 'unit',
        stockQuantity: 8,
        manufacturer: 'Mindray',
        specifications: {
          illumination: '160,000 lux',
          colorTemp: '4350K',
          diameter: '700mm',
          lifespan: '50,000 hours',
          control: 'Wall panel + handle'
        }
      },
      // Sterilization
      {
        name: 'Tuttnauer 3870EA Autoclave',
        sku: 'TUT-3870EA',
        description: 'Automatic autoclave sterilizer with electronic controls and printer.',
        category: 'Sterilization',
        price: 8500.00,
        unit: 'unit',
        stockQuantity: 6,
        manufacturer: 'Tuttnauer',
        specifications: {
          chamber: '85 liter',
          temperature: '121-134°C',
          programs: '6 preset',
          printer: 'Built-in',
          safety: 'Door lock'
        }
      },
      // Respiratory
      {
        name: 'ResMed AirSense 10 CPAP',
        sku: 'RMD-AS10',
        description: 'Premium auto-adjusting pressure sleep apnea therapy device.',
        category: 'Respiratory',
        price: 899.00,
        unit: 'unit',
        stockQuantity: 25,
        manufacturer: 'ResMed',
        specifications: {
          pressure: '4-20 cm H2O',
          noise: '<26 dBA',
          humidifier: 'Integrated',
          data: 'SD Card + wireless',
          dimensions: '116 x 255 x 150 mm'
        }
      },
      // Rehabilitation
      {
        name: 'BTL-4000 Smart Electrotherapy',
        sku: 'BTL-4000S',
        description: 'Professional electrotherapy unit with color touch screen and preset protocols.',
        category: 'Rehabilitation',
        price: 3200.00,
        unit: 'unit',
        stockQuantity: 10,
        manufacturer: 'BTL Industries',
        specifications: {
          channels: '2 independent',
          screen: '4.3" Touch',
          protocols: '50+ preset',
          waveforms: '7 types',
          battery: 'Li-ion'
        }
      },
      // Emergency Equipment
      {
        name: 'Philips HeartStart FRx AED',
        sku: 'PHIL-FRX',
        description: 'Automated external defibrillator for professional use with advanced features.',
        category: 'Emergency',
        price: 1800.00,
        unit: 'unit',
        stockQuantity: 15,
        manufacturer: 'Philips Healthcare',
        specifications: {
          waveform: 'SMART Biphasic',
          energy: '150J nominal',
          guidance: 'Voice + text',
          battery: '4 year shelf life',
          weight: '1.6 kg'
        }
      }
    ];

    for (const product of products) {
      const newProduct = new Product(product);
      await newProduct.save();
    }

    console.log('Generated products');
  } catch (error) {
    console.error('Error generating products:', error);
  }
};

// Generate orders and deliveries
const generateOrdersAndDeliveries = async () => {
  try {
    const customers = await User.find({ role: 'CUSTOMER' });
    const products = await Product.find();

    if (customers.length === 0) {
      console.log('No customers found. Skipping order generation.');
      return;
    }

    if (products.length === 0) {
      console.log('No products found. Skipping order generation.');
      return;
    }

    // Constants for order generation
    const ORDER_STATUS = ['PENDING', 'APPROVED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const DELIVERY_STATUS = ['PREPARING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];
    const STATUS_WEIGHTS = {
      PENDING: 0.1,    // 10% pending
      APPROVED: 0.1,   // 10% approved
      SHIPPED: 0.1,    // 10% shipped
      DELIVERED: 0.6,  // 60% delivered
      CANCELLED: 0.1   // 10% cancelled
    };
    
    // Generate orders for the past 2 years
    const END_DATE = new Date();
    const START_DATE = new Date(END_DATE);
    START_DATE.setFullYear(END_DATE.getFullYear() - 2);
    
    // Generate approximately 20-40 orders per month
    const months = 24; // 2 years
    const ordersPerMonth = faker.number.int({ min: 20, max: 40 });
    
    for (let m = 0; m < months; m++) {
      const monthDate = new Date(START_DATE);
      monthDate.setMonth(START_DATE.getMonth() + m);
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(monthDate.getMonth() + 1);

      console.log(`Generating orders for ${monthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`);
      
      for (let i = 0; i < ordersPerMonth; i++) {
        const customer = faker.helpers.arrayElement(customers);
        const orderProducts = [];
        const numProducts = faker.number.int({ min: 1, max: 5 });

        // Add random products to order
        for (let j = 0; j < numProducts; j++) {
          const product = faker.helpers.arrayElement(products);
          orderProducts.push({
            productId: product._id,
            name: product.name,
            quantity: faker.number.int({ min: 1, max: 10 }),
            price: product.price
          });
        }

        // Calculate total amount
        const totalAmount = orderProducts.reduce((sum, item) => 
          sum + (item.price * item.quantity), 0
        );

        // Weighted random status selection
        const rand = Math.random();
        let cumulativeWeight = 0;
        let selectedStatus = ORDER_STATUS[0];
        
        for (const status in STATUS_WEIGHTS) {
          cumulativeWeight += STATUS_WEIGHTS[status];
          if (rand <= cumulativeWeight) {
            selectedStatus = status;
            break;
          }
        }

        // Create order with a date in the appropriate month
        const orderDate = faker.date.between({ from: monthDate, to: nextMonth });
        const order = new Order({
          orderNumber: `ORD-${faker.string.alphanumeric(8).toUpperCase()}`,
          customer: customer._id,
          products: orderProducts,
          totalAmount,
          status: selectedStatus,
          orderDate: orderDate
        });

        const savedOrder = await order.save();

        // Create delivery for non-pending orders
        if (savedOrder.status !== 'PENDING' && savedOrder.status !== 'CANCELLED') {
          let deliveryStatus;
          if (savedOrder.status === 'DELIVERED') {
            deliveryStatus = 'DELIVERED';
          } else if (savedOrder.status === 'SHIPPED') {
            deliveryStatus = faker.helpers.arrayElement(['IN_TRANSIT', 'DELIVERED']);
          } else {
            deliveryStatus = faker.helpers.arrayElement(DELIVERY_STATUS);
          }

          const delivery = new Delivery({
            trackingNumber: `TRK-${faker.string.alphanumeric(12).toUpperCase()}`,
            order: savedOrder._id,
            status: deliveryStatus,
            address: customer.address || generatePhAddress(),
            estimatedDeliveryDate: new Date(savedOrder.orderDate.getTime() + (7 * 24 * 60 * 60 * 1000)), // 7 days after order
            currentLocation: generatePhAddress(),
            actualDeliveryDate: deliveryStatus === 'DELIVERED' ? 
              new Date(savedOrder.orderDate.getTime() + faker.number.int({ min: 1, max: 10 }) * 24 * 60 * 60 * 1000) : // 1-10 days after order
              undefined
          });

          await delivery.save();
        }
      }
    }

    console.log('Generated orders and deliveries');
  } catch (error) {
    console.error('Error generating orders and deliveries:', error);
  }
};

// Main seeding function
const seedData = async () => {
  try {
    await clearData();
    await generateUsers();
    await generateProducts();
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
