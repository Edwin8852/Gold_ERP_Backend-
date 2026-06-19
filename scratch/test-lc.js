const axios = require('axios');
const cheerio = require('cheerio');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8,ta;q=0.7',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.google.com/',
};

const scrapeLiveChennai = async () => {
  const res = await axios.get('https://www.livechennai.com/gold_silverrate.asp', {
    headers: { ...BROWSER_HEADERS },
    timeout: 12000,
  });

  const $ = cheerio.load(res.data);

  let gold22k   = null;
  let gold24k   = null;
  let silverRate = null;

  const toFloat = (str) => {
    if (!str) return null;
    const cleaned = str.replace(/[₹,\s]/g, '').trim();
    const val = parseFloat(cleaned);
    return isNaN(val) || val <= 0 ? null : val;
  };

  $('table').each((i, table) => {
    const text = $(table).text().toLowerCase();
    if (text.includes('pure gold (24 k)') || text.includes('standard gold (22 k)')) {
      $(table).find('tr').each((j, tr) => {
        const cells = $(tr).find('td');
        if (cells.length >= 5) {
          const dateStr = $(cells[0]).text().trim();
          if (dateStr.includes('/') && gold24k === null) {
            const val24k = toFloat($(cells[1]).text());
            const val22k = toFloat($(cells[3]).text());
            if (val24k) gold24k = val24k;
            if (val22k) gold22k = val22k;
          }
        }
      });
    }
    
    if (text.includes('silver 1 gm') && text.includes('ready silver')) {
      $(table).find('tr').each((j, tr) => {
        const cells = $(tr).find('td');
        if (cells.length >= 3) {
          const dateStr = $(cells[0]).text().trim();
          if (dateStr.includes('/') && silverRate === null) {
            const valAg = toFloat($(cells[1]).text());
            if (valAg) silverRate = valAg;
          }
        }
      });
    }
  });

  console.log('LiveChennai:', { gold24k, gold22k, silverRate });
};

scrapeLiveChennai().catch(console.error);
