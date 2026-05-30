const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get('https://www.livechennai.com/gold_silverrate.asp', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    const $ = cheerio.load(res.data);
    console.log($('table').text().toLowerCase().includes('18 k'));
    console.log($('table').text().toLowerCase().includes('18 carat'));
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
