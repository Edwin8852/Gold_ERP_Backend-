const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./shared/middleware/error.middleware');
require('dotenv').config();

const app = express();

// Global Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Body parser
app.use(express.urlencoded({ extended: true }));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SDRS Gold Finance & Jewelry ERP API' });
});

// Import Routes
const customerRoutes = require('./modules/customer/customer.routes');
const orderRoutes = require('./modules/order/order.routes');
const chitfundRoutes = require('./modules/chitfund/chitfund.routes');
const goldrateRoutes = require('./modules/goldrate/goldrate.routes');
const notificationRoutes = require('./modules/notification/notification.routes');

// Mount Routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/chit-funds', chitfundRoutes);
app.use('/api/gold-rates', goldrateRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware (Should be last)
app.use(errorHandler);

module.exports = app;
