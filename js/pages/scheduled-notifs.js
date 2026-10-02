// ===== BİLDİRİM ZAMANLAMA =====
import { getPersonnel } from '../state.js';
import { showToast, addNotification } from '../notifications.js';

const RECURRENCE_OPTIONS = [
  { id: 'once', label: 'Bir Kere' },
  { id: 'daily', label: 'Her Gün' },
  { id: 'weekly', label: 'Her Hafta' },
  { id: 'monthly', label: 'Her Ay' },
];

export function renderScheduledNotifsPage(container) {
  const scheduled = getScheduled();
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">⏰ Bildirim Zamanlama</h1>
          <p class="text-slate-400 text-sm mt-1">Otomatik bildirimler ve hatırlatmalar planlayın</p>
        </div>
        <button id="sn-add-btn" class="btn-primary">+ Zamanla</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${snStat('📋', 'Toplam', scheduled.length, 'cyan')}
        ${snStat('🟢', 'Aktif', scheduled.filter(s=>s.active).length, 'green')}
        ${snStat('🔴', 'Pasif', scheduled.filter(s=>!s.active).length, 'red')}
        ${snStat('📨', 'Gönderilen', scheduled.reduce((s,x)=>s+(x.sentCount||0),0), 'purple')}
      </div>
      <div id="sn-list" class="space-y-3"></div>
    </div>`;
  renderList(scheduled);
  document.getElementById('sn-add-btn').onclick = () => showScheduledModal();
}

function renderList(scheduled) {
  const el = document.getElementById('sn-list');
  if (scheduled.length === 0) {
    el.innerHTML = '<div class="empty-state card"><div class="icon">⏰</div><div class="title">Zamanlanmış bildirim yok</div></div>';
    return;
  }
  el.innerHTML = scheduled.map(s => `
    <div class="card flex items-center gap-4 ${s.active?'':'opacity-60'}">
      <div class="text-3xl">${s.active?'🟢':'🔴'}</div>
      <div class="flex-1">
        <p class="font-medium text-white">${s.title}</p>
        <p class="text-xs text-slate-400">${s.message}</p>
        <div class="flex gap-3 mt-1 text-xs text-slate-500">
          <span>📅 ${s.date} ${s.time}</span>
          <span>🔄 ${RECURRENCE_OPTIONS.find(r=>r.id===s.recurrence)?.label || s.recurrence}</span>
          <span>📨 ${s.sentCount||0} gönderildi</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button class="sn-toggle-btn btn-secondary text-xs px-3 py-1" data-id="${s.id}">${s.active?'⏸️ Durdur':'▶️ Başlat'}</button>
        <button class="sn-del-btn btn-secondary text-xs px-2 py-1 text-red-400" data-id="${s.id}">🗑️</button>
      </div>
    </div>`).join('');

  el.querySelectorAll('.sn-toggle-btn').forEach(b => {
    b.onclick = () => {
      const all = getScheduled();
      const item = all.find(x => x.id === parseInt(b.dataset.id));
      if (item) { item.active = !item.active; saveScheduled(all); renderList(all); }
    };
  });
  el.querySelectorAll('.sn-del-btn').forEach(b => {
    b.onclick = () => {
      const all = getScheduled().filter(x => x.id !== parseInt(b.dataset.id));
      saveScheduled(all); renderList(all); showToast('Zamanlama silindi', 'success');
    };
  });
}

function showScheduledModal() {
  const personnel = getPersonnel({ status: 'active' });
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
    <h3 class="text-xl font-bold text-white mb-4">⏰ Bildirim Zamanla</h3>
    <div class="space-y-3">
      <div><label class="label">Başlık *</label><input id="sn-title" class="input-field w-full" placeholder="Bildirim başlığı"></div>
      <div><label class="label">Mesaj</label><textarea id="sn-msg" class="input-field w-full" rows="2" placeholder="Bildirim mesajı"></textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label">Tarih</label><input id="sn-date" type="date" class="input-field w-full" value="${new Date().toISOString().split('T')[0]}"></div>
        <div><label class="label">Saat</label><input id="sn-time" type="time" class="input-field w-full" value="09:00"></div>
      </div>
      <div><label class="label">Tekrar</label><select id="sn-recurrence" class="input-field w-full">${RECURRENCE_OPTIONS.map(r=>`<option value="${r.id}">${r.label}</option>`).join('')}</select></div>
      <div><label class="label">Hedef</label><select id="sn-target" class="input-field w-full">
        <option value="all">Tüm Personel</option>
        ${[...new Set(personnel.map(p=>p.department))].map(d=>`<option value="dept:${d}">${d} Departmanı</option>`).join('')}
      </select></div>
    </div>
    <div class="flex gap-3 mt-6"><button id="sn-save" class="btn-primary flex-1">💾 Kaydet</button><button onclick="this.closest('.fixed').remove()" class="btn-secondary flex-1">İptal</button></div></div>`;
  document.body.appendChild(m);
  document.getElementById('sn-save').onclick = () => {
    const title = document.getElementById('sn-title').value.trim();
    if (!title) { showToast('Başlık gereklidir', 'error'); return; }
    const all = getScheduled();
    all.push({
      id: Date.now(), title, message: document.getElementById('sn-msg').value.trim(),
      date: document.getElementById('sn-date').value, time: document.getElementById('sn-time').value,
      recurrence: document.getElementById('sn-recurrence').value, target: document.getElementById('sn-target').value,
      active: true, sentCount: 0, createdAt: new Date().toISOString(),
    });
    saveScheduled(all);
    m.remove(); showToast('Bildirim zamanlandı!', 'success');
    renderList(all);
  };
}

// Auto-check scheduled notifications
export function checkScheduledNotifications() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
  const scheduled = getScheduled();
  let changed = false;
  scheduled.forEach(s => {
    if (!s.active) return;
    if (s.date > today) return;
    if (s.date === today && s.time > currentTime) return;
    if (s.lastSent === today) return;
    addNotification('⏰ ' + s.title, s.message || 'Zamanlanmış bildirim', s.id);
    s.sentCount = (s.sentCount || 0) + 1;
    s.lastSent = today;
    if (s.recurrence === 'daily') {
      const d = new Date(now.getTime() + 86400000);
      s.date = d.toISOString().split('T')[0];
    } else if (s.recurrence === 'weekly') {
      const d = new Date(now.getTime() + 7*86400000);
      s.date = d.toISOString().split('T')[0];
    } else if (s.recurrence === 'monthly') {
      const d = new Date(now);
      d.setMonth(d.getMonth()+1);
      s.date = d.toISOString().split('T')[0];
    } else {
      s.active = false;
    }
    changed = true;
  });
  if (changed) saveScheduled(scheduled);
}

function getScheduled() { try { return JSON.parse(localStorage.getItem('hospital_scheduled_notifs') || '[]'); } catch { return []; } }
function saveScheduled(s) { localStorage.setItem('hospital_scheduled_notifs', JSON.stringify(s)); }
function snStat(icon, label, value, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-2xl font-bold text-white mt-1">${value}</p></div>`;
}
