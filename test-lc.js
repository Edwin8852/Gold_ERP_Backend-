const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  try {
    const res = await axios.get(`https://api.allorigins.win/get?url=${encodeURIComponent('https://www.goodreturns.in/gold-rates/chennai.html')}`);
    const $ = cheerio.load(res.data.contents);
    let found = false;
    $('.gold_silver_table table tr').each((i, table) => {
       console.log("Table TR:", $(table).text().replace(/\s+/g, ' ').trim());
       found = true;
    });
    if (!found) console.log("Not found via allorigins");
  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
