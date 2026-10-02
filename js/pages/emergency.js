// ===== ACİL DURUM BİLDİRİM SİSTEMİ =====

import { getPersonnel, getCurrentUser, DEPARTMENTS, isDepartmentRestricted, getUserDepartment } from '../state.js';
import { addNotification, showToast, speakText } from '../notifications.js';

const EMERGENCY_CODES = [
  { code: 'CODE_BLUE', label: 'Kod Mavi', desc: 'Kalp Durması / Tıbbi Acil', icon: '💙', color: 'blue', priority: 'critical' },
  { code: 'CODE_RED', label: 'Kod Kırmızı', desc: 'Yangın Alarmı', icon: '🔴', color: 'red', priority: 'critical' },
  { code: 'CODE_YELLOW', label: 'Kod Sarı', desc: 'Bomba İhbarı / Güvenlik Tehdidi', icon: '🟡', color: 'yellow', priority: 'critical' },
  { code: 'CODE_GREEN', label: 'Kod Yeşil', desc: 'Tahliye / Doğal Afet', icon: '🟢', color: 'green', priority: 'high' },
  { code: 'CODE_PINK', label: 'Kod Pembe', desc: 'Çocuk/Kadın Kaçırma', icon: '🩷', color: 'pink', priority: 'critical' },
  { code: 'CODE_GRAY', label: 'Kod Gri', desc: 'Tehdit/Şiddet Olayı', icon: '⚫', color: 'gray', priority: 'critical' },
  { code: 'CODE_ORANGE', label: 'Kod Turuncu', desc: 'Kimyasal Sızıntı / Tehlikeli Madde', icon: '🟠', color: 'orange', priority: 'high' },
  { code: 'CODE_WHITE', label: 'Kod Beyaz', desc: 'Yenidoğan Alarmı', icon: '⚪', color: 'white', priority: 'critical' },
];

const HISTORY_KEY = 'hospital_emergency_history';

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; } catch { return []; }
}
function saveHistory(h) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }

