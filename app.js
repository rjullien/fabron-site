// --- State ---
let currentLang = 'fr';
let currentPage = 'home';
let privateData = null;

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
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  document.getElementById('lang-toggle').textContent = currentLang === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR';
  document.documentElement.lang = currentLang;
  // Update all data-fr/data-en elements
  document.querySelectorAll('[data-fr]').forEach(el => {
    el.textContent = el.getAttribute(`data-${currentLang}`);
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
  const content = currentLang === 'fr' ? PUBLIC_FR : PUBLIC_EN;
  document.getElementById('welcome-content').innerHTML = content.bienvenue || '';
  document.getElementById('transports-content').innerHTML = content.transports || '';
  document.getElementById('restaurants-content').innerHTML = content.restaurants || '';
  document.getElementById('nice-content').innerHTML = content.nice || '';
  document.getElementById('plages-content').innerHTML = content.plages || '';
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
  // Update PIN section
  const pinSection = document.getElementById('pin-section');
  pinSection.innerHTML = `<p class="pin-ok">✅ ${currentLang === 'fr' ? 'Débloqué ! Allez dans l\'onglet Appart' : 'Unlocked! Go to Apt tab'}</p>`;
}

function loadPrivateContent() {
  if (!privateData) return;
  const html = currentLang === 'fr' ? privateData.fr : privateData.en;

  // Build WiFi card + content
  const wifiCard = `
    <div class="wifi-card">
      <h3>📶 WiFi</h3>
      <div>
        <div class="wifi-detail">${privateData.wifi.name}</div>
      </div>
      <div style="margin-top:4px;font-size:0.85rem;opacity:0.9">${currentLang === 'fr' ? 'Mot de passe' : 'Password'}</div>
      <div>
        <div class="wifi-detail">${privateData.wifi.password}</div>
      </div>
    </div>
  `;

  document.getElementById('apartment-content').innerHTML = wifiCard + html;
}

// --- Service Worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
