'use strict';

/**
 * Live Rate Service
 * ============================================================
 * SDRS Gold Finance — Chennai-Only Live Rate Service
 * ============================================================
 *
 * Fetches gold and silver prices exclusively for Chennai
 * from livechennai.com (primary source).
 *
 * CITY POLICY: Only Chennai market rates are allowed.
 * Any other city data is rejected.
 *
 * ============================================================
 */

const { LiveRate } = require('../../../models');
const axios   = require('axios');
const cheerio = require('cheerio');
const logger  = require('../../../config/logger');

const CITY = 'Chennai';
const SOURCE_LABEL = 'Chennai Market Rates';

class LiveRateService {
  constructor() {
    this.refreshInterval = 30 * 60 * 1000; // 30 minutes
    this.sourceUrl = 'https://www.livechennai.com/gold_silverrate.asp';

    // Chennai market reference rates (used only when live fetch fails)
    this.fallbackRates = {
      city:        CITY,
      gold18k:     null,
      gold22k:     null,
      gold24k:     null,
      silver:      null,
      lastUpdated: new Date(),
      isLive:      false,
      source:      SOURCE_LABEL,
    };

    this.cachedRate = this.fallbackRates;
  }

  /**
   * Remove currency symbols, commas, whitespace and convert to float.
   */
  parsePrice(str) {
    if (!str) return 0;
    const clean = str.replace(/[₹\s,]/g, '').trim();
    return parseFloat(clean) || 0;
  }

  /**
   * Scrape real-time Chennai gold & silver rates from livechennai.com
   */
  async fetchLiveRates() {
    const goldRateService = require('../../goldRates/goldRate.service');
    // We already have a robust scraper in goldRateService.
    const rates = await goldRateService.getLiveMarketRates();
    
    if (!rates) throw new Error('Failed to fetch from unified rate service');
    
    return {
      city:      CITY,
      gold24k:   rates.gold_24k || rates.gold24k,
      gold22k:   rates.gold_22k || rates.gold22k,
      gold18k:   rates.gold_18k || rates.gold18k,
      silver:    rates.silver_rate || rates.silverRate,
      updatedAt: new Date(),
      source:    SOURCE_LABEL,
    };
  }

  /**
   * Persist fetched rates and update in-memory cache.
   */
  async updateRates() {
    try {
      const goldRateService = require('../../goldRates/goldRate.service');
      await goldRateService.fetchAndSaveTodaysRate();
      const rates = await this.fetchLiveRates();

      const newRate = await LiveRate.create({
        gold18k: rates.gold18k,
        gold22k: rates.gold22k,
        gold24k: rates.gold24k,
        silver:  rates.silver,
        source:  rates.source,
      });

      this.cachedRate = {
        city:        CITY,
        gold18k:     Number(newRate.gold18k),
        gold22k:     Number(newRate.gold22k),
        gold24k:     Number(newRate.gold24k),
        silver:      Number(newRate.silver),
        lastUpdated: newRate.createdAt,
        isLive:      true,
        source:      SOURCE_LABEL,
      };

      logger.info(`[LiveRateService] Successfully updated Chennai rates.`);
      return this.cachedRate;

    } catch (error) {
      logger.warn(`[LiveRateService] Chennai rate fetch failed: ${error.message}. Checking DB for last known rate.`);

      // Use last DB record — still Chennai only
      const lastValid = await LiveRate.findOne({
        order: [['createdAt', 'DESC']],
      }).catch(() => null);

      if (lastValid) {
        this.cachedRate = {
          city:        CITY,
          gold18k:     Number(lastValid.gold18k),
          gold22k:     Number(lastValid.gold22k),
          gold24k:     Number(lastValid.gold24k),
          silver:      Number(lastValid.silver),
          lastUpdated: lastValid.createdAt,
          isLive:      false,
          source:      `${SOURCE_LABEL} (Cached)`,
        };
      } else {
        // No DB records at all — mark as unavailable, do NOT use fallback numbers
        this.cachedRate = {
          city:        CITY,
          gold18k:     null,
          gold22k:     null,
          gold24k:     null,
          silver:      null,
          lastUpdated: new Date(),
          isLive:      false,
          source:      'Chennai Rate Temporarily Unavailable',
        };
      }

      return this.cachedRate;
    }
  }

  /**
   * Get the latest cached Chennai rate.
   */
  async getLatestRate() {
    return this.cachedRate;
  }

  /**
   * Start the 30-minute auto-refresh cycle.
   */
  startAutoRefresh() {
    logger.info(`[LiveRateService] Starting Chennai rate auto-refresh every ${this.refreshInterval / 60000} minutes.`);
    if (this.timer) clearInterval(this.timer);
    this.updateRates(); // immediate first fetch
    this.timer = setInterval(() => this.updateRates(), this.refreshInterval);
  }
}

module.exports = new LiveRateService();
