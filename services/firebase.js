// Firebase Studio — Ücretsiz Spark Plan
const { openPage, saveSession } = require('../utils/browser');

const FIREBASE_URLS = {
  '1': { label: 'Firebase Konsol',          url: 'https://console.firebase.google.com' },
  '2': { label: 'Authentication',           url: 'https://console.firebase.google.com/project/_/authentication' },
  '3': { label: 'Firestore Database',       url: 'https://console.firebase.google.com/project/_/firestore' },
  '4': { label: 'Realtime Database',        url: 'https://console.firebase.google.com/project/_/database' },
  '5': { label: 'Storage',                  url: 'https://console.firebase.google.com/project/_/storage' },
  '6': { label: 'Hosting',                  url: 'https://console.firebase.google.com/project/_/hosting' },
  '7': { label: 'Functions',                url: 'https://console.firebase.google.com/project/_/functions' },
  '8': { label: 'Analytics',                url: 'https://console.firebase.google.com/project/_/analytics' },
  '9': { label: 'Remote Config',            url: 'https://console.firebase.google.com/project/_/config' },
};

async function firebaseMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Firebase Studio (Ücretsiz Spark Plan) ─');
  Object.entries(FIREBASE_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (FIREBASE_URLS[c]) {
    await openPage(context, FIREBASE_URLS[c].url, FIREBASE_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { firebaseMenu };
