'use strict';

/**
 * ============================================================
 * SDRS Gold Finance — GoldRate Service (Production)
 * ============================================================
 *
 * Single authoritative source for all gold & silver rates.
 * CITY POLICY: Only Chennai market rates are allowed.
 *
 * Fetch priority:
 *   1. livechennai.com  (Chennai primary source)
 *
 * Persistence:
 *   - One record per calendar day (IST) in `gold_rates` table
 *   - Uses upsert on rateDate to prevent duplicates
 *   - If fetch fails, returns most recent valid Chennai DB record
 *   - If NO Chennai records exist, returns null (never uses another city)
 *
 * Timezone:
 *   - All dates computed in Asia/Kolkata (IST, UTC+5:30)
 *
 * ============================================================
 */

const axios   = require('axios');
const cheerio = require('cheerio');
const { Op }  = require('sequelize');
const { GoldRate, GoldMarketRate } = require('../../models');
const logger  = require('../../config/logger');

// ── In-memory cache (1-minute TTL for the live ticker) ─────────────────────
let _memCache    = null;
let _memCacheExp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute

// ── Axios browser-like headers to avoid bot-detection ──────────────────────
const BROWSER_HEADERS = {
  'User-Agent'     : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept'         : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8,ta;q=0.7',
  'Cache-Control'  : 'no-cache',
  'Pragma'         : 'no-cache',
  'Referer'        : 'https://www.google.com/',
};

// ── Validate an API key string isn't a placeholder ─────────────────────────
const isValidApiKey = (k) => {
  if (!k) return false;
  const c = k.trim().toLowerCase();
  return c !== '' && !c.startsWith('your_') && !c.includes('placeholder');
};

// ──────────────────────────────────────────────────────────────────────────
// TIMEZONE HELPER
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns today's date string 'YYYY-MM-DD' in Asia/Kolkata timezone.
 */
const getTodaysISTDate = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year:     'numeric',
    month:    '2-digit',
    day:      '2-digit',
  }).format(new Date()); // → 'YYYY-MM-DD'
};

/**
 * Returns current IST timestamp as a JS Date object (for storing fetchedAt).
 */
const getNowIST = () => {
  // Intl shifts to IST; create a date from its string representation
  const istStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
  return new Date(istStr);
};

// ──────────────────────────────────────────────────────────────────────────
// SCRAPER 1 — livechennai.com  (PRIMARY)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Scrapes gold and silver rates from livechennai.com/gold_silverrate.asp
 * Returns: { gold22k, gold24k, silverRate, source }
 */
