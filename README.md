# Megaion Supply Chain Management System

A comprehensive supply chain management system built with MEAN stack (MongoDB, Express.js, Angular, Node.js) featuring AI-powered demand forecasting.

## Project Structure
```
├── backend/                 # Node.js + Express backend
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   └── server.js          # Entry point
├── frontend/               # Angular frontend
│   ├── src/
│   │   ├── app/          # Components
│   │   ├── assets/       # Static files
│   │   └── environments/ # Environment configs
│   ├── angular.json
│   └── package.json
└── README.md
```

## Features

### User Roles & Permissions
- Admin: Full system access
- Customer: Create/review purchase orders
- Inventory Staff: Manage stock levels
- Logistics Manager: Track shipments

### Inventory Management
Product status tracking for:
- Demo Units
- In Stock
- In Delivery

### AI-Powered Demand Forecasting
- Real-time order trend analysis
- Machine learning-based demand prediction
- Interactive forecasting visualization
- Historical data analysis spanning 5 years
- Customizable forecasting parameters
- Category-wise demand forecasting

## Setup Instructions

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
ng serve
```

### Environment Requirements
- Node.js >= 14.x
- MongoDB >= 5.x
- Angular CLI >= 16.x

### Test Data Generation
The system includes a comprehensive data seeding script that generates:
- 5 years of historical order data (2020-2025)
- Realistic product categories and inventory levels
- User accounts with different roles
- Delivery records with tracking information

To generate test data:
```bash
cd server
node scripts/seed.js
```
