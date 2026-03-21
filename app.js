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
  // Cycle FR → EN → ES → FR
  if (currentLang === 'fr') {
    currentLang = 'en';
  } else if (currentLang === 'en') {
    currentLang = 'es';
  } else {
    currentLang = 'fr';
  }
  
  // Update button text to show NEXT language
  let nextLabel;
  if (currentLang === 'fr') {
    nextLabel = '🇬🇧 EN';
  } else if (currentLang === 'en') {
    nextLabel = '🇪🇸 ES';
  } else {
    nextLabel = '🇫🇷 FR';
  }
  
  document.getElementById('lang-toggle').textContent = nextLabel;
  document.documentElement.lang = currentLang;
  
  // Update all data-fr/data-en/data-es elements
  document.querySelectorAll('[data-fr]').forEach(el => {
    const text = el.getAttribute(`data-${currentLang}`);
    if (text) {
      el.textContent = text;
    }
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
  let content;
  if (currentLang === 'fr') {
    content = PUBLIC_FR;
  } else if (currentLang === 'en') {
    content = PUBLIC_EN;
  } else {
    content = PUBLIC_ES;
  }
  
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
  // Update PIN section
  const pinSection = document.getElementById('pin-section');
  let message;
  if (currentLang === 'fr') {
    message = 'Débloqué ! Allez dans l\'onglet Appart';
  } else if (currentLang === 'en') {
    message = 'Unlocked! Go to Apt tab';
  } else {
    message = '¡Desbloqueado! Vayan a la pestaña Piso';
  }
  pinSection.innerHTML = `<p class="pin-ok">✅ ${message}</p>`;
}

function loadPrivateContent() {
  if (!privateData) return;
  
  let html;
  if (currentLang === 'fr') {
    html = privateData.fr;
  } else if (currentLang === 'en') {
    html = privateData.en;
  } else {
    html = privateData.es;
  }

  // Build WiFi card + content
  let passwordLabel;
  if (currentLang === 'fr') {
    passwordLabel = 'Mot de passe';
  } else if (currentLang === 'en') {
    passwordLabel = 'Password';
  } else {
    passwordLabel = 'Contraseña';
  }

  const wifiCard = `
    <div class="wifi-card">
      <h3>📶 WiFi</h3>
      <div>
        <div class="wifi-detail">${privateData.wifi.name}</div>
      </div>
      <div style="margin-top:4px;font-size:0.85rem;opacity:0.9">${passwordLabel}</div>
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
