const { webkit } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await webkit.launch({ headless: false });
  const ctx = await browser.newContext({
    storageState: './session.json',
    viewport: { width: 1280, height: 900 }
  });
  const page = await ctx.newPage();

  console.log('[1] AI Studio açılıyor...');
  await page.goto('https://aistudio.google.com/app/apikey', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });
  await new Promise(r => setTimeout(r, 5000));

  // Önce mevcut key'leri kontrol et
  let body = await page.evaluate(() => document.body?.innerText || '');
  let keys = [...body.matchAll(/AIza[0-9A-Za-z_\-]{35,}/g)].map(m => m[0]);
  if (keys.length > 0) {
    console.log('[✓] Mevcut key(ler) bulundu:');
    keys.forEach((k, i) => console.log(`  ${i+1}. ${k}`));
    fs.writeFileSync('/tmp/gemini_apikey.txt', keys[0]);
    await ctx.storageState({ path: './session.json' });
    await browser.close();
    process.exit(0);
  }

  // Yeni key oluştur
  console.log('[2] Yeni key oluşturma deneniyor...');
  const createSelectors = [
    'button:has-text("Create API key")',
    'button:has-text("API anahtarı oluştur")',
    'a:has-text("Create API key")',
    'button:has-text("Get API key")',
  ];

  for (const sel of createSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        console.log('[2] Buton tıklandı: ' + sel);
        await btn.click();
        await new Promise(r => setTimeout(r, 4000));
        break;
      }
    } catch (_) {}
  }

  // Proje seçim dialogu
  try {
    const combobox = page.locator('mat-select, [role="combobox"], [aria-label*="project" i]').first();
    if (await combobox.isVisible({ timeout: 3000 })) {
      console.log('[3] Proje seçiliyor: emarehup');
      await combobox.click();
      await new Promise(r => setTimeout(r, 1500));
      
      for (const projName of ['EmareHup', 'emarehup', 'Emare']) {
        const opt = page.locator(`mat-option:has-text("${projName}")`).first();
        if (await opt.isVisible({ timeout: 1000 }).catch(() => false)) {
          await opt.click();
          console.log('[3] Proje seçildi: ' + projName);
          break;
        }
      }
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (_) {}

  // Oluştur butonu
  const confirmSelectors = [
    'button:has-text("Create API key in existing project")',
    'button:has-text("Create API key in new project")',
    'button:has-text("Create")',
    'button:has-text("Oluştur")',
    '[mat-raised-button]',
  ];

  for (const sel of confirmSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 2000 })) {
        console.log('[4] Oluştur tıklandı: ' + sel);
        await btn.click();
        await new Promise(r => setTimeout(r, 5000));
        break;
      }
    } catch (_) {}
  }

  // Key'i bekle ve oku
  console.log('[5] API key bekleniyor...');
  for (let i = 0; i < 20; i++) {
    body = await page.evaluate(() => document.body?.innerText || '');
    keys = [...body.matchAll(/AIza[0-9A-Za-z_\-]{35,}/g)].map(m => m[0]);
    if (keys.length > 0) {
      console.log('\n✅ GEMINI API KEY ALINDI:');
      keys.forEach((k, idx) => console.log(`  ${idx+1}. ${k}`));
      fs.writeFileSync('/tmp/gemini_apikey.txt', keys[keys.length - 1]);
      console.log('\nDosyaya kaydedildi: /tmp/gemini_apikey.txt');
      await ctx.storageState({ path: './session.json' });
      await browser.close();
      process.exit(0);
    }
    await new Promise(r => setTimeout(r, 2000));
    process.stdout.write('.');
  }

  // Başarısız — sayfa içeriğini kaydet
  const finalBody = await page.evaluate(() => document.body?.innerText?.substring(0, 1000) || '');
  console.log('\n[!] Key bulunamadı. Sayfa içeriği:\n' + finalBody);
  fs.writeFileSync('/tmp/gemini_page.txt', finalBody);
  await browser.close();
  process.exit(1);
})();
