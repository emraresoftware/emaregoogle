// Google Workspace — Drive, Docs, Sheets, Slides, Forms, Sites (Ücretsiz)
const { openPage, saveSession } = require('../utils/browser');

const WORKSPACE_URLS = {
  '1': { label: 'Google Drive',          url: 'https://drive.google.com' },
  '2': { label: 'Google Docs',           url: 'https://docs.google.com' },
  '3': { label: 'Google Sheets',         url: 'https://sheets.google.com' },
  '4': { label: 'Google Slides',         url: 'https://slides.google.com' },
  '5': { label: 'Google Forms',          url: 'https://forms.google.com' },
  '6': { label: 'Google Sites',          url: 'https://sites.google.com' },
  '7': { label: 'Google Jamboard',       url: 'https://jamboard.google.com' },
  '8': { label: 'Google Keep',           url: 'https://keep.google.com' },
  '9': { label: 'Google Colab (AI/ML)',  url: 'https://colab.research.google.com' },
};

async function workspaceMenu(context, rl) {
  const ask = (q) => new Promise(r => rl.question(q, r));
  console.log('\n── Google Workspace (Ücretsiz) ───────────');
  Object.entries(WORKSPACE_URLS).forEach(([k, v]) => console.log(`  [${k}] ${v.label}`));
  console.log('  [0] Geri');
  const c = (await ask('\n  Seçim: ')).trim();
  if (c === '0') return;
  if (WORKSPACE_URLS[c]) {
    await openPage(context, WORKSPACE_URLS[c].url, WORKSPACE_URLS[c].label);
    await saveSession(context);
  }
}

module.exports = { workspaceMenu };
