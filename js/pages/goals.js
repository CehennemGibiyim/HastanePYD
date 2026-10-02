// ===== HEDEFF & KPI YONETIMI =====
import { getGoals, addGoal, updateGoal, deleteGoal } from '../state-extensions.js';
import { getDepartments, getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

export function renderGoalsPage(el) {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const depts = getDepartments();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🎯 Hedef & KPI Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Departman hedefleri ve performans göstergeleri</p>
        </div>
        <div class="flex gap-2">
          <select id="goals-dept" class="input-field text-sm"><option value="">Tüm Departmanlar</option>${depts.map(d => '<option>' + d + '</option>').join('')}</select>
          ${isAdmin ? '<button id="add-goal-btn" class="btn-primary text-sm">+ Hedef Ekle</button>' : ''}
        </div>
      </div>
    </div>
    <div id="goals-list" class="fade-in"></div>
    <div id="goal-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 id="goal-modal-title" class="text-xl font-bold text-white mb-4">🎯 Hedef Ekle</h3>
        <div class="space-y-3">
          <div><label class="label">Departman</label><select id="g-dept" class="input-field w-full">${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
          <div><label class="label">Hedef Başlığı</label><input id="g-title" class="input-field w-full" placeholder="Örn: Hasta memnuniyeti %90+"></div>
          <div class="grid grid-cols-3 gap-3">
            <div><label class="label">Hedef</label><input id="g-target" type="number" class="input-field w-full" placeholder="90"></div>
            <div><label class="label">Mevcut</label><input id="g-current" type="number" class="input-field w-full" placeholder="82"></div>
            <div><label class="label">Birim</label><input id="g-unit" class="input-field w-full" placeholder="%" value="%"></div>
          </div>
          <div><label class="label">Bitiş Tarihi</label><input id="g-deadline" type="date" class="input-field w-full"></div>
        </div>
        <div class="flex gap-3 mt-6"><button id="g-save" class="btn-primary flex-1">💾 Kaydet</button><button id="g-cancel" class="btn-secondary flex-1">İptal</button></div>
      </div>
    </div>`;

  function render() {
    const dept = document.getElementById('goals-dept').value;
    const list = getGoals(dept || null);
    const container = document.getElementById('goals-list');
    if (!list.length) { container.innerHTML = '<div class="empty-state"><div class="icon">🎯</div><div class="title">Hedef bulunamadı</div></div>'; return; }
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 gap-4">${list.map(g => {
      const pct = g.target ? Math.min(100, Math.round(g.current / g.target * 100)) : 0;
      const color = pct >= 90 ? 'from-green-500 to-emerald-500' : pct >= 70 ? 'from-amber-500 to-yellow-500' : 'from-red-500 to-orange-500';
      const statusIcon = pct >= 100 ? '✅' : pct >= 70 ? '🔄' : '⚠️';
      return `<div class="card">
        <div class="flex items-start justify-between mb-3">
          <div><p class="text-sm font-medium text-white">${g.title}</p><p class="text-xs text-slate-400 mt-1">🏢 ${g.department} · ⏰ ${g.deadline || 'Süresiz'}</p></div>
          <span class="text-2xl">${statusIcon}</span>
        </div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-2xl font-bold text-white">${g.current}<span class="text-sm text-slate-400">${g.unit}</span></span>
          <span class="text-sm text-slate-400">Hedef: ${g.target}${g.unit}</span>
        </div>
        <div class="h-3 rounded-full bg-white/10 overflow-hidden mb-1">
          <div class="h-full rounded-full bg-gradient-to-r ${color} transition-all" style="width:${pct}%"></div>
        </div>
        <p class="text-xs text-slate-500 text-right">%${pct} tamamlandı</p>
        ${isAdmin ? `<div class="flex gap-2 mt-3 pt-3 border-t border-white/10">
          <button data-edit-goal="${g.id}" class="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded hover:bg-cyan-500/10">✏️ Düzenle</button>
          <button data-del-goal="${g.id}" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10">🗑️</button>
        </div>` : ''}
      </div>`;
    }).join('')}</div>`;
    document.querySelectorAll('[data-edit-goal]').forEach(btn => { btn.onclick = () => { const g = list.find(x => x.id === parseInt(btn.dataset.editGoal)); if (g) openModal(g); }; });
    document.querySelectorAll('[data-del-goal]').forEach(btn => { btn.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteGoal(parseInt(btn.dataset.delGoal)); render(); showToast('Hedef silindi', 'success'); } }; });
  }

  function openModal(existing) {
    const modal = document.getElementById('goal-modal');
    document.getElementById('goal-modal-title').textContent = existing ? '✏️ Hedef Düzenle' : '🎯 Yeni Hedef';
    document.getElementById('g-dept').value = existing?.department || depts[0];
    document.getElementById('g-title').value = existing?.title || '';
    document.getElementById('g-target').value = existing?.target || '';
    document.getElementById('g-current').value = existing?.current || '';
    document.getElementById('g-unit').value = existing?.unit || '%';
    document.getElementById('g-deadline').value = existing?.deadline || '';
    modal.classList.remove('hidden');
    document.getElementById('g-save').onclick = () => {
      const title = document.getElementById('g-title').value.trim();
      if (!title) { showToast('Başlık gereklidir', 'error'); return; }
      const data = { department: document.getElementById('g-dept').value, title, target: parseFloat(document.getElementById('g-target').value) || 0, current: parseFloat(document.getElementById('g-current').value) || 0, unit: document.getElementById('g-unit').value || '%', deadline: document.getElementById('g-deadline').value };
      if (existing) { updateGoal(existing.id, data); showToast('Hedef güncellendi', 'success'); }
      else { addGoal(data); showToast('Hedef eklendi', 'success'); }
      modal.classList.add('hidden'); render();
    };
  }

  document.getElementById('g-cancel').onclick = () => document.getElementById('goal-modal').classList.add('hidden');
  document.getElementById('goal-modal').onclick = (e) => { if (e.target.id === 'goal-modal') document.getElementById('goal-modal').classList.add('hidden'); };
  document.getElementById('add-goal-btn')?.addEventListener('click', () => openModal(null));
  document.getElementById('goals-dept').onchange = render;
  render();
}
