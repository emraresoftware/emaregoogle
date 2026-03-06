const readline = require('readline');
const { createBrowser, createContext, saveSession } = require('./utils/browser');
const { adminMenu }         = require('./services/admin');
const { cloudMenu }         = require('./services/cloud');
const { firebaseMenu }      = require('./services/firebase');
const { workspaceMenu }     = require('./services/workspace');
const { analyticsMenu }     = require('./services/analytics');
const { communicationMenu } = require('./services/communication');
const { aiMenu }            = require('./services/ai');
const { mediaMenu }         = require('./services/media');

function banner() {
  console.clear();
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   EMARE — Google Servis Yönetim Sistemi      ║');
  console.log('║   edmin@emareas.com                          ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  [1]  Google Admin Console                   ║');
  console.log('║  [2]  Google Cloud (Ücretsiz Tier)           ║');
  console.log('║  [3]  Firebase Studio                        ║');
  console.log('║  [4]  Google Workspace (Drive/Docs/Sheets…)  ║');
  console.log('║  [5]  Analytics, SEO & Tag Manager           ║');
  console.log('║  [6]  Gmail, Meet, Chat, Calendar            ║');
  console.log('║  [7]  Google AI (Gemini, Colab, Vision…)     ║');
  console.log('║  [8]  YouTube Studio, Maps, Play Console     ║');
  console.log('║  [0]  Çıkış                                  ║');
  console.log('╚══════════════════════════════════════════════╝');
}

(async () => {
  const browser = await createBrowser(false);
  const context = await createContext(browser);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(r => rl.question(q, r));

  const MENUS = {
    '1': (ctx) => adminMenu(ctx, rl),
    '2': (ctx) => cloudMenu(ctx, rl),
    '3': (ctx) => firebaseMenu(ctx, rl),
    '4': (ctx) => workspaceMenu(ctx, rl),
    '5': (ctx) => analyticsMenu(ctx, rl),
    '6': (ctx) => communicationMenu(ctx, rl),
    '7': (ctx) => aiMenu(ctx, rl),
    '8': (ctx) => mediaMenu(ctx, rl),
  };

  while (true) {
    banner();
    const choice = (await ask('\n  Kategori seçin: ')).trim();
    if (choice === '0') {
      console.log('\n  Çıkılıyor...');
      rl.close();
      await browser.close();
      break;
    }
    if (MENUS[choice]) {
      await MENUS[choice](context);
    } else {
      console.log('  Geçersiz seçim.');
      await new Promise(r => setTimeout(r, 1000));
    }
  }
})();
