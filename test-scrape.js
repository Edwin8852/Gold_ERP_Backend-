const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.livechennai.com/gold_silverrate.asp', {
  headers: {'User-Agent': 'Mozilla/5.0'}
}).then(res => {
  const $ = cheerio.load(res.data);
  console.log($('body').text().replace(/\s+/g, ' ').substring(0, 2000));
}).catch(console.error);
