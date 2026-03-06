const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const urls = [
  'https://www.emareas.com/',
  'https://www.emareas.com/login',
  'https://www.emareas.com/admin',
  'https://www.emareas.com/giris',
  'https://www.emareas.com/dashboard',
  'https://emareas.com/wp-admin',
];

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  for (const url of urls) {
    const page = await browser.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await new Promise(r => setTimeout(r, 2000));
      const finalUrl = page.url();
      const status = resp ? resp.status() : '?';
      const title = await page.title();
      console.log(`[${status}] ${url} => ${finalUrl} | "${title}"`);
    } catch (e) {
      console.log(`[ERR] ${url} => ${e.message.substring(0, 60)}`);
    }
    await page.close();
  }

  await browser.close();
})();
