require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./server/routes/auth');
const orderRoutes = require('./server/routes/orders');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the Angular app
app.use(express.static(path.join(__dirname, 'dist/megaion-scms')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// For any other routes, redirect to the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/megaion-scms/index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/megaion-scms', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
