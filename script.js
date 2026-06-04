// ===== KONFIGURASI =====
// Karena pakai Cloudflare Pages Functions, API ada di domain yang sama
// Tidak perlu ubah apapun di sini
const API_BASE = '/api';
const POLL_INTERVAL = 2000; // ms

// ===== STATE =====
let relayState = { relay_1:'off', relay_2:'off', relay_3:'off', relay_4:'off', relay_5:'off', relay_6:'off', relay_7:'off', relay_8:'off' };
let pollTimer = null;
let isOnline = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  fetchState();
  startPolling();
  updateClock();
  setInterval(updateClock, 1000);

  document.addEventListener('click', (e) => {
    const panel = document.getElementById('settingsPanel');
    if (!e.target.closest('.header-right')) panel.classList.remove('open');
  });
});

// ===== POLLING =====
function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(fetchState, POLL_INTERVAL);
}

async function fetchState() {
  try {
    const res = await fetch(`${API_BASE}/state`);
    if (!res.ok) throw new Error('fetch gagal');
    const data = await res.json();
    relayState = data;
    renderAll();
    setStatus('online');
  } catch (e) {
    setStatus('error');
  }
}

// ===== TOGGLE RELAY =====
async function toggleRelay(num) {
  const key = `relay_${num}`;
  const newState = relayState[key] === 'on' ? 'off' : 'on';

  // Optimistic update (langsung update UI, tidak tunggu server)
  relayState[key] = newState;
  renderCard(num);
  updateActiveCount();

  try {
    const res = await fetch(`${API_BASE}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relay: num, state: newState })
    });
    if (!res.ok) throw new Error();
    showToast(`Relay ${num} → ${newState.toUpperCase()}`);
  } catch (e) {
    // Rollback jika gagal
    relayState[key] = newState === 'on' ? 'off' : 'on';
    renderCard(num);
    updateActiveCount();
    showToast('Gagal terhubung ke server', true);
  }
}

// ===== ALL ON / ALL OFF =====
async function allOn()  { await setAll('on');  }
async function allOff() { await setAll('off'); }

async function setAll(state) {
  for (let i = 1; i <= 8; i++) relayState[`relay_${i}`] = state;
  renderAll();

  const promises = [];
  for (let i = 1; i <= 8; i++) {
    promises.push(fetch(`${API_BASE}/relay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ relay: i, state })
    }));
  }
  try {
    await Promise.all(promises);
    showToast(`Semua relay → ${state.toUpperCase()}`);
  } catch (e) {
    showToast('Sebagian gagal, cek koneksi', true);
  }
}

async function refreshAll() {
  setStatus('connecting');
  await fetchState();
  toggleSettings();
  showToast('Status diperbarui');
}

// ===== RENDER =====
function renderAll() {
  for (let i = 1; i <= 8; i++) renderCard(i);
  updateActiveCount();
}

function renderCard(num) {
  const key = `relay_${num}`;
  const on = relayState[key] === 'on';
  const card  = document.getElementById(`card-${num}`);
  const badge = document.getElementById(`badge-${num}`);
  if (!card || !badge) return;
  card.classList.toggle('active', on);
  badge.textContent = on ? 'ON' : 'OFF';
}

function updateActiveCount() {
  const count = Object.values(relayState).filter(v => v === 'on').length;
  document.getElementById('activeCount').textContent = count;
}

// ===== STATUS =====
function setStatus(status) {
  const el = document.getElementById('connStatus');
  const txt = el.querySelector('.status-text');
  el.className = 'status-indicator';
  if (status === 'online')     { el.classList.add('online'); txt.textContent = 'ONLINE'; isOnline = true; }
  else if (status === 'error') { el.classList.add('error');  txt.textContent = 'ERROR';  isOnline = false; }
  else                         { txt.textContent = 'CONNECTING'; }
}

// ===== TOAST =====
let toastTimer = null;
function showToast(msg, isError = false) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.borderColor = isError ? 'var(--danger)' : 'var(--accent)';
  toast.style.color = isError ? 'var(--danger)' : 'var(--accent)';
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ===== SETTINGS =====
function toggleSettings() {
  document.getElementById('settingsPanel').classList.toggle('open');
}

function setTheme(mode) {
  document.body.classList.toggle('light', mode === 'light');
  localStorage.setItem('theme', mode);
  document.getElementById('settingsPanel').classList.remove('open');
}

function loadTheme() {
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
}

// ===== CLOCK =====
function updateClock() {
  const now = new Date();
  document.getElementById('lastUpdate').textContent =
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
