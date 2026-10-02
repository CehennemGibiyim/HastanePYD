// ===== BİLDİRİM SİSTEMİ =====

const NOTIF_STORAGE_KEY = 'hospital_notifications';
const SENT_KEY_PREFIX = 'notif_sent_';

let toastContainer = null;

// ===== PERSISTENT NOTIFICATION STORAGE =====

function loadNotifs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveNotifs(notifs) {
  localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifs));
}

// ===== TOAST (ephemeral, auto-dismiss) =====

export function initNotifications() {
  if (toastContainer) return;
  toastContainer = document.createElement('div');
  toastContainer.id = 'toast-container';
  toastContainer.className = 'fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none';
  document.body.appendChild(toastContainer);
}

export function showToast(message, type = 'info', duration = 3000) {
  initNotifications();
  const colors = {
    success: 'bg-green-500/90 border-green-400/50',
    error: 'bg-red-500/90 border-red-400/50',
    warning: 'bg-amber-500/90 border-amber-400/50',
    info: 'bg-cyan-500/90 border-cyan-400/50',
  };
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `${colors[type] || colors.info} border rounded-xl px-4 py-3 text-white text-sm font-medium shadow-2xl backdrop-blur-sm pointer-events-auto transition-all duration-300 ease-out`;
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg shrink-0">${icons[type] || icons.info}</span>
      <span class="flex-1">${message}</span>
      <button class="text-white/70 hover:text-white shrink-0" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>`;

  toastContainer.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== PERSISTENT NOTIFICATIONS =====

const TYPE_ICONS = {
  success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️',
  shift: '🔄', leave: '🏖️', attendance: '⏰', personnel: '👤',
  report: '📊', system: '🏥',
};

const TYPE_COLORS = {
  success: 'border-green-500/20 bg-green-500/5',
  error: 'border-red-500/20 bg-red-500/5',
  warning: 'border-amber-500/20 bg-amber-500/5',
  info: 'border-cyan-500/20 bg-cyan-500/5',
  shift: 'border-purple-500/20 bg-purple-500/5',
  leave: 'border-emerald-500/20 bg-emerald-500/5',
  attendance: 'border-blue-500/20 bg-blue-500/5',
  personnel: 'border-pink-500/20 bg-pink-500/5',
  report: 'border-orange-500/20 bg-orange-500/5',
  system: 'border-cyan-500/20 bg-cyan-500/5',
};

export function addNotification(title, message, type = 'info', icon) {
  const notifs = loadNotifs();
  const notif = {
    id: Date.now() + Math.random(),
    title, message, type,
    icon: icon || TYPE_ICONS[type] || 'ℹ️',
    time: new Date().toISOString(),
    read: false,
  };
  notifs.unshift(notif);
  if (notifs.length > 100) notifs.length = 100;
  saveNotifs(notifs);
  showToast(`${title}: ${message}`, type === 'shift' || type === 'leave' || type === 'personnel' || type === 'report' ? 'info' : type);
  refreshNotifBadge();
  // TTS for critical notifications
  if (type === 'error' || type === 'warning' || type === 'shift') {
    speakText(`${title}. ${message}`);
  }
  return notif;
}

export function getNotifications() { return loadNotifs(); }
export function getUnreadCount() { return loadNotifs().filter(n => !n.read).length; }

export function markNotificationRead(id) {
  const notifs = loadNotifs();
  const n = notifs.find(x => Math.abs(x.id - id) < 1);
  if (n) { n.read = true; saveNotifs(notifs); }
  refreshNotifBadge();
}

export function markAllNotificationsRead() {
  const notifs = loadNotifs();
  notifs.forEach(n => n.read = true);
  saveNotifs(notifs);
  refreshNotifBadge();
}

export function clearAllNotifications() {
  saveNotifs([]);
  refreshNotifBadge();
}

export function deleteNotification(id) {
  const notifs = loadNotifs().filter(n => Math.abs(n.id - id) >= 1);
  saveNotifs(notifs);
  refreshNotifBadge();
}

// ===== BADGE =====

export function refreshNotifBadge() {
  const count = getUnreadCount();
  const display = count > 0 ? 'flex' : 'none';
  const text = count > 99 ? '99+' : String(count);
  ['notif-badge', 'mobile-notif-badge'].forEach(id => {
    const badge = document.getElementById(id);
    if (badge) { badge.textContent = text; badge.style.display = display; }
  });
}

// ===== NOTIFICATION BELL COMPONENT =====

export function renderNotifBellHTML() {
  const count = getUnreadCount();
  return `
    <button id="notif-bell" class="relative p-2 rounded-xl hover:bg-white/10 transition" aria-label="Bildirimler">
      <span class="text-xl">🔔</span>
      <span id="notif-badge" class="notif-badge" style="display:${count > 0 ? 'flex' : 'none'}">${count > 99 ? '99+' : count}</span>
    </button>`;
}

// ===== NOTIFICATION PANEL =====

export function renderNotifPanelHTML() {
  return `
    <div id="notif-panel" class="hidden fixed inset-0 z-[100]">
      <div class="absolute inset-0 bg-black/40" id="notif-overlay"></div>
      <div id="notif-slide" class="absolute right-0 top-0 h-full w-96 max-w-[90vw] bg-slate-900 border-l border-white/10 shadow-2xl transform translate-x-full transition-transform duration-300 flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-white/10">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">🔔 Bildirimler</h3>
          <button id="notif-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition" aria-label="Kapat">✕</button>
        </div>
        <div class="flex gap-2 p-3 border-b border-white/5">
          <button id="notif-read-all" class="text-xs text-cyan-400 hover:text-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-500/10 transition">✓ Tümünü Okundu İşle</button>
          <button id="notif-clear" class="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition">🗑️ Temizle</button>
        </div>
        <div id="notif-list" class="flex-1 overflow-y-auto p-3 space-y-1.5"></div>
      </div>
    </div>`;
}

export function openNotifPanel() {
  const panel = document.getElementById('notif-panel');
  const slide = document.getElementById('notif-slide');
  if (!panel) return;
  panel.classList.remove('hidden');
  requestAnimationFrame(() => slide?.classList.remove('translate-x-full'));
  renderNotifList();
}

function closeNotifPanel() {
  const slide = document.getElementById('notif-slide');
  const panel = document.getElementById('notif-panel');
  if (slide) slide.classList.add('translate-x-full');
  setTimeout(() => panel?.classList.add('hidden'), 300);
}

function renderNotifList() {
  const container = document.getElementById('notif-list');
  if (!container) return;
  const notifs = loadNotifs();

  if (!notifs.length) {
    container.innerHTML = `
      <div class="text-center py-16">
        <p class="text-5xl mb-3">🔕</p>
        <p class="text-slate-400 text-sm font-medium">Bildirim bulunmuyor</p>
        <p class="text-slate-600 text-xs mt-1">Yeni bildirimler burada görünecek</p>
      </div>`;
    return;
  }

  container.innerHTML = notifs.map(n => {
    const timeStr = formatNotifTime(n.time);
    const borderCls = TYPE_COLORS[n.type] || TYPE_COLORS.info;
    return `
      <div class="notif-item border ${borderCls} ${n.read ? 'opacity-50' : ''}" data-notif-id="${n.id}">
        <div class="flex items-start gap-3">
          <span class="text-lg shrink-0 mt-0.5">${n.icon || 'ℹ️'}</span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}">${n.title}</p>
            <p class="text-xs text-slate-400 mt-0.5 line-clamp-2">${n.message}</p>
            <p class="text-[10px] text-slate-600 mt-1">${timeStr}</p>
          </div>
          <div class="flex flex-col gap-1 shrink-0">
            ${!n.read ? `<button class="text-cyan-400 hover:text-cyan-300 text-[10px] px-1.5 py-0.5 rounded hover:bg-cyan-500/10 transition" data-read-id="${n.id}" title="Okundu işaretle">✓</button>` : ''}
            <button class="text-red-400/60 hover:text-red-300 text-[10px] px-1.5 py-0.5 rounded hover:bg-red-500/10 transition" data-del-id="${n.id}" title="Sil">✕</button>
          </div>
        </div>
        ${!n.read ? '<div class="unread-dot"></div>' : ''}
      </div>`;
  }).join('');

  // Wire up list buttons
  container.querySelectorAll('[data-read-id]').forEach(btn => {
    btn.onclick = () => {
      markNotificationRead(parseFloat(btn.dataset.readId));
      renderNotifList();
    };
  });
  container.querySelectorAll('[data-del-id]').forEach(btn => {
    btn.onclick = () => {
      deleteNotification(parseFloat(btn.dataset.delId));
      renderNotifList();
    };
  });
}

function formatNotifTime(isoString) {
  const now = new Date();
  const then = new Date(isoString);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Az önce';
  if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`;
  return then.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

