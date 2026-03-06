// Google Analytics, Search Console, Tag Manager (Ücretsiz)
const { openPage, saveSession } = require('../utils/browser');

const ANALYTICS_URLS = {
  '1': { label: 'Google Analytics 4',          url: 'https://analytics.google.com' },
  '2': { label: 'Google Search Console',       url: 'https://search.google.com/search-console' },
  '3': { label: 'Google Tag Manager',          url: 'https://tagmanager.google.com' },
  '4': { label: 'Google Optimize',             url: 'https://optimize.google.com' },
  '5': { label: 'Looker Studio (Raporlama)',   url: 'https://lookerstudio.google.com' },
  '6': { label: 'Google Trends',               url: 'https://trends.google.com' },
  '7': { label: 'Google PageSpeed Insights',   url: 'https://pagespeed.web.dev' },
};

async function analyticsMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Analytics & SEO Araçları (Ücretsiz) ──');
  Object.entries(ANALYTICS_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (ANALYTICS_URLS[c]) {
    await openPage(context, ANALYTICS_URLS[c].url, ANALYTICS_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { analyticsMenu };