export function renderEmergencyPage(el) {
  const history = loadHistory();
  const recent = history.slice(0, 20);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🚨 Acil Durum Bildirim Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Kod gönderimi ve acil durum yönetimi</p>
    </div>

    <!-- Acil Kodlar -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 fade-in">
      ${EMERGENCY_CODES.map(c => `
        <button class="emergency-code-btn rounded-2xl border-2 border-${c.color}-500/30 bg-${c.color}-500/5 p-5 text-center hover:bg-${c.color}-500/15 hover:border-${c.color}-500/50 transition-all cursor-pointer group" data-code="${c.code}">
          <span class="text-4xl block mb-2 group-hover:scale-110 transition-transform">${c.icon}</span>
          <p class="text-sm font-bold text-white">${c.label}</p>
          <p class="text-[10px] text-slate-400 mt-1">${c.desc}</p>
        </button>
      `).join('')}
    </div>

    <!-- Hedef Seçimi Bilgisi -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">📡 Gönderim Hedefleri</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
          <p class="text-3xl mb-1">🏥</p>
          <p class="text-sm font-medium text-white">Tüm Hastane</p>
          <p class="text-xs text-slate-400">${getPersonnel().filter(p => p.status === 'active').length} personel</p>
        </div>
        ${isDepartmentRestricted() ? `
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
          <p class="text-3xl mb-1">🏢</p>
          <p class="text-sm font-medium text-white">Departman</p>
          <p class="text-xs text-slate-400">${getUserDepartment()}</p>
        </div>
        ` : ''}
        <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
          <p class="text-3xl mb-1">🔊</p>
          <p class="text-sm font-medium text-white">Sesli Uyarı</p>
          <p class="text-xs text-slate-400">TTS aktif</p>
        </div>
      </div>
    </div>

    <!-- Geçmiş -->
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">📜 Kod Geçmişi</h3>
        ${history.length > 0 ? `<button id="clear-emergency-history" class="text-xs text-red-400 hover:text-red-300">🗑️ Temizle</button>` : ''}
      </div>
      ${recent.length === 0 ? `
        <div class="empty-state">
          <div class="icon">✅</div>
          <div class="title">Acil durum kaydı yok</div>
          <div class="desc">Kod gönderildiğinde burada görünecek</div>
        </div>
      ` : `
        <div class="space-y-2">
          ${recent.map(h => {
            const code = EMERGENCY_CODES.find(c => c.code === h.code);
            const time = new Date(h.timestamp);
            return `
            <div class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3 ${h.active ? 'border-red-500/30 bg-red-500/5' : ''}">
              <span class="text-2xl shrink-0">${code?.icon || '🚨'}</span>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium text-white">${code?.label || h.code}</p>
                  ${h.active ? '<span class="badge bg-red-500/15 text-red-400 animate-pulse">AKTİF</span>' : '<span class="badge bg-slate-500/15 text-slate-400">Kapatıldı</span>'}
                </div>
                <p class="text-xs text-slate-400">${code?.desc || ''}</p>
                <p class="text-[10px] text-slate-500 mt-1">${time.toLocaleString('tr-TR')} · ${h.sentBy || 'Sistem'}</p>
              </div>
              ${h.active ? `<button data-deactivate="${h.id}" class="btn-primary text-xs px-3 py-1.5">🔔 Kod Kapat</button>` : ''}
            </div>`;
          }).join('')}
        </div>
      `}
    </div>`;

  // Wire code buttons
  el.querySelectorAll('.emergency-code-btn').forEach(btn => {
    btn.onclick = () => sendEmergencyCode(btn.dataset.code, el);
  });

  // Wire deactivate
  el.querySelectorAll('[data-deactivate]').forEach(btn => {
    btn.onclick = () => {
      const history = loadHistory();
      const item = history.find(h => h.id === parseInt(btn.dataset.deactivate));
      if (item) {
        item.active = false;
        item.deactivatedAt = new Date().toISOString();
        saveHistory(history);
        addNotification('Kod Kapatıldı', `${EMERGENCY_CODES.find(c => c.code === item.code)?.label || item.code} kapatıldı`, 'success', '✅');
        renderEmergencyPage(el);
      }
    };
  });

  // Wire clear history
  document.getElementById('clear-emergency-history')?.addEventListener('click', () => {
    saveHistory([]);
    renderEmergencyPage(el);
    showToast('Geçmiş temizlendi', 'success');
  });
}

function sendEmergencyCode(code, el) {
  const codeInfo = EMERGENCY_CODES.find(c => c.code === code);
  if (!codeInfo) return;

  // Onay modalı
  const existing = document.getElementById('emergency-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'emergency-confirm-modal';
  modal.className = 'fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border-2 border-${codeInfo.color}-500/50 bg-slate-900 p-6 shadow-2xl fade-in text-center">
      <div class="text-6xl mb-4 animate-bounce">${codeInfo.icon}</div>
      <h2 class="text-2xl font-bold text-white mb-2">${codeInfo.label}</h2>
      <p class="text-slate-300 mb-2">${codeInfo.desc}</p>
      <p class="text-sm text-red-400 font-medium mb-6">⚠️ Bu kod tüm personele gönderilecek ve sesli uyarı yapılacak!</p>
      <div class="flex gap-3">
        <button id="emergency-confirm" class="btn-primary flex-1 bg-red-500 hover:bg-red-400">🚨 GÖNDER</button>
        <button id="emergency-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'emergency-confirm-modal') modal.remove(); };
  document.getElementById('emergency-cancel').onclick = () => modal.remove();
  document.getElementById('emergency-confirm').onclick = () => {
    // Save to history
    const history = loadHistory();
    const entry = {
      id: Date.now(),
      code,
      active: true,
      timestamp: new Date().toISOString(),
      sentBy: getCurrentUser()?.name || 'Bilinmiyor',
    };
    history.unshift(entry);
    if (history.length > 50) history.length = 50;
    saveHistory(history);

    // Send notification
    addNotification(`🚨 ${codeInfo.label}`, `${codeInfo.desc} - Tüm personele bildirim gönderildi`, 'error', codeInfo.icon);

    // TTS alert
    speakText(`Dikkat! ${codeInfo.label}. ${codeInfo.desc}. Tüm personel lütfen hazırlıklı olsun.`);

    modal.remove();
    showToast(`${codeInfo.label} gönderildi!`, 'error');
    renderEmergencyPage(el);
  };
}
