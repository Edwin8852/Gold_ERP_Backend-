const express = require('express');
const router = express.Router();
const jewelryController = require('./jewelry.controller');

router.post('/', jewelryController.createOrder);

module.exports = router;
