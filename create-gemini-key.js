/**
 * AI Studio üzerinden yeni Gemini API key oluşturur
 * Mevcut session.json oturumunu kullanır
 */
const { webkit } = require('playwright');
const fs = require('fs');

const SESSION_FILE = './session.json';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function createGeminiKey() {
  if (!fs.existsSync(SESSION_FILE)) {
    console.error('session.json bulunamadı! Önce node gcloud-login.js çalıştırın.');
    process.exit(1);
  }

  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1440, height: 900 },
    locale: 'tr-TR',
  });

  const page = await context.newPage();

  try {
    console.log('[1] AI Studio API key sayfası açılıyor...');
    await page.goto('https://aistudio.google.com/app/apikey', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await sleep(3000);

    const title = await page.title();
    const url = page.url();
    console.log(`    Başlık: ${title}`);
    console.log(`    URL: ${url}`);

    // Yanlış sayfaya gittiyse uyar
    if (!url.includes('aistudio.google.com') && !url.includes('makersuite')) {
      console.log('    Sayfa içeriği:', await page.evaluate(() => document.body?.innerText?.substring(0, 300)));
      throw new Error('AI Studio sayfası açılamadı');
    }

    console.log('[2] "Create API key" butonu aranıyor...');

    // Buton için farklı selector'lar dene
    const buttonSelectors = [
      'button:has-text("Create API key")',
      'button:has-text("API anahtarı oluştur")',
      '[data-testid="create-api-key-button"]',
      'mat-raised-button:has-text("Create")',
      'button.create-key-button',
    ];

    let clicked = false;
    for (const sel of buttonSelectors) {
      try {
        await page.click(sel, { timeout: 5000 });
        console.log(`    Tıklandı: ${sel}`);
        clicked = true;
        break;
      } catch (_) {}
    }

    if (!clicked) {
      // Sayfadaki butonları listele
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(t => t);
      });
      console.log('    Bulunan butonlar:', buttons.slice(0, 10));

      // "Create" içeren butona tıkla
      const createBtn = buttons.find(b => b.toLowerCase().includes('create'));
      if (createBtn) {
        await page.click(`button:has-text("${createBtn}")`, { timeout: 5000 });
        clicked = true;
      }
    }

    if (!clicked) {
      // Network request intercept ile key endpoint'ini dene
      console.log('[!] Buton bulunamadı, REST API endpoint deneniyor...');
      throw new Error('Buton bulunamadı');
    }

    await sleep(3000);

    console.log('[3] Key aranıyor...');

    // Dialog veya sayfada key görünüyor mu?
    const pageText = await page.evaluate(() => document.body?.innerText?.substring(0, 5000));

    // AIzaSy ile başlayan key bul
    const keyMatch = pageText.match(/AIzaSy[A-Za-z0-9_-]{33}/);
    if (keyMatch) {
      const newKey = keyMatch[0];
      console.log(`\n✅ YENİ GEMİNİ API KEY: ${newKey}\n`);
      fs.writeFileSync('/tmp/new_gemini_key.txt', newKey);

      // session kaydet
      await context.storageState({ path: SESSION_FILE });
      await browser.close();
      return newKey;
    }

    // Dialog içinde key arama
    const dialogText = await page.evaluate(() => {
      const dialogs = document.querySelectorAll('[role="dialog"], mat-dialog-container, .mat-dialog-content');
      return Array.from(dialogs).map(d => d.innerText).join('\n');
    });
    const dialogMatch = dialogText.match(/AIzaSy[A-Za-z0-9_-]{33}/);
    if (dialogMatch) {
      const newKey = dialogMatch[0];
      console.log(`\n✅ YENİ GEMİNİ API KEY: ${newKey}\n`);
      fs.writeFileSync('/tmp/new_gemini_key.txt', newKey);
      await context.storageState({ path: SESSION_FILE });
      await browser.close();
      return newKey;
    }

    console.log('    Sayfa metni (ilk 1000):', pageText.substring(0, 1000));
    throw new Error('Key bulunamadı');

  } catch (e) {
    console.error('HATA:', e.message);
    // Screenshot için sayfa içeriğini kaydet
    try {
      const ss = await page.screenshot({ path: '/tmp/gemini-key-debug.png', fullPage: true });
    } catch(_) {}
    await browser.close();
    process.exit(1);
  }
}

createGeminiKey();
