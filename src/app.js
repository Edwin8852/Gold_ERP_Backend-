const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./shared/middleware/error.middleware');
const routes = require('./routes'); // Centralized router
require('dotenv').config();

const app = express();

// Global Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow cross-origin images/resources if needed
})); 
app.use(cors({
  origin: '*', // In production, set to: process.env.FRONTEND_URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-api-key',
    'Cache-Control',
    'Pragma',
    'Expires',
    'Surrogate-Control',
  ],
  credentials: true,
}));
// Explicitly handle OPTIONS preflight for all routes (Express 5 syntax)
app.options('/{*splat}', cors());
app.use(morgan('dev')); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SDRS Gold Finance & Jewelry ERP API' });
});

// Mount All API Routes
app.use('/api', routes);

// Error Handling Middleware (Should be last)
app.use(errorHandler);

module.exports = app;
