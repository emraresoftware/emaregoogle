// Google Cloud Console — Ücretsiz Tier Servisleri
const { openPage, saveSession } = require('../utils/browser');

const CLOUD_URLS = {
  '1': { label: 'Cloud Anasayfa',              url: 'https://console.cloud.google.com' },
  '2': { label: 'API & Servisler',             url: 'https://console.cloud.google.com/apis/dashboard' },
  '3': { label: 'Cloud Functions (ücretsiz)',  url: 'https://console.cloud.google.com/functions' },
  '4': { label: 'Cloud Run (ücretsiz tier)',   url: 'https://console.cloud.google.com/run' },
  '5': { label: 'Cloud Storage',               url: 'https://console.cloud.google.com/storage' },
  '6': { label: 'BigQuery (ücretsiz 10GB)',    url: 'https://console.cloud.google.com/bigquery' },
  '7': { label: 'Pub/Sub',                     url: 'https://console.cloud.google.com/cloudpubsub' },
  '8': { label: 'Secret Manager',              url: 'https://console.cloud.google.com/security/secret-manager' },
  '9': { label: 'Artifact Registry',           url: 'https://console.cloud.google.com/artifacts' },
};

async function cloudMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Google Cloud Console (Ücretsiz Tier) ──');
  Object.entries(CLOUD_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (CLOUD_URLS[c]) {
    await openPage(context, CLOUD_URLS[c].url, CLOUD_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { cloudMenu };
