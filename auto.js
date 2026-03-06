const { createBrowser, createContext, saveSession, openPage } = require('./utils/browser');

// Emare için en kritik ücretsiz Google servisleri — otomatik açılır
const EMARE_SERVICES = [
  { label: '🔧 Google Admin Console',        url: 'https://admin.google.com' },
  { label: '☁️  Google Cloud Console',        url: 'https://console.cloud.google.com' },
  { label: '🔥 Firebase Studio',              url: 'https://console.firebase.google.com' },
  { label: '🤖 Google AI Studio (Gemini)',    url: 'https://aistudio.google.com' },
  { label: '📊 Google Analytics 4',           url: 'https://analytics.google.com' },
  { label: '🔍 Google Search Console',        url: 'https://search.google.com/search-console' },
  { label: '💾 Google Drive',                 url: 'https://drive.google.com' },
  { label: '📧 Gmail',                        url: 'https://mail.google.com' },
  { label: '📺 YouTube Studio',               url: 'https://studio.youtube.com' },
  { label: '📈 Looker Studio',                url: 'https://lookerstudio.google.com' },
  { label: '🧪 Google Colab (AI/ML)',         url: 'https://colab.research.google.com' },
  { label: '🏢 Google My Business',           url: 'https://business.google.com' },
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   EMARE — Tam Otomatik Başlatma              ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const browser = await createBrowser(false);
  const context = await createContext(browser);

  console.log(`Toplam ${EMARE_SERVICES.length} servis açılacak...\n`);

  for (let i = 0; i < EMARE_SERVICES.length; i++) {
    const s = EMARE_SERVICES[i];
    console.log(`[${i + 1}/${EMARE_SERVICES.length}] ${s.label}`);
    await openPage(context, s.url, s.label);
    await saveSession(context);
    await sleep(1500);
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  ✓ Tüm servisler açıldı!                     ║');
  console.log('║  Tarayıcı sekmeleri hazır, kullanabilirsiniz. ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Tarayıcıyı açık bırak
})();
