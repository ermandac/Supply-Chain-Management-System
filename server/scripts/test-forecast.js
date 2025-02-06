const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Order = require('../models/Order');

// Generate test orders with an increasing trend and some seasonality
async function generateTestOrders() {
    try {
        // Clear existing orders
        await Order.deleteMany({});

        // Create a test customer ID
        const customerId = new mongoose.Types.ObjectId();
        // Create a test product ID
        const productId = new mongoose.Types.ObjectId();

        const startDate = new Date('2024-01-01');
        const baseQuantity = 100;
        const seasonalFactor = 20; // Amplitude of seasonal variation
        const trendFactor = 5; // Monthly increase in base quantity
        const randomFactor = 10; // Random variation

        // Generate 13 months of data (to show trend)
        for (let month = 0; month < 13; month++) {
            const monthDate = new Date(startDate);
            monthDate.setMonth(startDate.getMonth() + month);
            
            // Calculate quantity with trend, seasonality, and randomness
            const trend = trendFactor * month;
            const seasonality = seasonalFactor * Math.sin(month * Math.PI / 6); // 12-month cycle
            const randomness = (Math.random() - 0.5) * randomFactor;
            
            const quantity = Math.max(1, Math.round(baseQuantity + trend + seasonality + randomness));
            
            // Create multiple orders for each month
            const numOrders = Math.floor(quantity / 10); // Split into smaller orders
            
            for (let i = 0; i < numOrders; i++) {
                const orderDay = Math.floor(Math.random() * 28) + 1; // Random day of month
                const orderDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), orderDay);
                
                const order = new Order({
                    orderNumber: `TEST-${monthDate.getFullYear()}${String(monthDate.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(3, '0')}`,
                    products: [{
                        productId: productId,
                        name: 'Test Product',
                        quantity: Math.ceil(10 + Math.random() * 5),
                        price: 100
                    }],
                    status: 'DELIVERED',
                    customer: {
                        id: customerId,
                        name: 'Test Customer'
                    },
                    totalAmount: 1000,
                    createdAt: orderDate
                });
                
                await order.save();
            }
        }

        console.log('Test orders generated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error generating test orders:', error);
        process.exit(1);
    }
}

generateTestOrders();
