const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const response = await axios.get('https://www.livechennai.com/gold_silverrate.asp');
  const $ = cheerio.load(response.data);
  $('table').each((i, table) => {
    console.log(`\n--- TABLE ${i} ---`);
    $(table).find('tr').slice(0, 5).each((j, tr) => {
      const row = $(tr).text().replace(/\s+/g, ' ').trim();
      console.log(`Row ${j}: ${row}`);
    });
  });
}
test();
