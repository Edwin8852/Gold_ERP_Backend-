const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const sites = [
    'https://www.bankbazaar.com/gold-rate-chennai.html',
    'https://www.policybazaar.com/gold-rate-chennai/',
    'https://www.cred.club/gold-loan/gold-rate-today-in-chennai',
    'https://www.goldratetoday.com/chennai-gold-rate.php'
  ];

  for (const url of sites) {
    try {
      console.log('Testing', url);
      const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(res.data);
      console.log('Length:', $('body').text().length, 'Includes 18:', $('body').text().includes('18'));
    } catch(e) {
      console.error(url, 'Error:', e.message);
    }
  }
}
test();
