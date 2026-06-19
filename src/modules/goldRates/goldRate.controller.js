'use strict';

const goldRateService = require('./goldRate.service');
const logger          = require('../../config/logger');

/**
 * Shared no-cache headers — ensures browsers/proxies never serve stale rates.
 */
const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma':        'no-cache',
  'Expires':       '0',
  'Surrogate-Control': 'no-store',
};

// ──────────────────────────────────────────────────────────────────────────
// GET /api/gold-rates/latest   &   GET /api/gold-rate/latest
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns today's canonical gold and silver rate.
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "gold18k":    6765.00,
 *     "gold22k":    8058.00,
 *     "gold24k":    8793.00,
 *     "silverRate": 98.50,
 *     "updatedAt":  "2026-05-30T06:00:00+05:30",
 *     "rateDate":   "2026-05-30",
 *     "source":     "livechennai.com",
 *     "isFallback": false
 *   }
 * }
 *
 * Purity formula (24K is master):
 *   18K = 24K × (18 / 24)
 *   22K = 24K × (22 / 24)
 */
const getLatestRate = async (req, res) => {
  try {
    res.set(NO_CACHE_HEADERS);

    const rate = await goldRateService.getLatestRate();

    if (!rate) {
      logger.error('[GoldRateController] getLatestRate: No Chennai rate available.');
      return res.status(503).json({
        success: false,
        message: 'Chennai Rate Temporarily Unavailable. Please try again shortly.',
      });
    }

    const todayIST   = goldRateService.getTodaysISTDate();
    const isFallback = rate.isFallback || rate.rateDate !== todayIST;

    // ── Requirement 18: Log Current API Rate vs Displayed UI Rate ─────────
    console.log('\n═══════════════════════════════════════════');
    console.log('[GoldRateController] /api/gold-rate/latest RESPONSE AUDIT');
    console.log('  [Saved DB Rate]    24K: ₹' + rate.gold24k + '  22K: ₹' + rate.gold22k + '  18K: ₹' + rate.gold18k + '  Ag: ₹' + rate.silverRate);
    console.log('  [Displayed UI Rate] 24K: ₹' + rate.gold24k + '  22K: ₹' + rate.gold22k + '  18K: ₹' + rate.gold18k);
    console.log('  [Source]            ' + rate.source + ' | Date: ' + rate.rateDate);
    console.log('  [Is Fallback]       ' + isFallback);
    console.log('═══════════════════════════════════════════\n');

    return res.status(200).json({
      city:       'Chennai',
      gold24k:    rate.gold24k,
      gold22k:    rate.gold22k,
      gold18k:    rate.gold18k,
      silverRate: rate.silverRate,
      updatedAt:  rate.updatedAt,
      rateDate:   rate.rateDate,
      source:     'Chennai Market Rates',
      isFallback,
    });
  } catch (error) {
    logger.error(`[GoldRateController] getLatestRate error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Internal error fetching gold rate.',
      error:   process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// GET /api/gold-rates/live
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns real-time live market rates with change metrics for the live ticker.
 * Also includes backward-compat keys for the existing frontend components.
 *
 * 18K is always derived server-side:  24K × (18 / 24)
 * 22K is always derived server-side:  24K × (22 / 24)
 */
const getLiveRate = async (req, res) => {
  try {
    res.set(NO_CACHE_HEADERS);

    const rates = await goldRateService.getLiveMarketRates();

    // ── Requirement 18: Log Current API Rate vs Displayed UI Rate ─────────
    console.log('\n═══════════════════════════════════════════');
    console.log('[GoldRateController] /api/gold-rates/live RESPONSE AUDIT');
    console.log('  [Current API Rate] 24K: ₹' + rates.gold_24k + '  22K: ₹' + rates.gold_22k + '  18K: ₹' + rates.gold_18k + '  Ag: ₹' + rates.silver_rate);
    console.log('  [Displayed UI Rate] 24K: ₹' + rates.gold24K + '  22K: ₹' + rates.gold22K + '  18K: ₹' + rates.gold18K);
    console.log('  [Market Status]    ' + rates.market_status + ' | Source: ' + rates.source);
    console.log('═══════════════════════════════════════════\n');

    return res.status(200).json({
      success: true,

      // ── Canonical snake_case keys ──
      city:        'Chennai',
      gold_24k:    Number(rates.gold_24k),
      gold_22k:    Number(rates.gold_22k),
      gold_18k:    Number(rates.gold_18k),
      silver_rate: Number(rates.silver_rate),
      source:      'Chennai Market Rates',
      market_status: rates.market_status,
      updated_at:  rates.updated_at,

      // ── Change metrics ──
      gold24k_change:         rates.gold24k_change,
      gold24k_change_percent: rates.gold24k_change_percent,
      gold24k_is_up:          rates.gold24k_is_up,
      gold22k_change:         rates.gold22k_change,
      gold22k_change_percent: rates.gold22k_change_percent,
      gold22k_is_up:          rates.gold22k_is_up,
      gold18k_change:         rates.gold18k_change,
      gold18k_change_percent: rates.gold18k_change_percent,
      gold18k_is_up:          rates.gold18k_is_up,
      silver_change:          rates.silver_change,
      silver_change_percent:  rates.silver_change_percent,
      silver_is_up:           rates.silver_is_up,

      // ── Backward-compat camelCase keys (existing UI components) ──
      gold18K:    Number(rates.gold_18k),
      gold22K:    Number(rates.gold_22k),
      gold24K:    Number(rates.gold_24k),
      silverRate: Number(rates.silver_rate),
      updatedAt:  rates.updated_at,
      isLive:     rates.market_status === 'LIVE',
    });
  } catch (error) {
    logger.error(`[GoldRateController] getLiveRate error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live market rates.',
      error:   process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// POST /api/gold-rates/refresh  (admin manual trigger)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Manually triggers a fresh scrape and DB upsert.
 * Useful for admin panel "Refresh Rate Now" button.
 *
 * 18K = 24K × (18/24), 22K = 24K × (22/24) — always computed from 24K master.
 */
const refreshRate = async (req, res) => {
  try {
    res.set(NO_CACHE_HEADERS);
    logger.info('[GoldRateController] Manual rate refresh triggered.');

    const saved = await goldRateService.fetchAndSaveTodaysRate();

    // ── Log all three rates after refresh ─────────────────────────────────
    console.log('\n═══════════════════════════════════════════');
    console.log('[GoldRateController] MANUAL REFRESH COMPLETE');
    console.log('  [Current API Rate] 24K: ₹' + Number(saved.gold24k) + '  22K: ₹' + Number(saved.gold22k) + '  18K: ₹' + Number(saved.gold18k));
    console.log('  [Saved DB Rate]    rateDate: ' + saved.rateDate + ' | source: ' + saved.source);
    console.log('═══════════════════════════════════════════\n');

    return res.status(200).json({
      success: true,
      message: 'Chennai gold rate refreshed successfully.',
      data: {
        city:       'Chennai',
        gold18k:    Number(saved.gold18k),
        gold22k:    Number(saved.gold22k),
        gold24k:    Number(saved.gold24k),
        silverRate: Number(saved.silverRate),
        rateDate:   saved.rateDate,
        source:     'Chennai Market Rates',
        updatedAt:  saved.fetchedAt || saved.updatedAt,
      },
    });
  } catch (error) {
    logger.error(`[GoldRateController] refreshRate error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Rate refresh failed.',
      error:   process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// GET /api/gold-rates/logs
// ──────────────────────────────────────────────────────────────────────────

const getRateLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const logs = await goldRateService.getLatestLogs(limit);
    return res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error(`[GoldRateController] getRateLogs error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch gold rate logs.',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────

module.exports = {
  getLatestRate,
  getLiveRate,
  refreshRate,
  getRateLogs,
};
