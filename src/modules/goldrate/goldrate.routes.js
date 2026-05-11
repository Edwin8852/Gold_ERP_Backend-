const express = require('express');

const router = express.Router();

const GoldRateController =
require('./goldrate.controller');

/**
 * Gold Rate Routes
 */

router.post(
  '/',
  GoldRateController.create
);

router.get(
  '/',
  GoldRateController.getAll
);

router.get(
  '/:id',
  GoldRateController.getById
);

router.put(
  '/:id',
  GoldRateController.update
);

router.delete(
  '/:id',
  GoldRateController.deleteGoldRate
);

module.exports = router;