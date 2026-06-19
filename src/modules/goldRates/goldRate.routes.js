'use strict';

const express            = require('express');
const router             = express.Router();
const goldRateController = require('./goldRate.controller');

// ── Debug log (Requirement 9) ─────────────────────────────────────────────
console.log('✅ Gold Rate Routes Loaded — /api/gold-rate/* & /api/gold-rates/*');

// ── Health check (Requirement 10) ─────────────────────────────────────────
// GET /api/gold-rate/test   →  { success: true, message: "Gold Rate Route Working" }
router.get('/test', (req, res) => {
  res.status(200).json({ success: true, message: 'Gold Rate Route Working' });
});

// ── Public rate endpoints ──────────────────────────────────────────────────
// GET /api/gold-rate/latest   (also mounted at /api/gold-rates/latest)
router.get('/latest', goldRateController.getLatestRate);

// GET /api/gold-rate/live
router.get('/live', goldRateController.getLiveRate);

// ── Admin: manual rate refresh ─────────────────────────────────────────────
// POST /api/gold-rate/refresh
router.post('/refresh', goldRateController.refreshRate);

// ── Admin: rate logs ───────────────────────────────────────────────────────
// GET /api/gold-rate/logs
router.get('/logs', goldRateController.getRateLogs);

module.exports = router;