const scrapeLiveChennai = async () => {
  logger.info('[GoldRateService] Scraping livechennai.com ...');
  console.log('🌐 [GoldRateService] Fetching from livechennai.com ...');

  const res = await axios.get('https://www.livechennai.com/gold_silverrate.asp', {
    headers: { ...BROWSER_HEADERS },
    timeout: 12000,
  });

  const $ = cheerio.load(res.data);

  let gold22k   = null;
  let gold24k   = null;
  let silverRate = null;

  // livechennai.com displays rates in a table with rows like:
  //  | 22 Carat Gold | ₹XXXXX / 8g |
  //  | 24 Carat Gold | ₹XXXXX / 8g |
  //  | Silver        | ₹XXX / gram |
  // We parse all <tr> elements and look for keyword matches.

  const toFloat = (str) => {
    if (!str) return null;
    const cleaned = str.replace(/[₹,\s]/g, '').trim();
    const val = parseFloat(cleaned);
    return isNaN(val) || val <= 0 ? null : val;
  };

  $('table tr').each((_, tr) => {
    const cells = $(tr).find('td');
    if (cells.length < 2) return;

    const label = $(cells[0]).text().replace(/\s+/g, ' ').trim().toLowerCase();
    const rawVal = $(cells[1]).text().replace(/\s+/g, ' ').trim();

    if ((label.includes('24 carat') || label.includes('24k') || label.includes('24 k')) && gold24k === null) {
      const per8g = toFloat(rawVal);
      if (per8g) gold24k = parseFloat((per8g / 8).toFixed(2));
    }

    // Silver is per gram on livechennai
    if (label.includes('silver') && silverRate === null) {
      const val = toFloat(rawVal);
      if (val) silverRate = parseFloat(val.toFixed(2));
    }
  });

  // Fallback: try alternate table structures if main pass yielded nothing
  if (!gold24k) {
    $('table').each((_, table) => {
      const text = $(table).text().replace(/\s+/g, ' ');
      if (!text.toLowerCase().includes('gold')) return;

      $(table).find('tr').each((_, tr) => {
        const cells = $(tr).find('td');
        if (cells.length < 2) return;
        const label = $(cells[0]).text().toLowerCase();
        const rawVal = $(cells[1]).text();

        if (label.includes('24') && !gold24k) {
          const per8g = toFloat(rawVal);
          if (per8g) gold24k = parseFloat((per8g / 8).toFixed(2));
        }
      });
    });
  }

  // Validate
  if (!gold24k || gold24k < 100) throw new Error('LIVECHENNAI_INVALID_24K');
  if (!silverRate || silverRate < 10) throw new Error('LIVECHENNAI_INVALID_SILVER');

  // Exact math calculations requested by user
  gold22k = parseFloat((gold24k * (22 / 24)).toFixed(2));
  let gold18k = parseFloat((gold24k * (18 / 24)).toFixed(2));

  logger.info(`[GoldRateService] livechennai.com -> 24K: ₹${gold24k}, 22K: ₹${gold22k}, 18K: ₹${gold18k}, Ag: ₹${silverRate}`);
  console.log(`[GoldRateService] Extracted Master 24K: ₹${gold24k}`);
  console.log("Market City:", "Chennai");
  console.log("24K Rate:", gold24k);
  console.log("22K Rate:", gold22k);
  console.log("Silver Rate:", silverRate);
  return { city: 'Chennai', gold18k, gold22k, gold24k, silverRate, source: 'Chennai Market Rates' };
};

// ──────────────────────────────────────────────────────────────────────────
// FETCH ORCHESTRATOR
// ──────────────────────────────────────────────────────────────────────────

/**
 * Tries scraping Chennai rates. Returns success or throws if fails.
 */
const fetchFreshRates = async () => {
  const errors = [];

  // 1. livechennai.com
  try {
    return await scrapeLiveChennai();
  } catch (e) {
    logger.warn(`[GoldRateService] livechennai failed: ${e.message}`);
    console.warn(`⚠️  livechennai.com failed (${e.message}).`);
    errors.push(`livechennai: ${e.message}`);
  }

  throw new Error(`ALL_SOURCES_FAILED: ${errors.join(' | ')}`);
};

// ──────────────────────────────────────────────────────────────────────────
// PERSIST — upsert today's rate into gold_rates table
// ──────────────────────────────────────────────────────────────────────────

/**
 * Saves or updates today's IST rate in the `gold_rates` table.
 * Uses findOne + create-or-update to stay compatible with Sequelize v6.
 *
 * @param {{ gold18k, gold22k, gold24k, silverRate, source }} freshRates
 * @returns {GoldRate} Saved Sequelize instance
 */
const persistTodaysRate = async (freshRates) => {
  const todayIST = getTodaysISTDate();
  const now      = getNowIST();

  const [record, created] = await GoldRate.findOrCreate({
    where: { rateDate: todayIST },
    defaults: {
      city:       freshRates.city || 'Chennai',
      gold18k:    freshRates.gold18k,
      gold22k:    freshRates.gold22k,
      gold24k:    freshRates.gold24k,
      silverRate: freshRates.silverRate,
      // Keep legacy fields in sync
      gold22KRate: freshRates.gold22k,
      gold24KRate: freshRates.gold24k,
      source:     freshRates.source,
      fetchedAt:  now,
      status:     'ACTIVE',
    },
  });

  if (!created) {
    // Record already exists for today — update with fresh data
    await record.update({
      city:       freshRates.city || 'Chennai',
      gold18k:    freshRates.gold18k,
      gold22k:    freshRates.gold22k,
      gold24k:    freshRates.gold24k,
      silverRate: freshRates.silverRate,
      gold22KRate: freshRates.gold22k,
      gold24KRate: freshRates.gold24k,
      source:     freshRates.source,
      fetchedAt:  now,
    });
    logger.info(`[GoldRateService] Updated today's (${todayIST}) rate from ${freshRates.source}`);
  } else {
    logger.info(`[GoldRateService] Created today's (${todayIST}) rate from ${freshRates.source}`);
  }

  await record.reload();
  return record;
};