// ===== PANEL WIRING =====

export function initNotifPanel() {
  document.getElementById('notif-bell')?.addEventListener('click', openNotifPanel);
  document.getElementById('notif-close')?.addEventListener('click', closeNotifPanel);
  document.getElementById('notif-overlay')?.addEventListener('click', closeNotifPanel);
  document.getElementById('notif-read-all')?.addEventListener('click', () => {
    markAllNotificationsRead();
    renderNotifList();
    refreshNotifBadge();
  });
  document.getElementById('notif-clear')?.addEventListener('click', () => {
    clearAllNotifications();
    renderNotifList();
  });
}

// ===== AUTO-NOTIFICATIONS =====

export function checkAutoNotifications() {
  const now = new Date();
  const hour = now.getHours();
  const today = now.toISOString().split('T')[0];

  const tryNotify = (key, fn) => {
    if (localStorage.getItem(SENT_KEY_PREFIX + key)) return;
    fn();
    localStorage.setItem(SENT_KEY_PREFIX + key, '1');
  };

  // Vardiya değişimi uyarıları
  if (hour === 6) tryNotify(`${today}_shift_morning`, () =>
    addNotification('Vardiya Değişimi', 'Sabah vardiyası 07:00\'de başlıyor. Tüm sabah personelinin hazır olması gerekiyor.', 'shift', '🌅'));
  if (hour === 14) tryNotify(`${today}_shift_evening`, () =>
    addNotification('Vardiya Değişimi', 'Akşam vardiyası 15:00\'de başlıyor. Akşam ekibinin geçiş hazırlıklarını kontrol edin.', 'shift', '🌆'));
  if (hour === 22) tryNotify(`${today}_shift_night`, () =>
    addNotification('Vardiya Değişimi', 'Gece vardiyası 23:00\'de başlıyor. Gece nöbetçilerinin görev yerlerinde hazır olması gerekiyor.', 'shift', '🌙'));

  // Puantaj hatırlatması
  if (hour === 17) tryNotify(`${today}_attendance`, () =>
    addNotification('Puantaj Hatırlatması', 'Günlük puantaj kayıtlarını kontrol edin ve eksik kayıtları tamamlayın.', 'attendance', '⏰'));

  // Ay sonu uyarısı
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (now.getDate() >= lastDay - 3 && hour === 9) tryNotify(`${today}_monthend`, () =>
    addNotification('Ay Sonu Yaklaşıyor', 'Aylık puantaj raporunu hazırlamayı unutmayın. Rapor teslim tarihine 3 gün kaldı.', 'warning', '📅'));

  // Haftalık özet (Pazartesi)
  if (now.getDay() === 1 && hour === 8) tryNotify(`${today}_weekly`, () =>
    addNotification('Haftalık Özet', 'Yeni hafta başladı. Nöbet listesini ve puantaj durumunu kontrol edin.', 'info', '📋'));
}

