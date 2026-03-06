const { webkit } = require('playwright');
const fs = require('fs');

const SESSION_FILE = './session.json';

async function createBrowser(headless = false) {
  return await webkit.launch({ headless });
}

async function createContext(browser) {
  if (fs.existsSync(SESSION_FILE)) {
    return await browser.newContext({
      storageState: SESSION_FILE,
      viewport: { width: 1440, height: 900 },
      locale: 'tr-TR',
    });
  }
  return await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'tr-TR',
  });
}

async function saveSession(context) {
  await context.storageState({ path: SESSION_FILE });
  console.log('  ✓ Oturum güncellendi.');
}

async function waitForLogin(page, targetDomain) {
  const url = page.url();
  if (!url.includes('accounts.google.com')) return;

  console.log('\n  >>> Tarayıcıda Google hesabınıza giriş yapın.');
  console.log('  >>> Giriş tamamlandıktan sonra otomatik devam edilecek...\n');

  let waited = 0;
  while (waited < 180000) {
    await new Promise(r => setTimeout(r, 3000));
    waited += 3000;
    const currentUrl = page.url();
    process.stdout.write(`\r  Bekleniyor... ${waited / 1000}s`);
    if (!currentUrl.includes('accounts.google.com')) {
      console.log('\n  ✓ Giriş başarılı!');
      return;
    }
  }
  console.log('\n  ✗ Giriş zaman aşımına uğradı.');
}

async function openPage(context, url, label) {
  const page = await context.newPage();
  console.log(`\n  → ${label} açılıyor...`);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));
    await waitForLogin(page, url);
    const title = await page.title();
    console.log(`  ✓ Açıldı: ${title}`);
  } catch (e) {
    console.log(`  ! Uyarı: ${e.message.substring(0, 80)}`);
  }
  return page;
}

module.exports = { createBrowser, createContext, saveSession, waitForLogin, openPage };
