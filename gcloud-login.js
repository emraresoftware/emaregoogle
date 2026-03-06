/**
 * gcloud-login.js — Tek adımda Google Cloud girişi
 * Playwright ile mevcut Google oturumunu kullanarak gcloud auth akışını tamamlar.
 */
const { webkit } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

const SESSION_FILE = './session.json';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  console.log('\n[1/4] gcloud auth başlatılıyor...');

  // gcloud auth login sürecini başlat
  const gcloud = spawn('/usr/local/bin/gcloud', ['auth', 'login', '--no-launch-browser'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // URL'yi yakala
  let authUrl = null;
  let buf = '';
  await new Promise(resolve => {
    const onData = d => {
      buf += d.toString();
      const m = buf.match(/(https:\/\/accounts\.google\.com\/o\/oauth2\/auth[^\s\n]+)/);
      if (m) { authUrl = m[1].trim(); resolve(); }
    };
    gcloud.stdout.on('data', onData);
    gcloud.stderr.on('data', onData);
    setTimeout(resolve, 15000);
  });

  if (!authUrl) { console.error('[✗] Auth URL alınamadı!'); process.exit(1); }
  console.log('[2/4] Auth URL alındı.\n[3/4] Playwright ile onay veriliyor...');

  // Playwright ile Google oturumu kullanarak onay ver
  const browser = await webkit.launch({ headless: true });
  const context = fs.existsSync(SESSION_FILE)
    ? await browser.newContext({ storageState: SESSION_FILE, viewport: { width: 1280, height: 800 } })
    : await browser.newContext({ viewport: { width: 1280, height: 800 } });

  const page = await context.newPage();
  await page.goto(authUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(3000);

  // Hesap seçme ekranı — edmin@emareas.com hesabını seç
  const accountSelectors = [
    'li:has-text("edmin@emareas.com")',
    '[data-email="edmin@emareas.com"]',
    'div:has-text("edmin@emareas.com")',
    '[data-identifier="edmin@emareas.com"]',
  ];
  for (const sel of accountSelectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 })) {
        console.log(`   Hesap seçildi: ${sel}`);
        await el.click();
        await sleep(4000);
        break;
      }
    } catch (_) {}
  }

  // Şifre alanı varsa doldur
  try {
    const pwdInput = page.locator('input[type="password"]').first();
    if (await pwdInput.isVisible({ timeout: 3000 })) {
      console.log('   Şifre giriliyor...');
      await pwdInput.fill('Emare2025*');
      await sleep(500);
      await page.keyboard.press('Enter');
      await sleep(4000);
    }
  } catch (_) {}

  // Onay & yetkilendirme butonlarını birden fazla kez tıkla (çok adımlı akış)
  for (let attempt = 0; attempt < 4; attempt++) {
    let clicked = false;
    for (const sel of [
      'button:has-text("Devam Et")',
      'button:has-text("Continue")',
      '#submit_approve_access',
      'button:has-text("Allow")',
      'button:has-text("İzin ver")',
      'button:has-text("Oturum Aç")',
      'button[type="submit"]'
    ]) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          console.log(`   [${attempt+1}] Buton tıklandı: ${sel}`);
          await btn.click();
          await sleep(3000);
          clicked = true;
          break;
        }
      } catch (_) {}
    }
    if (!clicked) break; // Tıklanacak buton kalmadı
    await sleep(1000);
  }

  // Kod sayfasını bekle (sdk.cloud.google.com/authcode.html → tek satır kod)
  let authCode = null;
  for (let i = 0; i < 20; i++) {
    const currentUrl = page.url();
    const bodyText = await page.evaluate(() => document.body?.innerText || '').catch(() => '');

    // URL'de code parametresi
    const urlMatch = currentUrl.match(/[?&]code=([^&\s]+)/);
    if (urlMatch) { authCode = decodeURIComponent(urlMatch[1]); break; }

    // Sayfada 4/xxx formatı
    const bodyMatch = bodyText.match(/4\/[0-9A-Za-z_\-]+/);
    if (bodyMatch) { authCode = bodyMatch[0]; break; }

    // SDK auth code sayfası — input veya code tag
    const inputVal = await page.evaluate(() => {
      for (const el of document.querySelectorAll('input[readonly], code, pre, .auth-code, [data-testid]')) {
        const v = el.value || el.textContent || '';
        if (v.trim().startsWith('4/')) return v.trim();
      }
      return null;
    }).catch(() => null);
    if (inputVal) { authCode = inputVal; break; }

    await sleep(2000);
  }

  // Debug — kodu alamazsak durumu yakala
  if (!authCode) {
    const finalUrl = page.url();
    const finalBody = await page.evaluate(() => document.body?.innerText || '').catch(() => '');
    console.error('[✗] Auth kodu otomatik alınamadı!');
    console.log('   Son URL:', finalUrl);
    console.log('   Sayfa içeriği:', finalBody.substring(0, 500));
    await page.screenshot({ path: '/tmp/gcloud_auth_debug.png' }).catch(() => {});
    console.log('   Screenshot: /tmp/gcloud_auth_debug.png');
    await browser.close();
    gcloud.kill();
    process.exit(1);
  }

  await browser.close();

  console.log(`   Auth kodu alındı: ${authCode.substring(0, 25)}...`);
  
  // Kodu gcloud'a gönder
  console.log('[4/4] Kod gcloud\'a gönderiliyor...');
  gcloud.stdin.write(authCode + '\n');
  gcloud.stdin.end();

  // Sonucu bekle
  await new Promise((resolve) => {
    let result = '';
    gcloud.stdout.on('data', d => { result += d; process.stdout.write(d); });
    gcloud.stderr.on('data', d => { result += d; process.stderr.write(d); });
    gcloud.on('close', code => {
      if (result.includes('logged in') || result.includes('credentials')) {
        console.log('\n[✓] Google Cloud girişi başarılı!');
      } else {
        console.log('\n[!] Çıkış kodu:', code);
      }
      resolve();
    });
  });

  // Proje listesi
  console.log('\n[→] Google Cloud projeleri:');
  const { execSync } = require('child_process');
  try {
    const projs = execSync('/usr/local/bin/gcloud projects list 2>&1', { encoding: 'utf8', timeout: 20000 });
    console.log(projs);
  } catch (e) {
    console.log('Proje listesi alınamadı:', e.message.substring(0, 200));
  }

  process.exit(0);
})();