// ===== TTS (TEXT-TO-SPEECH) =====

// Public voice discovered from the platform voice catalog.
const TTS_VOICE_ID = 'cartesia:5fe07c8e-e3dd-4738-be97-f7b53ed33bfc';
let ttsEnabled = true;

export function setTtsEnabled(enabled) {
  ttsEnabled = enabled;
  localStorage.setItem('hospital_tts_enabled', enabled ? '1' : '0');
}

export function isTtsEnabled() {
  return ttsEnabled && localStorage.getItem('hospital_tts_enabled') !== '0';
}

export async function speakText(text) {
  if (!isTtsEnabled()) return;
  try {
    if (typeof miniappsAI !== 'undefined' && miniappsAI.tts) {
      await miniappsAI.tts.speak({
        text,
        voiceId: TTS_VOICE_ID,
        timeoutMs: 15000,
      });
    }
  } catch {
    // TTS is an optional enhancement; notification delivery must remain silent
    // and reliable when the preview has no TTS permission/credits.
    ttsEnabled = false;
  }
}

// ===== PHOTO UPLOAD UTILITY =====

export function resizeImage(file, maxSize = 150) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Dosya okunamadı'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Görüntü yüklenemedi'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ===== PUSH NOTIFICATION SUBSCRIPTION =====

export async function subscribePushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    showToast('Push bildirimleri desteklenmiyor', 'warning');
    return false;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: null, // VAPID key would go here in production
    });
    localStorage.setItem('hospital_push_sub', JSON.stringify(sub));
    showToast('Push bildirimleri etkinleştirildi', 'success');
    return true;
  } catch (err) {
    console.warn('Push subscription error:', err);
    showToast('Push bildirimleri etkinleştirilemedi', 'error');
    return false;
  }
}

export function isPushSubscribed() {
  return !!localStorage.getItem('hospital_push_sub');
}
