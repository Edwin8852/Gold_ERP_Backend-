const goldRateService = require('../../goldRates/goldRate.service');
const logger = require('../../../config/logger');

/**
 * Live Rate Controller
 * Single source of truth for all rate-related requests
 */
const getLiveRates = async (req, res) => {
  try {
    const rates = await goldRateService.getLiveMarketRates();
    
    if (!rates) {
      return res.status(503).json({
        success: false,
        message: 'Live market rate temporarily unavailable',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    // Disable browser caching for real-time accuracy
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Return clean API response as requested
    return res.status(200).json({
      success: true,
      gold18K: Number(rates.gold_18k || rates.gold18k || rates.gold18K),
      gold22K: Number(rates.gold_22k || rates.gold22k || rates.gold22K),
      gold24K: Number(rates.gold_24k || rates.gold24k || rates.gold24K),
      silverRate: Number(rates.silver_rate || rates.silver || rates.silverRate),
      updatedAt: rates.updated_at || rates.updatedAt || rates.lastUpdated,
      source: rates.source || 'GoldAPI.io',
      isLive: rates.market_status === 'LIVE' || rates.isLive || false
    });
  } catch (error) {
    console.error('🔴 [LiveRateController] CRITICAL ERROR:', error);
    logger.error(`[LiveRateController] Error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({
      success: false,
      message: 'Internal server error while fetching live rates',
      error: error.message
    });
  }
};


/**
 * Force refresh rates (Admin only potentially)
 */
const refreshRates = async (req, res) => {
  try {
    const rates = await goldRateService.getLiveMarketRates();
    return res.status(200).json({
      success: true,
      message: 'Rates refreshed successfully',
      data: rates
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to force refresh rates'
    });
  }
};

module.exports = {
  getLiveRates,
  refreshRates
};
