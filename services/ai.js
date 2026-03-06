// Google AI & Geliştirici Araçları (Ücretsiz)
const { openPage, saveSession } = require('../utils/browser');

const AI_URLS = {
  '1': { label: 'Google AI Studio (Gemini API)', url: 'https://aistudio.google.com' },
  '2': { label: 'Google Colab (Notebook/GPU)',   url: 'https://colab.research.google.com' },
  '3': { label: 'Vertex AI Studio',              url: 'https://console.cloud.google.com/vertex-ai' },
  '4': { label: 'Google ML Kit',                 url: 'https://developers.google.com/ml-kit' },
  '5': { label: 'Google Translate API (ücretsiz 500K/ay)', url: 'https://console.cloud.google.com/apis/library/translate.googleapis.com' },
  '6': { label: 'Natural Language API',          url: 'https://console.cloud.google.com/apis/library/language.googleapis.com' },
  '7': { label: 'Vision API',                    url: 'https://console.cloud.google.com/apis/library/vision.googleapis.com' },
  '8': { label: 'Speech-to-Text API',            url: 'https://console.cloud.google.com/apis/library/speech.googleapis.com' },
};

async function aiMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Google AI & Geliştirici (Ücretsiz) ───');
  Object.entries(AI_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (AI_URLS[c]) {
    await openPage(context, AI_URLS[c].url, AI_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { aiMenu };
