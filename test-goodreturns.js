const cheerio = require('cheerio');

async function test() {
  try {
    const res = await fetch('https://api.allorigins.win/raw?url=https://www.goodreturns.in/gold-rates/chennai.html');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    console.log('--- TABLES ---');
    $('table').each((i, tbl) => {
      const text = $(tbl).text().toLowerCase();
      if (text.includes('24 carat')) {
        console.log(`Table ${i} matches '24 carat':`);
        $(tbl).find('tr').each((j, tr) => {
          console.log(`  TR ${j}:`, $(tr).text().trim().replace(/\s+/g, ' '));
        });
      }
    });

  } catch(e) {
    console.error('Error:', e.message);
  }
}
test();
