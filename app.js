// --- State ---
let currentLang = 'fr';
let currentPage = 'home';
let privateData = null;
const LANGS = ['fr', 'en', 'es'];
const LANG_LABELS = { fr: '\ud83c\uddec\ud83c\udde7 EN', en: '\ud83c\uddea\ud83c\uddf8 ES', es: '\ud83c\uddeb\ud83c\uddf7 FR' };

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadPublicContent();
  // Check if PIN was already entered (session)
  const saved = sessionStorage.getItem('fabron_private');
  if (saved) {
    try {
      privateData = JSON.parse(saved);
      onUnlocked();
    } catch(e) {}
  }
});

// --- Language toggle ---
function toggleLang() {
  const idx = LANGS.indexOf(currentLang);
  currentLang = LANGS[(idx + 1) % LANGS.length];
  document.getElementById('lang-toggle').textContent = LANG_LABELS[currentLang];
  document.documentElement.lang = currentLang;
  // Update all data-fr/data-en/data-es elements
  document.querySelectorAll('[data-fr]').forEach(el => {
    const val = el.getAttribute(`data-${currentLang}`);
    if (val) el.textContent = val;
  });
  loadPublicContent();
  if (privateData) loadPrivateContent();
}

// --- Page navigation ---
function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.page === page);
  });
  window.scrollTo(0, 0);
}

// --- Load public content ---
function loadPublicContent() {
  const content = currentLang === 'fr' ? PUBLIC_FR : currentLang === 'en' ? PUBLIC_EN : PUBLIC_ES;
  document.getElementById('welcome-content').innerHTML = content.bienvenue || '';
  document.getElementById('transports-content').innerHTML = content.transports || '';
  document.getElementById('restaurants-content').innerHTML = content.restaurants || '';
  document.getElementById('nice-content').innerHTML = content.nice || '';
  document.getElementById('plages-content').innerHTML = content.plages || '';
  document.getElementById('quartier-content').innerHTML = content.quartier || '';
}

// --- PIN input ---

async function pinSubmit() {
  const pin = document.getElementById('pin-field').value.trim();
  if (!pin) return;

  document.getElementById('pin-error').classList.add('hidden');

  const result = await FabronCrypto.decrypt(ENCRYPTED_PRIVATE, pin);
  if (result) {
    privateData = result;
    sessionStorage.setItem('fabron_private', JSON.stringify(result));
    document.getElementById('pin-success').classList.remove('hidden');
    document.querySelector('.pin-input').classList.add('hidden');
    document.getElementById('pin-section').querySelector('p').classList.add('hidden');
    setTimeout(() => onUnlocked(), 500);
  } else {
    document.getElementById('pin-error').classList.remove('hidden');
    document.getElementById('pin-field').value = '';
    document.getElementById('pin-field').focus();
    document.querySelector('.pin-input').style.animation = 'shake 0.3s';
    setTimeout(() => document.querySelector('.pin-input').style.animation = '', 300);
  }
}

// --- Unlock private content ---
function onUnlocked() {
  document.getElementById('apartment-locked').classList.add('hidden');
  document.getElementById('apartment-content').classList.remove('hidden');
  loadPrivateContent();
  // Update code section
  const pinSection = document.getElementById('pin-section');
  const msg = currentLang === 'fr' ? 'D\u00e9bloqu\u00e9 ! Allez dans l\'onglet Appart'
    : currentLang === 'en' ? 'Unlocked! Go to Apt tab'
    : '\u00a1Desbloqueado! Ve a la pesta\u00f1a Appart';
  pinSection.innerHTML = `<p class="pin-ok">\u2705 ${msg}</p>`;
}

function loadPrivateContent() {
  if (!privateData) return;
  const html = currentLang === 'fr' ? privateData.fr
    : currentLang === 'en' ? privateData.en
    : (privateData.es || privateData.en);

  // Build WiFi info card (credentials in Airbnb app)
  const wifiLabel = currentLang === 'fr'
    ? 'Les identifiants WiFi (r\u00e9seau et mot de passe) sont disponibles dans l\'app Airbnb, rubrique \u00ab\u00a0Informations du logement\u00a0\u00bb.'
    : currentLang === 'en'
    ? 'WiFi credentials (network name and password) are available in the Airbnb app, under "Listing details".'
    : 'Las credenciales WiFi (nombre de red y contrase\u00f1a) est\u00e1n disponibles en la app Airbnb, secci\u00f3n \u00ab\u00a0Informaci\u00f3n del alojamiento\u00a0\u00bb.';
  const wifiCard = `
    <div class="wifi-card">
      <h3>\ud83d\udcf6 WiFi</h3>
      <div style="font-size:0.95rem;padding:8px 0">${wifiLabel}</div>
    </div>
  `;

  document.getElementById('apartment-content').innerHTML = wifiCard + html;
}

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
