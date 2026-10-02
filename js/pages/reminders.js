// ===== KISESEL HATIRLATMA & DEADLINE =====
import { getPersonalReminders, addPersonalReminder, updatePersonalReminder, deletePersonalReminder } from '../state-extensions.js';
import { getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

export function renderRemindersPage(el) {
  const user = getCurrentUser();
  const userId = user?.username || 'default';

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🔔 Hatırlatmalar & Deadline</h1>
          <p class="text-slate-400 text-sm mt-1">Kişisel görevler ve son tarihler</p>
        </div>
        <button id="add-rem-btn" class="btn-primary text-sm">+ Hatırlatma Ekle</button>
      </div>
    </div>
    <div id="rem-stats" class="grid grid-cols-3 gap-4 mb-6 fade-in"></div>
    <div id="rem-list" class="fade-in"></div>
    <div id="rem-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 id="rem-modal-title" class="text-xl font-bold text-white mb-4">🔔 Hatırlatma Ekle</h3>
        <div class="space-y-3">
          <div><label class="label">Başlık</label><input id="r-title" class="input-field w-full" placeholder="Hatırlatma başlığı"></div>
          <div><label class="label">Açıklama</label><textarea id="r-desc" class="input-field w-full" rows="2" placeholder="Detay..."></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Son Tarih</label><input id="r-due" type="date" class="input-field w-full"></div>
            <div><label class="label">Öncelik</label><select id="r-priority" class="input-field w-full"><option value="low">Düşük</option><option value="medium" selected>Orta</option><option value="high">Yüksek</option></select></div>
          </div>
        </div>
        <div class="flex gap-3 mt-6"><button id="r-save" class="btn-primary flex-1">💾 Kaydet</button><button id="r-cancel" class="btn-secondary flex-1">İptal</button></div>
      </div>
    </div>`;

  function render() {
    const list = getPersonalReminders(userId);
    const today = new Date().toISOString().split('T')[0];
    const pending = list.filter(r => !r.done);
    const overdue = pending.filter(r => r.dueDate && r.dueDate < today);
    const done = list.filter(r => r.done);
    document.getElementById('rem-stats').innerHTML = `
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${pending.length}</p><p class="text-xs text-slate-400">Bekleyen</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-red-300">${overdue.length}</p><p class="text-xs text-slate-400">Gecikmiş</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-green-300">${done.length}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>`;

    const container = document.getElementById('rem-list');
    if (!list.length) { container.innerHTML = '<div class="empty-state"><div class="icon">🔔</div><div class="title">Hatırlatma yok</div></div>'; return; }
    const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' };
    const renderCard = (r) => {
      const isOverdue = !r.done && r.dueDate && r.dueDate < today;
      return `<div class="flex items-center gap-3 rounded-xl ${r.done ? 'bg-white/3 opacity-50' : isOverdue ? 'bg-red-500/10 border border-red-500/20' : 'bg-white/5 border border-white/10'} p-3">
        <button data-toggle-rem="${r.id}" class="w-6 h-6 rounded-full border-2 ${r.done ? 'bg-green-500 border-green-500' : 'border-slate-500'} flex items-center justify-center text-white text-xs shrink-0">${r.done ? '✓' : ''}</button>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium ${r.done ? 'line-through text-slate-500' : 'text-white'}">${r.title}</p>
          ${r.description ? '<p class="text-xs text-slate-400 truncate">' + r.description + '</p>' : ''}
          <div class="flex items-center gap-2 mt-1 text-[10px]">
            <span>${priorityIcons[r.priority] || '🟡'}</span>
            ${r.dueDate ? `<span class="${isOverdue ? 'text-red-400 font-bold' : 'text-slate-500'}">📅 ${r.dueDate}${isOverdue ? ' (Gecikmiş!)' : ''}</span>` : ''}
          </div>
        </div>
        <div class="flex gap-1 shrink-0">
          <button data-del-rem="${r.id}" class="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 text-xs">🗑️</button>
        </div>
      </div>`;
    };
    container.innerHTML = `
      ${pending.length ? '<h3 class="text-sm font-semibold text-slate-300 mb-3">📋 Bekleyen (' + pending.length + ')</h3><div class="space-y-2 mb-4">' + pending.map(renderCard).join('') + '</div>' : ''}
      ${done.length ? '<h3 class="text-sm font-semibold text-slate-500 mb-3">✅ Tamamlanan (' + done.length + ')</h3><div class="space-y-2">' + done.slice(0, 10).map(renderCard).join('') + '</div>' : ''}`;

    document.querySelectorAll('[data-toggle-rem]').forEach(btn => {
      btn.onclick = () => { const r = list.find(x => x.id === parseInt(btn.dataset.toggleRem)); if (r) { updatePersonalReminder(r.id, { done: !r.done }, userId); render(); } };
    });
    document.querySelectorAll('[data-del-rem]').forEach(btn => {
      btn.onclick = () => { deletePersonalReminder(parseInt(btn.dataset.delRem), userId); render(); showToast('Hatırlatma silindi', 'success'); };
    });
  }

  document.getElementById('add-rem-btn').onclick = () => {
    const modal = document.getElementById('rem-modal');
    document.getElementById('r-title').value = ''; document.getElementById('r-desc').value = '';
    document.getElementById('r-due').value = ''; document.getElementById('r-priority').value = 'medium';
    modal.classList.remove('hidden');
    document.getElementById('r-save').onclick = () => {
      const title = document.getElementById('r-title').value.trim();
      if (!title) { showToast('Başlık gereklidir', 'error'); return; }
      addPersonalReminder({ userId, title, description: document.getElementById('r-desc').value, dueDate: document.getElementById('r-due').value, priority: document.getElementById('r-priority').value });
      modal.classList.add('hidden'); render(); showToast('Hatırlatma eklendi', 'success');
    };
  };
  document.getElementById('r-cancel').onclick = () => document.getElementById('rem-modal').classList.add('hidden');
  document.getElementById('rem-modal').onclick = (e) => { if (e.target.id === 'rem-modal') document.getElementById('rem-modal').classList.add('hidden'); };
  render();
}
