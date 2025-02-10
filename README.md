# Megaion Supply Chain Management System

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
- Windows 10/11 or Windows Subsystem for Linux (WSL)

## Installation

### Prerequisites Setup (Windows)
1. **Install Node.js**
   - Download from [Node.js Official Website](https://nodejs.org/)
   - Run the installer and follow the installation wizard
   - Ensure "Add to PATH" is checked during installation
   - Verify installation by opening Command Prompt and running:
     ```cmd
     node --version
     npm --version
     ```

2. **Install MongoDB**
   - Download MongoDB Community Server from [MongoDB Website](https://www.mongodb.com/try/download/community)
   - Run the installer, select "Complete" setup type
   - Choose "Install MongoDB as a Service"
   - Add MongoDB `bin` directory to system PATH
   - Verify installation:
     ```cmd
     mongod --version
     ```

3. **Install Angular CLI**
   ```cmd
   npm install -g @angular/cli
   ```

### Backend Setup (Windows)
```cmd
REM Navigate to server directory
cd server

REM Install dependencies
npm install

REM Create environment file (if not exists)
copy .env.example .env
REM Edit .env with your configuration using a text editor

REM Start the server
npm run server
```

### Frontend Setup (Windows)
```cmd
REM Install project dependencies
npm install

REM Serve the application
ng serve
```

### Alternative: Using Windows Subsystem for Linux (WSL)
1. Enable WSL 2 on Windows
2. Install a Linux distribution (Ubuntu recommended)
3. Follow Linux installation steps in the original README
4. Use WSL terminal for development

### Troubleshooting
- Ensure all prerequisites are installed and PATH is configured
- Run Command Prompt or PowerShell as Administrator for global installations
- For MongoDB connection issues, verify service is running
- Check firewall settings if ports are blocked

## Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add some feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## Testing
- Run backend tests: `npm run test:backend`
- Run frontend tests: `ng test`

## Deployment
- Production build: `npm run build:prod`
- Backend deployment: Use PM2 or similar process manager
- Frontend deployment: Deploy static files to hosting platform
