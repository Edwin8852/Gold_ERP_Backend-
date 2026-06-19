const axios = require('axios');
const cheerio = require('cheerio');

async function getSilver() {
  const res = await axios.get('https://www.goodreturns.in/silver-rates/chennai.html');
  const $ = cheerio.load(res.data);
  const silverText = $('#1gm_silver_rate').text() || $('.silver-price').text() || $('div:contains("1 gram")').text().substring(0, 500);
  console.log('Silver HTML:', silverText);

  // let's try finding the table again but print all text
  let found = false;
  $('table').each((i, table) => {
    const text = $(table).text().toLowerCase();
    if (text.includes('1 gram')) {
       console.log('TABLE FOUND');
       $(table).find('tr').each((j, tr) => {
           console.log('ROW:', $(tr).text().replace(/\s+/g, ' '));
       });
    }
  });
}
getSilver();
