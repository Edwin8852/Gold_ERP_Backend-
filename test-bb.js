const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://www.bankbazaar.com/gold-rate-chennai.html', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(res.data);
    console.log($('body').text().substring(0, 500));
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
