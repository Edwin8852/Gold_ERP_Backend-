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
    logger.info(`[LiveRateService] Fetching Chennai rates from: ${this.sourceUrl}`);
    console.log(`[LiveRateService] Fetching Chennai Market Rates from livechennai.com ...`);

    const response = await axios.get(this.sourceUrl, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8,ta;q=0.7',
        'Cache-Control':   'no-cache',
        'Pragma':          'no-cache',
        'Referer':         'https://www.google.com/',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    const toFloat = (str) => {
      if (!str) return null;
      const cleaned = str.replace(/[₹,\s]/g, '').trim();
      const val = parseFloat(cleaned);
      return isNaN(val) || val <= 0 ? null : val;
    };

    let gold24k    = null;
    let gold22k    = null;
    let silverRate = null;

    $('table tr').each((_, tr) => {
      const cells = $(tr).find('td');
      if (cells.length < 2) return;

      const label  = $(cells[0]).text().replace(/\s+/g, ' ').trim().toLowerCase();
      const rawVal = $(cells[1]).text().replace(/\s+/g, ' ').trim();

      if ((label.includes('24 carat') || label.includes('24k')) && gold24k === null) {
        const per8g = toFloat(rawVal);
        if (per8g) gold24k = parseFloat((per8g / 8).toFixed(2));
      }
      if (label.includes('silver') && silverRate === null) {
        const val = toFloat(rawVal);
        if (val) silverRate = parseFloat(val.toFixed(2));
      }
    });

    if (!gold24k || gold24k < 100) {
      throw new Error('LIVECHENNAI_INVALID_24K: Could not parse Chennai 24K rate');
    }

    // Derive lower purities from master 24K (Chennai rate)
    gold22k = parseFloat((gold24k * (22 / 24)).toFixed(2));
    const gold18k = parseFloat((gold24k * (18 / 24)).toFixed(2));

    console.log(`Market City: ${CITY}`);
    console.log(`24K Rate: ${gold24k}`);
    console.log(`22K Rate: ${gold22k}`);
    console.log(`Silver Rate: ${silverRate}`);

    logger.info(`[LiveRateService] Chennai rates — 24K: ₹${gold24k}, 22K: ₹${gold22k}, 18K: ₹${gold18k}, Ag: ₹${silverRate}`);

    return {
      city:      CITY,
      gold24k,
      gold22k,
      gold18k,
      silver:    silverRate,
      updatedAt: new Date(),
      source:    SOURCE_LABEL,
    };
  }

  /**
   * Persist fetched rates and update in-memory cache.
   */
  async updateRates() {
    try {
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