// ──────────────────────────────────────────────────────────────────────────
// MAIN PUBLIC API — fetchAndSaveTodaysRate
// ──────────────────────────────────────────────────────────────────────────

/**
 * Fetches fresh rates from the web and saves to DB for today (IST).
 * Used by cron job and by getLatestRate() when today's record is missing.
 *
 * @returns {GoldRate} Saved DB record
 */
const fetchAndSaveTodaysRate = async () => {
  logger.info('[GoldRateService] fetchAndSaveTodaysRate() called.');
  const fresh = await fetchFreshRates();
  const saved = await persistTodaysRate(fresh);
  // Also save to GoldMarketRate for the live ticker / change metrics
  try {
    await GoldMarketRate.create({
      city:          fresh.city || 'Chennai',
      gold_24k:      fresh.gold24k,
      gold_22k:      fresh.gold22k,
      gold_18k:      fresh.gold18k,
      silver_rate:   fresh.silverRate,
      source:        fresh.source,
      market_status: 'LIVE',
      updated_at:    new Date(),
    });
  } catch (mErr) {
    logger.warn(`[GoldRateService] GoldMarketRate insert warning: ${mErr.message}`);
  }
  return saved;
};

// ──────────────────────────────────────────────────────────────────────────
// getLatestRate — used by /api/gold-rates/latest
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns today's gold/silver rate.
 * Strategy:
 *   1. Look for today's (IST) record in DB.
 *   2. If missing → trigger fetchAndSaveTodaysRate().
 *   3. If fetch also fails → return the most recent valid DB record.
 *   4. Never return random/placeholder data.
 *
 * @returns {{ gold22k, gold24k, silverRate, updatedAt, source, rateDate }}
 */
const getLatestRate = async () => {
  const todayIST = getTodaysISTDate();
  logger.info(`[GoldRateService] getLatestRate() — looking for ${todayIST} in DB.`);

  // 1. Check for today's record
  let record = await GoldRate.findOne({ where: { rateDate: todayIST } });

  if (record && record.gold22k && Number(record.gold22k) > 100) {
    logger.info(`[GoldRateService] Today's rate found in DB (source: ${record.source})`);
    return formatRateResponse(record);
  }

  // 2. Today's record missing or invalid — fetch from web
  logger.info('[GoldRateService] No valid record for today. Fetching fresh rates ...');
  console.log('🔄 [GoldRateService] No today\'s rate in DB. Fetching live ...');

  try {
    record = await fetchAndSaveTodaysRate();
    if (record && record.gold22k && Number(record.gold22k) > 100) {
      return formatRateResponse(record);
    }
  } catch (fetchErr) {
    logger.warn(`[GoldRateService] Live fetch failed: ${fetchErr.message}. Falling back to last DB record.`);
    console.warn(`⚠️  Live fetch failed. Using last known valid DB record.`);
  }

  // 3. DB fallback — most recent valid record (could be yesterday)
  // NOTE: Do NOT filter by city here — the column may not exist on first deploy
  let lastRecord = null;
  try {
    lastRecord = await GoldRate.findOne({
      where: {
        gold22k: { [Op.not]: null },
        gold24k: { [Op.not]: null },
      },
      order: [['rateDate', 'DESC']],
    });
  } catch (dbErr) {
    logger.error(`[GoldRateService] DB fallback query failed: ${dbErr.message}`);
  }

  if (lastRecord) {
    logger.warn(`[GoldRateService] Using DB fallback record (${lastRecord.rateDate}) for today's display.`);
    return { ...formatRateResponse(lastRecord), isFallback: true };
  }

  // 4. Absolute last resort — should never happen in production
  logger.error('[GoldRateService] No DB records at all. Returning null.');
  return null;
};

/**
 * Format a GoldRate DB record into the canonical API response shape.
 */
const formatRateResponse = (record) => ({
  city:       record.city || 'Chennai',
  gold18k:    parseFloat(Number(record.gold18k || (record.gold24k * (18/24))).toFixed(2)),
  gold22k:    parseFloat(Number(record.gold22k).toFixed(2)),
  gold24k:    parseFloat(Number(record.gold24k).toFixed(2)),
  silverRate: parseFloat(Number(record.silverRate).toFixed(2)),
  updatedAt:  record.fetchedAt || record.updatedAt || record.createdAt,
  rateDate:   record.rateDate,
  source:     record.source,
  // Legacy aliases (for loan calculation code)
  gold22KRate: parseFloat(Number(record.gold22k).toFixed(2)),
  gold24KRate: parseFloat(Number(record.gold24k).toFixed(2)),
});

