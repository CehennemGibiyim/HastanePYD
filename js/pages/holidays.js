// ===== RESMI TATİL YÖNETİMİ =====

import { getCurrentUser, hasPermission } from '../state.js';
import { showToast, addNotification } from '../notifications.js';

const HOLIDAYS_KEY = 'hospital_holidays';

function loadHolidays() {
  const stored = localStorage.getItem(HOLIDAYS_KEY);
  if (stored) return JSON.parse(stored);
  // Default Turkish public holidays
  const now = new Date();
  const y = now.getFullYear();
  const defaults = [
    { date: `${y}-01-01`, name: 'Yılbaşı', type: 'national', icon: '🎆' },
    { date: `${y}-04-23`, name: 'Ulusal Egemenlik ve Çocuk Bayramı', type: 'national', icon: '🇹🇷' },
    { date: `${y}-05-01`, name: 'Emek ve Dayanışma Günü', type: 'national', icon: '👷' },
    { date: `${y}-05-19`, name: 'Atatürk\'ü Anma, Gençlik ve Spor Bayramı', type: 'national', icon: '🏃' },
    { date: `${y}-07-15`, name: 'Demokrasi ve Milli Birlik Günü', type: 'national', icon: '🕊️' },
    { date: `${y}-08-30`, name: 'Zafer Bayramı', type: 'national', icon: '🏆' },
    { date: `${y}-10-29`, name: 'Cumhuriyet Bayramı', type: 'national', icon: '🇹🇷' },
    { date: `${y}-03-29`, name: 'Ramazan Bayramı 1. Gün', type: 'religious', icon: '🌙' },
    { date: `${y}-03-30`, name: 'Ramazan Bayramı 2. Gün', type: 'religious', icon: '🌙' },
    { date: `${y}-03-31`, name: 'Ramazan Bayramı 3. Gün', type: 'religious', icon: '🌙' },
    { date: `${y}-06-06`, name: 'Kurban Bayramı 1. Gün', type: 'religious', icon: '🐑' },
    { date: `${y}-06-07`, name: 'Kurban Bayramı 2. Gün', type: 'religious', icon: '🐑' },
    { date: `${y}-06-08`, name: 'Kurban Bayramı 3. Gün', type: 'religious', icon: '🐑' },
    { date: `${y}-06-09`, name: 'Kurban Bayramı 4. Gün', type: 'religious', icon: '🐑' },
  ];
  saveHolidays(defaults);
  return defaults;
}
function saveHolidays(h) { localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(h)); }

export function getPublicHolidays(year, month) {
  const holidays = loadHolidays();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return holidays.filter(h => h.date.startsWith(prefix));
}

export function isHoliday(dateStr) {
  return loadHolidays().some(h => h.date === dateStr);
}

