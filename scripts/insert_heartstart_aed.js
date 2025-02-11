const { MongoClient, ObjectId } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

// MongoDB connection URL
const url = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'megaion-scms';

// Function to generate unique serial number
function generateSerialNumber(index) {
  return `FRX-${String(index).padStart(4, '0')}`;
}

// Main insertion function
async function insertPhilipsHeartStartFrxAED() {
  let client;
  try {
    // Connect to MongoDB
    client = await MongoClient.connect(url, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    
    const db = client.db(dbName);
    const productsCollection = db.collection('products');
    const productModelsCollection = db.collection('productmodels');

    // Clear existing Philips HeartStart FRx AED products
    const clearResult = await productsCollection.deleteMany({
      name: 'Philips HeartStart FRx AED'
    });
    console.log(`Cleared ${clearResult.deletedCount} existing Philips HeartStart FRx AED products`);

    // Create a dummy ProductModel
    const productModel = {
      name: 'Philips HeartStart FRx AED',
      sku: 'PHIL-FRX',
      description: 'Automated external defibrillator for professional use with advanced features.',
      category: 'Emergency',
      price: 1800.00,
      manufacturer: 'Philips Healthcare'
    };

    const productModelResult = await productModelsCollection.insertOne(productModel);
    const productModelId = productModelResult.insertedId;

    // Prepare products to insert
    const productsToInsert = [];
    const NUM_INSTANCES = 10;

    for (let i = 1; i <= NUM_INSTANCES; i++) {
      const productInstance = {
        name: 'Philips HeartStart FRx AED',
        sku: `PHIL-FRX-${i}`, // Ensure unique SKU
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
          weight: '1.6 kg',
          complianceStandards: 'FDA, CE, AHA Guidelines',
          operatingTemperature: '0°C to 50°C',
          storageTemperature: '-20°C to 65°C'
        },
        productModelId: productModelId,
        instanceId: uuidv4(),
        trackingDetails: {
          serialNumber: generateSerialNumber(i),
          purchaseDate: new Date(),
          warrantyExpirationDate: new Date(Date.now() + 4 * 365 * 24 * 60 * 60 * 1000), // 4 years from now
          currentLocation: 'Warehouse',
          maintenanceHistory: []
        }
      };

      productsToInsert.push(productInstance);
    }

    // Insert products
    const insertResult = await productsCollection.insertMany(productsToInsert);
    console.log(`Successfully inserted ${insertResult.insertedCount} Philips HeartStart FRx AED products`);

  } catch (error) {
    console.error('Error inserting Philips HeartStart FRx AED products:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run the insertion
insertPhilipsHeartStartFrxAED();
