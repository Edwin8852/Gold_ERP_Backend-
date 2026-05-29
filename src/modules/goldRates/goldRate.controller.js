const goldRateService = require('./goldRate.service');

const getLatestRate = async (req, res) => {
  try {
    const rate = await goldRateService.getLatestRate();
    
    if (!rate) {
      // If no rate exists, trigger an update immediately
      const newRate = await goldRateService.updateGoldRate();
      return res.status(200).json({
        success: true,
        data: newRate
      });
    }

    return res.status(200).json({
      success: true,
      data: rate
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getLiveRate = async (req, res) => {
  try {
    const rates = await goldRateService.getLiveMarketRates();
    
    // Disable browser caching for real-time accuracy
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Return rates with both requested keys and backward compatibility keys
    return res.status(200).json({
      success: true,
      
      // Snake_case keys as requested
      gold_24k: Number(rates.gold_24k),
      gold_22k: Number(rates.gold_22k),
      gold_18k: Number(rates.gold_18k),
      silver_rate: Number(rates.silver_rate),
      source: rates.source,
      market_status: rates.market_status,
      updated_at: rates.updated_at,

      // Change metrics
      gold24k_change: rates.gold24k_change,
      gold24k_change_percent: rates.gold24k_change_percent,
      gold24k_is_up: rates.gold24k_is_up,

      gold22k_change: rates.gold22k_change,
      gold22k_change_percent: rates.gold22k_change_percent,
      gold22k_is_up: rates.gold22k_is_up,

      gold18k_change: rates.gold18k_change,
      gold18k_change_percent: rates.gold18k_change_percent,
      gold18k_is_up: rates.gold18k_is_up,

      silver_change: rates.silver_change,
      silver_change_percent: rates.silver_change_percent,
      silver_is_up: rates.silver_is_up,

      // Backward compatible keys (used by existing UI code)
      gold18K: Number(rates.gold_18k),
      gold22K: Number(rates.gold_22k),
      gold24K: Number(rates.gold_24k),
      silverRate: Number(rates.silver_rate),
      updatedAt: rates.updated_at,
      isLive: rates.market_status === 'LIVE'
    });
  } catch (error) {
    console.error('🔴 [GoldRateController] Error fetching live market rates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch live market rates',
      error: error.message
    });
  }
};

module.exports = { 
  getLatestRate,
  getLiveRate
};

