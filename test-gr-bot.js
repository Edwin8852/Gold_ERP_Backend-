const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const response = await axios.get('https://www.goodreturns.in/gold-rates/chennai.html', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });
    
    const html = response.data;
    const $ = cheerio.load(html);
    
    // We will find the div with gold rates
    console.log("GoodReturns Gold Page Structure:");
    let gold22k = null;
    let gold24k = null;
    let gold18k = null;
    let silver = null;
    
    // Find strong tags inside the tables
    $('.gold_silver_table strong').each((i, el) => {
       console.log("Strong tag:", $(el).text());
    });
    
    $('table tr').each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if(text.includes('1 Gram') || text.includes('1 gram')) {
        console.log("TR:", text);
      }
    });
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
