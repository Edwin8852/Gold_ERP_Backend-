const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const response = await fetch('https://www.goodreturns.in/gold-rates/chennai.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    if (!response.ok) throw new Error('Status: ' + response.status);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // They have elements like 24K, 22K, 18K
    // Let's print out the text in their main gold rate container
    console.log("GoodReturns Gold Page Structure:");
    $('.gold_silver_table table tr').each((i, el) => {
      console.log('TR:', $(el).text().trim().replace(/\s+/g, ' '));
    });
    
    // Sometimes it's inside div.money-table
    $('.money-table table tr').each((i, el) => {
      console.log('MoneyTable TR:', $(el).text().trim().replace(/\s+/g, ' '));
    });
    
    // Also try to find by specific text
    $('*').each((i, el) => {
      const text = $(el).text();
      if(text.includes('18 Karat') || text.includes('18K')) {
        // console.log('18K text found:', text.substring(0, 100)); // Too noisy
      }
    });

  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
