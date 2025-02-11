const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/megaion-scms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const ProductModel = require('../server/models/productModel');
const Product = require('../server/models/product');

async function seedDatabase() {
  try {
    // Start a session for transactions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create ProductModel for Philips HeartStart FRx AED
      const productModel = new ProductModel({
        name: 'Philips HeartStart FRx AED',
        manufacturer: 'Philips Healthcare',
        category: 'Emergency',
        description: 'Automated external defibrillator for professional use with advanced features.',
        sku: 'PHIL-FRX',
        price: 1800,
        specifications: {
          waveform: 'SMART Biphasic',
          energy: '150J nominal',
          guidance: 'Voice + text',
          battery: '4 year shelf life',
          weight: '1.6 kg'
        }
      });

      await productModel.save();

      // 2. Create 10 individual Product instances
      const productsToInsert = [];
      for (let i = 1; i <= 10; i++) {
        const product = new Product({
          productModelId: productModel._id,
          instanceId: uuidv4(),
          status: 'in_stock',
          itemStatus: 'inventory',
          trackingDetails: {
            serialNumber: `FRX-${String(i).padStart(4, '0')}`,
            purchaseDate: new Date(),
            warrantyExpirationDate: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000), // 4 years from now
            currentLocation: 'Warehouse',
            maintenanceHistory: []
          }
        });

        productsToInsert.push(product);
      }

      await Product.insertMany(productsToInsert);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('Database seeded successfully');
      console.log(`Created ProductModel: ${productModel.name}`);
      console.log(`Inserted ${productsToInsert.length} Product instances`);
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
  }
}

// Run seeding
seedDatabase();
