# SDRS Gold Finance & Jewelry ERP System - Backend API

## Tech Stack
- **Node.js & Express.js**: Backend framework
- **PostgreSQL**: Database
- **Sequelize ORM**: Database modeling
- **JWT**: Authentication
- **Joi**: Input validation

## Installation
1. Update `.env` with your PostgreSQL credentials.
2. Run `npm install`
3. Run `npm run dev`

## API Endpoints (Postman Ready)

### 1. Customer Management
- `POST /api/customers` - Create a customer
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### 2. Jewelry Orders
- `POST /api/orders` - Place new order
- `GET /api/orders` - View all orders (includes customer details)
- `GET /api/orders/:id` - View single order
- `PATCH /api/orders/:id` - Update order status
- `DELETE /api/orders/:id` - Remove order

### 3. Chit Funds
- `POST /api/chit-funds` - New subscription
- `GET /api/chit-funds` - View all subscriptions
- `GET /api/chit-funds/:id` - View single subscription
- `PATCH /api/chit-funds/:id` - Update payment status

### 4. Gold Rates
- `POST /api/gold-rates` - Update today's rate
- `GET /api/gold-rates/latest` - Get current rates (24K, 22K, 18K)
- `GET /api/gold-rates/history` - View rate history

### 5. Notifications
- `POST /api/notifications/send-custom` - Send custom Email/WhatsApp

## Security
To protect a route, add the `authMiddleware` to the route definition in `src/modules/<module>/<module>.routes.js`.
