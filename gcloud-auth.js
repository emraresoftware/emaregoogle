/**
 * gcloud-auth.js
 * Playwright üzerinden Google Cloud OAuth akışını otomatik tamamlar.
 * Kullanım: AUTH_URL="..." node gcloud-auth.js
 */

const { webkit } = require('playwright');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const SESSION_FILE = './session.json';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function getAuthCode(authUrl) {
  console.log('[→] Tarayıcı başlatılıyor (Google oturumu yükleniyor)...');
  const browser = await webkit.launch({ headless: false }); // Görünür — kullanıcı işlem yapabilir
  
  let context;
  if (fs.existsSync(SESSION_FILE)) {
    context = await browser.newContext({
      storageState: SESSION_FILE,
      viewport: { width: 1280, height: 800 },
    });
    console.log('[✓] Kaydedilmiş Google oturumu yüklendi.');
  } else {
    context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    console.log('[!] Oturum bulunamadı — Google hesabına giriş yapmanız gerekebilir.');
  }

  const page = await context.newPage();
  console.log('[→] Google OAuth sayfası açılıyor...');
  await page.goto(authUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2000);

  // "İzin ver" / "Allow" butonu varsa tıkla
  try {
    const allowBtn = page.locator('button:has-text("Allow"), button:has-text("İzin ver"), #submit_approve_access, [id="submit_approve_access"]');
    if (await allowBtn.count() > 0) {
      console.log('[→] İzin butonu bulundu, tıklanıyor...');
      await allowBtn.first().click();
      await sleep(3000);
    }
  } catch (e) {
    // Buton yoksa devam
  }

  // sdk.cloud.google.com/authcode.html sayfasını bekle
  console.log('[→] Auth kodu bekleniyor (en fazla 60 saniye)...');
  let authCode = null;
  for (let i = 0; i < 30; i++) {
    const url = page.url();
    const title = await page.title().catch(() => '');
    
    // Auth kodu sayfasına ulaştık mı?
    if (url.includes('authcode') || url.includes('code=') || title.toLowerCase().includes('sign in') === false) {
      try {
        // Sayfadaki auth kodunu oku
        const bodyText = await page.evaluate(() => document.body?.innerText || document.body?.textContent || '');
        // "4/xxx..." veya benzer token formatları
        const match = bodyText.match(/4\/[0-9A-Za-z_\-]+/) || 
                      bodyText.match(/code:\s*([^\s\n]+)/i) ||
                      url.match(/[?&]code=([^&]+)/);
        if (match) {
          authCode = match[1] || match[0];
          console.log(`[✓] Auth kodu alındı: ${authCode.substring(0, 20)}...`);
          break;
        }
        
        // Kodu gösteren input alanı var mı?
        const inputCode = await page.evaluate(() => {
          const inputs = document.querySelectorAll('input[readonly], code, pre, .token');
          for (const el of inputs) {
            if (el.value && el.value.length > 10) return el.value;
            if (el.textContent && el.textContent.length > 10) return el.textContent.trim();
          }
          return null;
        });
        if (inputCode && inputCode.length > 10) {
          authCode = inputCode;
          console.log(`[✓] Auth kodu alındı (input): ${authCode.substring(0, 20)}...`);
          break;
        }
      } catch (e) {}
    }
    await sleep(2000);
  }

  if (!authCode) {
    console.log('\n[!] Auth kodu otomatik alınamadı.');
    console.log('[i] Tarayıcıya bakın ve gösterilen kodu aşağıya yapıştırın:\n');
    
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    authCode = await new Promise(resolve => {
      rl.question('Auth kodu: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  await browser.close();
  return authCode;
}

async function main() {
  // gcloud auth login --no-launch-browser başlat
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  EMARE — Google Cloud CLI Kimlik Doğrulama       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');

  const gcloud = spawn('/usr/local/bin/gcloud', ['auth', 'login', '--no-launch-browser'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let authUrl = null;
  let outputBuffer = '';

  // gcloud çıktısından URL'yi yakala
  await new Promise((resolve) => {
    const checkOutput = (data) => {
      outputBuffer += data.toString();
      const match = outputBuffer.match(/(https:\/\/accounts\.google\.com[^\s\n]+)/);
      if (match) {
        authUrl = match[1];
        resolve();
      }
    };
    gcloud.stdout.on('data', checkOutput);
    gcloud.stderr.on('data', checkOutput);
    setTimeout(resolve, 10000); // 10 saniye içinde URL gelmezse devam
  });

  if (!authUrl) {
    console.error('[✗] gcloud auth URL alınamadı. gcloud kurulu mu?');
    process.exit(1);
  }

  console.log('[✓] Auth URL alındı.\n');
  
  // Tarayıcı ile auth kodu al
  const authCode = await getAuthCode(authUrl);
  
  if (!authCode) {
    console.error('[✗] Auth kodu alınamadı.');
    gcloud.kill();
    process.exit(1);
  }

  // Auth kodunu gcloud'a gönder
  console.log('\n[→] Auth kodu gcloud\'a gönderiliyor...');
  gcloud.stdin.write(authCode + '\n');
  gcloud.stdin.end();

  // Sonucu bekle
  await new Promise((resolve, reject) => {
    let result = '';
    gcloud.stdout.on('data', d => { result += d; process.stdout.write(d); });
    gcloud.stderr.on('data', d => { result += d; process.stderr.write(d); });
    gcloud.on('close', (code) => {
      if (code === 0 || result.includes('logged in')) {
        console.log('\n[✓] Google Cloud girişi başarılı!');
        resolve();
      } else {
        console.log('\n[!] gcloud çıkış kodu:', code);
        resolve();
      }
    });
  });

  // Mevcut projeleri listele
  console.log('\n[→] Google Cloud projeleri listeleniyor...');
  try {
    const projects = execSync('/usr/local/bin/gcloud projects list 2>&1', { encoding: 'utf8' });
    console.log(projects);
  } catch (e) {
    console.log('[!] Proje listesi alınamadı:', e.message);
  }
}

main().catch(console.error);