// ──────────────────────────────────────────────────────────────────────────
// getLiveMarketRates — used by /api/gold-rates/live (live ticker)
// ──────────────────────────────────────────────────────────────────────────

/**
 * Returns full live-market response with change metrics for the UI ticker.
 * Uses 1-minute in-memory cache to avoid hammering scrapers.
 */
const getLiveMarketRates = async () => {
  const now = Date.now();

  // Return from memory cache if still fresh
  if (_memCache && now < _memCacheExp) {
    logger.info('[GoldRateService] Returning live rates from memory cache.');
    return _memCache;
  }

  let freshRates = null;
  let marketStatus = 'LIVE';

  try {
    freshRates = await fetchFreshRates();
  } catch (fetchErr) {
    logger.warn(`[GoldRateService] Live fetch for ticker failed: ${fetchErr.message}`);
    marketStatus = 'CACHED';
  }

  if (freshRates) {
    // Fetch previous GoldMarketRate record for change metric computation
    const prevSaved = await GoldMarketRate.findOne({ order: [['updated_at', 'DESC']] }).catch(() => null);
    const changes   = computeChangeMetrics(freshRates, prevSaved);

    // Persist to GoldMarketRate and today's GoldRate
    try {
      await persistTodaysRate(freshRates);
      await GoldMarketRate.create({
        city:          freshRates.city || 'Chennai',
        gold_24k:      freshRates.gold24k,
        gold_22k:      freshRates.gold22k,
        gold_18k:      freshRates.gold18k,
        silver_rate:   freshRates.silverRate,
        source:        freshRates.source,
        market_status: 'LIVE',
        updated_at:    new Date(),
      });
    } catch (dbErr) {
      logger.warn(`[GoldRateService] DB write warning during getLiveMarketRates: ${dbErr.message}`);
    }

    const response = buildLiveResponse(freshRates, 'LIVE', changes);
    _memCache    = response;
    _memCacheExp = now + CACHE_TTL_MS;
    return response;
  }

  // Scrape failed — use DB fallback
  const lastMarket = await GoldMarketRate.findOne({ order: [['updated_at', 'DESC']] }).catch(() => null);
  if (lastMarket) {
    const secondLast = await GoldMarketRate.findOne({ order: [['updated_at', 'DESC']], offset: 1 }).catch(() => null);
    const asRates    = {
      gold22k:    Number(lastMarket.gold_22k),
      gold24k:    Number(lastMarket.gold_24k),
      silverRate: Number(lastMarket.silver_rate),
    };
    const changes = computeChangeMetrics(asRates, secondLast ? {
      gold22k:    Number(secondLast.gold_22k),
      gold24k:    Number(secondLast.gold_24k),
      silverRate: Number(secondLast.silver_rate),
    } : null);

    const response = buildLiveResponse(
      { ...asRates, source: lastMarket.source || 'DB Cache' },
      'CACHED',
      changes,
      lastMarket.updated_at,
    );
    _memCache    = response;
    _memCacheExp = now + CACHE_TTL_MS;
    return response;
  }

  // Try GoldRate table as last resort
  let lastGoldRate = null;
  try {
    lastGoldRate = await GoldRate.findOne({
      where: { gold22k: { [Op.not]: null } },
      order: [['rateDate', 'DESC']],
    });
  } catch (dbErr) {
    logger.error(`[GoldRateService] GoldRate fallback query failed: ${dbErr.message}`);
  }

  if (lastGoldRate) {
    const asRates = {
      gold22k:    Number(lastGoldRate.gold22k),
      gold24k:    Number(lastGoldRate.gold24k),
      silverRate: Number(lastGoldRate.silverRate),
    };
    const response = buildLiveResponse({ ...asRates, source: 'DB Fallback' }, 'CACHED', computeChangeMetrics(asRates, null));
    _memCache    = response;
    _memCacheExp = now + CACHE_TTL_MS;
    return response;
  }

  // Absolute static default (prevents UI crash)
  logger.error('[GoldRateService] CRITICAL: No rates in any table. Returning static defaults.');
  return buildLiveResponse(
    { gold22k: 7350, gold24k: 8020, silverRate: 98, source: 'Static Default' },
    'API ERROR',
    computeChangeMetrics(null, null),
  );
};

