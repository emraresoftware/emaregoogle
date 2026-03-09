/**
 * gcloud yeniden kimlik doğrulama (reauth)
 * Mevcut session ile "Devam Et" onayı verir
 */
const { webkit } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

const SESSION_FILE = './session.json';
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('[1/4] gcloud auth login başlatılıyor...');

  const gcloud = spawn('/usr/local/bin/gcloud', ['auth', 'login', '--no-launch-browser'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let authUrl = null;
  let buf = '';
  await new Promise(resolve => {
    const onData = d => {
      buf += d.toString();
      const m = buf.match(/(https:\/\/accounts\.google\.com\/o\/oauth2\/auth[^\s\n"]+)/);
      if (m) { authUrl = m[1].trim(); resolve(); }
    };
    gcloud.stdout.on('data', onData);
    gcloud.stderr.on('data', onData);
    setTimeout(resolve, 20000);
  });

  if (!authUrl) {
    console.error('Auth URL alınamadı! Buffer:', buf.substring(0, 200));
    process.exit(1);
  }
  console.log('[2/4] Auth URL alındı, Playwright açılıyor...');

  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Auth URL'yi aç
  await page.goto(authUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  console.log('   URL:', page.url());
  console.log('   Başlık:', await page.title());

  // Hesap seçimi gerekiyorsa
  try {
    const accountEl = page.locator('[data-email="edmin@emareas.com"], li[data-identifier="edmin@emareas.com"]').first();
    if (await accountEl.isVisible({ timeout: 3000 })) {
      await accountEl.click();
      await sleep(3000);
      console.log('   Hesap seçildi: edmin@emareas.com');
    }
  } catch (_) {}

  // Şifre gerekiyorsa
  try {
    const pwd = page.locator('input[type="password"]').first();
    if (await pwd.isVisible({ timeout: 2000 })) {
      await pwd.fill('Emare2025*');
      await page.keyboard.press('Enter');
      await sleep(4000);
      console.log('   Şifre girildi');
    }
  } catch (_) {}

  // "Devam Et" / "Continue" — en geniş selector ile
  let authCode = null;
  for (let round = 0; round < 6; round++) {
    const currentUrl = page.url();
    console.log(`   [${round+1}] URL: ${currentUrl.substring(0, 80)}`);

    // Auth code kontrolleri
    const urlCodeMatch = currentUrl.match(/[?&]code=([^&\s]+)/);
    if (urlCodeMatch) { authCode = decodeURIComponent(urlCodeMatch[1]); break; }

    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    const bodyMatch = bodyText.match(/4\/[0-9A-Za-z_\-]{20,}/);
    if (bodyMatch) { authCode = bodyMatch[0]; break; }

    const inputCode = await page.evaluate(() => {
      for (const el of document.querySelectorAll('input[readonly], code, pre')) {
        const v = (el.value || el.textContent || '').trim();
        if (v.startsWith('4/')) return v;
      }
      return null;
    });
    if (inputCode) { authCode = inputCode; break; }

    // Tıklanabilir onay butonları
    const btns = [
      'button:has-text("Devam Et")',
      'button:has-text("Continue")',
      'button:has-text("İzin ver")',
      'button:has-text("Allow")',
      '#submit_approve_access',
      'button[type="submit"]'
    ];
    let tiklandi = false;
    for (const sel of btns) {
      try {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 })) {
          const text = await el.textContent();
          console.log(`   Buton tıklanıyor: "${text?.trim()}"`);
          await el.click();
          await sleep(4000);
          tiklandi = true;
          break;
        }
      } catch (_) {}
    }
    if (!tiklandi && round > 2) {
      console.log('   Tıklanacak buton yok, içerik:', bodyText.substring(0, 200));
      break;
    }
    await sleep(1000);
  }

  await browser.close();

  if (!authCode) {
    console.error('[✗] Auth kodu alınamadı');
    gcloud.kill();
    process.exit(1);
  }

  console.log(`[3/4] Auth kodu alındı: ${authCode.substring(0, 20)}...`);
  console.log('[4/4] gcloud\'a gönderiliyor...');
  gcloud.stdin.write(authCode + '\n');
  gcloud.stdin.end();

  await new Promise(resolve => {
    let out = '';
    gcloud.stdout.on('data', d => { out += d; process.stdout.write(d); });
    gcloud.stderr.on('data', d => { out += d; process.stderr.write(d); });
    gcloud.on('close', () => resolve());
  });

  console.log('\n[✓] Giriş tamamlandı!');
  
  // Token al
  const { execSync } = require('child_process');
  try {
    const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
    console.log('Access token:', token.substring(0, 20) + '...');
    fs.writeFileSync('/tmp/gcloud_token.txt', token);
  } catch (e) {
    console.log('Token alınamadı:', e.message);
  }
  process.exit(0);
})();
