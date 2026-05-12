# SDRS Gold Finance & Jewelry ERP System - Backend API

Enterprise-level clean and scalable backend for SDRS Gold Finance & Jewelry ERP.

## Tech Stack
- **Node.js & Express.js**: Backend framework
- **PostgreSQL**: Database
- **Sequelize ORM**: Database modeling
- **JWT**: Authentication
- **Joi**: Input validation

## Features
- **Modular Architecture**: Easy to maintain and scale.
- **Role-Based Access Control (RBAC)**: Secure access for Super Admin, Admin, and Staff.
- **Multi-language Support**: i18next integration for local languages.
- **Comprehensive Modules**: Gold Loan, Chit Fund, Inventory, and Jewelry Orders.

## Installation
1. Update `.env` with your PostgreSQL credentials.
2. Run `npm install`
3. Run `npm run dev`

## API Endpoints

### 1. Customer Management
- `POST /api/customers` - Create a customer
- `GET /api/customers` - Get all customers
- `GET /api/customers/search` - Search customers
- `GET /api/customers/:id` - Get single customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### 2. Jewelry Orders
- `POST /api/orders` - Place new order
- `GET /api/orders` - View all orders
- `PATCH /api/orders/:id` - Update order status

### 3. Chit Funds
- `POST /api/chit-funds` - New subscription
- `GET /api/chit-funds` - View all subscriptions

### 4. Gold Rates
- `POST /api/gold-rates` - Update today's rate
- `GET /api/gold-rates/latest` - Get current rates

## Security
Routes are protected using `authMiddleware` and `roleMiddleware`. Ensure you include a Bearer Token in the Authorization header.