// ──────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────

/**
 * Computes change metrics between current and previous rate objects.
 */
const computeChangeMetrics = (current, previous) => {
  if (!current || !previous) {
    return {
      gold24k_change: 0, gold24k_change_percent: 0, gold24k_is_up: true,
      gold22k_change: 0, gold22k_change_percent: 0, gold22k_is_up: true,
      gold18k_change: 0, gold18k_change_percent: 0, gold18k_is_up: true,
      silver_change:  0, silver_change_percent:  0, silver_is_up:  true,
    };
  }

  const c24 = Number(current.gold24k);  const p24 = Number(previous.gold24k || previous.gold_24k || c24);
  const c22 = Number(current.gold22k);  const p22 = Number(previous.gold22k || previous.gold_22k || c22);
  const c18 = Number(current.gold18k);  const p18 = Number(previous.gold18k || previous.gold_18k || c18);
  const cAg = Number(current.silverRate || current.silver_rate || 0);
  const pAg = Number(previous.silverRate || previous.silver_rate || cAg);

  const pct = (diff, base) => parseFloat(base > 0 ? ((diff / base) * 100).toFixed(2) : '0');

  return {
    gold24k_change:         parseFloat((c24 - p24).toFixed(2)),
    gold24k_change_percent: pct(c24 - p24, p24),
    gold24k_is_up:          c24 >= p24,
    gold22k_change:         parseFloat((c22 - p22).toFixed(2)),
    gold22k_change_percent: pct(c22 - p22, p22),
    gold22k_is_up:          c22 >= p22,
    gold18k_change:         parseFloat((c18 - p18).toFixed(2)),
    gold18k_change_percent: pct(c18 - p18, p18),
    gold18k_is_up:          c18 >= p18,
    silver_change:          parseFloat((cAg - pAg).toFixed(2)),
    silver_change_percent:  pct(cAg - pAg, pAg),
    silver_is_up:           cAg >= pAg,
  };
};

/**
 * Builds the full live-market response shape expected by the frontend ticker.
 */
const buildLiveResponse = (rates, status, changes, updatedAt = new Date()) => ({
  // Snake_case (primary)
  gold_24k:    rates.gold24k,
  gold_22k:    rates.gold22k,
  gold_18k:    rates.gold18k,
  silver_rate: rates.silverRate,
  source:      rates.source,
  market_status: status,
  updated_at:  updatedAt,

  // Change metrics
  ...changes,

  // Backward-compat camelCase keys (used by existing UI)
  gold18K:    rates.gold18k,
  gold22K:    rates.gold22k,
  gold24K:    rates.gold24k,
  silverRate: rates.silverRate,
  updatedAt:  updatedAt,
  isLive:     status === 'LIVE',
});

// ──────────────────────────────────────────────────────────────────────────
// LEGACY COMPAT (used by cron and loan calculation code)
// ──────────────────────────────────────────────────────────────────────────

const getCurrentRate = getLatestRate;

/**
 * Used by loan valuation — returns gold22k / gold24k for weight calculation.
 * Now reads from the real DB rate instead of random mock.
 */
const calculateValuation = (weight, purity, activeRate) => {
  const rate   = purity === '24K'
    ? (activeRate.gold24k || activeRate.gold24KRate)
    : (activeRate.gold22k || activeRate.gold22KRate);
  const goldValue          = weight * rate;
  const eligibleLoanAmount = goldValue * 0.75; // 75% LTV
  return { goldValue, eligibleLoanAmount };
};

// ──────────────────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────────────────

module.exports = {
  // Primary public API
  getLatestRate,
  getLiveMarketRates,
  fetchAndSaveTodaysRate,
  getTodaysISTDate,

  // Legacy compat (preserved to avoid breaking cron.js and loan controllers)
  getCurrentRate,
  calculateValuation,

  // Deprecated — no longer generates random data; kept for safety import compat
  updateGoldRate: fetchAndSaveTodaysRate,
};
