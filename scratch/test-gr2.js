const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeGoodReturns() {
  try {
    const res = await axios.get('https://www.goodreturns.in/gold-rates/chennai.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-IN,en-GB;q=0.9,en;q=0.8,ta;q=0.7',
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(res.data);
    
    let gold24k = null;
    let gold22k = null;
    let gold18k = null;
    
    // The previous code used $('#18K-price').text() - Let's see if there are other ids
    const price18kText = $('#18K-price').text();
    const price22kText = $('#22K-price').text();
    const price24kText = $('#24K-price').text();
    
    console.log('18K Text by ID:', price18kText);
    console.log('22K Text by ID:', price22kText);
    console.log('24K Text by ID:', price24kText);

    // Let's also grab silver if available
    const silverRes = await axios.get('https://www.goodreturns.in/silver-rates/chennai.html', {
        headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
    });
    const $ag = cheerio.load(silverRes.data);
    
    // There's usually a table with prices
    let silverPrice = null;
    $ag('table').each((i, table) => {
       const text = $ag(table).text().toLowerCase();
       if (text.includes('1 gram')) {
          $ag(table).find('tr').each((j, tr) => {
             const tds = $ag(tr).find('td');
             if (tds.length >= 2) {
                const first = $ag(tds[0]).text().toLowerCase();
                if (first.includes('1 gram')) {
                   silverPrice = $ag(tds[1]).text().trim();
                }
             }
          });
       }
    });
    
    console.log('Silver price text:', silverPrice);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

scrapeGoodReturns();
