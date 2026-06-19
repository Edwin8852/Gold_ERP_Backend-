const goldRateService = require('../goldRates/goldRate.service');

class ValuationService {
  /**
   * Formula: Gold Value = Weight × Gold Rate × Purity Percentage
   */
  async calculateValuation(weight, purity) {
    const currentRate = await goldRateService.getCurrentRate();
    if (!currentRate) throw new Error('Gold rates unavailable');

    let baseRate = 0;
    if (purity === '24K') baseRate = currentRate.gold24k || currentRate.gold24KRate;
    else if (purity === '22K') baseRate = currentRate.gold22k || currentRate.gold22KRate;
    else if (purity === '18K') baseRate = currentRate.gold18k || currentRate.gold18KRate;
    
    if (!baseRate) throw new Error(`Rate for purity ${purity} unavailable`);

    const goldValue = weight * baseRate;

    return {
      weight,
      purity,
      purityPercentage: 1, // Kept for schema compat, actual rate is already adjusted
      goldRateSnapshot: baseRate,
      goldValue
    };
  }
}

module.exports = new ValuationService();
