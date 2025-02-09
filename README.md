#Supply Chain Management System

## Overview
A comprehensive Supply Chain Management System designed to streamline inventory, order, and delivery management for modern businesses. The system provides robust features for tracking products, managing orders, and optimizing supply chain operations.

## Project Structure
```
megaion-scms/
├── server/                 # Backend Node.js + Express server
│   ├── app.js             # Main server application
│   ├── models/            # Mongoose data models
│   │   ├── Order.js       # Order data model
│   │   ├── delivery.js    # Delivery tracking model
│   │   ├── product.js     # Product inventory model
│   │   └── user.js        # User authentication model
│   ├── routes/            # API route handlers
│   │   ├── auth.js        # Authentication routes
│   │   ├── deliveries.js  # Delivery management routes
│   │   ├── orders.js      # Order processing routes
│   │   └── products.js    # Product inventory routes
│   ├── middleware/        # Express middleware
│   └── scripts/           # Utility scripts
│
├── src/                   # Angular Frontend
│   ├── app/
│   │   ├── auth/          # Authentication components
│   │   ├── dashboard/     # Main dashboard
│   │   ├── delivery/      # Delivery management
│   │   ├── inventory/     # Inventory tracking
│   │   ├── orders/        # Order management
│   │   └── services/      # Shared services
│   └── assets/            # Static assets
│
└── README.md
```

## Key Features
- 🔐 Secure User Authentication
- 📦 Comprehensive Inventory Management
- 🚚 Delivery Tracking
- 📊 Order Processing
- 🤖 Advanced Reporting and Analytics

## Technologies
- **Backend**:
  - Node.js
  - Express.js
  - MongoDB (Mongoose ODM)
- **Frontend**:
  - Angular 16
  - RxJS
  - Angular Material
- **Authentication**:
  - JSON Web Tokens (JWT)
  - bcrypt for password hashing
- **Additional Libraries**:
  - Chart.js for data visualization
  - Machine Learning regression for predictive analytics

## Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- Angular CLI (v16+)

## Installation

### Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm run server
```

### Frontend Setup
```bash
# Install Angular CLI globally
npm install -g @angular/cli

# Install project dependencies
npm install

# Serve the application
ng serve
