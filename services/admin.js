// Google Admin Console — Kullanıcı & Organizasyon Yönetimi
const { openPage, saveSession } = require('../utils/browser');

const ADMIN_URLS = {
  '1': { label: 'Admin Anasayfa',        url: 'https://admin.google.com' },
  '2': { label: 'Kullanıcılar',          url: 'https://admin.google.com/ac/users' },
  '3': { label: 'Gruplar',               url: 'https://admin.google.com/ac/groups' },
  '4': { label: 'Cihazlar',              url: 'https://admin.google.com/ac/devices' },
  '5': { label: 'Uygulamalar',           url: 'https://admin.google.com/ac/appslist/integrated' },
  '6': { label: 'Güvenlik',              url: 'https://admin.google.com/ac/security' },
  '7': { label: 'Raporlar',              url: 'https://admin.google.com/ac/reporting/report/user/accounts' },
  '8': { label: 'Fatura & Abonelikler',  url: 'https://admin.google.com/ac/billing/subscriptions' },
};

async function adminMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Google Admin Console ──────────────────');
  Object.entries(ADMIN_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (ADMIN_URLS[c]) {
    const page = await openPage(context, ADMIN_URLS[c].url, ADMIN_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { adminMenu };
