// Gmail & İletişim Servisleri
const { openPage, saveSession } = require('../utils/browser');

const GMAIL_URLS = {
  '1': { label: 'Gmail Gelen Kutusu',      url: 'https://mail.google.com' },
  '2': { label: 'Gmail Ayarları',          url: 'https://mail.google.com/mail/#settings/general' },
  '3': { label: 'Google Meet',             url: 'https://meet.google.com' },
  '4': { label: 'Google Chat',             url: 'https://chat.google.com' },
  '5': { label: 'Google Calendar',         url: 'https://calendar.google.com' },
  '6': { label: 'Google Contacts',         url: 'https://contacts.google.com' },
  '7': { label: 'Google Voice',            url: 'https://voice.google.com' },
};

async function communicationMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Gmail & İletişim (Ücretsiz) ───────────');
  Object.entries(GMAIL_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (GMAIL_URLS[c]) {
    await openPage(context, GMAIL_URLS[c].url, GMAIL_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { communicationMenu };
