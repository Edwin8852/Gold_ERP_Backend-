const goldRateService = require('../goldRates/goldRate.service');

class ValuationService {
  /**
   * Formula: Gold Value = Weight × Gold Rate × Purity Percentage
   */
  async calculateValuation(weight, purity) {
    const currentRate = await goldRateService.getCurrentRate();
    if (!currentRate) throw new Error('Gold rates unavailable');

    const purityPercentage = purity === '24K' ? 1 : (purity === '22K' ? 0.916 : 0.75);
    const baseRate = currentRate.gold24KRate; // Use 24K as base and multiply by purity
    
    const goldValue = weight * baseRate * purityPercentage;

    return {
      weight,
      purity,
      purityPercentage,
      goldRateSnapshot: baseRate,
      goldValue
    };
  }
}

module.exports = new ValuationService();
