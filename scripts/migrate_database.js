const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/megaion-scms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Import models
const Product = require('../server/models/product');
const ProductModel = require('../server/models/productModel');

async function migrateDatabase() {
  try {
    // Start a session for transactions
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Drop existing collections
      const collections = await mongoose.connection.db.listCollections().toArray();
      for (let collection of collections) {
        await mongoose.connection.db.dropCollection(collection.name);
        console.log(`Dropped collection: ${collection.name}`);
      }

      // 2. Recreate ProductModel collection
      const productModelSchema = new mongoose.Schema({
        name: {
          type: String,
          required: true,
          unique: true
        },
        manufacturer: {
          type: String,
          required: true
        },
        category: {
          type: String,
          required: true,
          enum: ['Diagnostic Imaging', 'Patient Monitoring', 'Surgical Equipment', 'Sterilization',
                 'Respiratory', 'Rehabilitation', 'Emergency', 'Laboratory', 'Dental',
                 'Hospital Furniture', 'Consumables', 'Wound Care']
        },
        description: String,
        specifications: {
          type: Map,
          of: String
        },
        sku: {
          type: String,
          required: true,
          unique: true
        },
        price: {
          type: Number,
          min: 0
        }
      }, { timestamps: true });

      const ProductModelModel = mongoose.model('ProductModel', productModelSchema);

      // 3. Recreate Product collection
      const productSchema = new mongoose.Schema({
        productModelId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'ProductModel',
          required: true
        },
        instanceId: {
          type: String,
          required: true,
          unique: true,
          trim: true
        },
        status: {
          type: String,
          enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
          default: 'in_stock'
        },
        itemStatus: {
          type: String,
          enum: ['demo', 'inventory', 'delivery', 'sold', 'returned', 'maintenance'],
          default: 'inventory'
        },
        trackingDetails: {
          serialNumber: {
            type: String,
            unique: true,
            sparse: true
          },
          purchaseDate: {
            type: Date,
            default: Date.now
          },
          warrantyExpirationDate: Date,
          currentLocation: {
            type: String,
            default: 'Warehouse'
          },
          maintenanceHistory: [{
            date: Date,
            description: String,
            performedBy: String
          }],
          locationTracking: {
            lastUpdated: {
              type: Date,
              default: Date.now
            }
          }
        }
      }, { timestamps: true });

      const ProductModel = mongoose.model('Product', productSchema);

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      console.log('Database restructured successfully');
    } catch (error) {
      // Abort transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error('Error migrating database:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
  }
}

// Run migration
migrateDatabase();
