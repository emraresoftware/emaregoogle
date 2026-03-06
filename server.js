const http = require('http');
const { webkit } = require('playwright');
const fs = require('fs');

const SESSION_FILE = './session.json';
const PORT = 3131;

let browser, context;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function init() {
  browser = await webkit.launch({ headless: true }); // ARKA PLAN — tarayıcı görünmez
  if (fs.existsSync(SESSION_FILE)) {
    context = await browser.newContext({
      storageState: SESSION_FILE,
      viewport: { width: 1440, height: 900 },
      locale: 'tr-TR',
    });
    console.log('[✓] Kaydedilmiş oturum yüklendi.');
  } else {
    context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'tr-TR' });
    console.log('[!] Oturum bulunamadı. Önce node login.js çalıştırın.');
  }
}

async function openUrl(url) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    const title = await page.title();
    const finalUrl = page.url();
    await context.storageState({ path: SESSION_FILE });
    return { ok: true, title, url: finalUrl };
  } catch (e) {
    await page.close();
    return { ok: false, error: e.message };
  }
}

async function getPageContent(url) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);
    const title = await page.title();
    const content = await page.evaluate(() => document.body?.innerText?.substring(0, 3000));
    await page.close();
    return { ok: true, title, content };
  } catch (e) {
    await page.close();
    return { ok: false, error: e.message };
  }
}

async function clickElement(url, selector) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1500);
    await page.click(selector, { timeout: 10000 });
    await sleep(1500);
    const title = await page.title();
    return { ok: true, title, url: page.url() };
  } catch (e) {
    await page.close();
    return { ok: false, error: e.message };
  }
}

// ─── HTTP API Sunucusu ────────────────────────────────────────────────────────
const ROUTES = {
  // GET /status
  '/status': async () => ({ ok: true, message: 'Emare Google Servisi çalışıyor', port: PORT }),

  // POST /open  { url }
  '/open': async (body) => await openUrl(body.url),

  // POST /read  { url }
  '/read': async (body) => await getPageContent(body.url),

  // POST /click { url, selector }
  '/click': async (body) => await clickElement(body.url, body.selector),
};

const SERVICES = {
  admin:    'https://admin.google.com',
  cloud:    'https://console.cloud.google.com',
  firebase: 'https://console.firebase.google.com',
  gemini:   'https://aistudio.google.com',
  analytics:'https://analytics.google.com',
  search:   'https://search.google.com/search-console',
  drive:    'https://drive.google.com',
  gmail:    'https://mail.google.com',
  youtube:  'https://studio.youtube.com',
  looker:   'https://lookerstudio.google.com',
  colab:    'https://colab.research.google.com',
  business: 'https://business.google.com',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  // GET /service/:name — hazır servis aç
  const serviceMatch = req.url.match(/^\/service\/(\w+)/);
  if (serviceMatch) {
    const name = serviceMatch[1];
    if (SERVICES[name]) {
      const result = await openUrl(SERVICES[name]);
      res.end(JSON.stringify(result));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ ok: false, error: 'Servis bulunamadı', available: Object.keys(SERVICES) }));
    }
    return;
  }

  const handler = ROUTES[req.url];
  if (!handler) {
    res.writeHead(404);
    res.end(JSON.stringify({
      ok: false,
      error: 'Route bulunamadı',
      routes: Object.keys(ROUTES),
      services: Object.keys(SERVICES).map(k => `/service/${k}`)
    }));
    return;
  }

  let body = {};
  if (req.method === 'POST') {
    const raw = await new Promise(r => { let d=''; req.on('data', c => d+=c); req.on('end', () => r(d)); });
    try { body = JSON.parse(raw); } catch(_) {}
  }

  try {
    const result = await handler(body);
    res.end(JSON.stringify(result));
  } catch (e) {
    res.writeHead(500);
    res.end(JSON.stringify({ ok: false, error: e.message }));
  }
});

(async () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  EMARE — Arka Plan Google Servis Sunucusu    ║');
  console.log('╚══════════════════════════════════════════════╝');
  await init();
  server.listen(PORT, () => {
    console.log(`[✓] Sunucu çalışıyor: http://localhost:${PORT}`);
    console.log(`[i] Servisleri açmak için:`);
    Object.keys(SERVICES).forEach(k => console.log(`    curl http://localhost:${PORT}/service/${k}`));
    console.log(`[i] Durum: curl http://localhost:${PORT}/status`);
  });
})();