export function renderHolidaysPage(el) {
  const holidays = loadHolidays();
  const canEdit = hasPermission('write');
  const now = new Date();
  const currentYear = now.getFullYear();

  const upcoming = holidays.filter(h => new Date(h.date) >= new Date(now.toISOString().split('T')[0])).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 10);
  const past = holidays.filter(h => new Date(h.date) < new Date(now.toISOString().split('T')[0])).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  // Monthly distribution
  const monthly = {};
  holidays.forEach(h => {
    const m = parseInt(h.date.split('-')[1]);
    if (!monthly[m]) monthly[m] = 0;
    monthly[m]++;
  });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🗓️ Resmi Tatil Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">${currentYear} yılı resmi tatilleri ve özel günler</p>
        </div>
        ${canEdit ? `<button id="add-holiday-btn" class="btn-primary">➕ Tatil Ekle</button>` : ''}
      </div>
    </div>

    <!-- İstatistikler -->
    <div class="grid grid-cols-3 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-cyan-300">${holidays.length}</p>
        <p class="text-xs text-cyan-400">Toplam Tatil Günü</p>
      </div>
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-green-300">${holidays.filter(h => h.type === 'national').length}</p>
        <p class="text-xs text-green-400">Milli Bayram</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-purple-300">${holidays.filter(h => h.type === 'religious').length}</p>
        <p class="text-xs text-purple-400">Dini Bayram</p>
      </div>
    </div>

    <!-- Aylık Dağılım -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Aylık Dağılım</h3>
      <div class="grid grid-cols-4 md:grid-cols-6 gap-2">
        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(m => {
          const count = monthly[m] || 0;
          const monthName = new Date(currentYear, m - 1).toLocaleDateString('tr-TR', { month: 'short' });
          return `
          <div class="rounded-lg ${count > 0 ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-white/5 border border-white/5'} p-2 text-center">
            <p class="text-xs font-medium ${count > 0 ? 'text-cyan-300' : 'text-slate-500'}">${monthName}</p>
            <p class="text-lg font-bold ${count > 0 ? 'text-white' : 'text-slate-600'}">${count}</p>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Yaklaşan Tatiller -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Yaklaşan Tatiller</h3>
      ${upcoming.length === 0 ? '<p class="text-slate-500 text-center py-8">Yaklaşan tatil bulunamadı</p>' : `
      <div class="space-y-2">
        ${upcoming.map(h => {
          const date = new Date(h.date);
          const daysUntil = Math.ceil((date - now) / 86400000);
          return `
          <div class="flex items-center gap-4 rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/10 transition">
            <span class="text-3xl">${h.icon || '📅'}</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">${h.name}</p>
              <p class="text-xs text-slate-400">${date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-lg font-bold ${daysUntil <= 7 ? 'text-amber-400' : 'text-cyan-400'}">${daysUntil}</p>
              <p class="text-[10px] text-slate-500">gün kaldı</p>
            </div>
            ${canEdit ? `<button data-delete-holiday="${h.date}" class="text-red-400/50 hover:text-red-400 text-sm px-2">✕</button>` : ''}
          </div>`;
        }).join('')}
      </div>`}
    </div>

    <!-- Geçmiş Tatiller -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📜 Geçmiş Tatiller</h3>
      ${past.length === 0 ? '<p class="text-slate-500 text-center py-8">Geçmiş tatil yok</p>' : `
      <div class="flex flex-wrap gap-2">
        ${past.map(h => `
          <div class="rounded-lg bg-white/5 border border-white/5 px-3 py-2 text-xs">
            <span>${h.icon || '📅'}</span>
            <span class="text-slate-300">${h.name}</span>
            <span class="text-slate-500">${h.date}</span>
          </div>
        `).join('')}
      </div>`}
    </div>`;

  if (canEdit) {
    document.getElementById('add-holiday-btn')?.addEventListener('click', () => openAddHolidayModal(el));
    el.querySelectorAll('[data-delete-holiday]').forEach(btn => {
      btn.onclick = () => {
        const holidays = loadHolidays().filter(h => h.date !== btn.dataset.deleteHoliday);
        saveHolidays(holidays);
        showToast('Tatil silindi', 'success');
        renderHolidaysPage(el);
      };
    });
  }
}

function openAddHolidayModal(el) {
  const existing = document.getElementById('holiday-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'holiday-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🗓️ Tatil Ekle</h3>
      <div class="space-y-3">
        <div>
          <label class="label">Tarih</label>
          <input type="date" id="holiday-date" class="input-field w-full">
        </div>
        <div>
          <label class="label">Adı</label>
          <input type="text" id="holiday-name" class="input-field w-full" placeholder="Tatil adı">
        </div>
        <div>
          <label class="label">Tür</label>
          <select id="holiday-type" class="input-field w-full">
            <option value="national">🇹🇷 Milli Bayram</option>
            <option value="religious">🌙 Dini Bayram</option>
            <option value="custom">📌 Özel Gün</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="holiday-save" class="btn-primary flex-1">💾 Ekle</button>
        <button id="holiday-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'holiday-modal') modal.remove(); };
  document.getElementById('holiday-cancel').onclick = () => modal.remove();
  document.getElementById('holiday-save').onclick = () => {
    const date = document.getElementById('holiday-date').value;
    const name = document.getElementById('holiday-name').value.trim();
    const type = document.getElementById('holiday-type').value;
    if (!date || !name) { showToast('Tarih ve adı giriniz', 'error'); return; }
    const holidays = loadHolidays();
    if (holidays.some(h => h.date === date)) { showToast('Bu tarihte zaten tatil var', 'error'); return; }
    const icons = { national: '🇹🇷', religious: '🌙', custom: '📌' };
    holidays.push({ date, name, type, icon: icons[type] || '📅' });
    holidays.sort((a, b) => a.date.localeCompare(b.date));
    saveHolidays(holidays);
    modal.remove();
    addNotification('Yeni Tatil', `${name} (${date}) eklendi`, 'info', '🗓️');
    showToast('Tatil eklendi', 'success');
    renderHolidaysPage(el);
  };
}
