// YouTube & Maps & Diğer Medya Servisleri
const { openPage, saveSession } = require('../utils/browser');

const MEDIA_URLS = {
  '1': { label: 'YouTube Studio',           url: 'https://studio.youtube.com' },
  '2': { label: 'YouTube Analytics',        url: 'https://studio.youtube.com/channel/UC/analytics' },
  '3': { label: 'Google Maps Platform',     url: 'https://console.cloud.google.com/google/maps-apis' },
  '4': { label: 'Google My Business',       url: 'https://business.google.com' },
  '5': { label: 'Google Photos',            url: 'https://photos.google.com' },
  '6': { label: 'Google Podcasts Manager',  url: 'https://podcastsmanager.google.com' },
  '7': { label: 'Google Play Console',      url: 'https://play.google.com/console' },
};

async function mediaMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── YouTube, Maps & Medya (Ücretsiz) ─────');
  Object.entries(MEDIA_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (MEDIA_URLS[c]) {
    await openPage(context, MEDIA_URLS[c].url, MEDIA_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { mediaMenu };
