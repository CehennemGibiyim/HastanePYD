// ===== OFFLINE MOD =====
import { getPersonnel, getDepartmentStats } from '../state.js';

const DB_NAME = 'hastane-pys-offline';
const DB_VERSION = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('cache')) d.createObjectStore('cache', { keyPath: 'key' });
      if (!d.objectStoreNames.contains('syncQueue')) d.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = (e) => { db = e.target.result; resolve(db); };
    req.onerror = () => reject(req.error);
  });
}

async function cacheData(key, data) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('cache', 'readwrite');
    tx.objectStore('cache').put({ key, data, updatedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getCachedData(key) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('cache', 'readonly');
    const req = tx.objectStore('cache').get(key);
    req.onsuccess = () => resolve(req.result?.data || null);
    req.onerror = () => reject(req.error);
  });
}

async function getAllCachedKeys() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('cache', 'readonly');
    const req = tx.objectStore('cache').getAllKeys();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getCacheSize() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('cache', 'readonly');
    const req = tx.objectStore('cache').count();
    req.onsuccess = () => resolve(req.result || 0);
    req.onerror = () => reject(req.error);
  });
}

async function clearCache() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('cache', 'readwrite');
    tx.objectStore('cache').clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function addToSyncQueue(action) {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('syncQueue', 'readwrite');
    tx.objectStore('syncQueue').add({ ...action, timestamp: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getSyncQueue() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('syncQueue', 'readonly');
    const req = tx.objectStore('syncQueue').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function clearSyncQueue() {
  const d = await openDB();
  return new Promise((resolve, reject) => {
    const tx = d.transaction('syncQueue', 'readwrite');
    tx.objectStore('syncQueue').clear();
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

export function syncAllData() {
  const personnel = getPersonnel({});
  cacheData('personnel', personnel);
  cacheData('departments', getDepartmentStats());
  cacheData('lastSync', Date.now());
}

export async function renderOfflinePage(el) {
  const isOnline = navigator.onLine;
  let cacheSize = 0;
  let syncQueueSize = 0;
  let cachedKeys = [];
  try {
    cacheSize = await getCacheSize();
    syncQueueSize = (await getSyncQueue()).length;
    cachedKeys = await getAllCachedKeys();
  } catch {}

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📴 Offline Mod</h1>
          <p class="text-slate-400 text-sm mt-1">Çevrimdışı veri erişimi ve senkron yönetimi</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse"></span>
          <span class="text-sm ${isOnline ? 'text-green-300' : 'text-red-300'}">${isOnline ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center">
        <p class="text-2xl font-bold ${isOnline ? 'text-green-300' : 'text-amber-300'}">${isOnline ? 'ONLINE' : 'OFFLINE'}</p>
        <p class="text-xs text-slate-400 mt-1">Bağlantı Durumu</p>
      </div>
      <div class="card text-center">
        <p class="text-2xl font-bold text-cyan-300">${cacheSize}</p>
        <p class="text-xs text-slate-400 mt-1">Önbellek Kaydı</p>
      </div>
      <div class="card text-center">
        <p class="text-2xl font-bold ${syncQueueSize > 0 ? 'text-amber-300' : 'text-green-300'}">${syncQueueSize}</p>
        <p class="text-xs text-slate-400 mt-1">Bekleyen Senkron</p>
      </div>
      <div class="card text-center">
        <p class="text-2xl font-bold text-purple-300">${cachedKeys.length}</p>
        <p class="text-xs text-slate-400 mt-1">Depolanan Veri Türü</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📦 Önbelleğe Alınan Veriler</h3>
        <div class="space-y-2" id="cache-list">
          ${cachedKeys.length ? cachedKeys.map(k => `
            <div class="flex items-center justify-between rounded-lg bg-white/5 border border-white/5 px-3 py-2">
              <span class="text-sm text-slate-300">${k}</span>
              <span class="badge text-xs">Önbellekte</span>
            </div>`).join('') : '<div class="empty-state"><div class="icon">📦</div><div class="title">Henüz önbellek yok</div><div class="desc">Verileri önbelleğe almak için "Senkron Et" butonuna tıklayın</div></div>'}
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🔄 Senkron Kuyruğu</h3>
        <div id="sync-queue-list" class="space-y-2">
          ${syncQueueSize > 0 ? '<p class="text-sm text-amber-300">Çevrimiçi olduğunuzda otomatik senkronlanacak.</p>' : '<div class="empty-state"><div class="icon">✅</div><div class="title">Senkron kuyruğu boş</div><div class="desc">Tüm veriler senkronize</div></div>'}
        </div>
      </div>
    </div>

    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">⚙️ Offline Ayarları</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-xl bg-white/5 border border-white/5 p-4">
          <h4 class="text-sm font-semibold text-white mb-2">📡 Otomatik Senkron</h4>
          <p class="text-xs text-slate-400 mb-3">Çevrimiçi olunduğunda veriler otomatik senkronlanır</p>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="auto-sync-toggle" class="w-5 h-5 rounded" ${isOnline ? 'checked' : ''}>
            <span class="text-sm text-slate-300">Otomatik senkron açık</span>
          </label>
        </div>
        <div class="rounded-xl bg-white/5 border border-white/5 p-4">
          <h4 class="text-sm font-semibold text-white mb-2">💾 Depolama Kullanımı</h4>
          <p class="text-xs text-slate-400 mb-3">IndexedDB ile tarayıcı depolaması</p>
          <div class="h-3 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style="width:${Math.min(100, cacheSize * 5)}%"></div>
          </div>
          <p class="text-[10px] text-slate-500 mt-1">${cacheSize} / 100 kayıt</p>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 fade-in">
      <button id="sync-now-btn" class="btn-primary">🔄 Şimdi Senkron Et</button>
      <button id="cache-personnel-btn" class="btn-secondary">👥 Personeli Önbelleğe Al</button>
      <button id="clear-cache-btn" class="btn-secondary text-red-300 border-red-500/20 hover:bg-red-500/10">🗑️ Önbelleği Temizle</button>
    </div>`;

  document.getElementById('sync-now-btn')?.addEventListener('click', async () => {
    syncAllData();
    try { await clearSyncQueue(); } catch {}
    renderOfflinePage(el);
  });

  document.getElementById('cache-personnel-btn')?.addEventListener('click', async () => {
    const p = getPersonnel({});
    await cacheData('personnel', p);
    renderOfflinePage(el);
  });

  document.getElementById('clear-cache-btn')?.addEventListener('click', async () => {
    if (confirm('Tüm önbellek temizlenecek. Emin misiniz?')) {
      await clearCache();
      await clearSyncQueue();
      renderOfflinePage(el);
    }
  });

  window.addEventListener('online', () => syncAllData());
}
