const mongoose = require('mongoose');
const Product = require('../models/product');

const products = [
  {
    name: 'Industrial Servo Motor - 2kW',
    sku: 'SM-2000-A1',
    description: 'High-performance 2kW servo motor for industrial automation applications. Features precise position control and high torque output.',
    category: 'Motors',
    price: 799.99,
    unit: 'piece',
    stockQuantity: 50,
    manufacturer: 'Megaion Industrial',
    specifications: {
      power: '2kW',
      voltage: '220V',
      rpm: '3000',
      torque: '6.37 Nm',
      encoderResolution: '20-bit'
    }
  },
  {
    name: 'PLC Controller - Advanced Series',
    sku: 'PLC-ADV-102',
    description: 'Advanced programmable logic controller with Ethernet connectivity and expanded I/O capabilities.',
    category: 'Controllers',
    price: 1299.99,
    unit: 'piece',
    stockQuantity: 30,
    manufacturer: 'Megaion Controls',
    specifications: {
      processor: 'Dual-core 1.5GHz',
      memory: '4GB RAM',
      storage: '32GB Flash',
      ports: '24 DI/16 DO/8 AI/4 AO',
      communication: 'Ethernet/IP, Modbus TCP'
    }
  },
  {
    name: 'Industrial Robot Arm - 6-Axis',
    sku: 'ROB-6X-2000',
    description: 'Versatile 6-axis industrial robot arm for manufacturing and assembly applications. Includes advanced motion control system.',
    category: 'Robotics',
    price: 25999.99,
    unit: 'piece',
    stockQuantity: 5,
    manufacturer: 'Megaion Robotics',
    specifications: {
      payload: '20kg',
      reach: '1.8m',
      repeatability: '±0.02mm',
      axes: '6',
      controlSystem: 'MegaControl V3'
    }
  },
  {
    name: 'HMI Touch Panel - 10"',
    sku: 'HMI-10-4K',
    description: '10-inch industrial touch panel with 4K resolution and multi-touch capability. Perfect for machine control interfaces.',
    category: 'Interface Devices',
    price: 899.99,
    unit: 'piece',
    stockQuantity: 40,
    manufacturer: 'Megaion Displays',
    specifications: {
      screenSize: '10 inches',
      resolution: '3840x2160',
      brightness: '400 nits',
      touchPoints: '10',
      protection: 'IP65'
    }
  },
  {
    name: 'Industrial Sensor Pack - Premium',
    sku: 'SENS-PRO-KIT',
    description: 'Complete set of industrial sensors including proximity, temperature, pressure, and level sensors.',
    category: 'Sensors',
    price: 499.99,
    unit: 'kit',
    stockQuantity: 25,
    manufacturer: 'Megaion Sensors',
    specifications: {
      sensorTypes: '4',
      accuracy: '±0.1%',
      responseTime: '<10ms',
      operatingTemp: '-20°C to 80°C',
      protection: 'IP67'
    }
  },
  {
    name: 'Motion Control System',
    sku: 'MOT-CTRL-X1',
    description: 'Advanced motion control system for multi-axis coordination. Includes software and hardware components.',
    category: 'Motion Control',
    price: 3499.99,
    unit: 'system',
    stockQuantity: 15,
    manufacturer: 'Megaion Motion',
    specifications: {
      axes: 'Up to 8',
      interface: 'EtherCAT',
      updateRate: '1ms',
      programming: 'G-code compatible',
      software: 'MegaMotion Suite'
    }
  },
  {
    name: 'Industrial Power Supply - 24V',
    sku: 'PWR-24-1000',
    description: 'Reliable 24V industrial power supply with 1000W output. Features overcurrent and overvoltage protection.',
    category: 'Power Supplies',
    price: 299.99,
    unit: 'piece',
    stockQuantity: 60,
    manufacturer: 'Megaion Power',
    specifications: {
      output: '24V DC',
      power: '1000W',
      efficiency: '94%',
      protection: 'OCP, OVP, SCP',
      cooling: 'Fan-less'
    }
  },
  {
    name: 'Safety Light Curtain',
    sku: 'SAF-LC-2M',
    description: 'Type 4 safety light curtain for machine guarding. Includes mounting brackets and cables.',
    category: 'Safety Equipment',
    price: 799.99,
    unit: 'pair',
    stockQuantity: 20,
    manufacturer: 'Megaion Safety',
    specifications: {
      height: '2m',
      resolution: '14mm',
      responseTime: '<30ms',
      protection: 'IP65',
      certification: 'CE, cULus'
    }
  }
];

async function seedProducts() {
  try {
    // Clear existing products
    await Product.deleteMany({});

    // Insert new products
    await Product.insertMany(products);
    console.log('Products seeded successfully');
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

module.exports = seedProducts;
