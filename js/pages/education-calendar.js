// ===== EGITIM TAKVIMI =====
import { getEducationEvents, addEducationEvent, updateEducationEvent, deleteEducationEvent } from '../state-extensions.js';
import { getDepartments, getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

export function renderEducationCalendarPage(el) {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const depts = ['Genel', ...getDepartments()];
  const now = new Date();
  let viewYear = now.getFullYear(), viewMonth = now.getMonth();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📋 Eğitim Takvimi</h1>
          <p class="text-slate-400 text-sm mt-1">Eğitim planlama ve katılımcı yönetimi</p>
        </div>
        <div class="flex gap-2">
          <div class="flex items-center gap-2">
            <button id="ed-prev" class="btn-secondary text-sm px-3">◀</button>
            <span id="ed-month-label" class="text-sm font-medium text-white min-w-[140px] text-center"></span>
            <button id="ed-next" class="btn-secondary text-sm px-3">▶</button>
          </div>
          ${isAdmin ? '<button id="add-ed-btn" class="btn-primary text-sm">+ Eğitim Ekle</button>' : ''}
        </div>
      </div>
    </div>
    <div id="ed-list" class="fade-in"></div>
    <div id="ed-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 id="ed-modal-title" class="text-xl font-bold text-white mb-4">📋 Eğitim Ekle</h3>
        <div class="space-y-3">
          <div><label class="label">Başlık</label><input id="ed-title" class="input-field w-full" placeholder="Eğitim başlığı"></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Tarih</label><input id="ed-date" type="date" class="input-field w-full"></div>
            <div><label class="label">Saat</label><input id="ed-time" type="time" class="input-field w-full" value="09:00"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Süre (saat)</label><input id="ed-duration" type="number" class="input-field w-full" value="2" min="1" max="8"></div>
            <div><label class="label">Maks Katılımcı</label><input id="ed-max" type="number" class="input-field w-full" value="30" min="1"></div>
          </div>
          <div><label class="label">Eğitmen</label><input id="ed-trainer" class="input-field w-full" placeholder="Eğitmen adı"></div>
          <div><label class="label">Departman</label><select id="ed-dept" class="input-field w-full">${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
          <div><label class="label">Yer</label><input id="ed-location" class="input-field w-full" placeholder="Konferans Salonu"></div>
        </div>
        <div class="flex gap-3 mt-6"><button id="ed-save" class="btn-primary flex-1">💾 Kaydet</button><button id="ed-cancel" class="btn-secondary flex-1">İptal</button></div>
      </div>
    </div>`;

  function render() {
    const monthStr = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
    document.getElementById('ed-month-label').textContent = new Date(viewYear, viewMonth).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
    const list = getEducationEvents({ month: monthStr });
    const container = document.getElementById('ed-list');
    if (!list.length) { container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><div class="title">Bu ay eğitim planlanmamış</div></div>'; return; }
    const today = now.toISOString().split('T')[0];
    container.innerHTML = `<div class="space-y-3">${list.map(e => {
      const isPast = e.date < today;
      const isToday = e.date === today;
      const pCount = (e.participants || []).length;
      const fillPct = e.maxParticipants ? Math.round(pCount / e.maxParticipants * 100) : 0;
      return `<div class="card border ${isToday ? 'border-cyan-500/30 bg-cyan-500/5' : isPast ? 'border-white/5 opacity-60' : 'border-white/10'}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              ${isToday ? '<span class="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Bugün</span>' : isPast ? '<span class="text-xs bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full">Geçmiş</span>' : ''}
              <h3 class="text-base font-semibold text-white">${e.title}</h3>
            </div>
            <div class="flex flex-wrap gap-3 text-xs text-slate-400 mt-2">
              <span>📅 ${e.date}</span><span>⏰ ${e.time || '09:00'}</span><span>⏱️ ${e.duration}s</span><span>👤 ${e.trainer || '-'}</span><span>🏢 ${e.department}</span><span>📍 ${e.location || '-'}</span>
            </div>
            <div class="mt-2">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-slate-400">Katılımcı: ${pCount}/${e.maxParticipants || '∞'}</span>
                <span class="text-slate-500">%${fillPct}</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style="width:${fillPct}%"></div></div>
            </div>
          </div>
          ${isAdmin ? `<div class="flex gap-1 shrink-0">
            <button data-edit-ed="${e.id}" class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-300 text-sm">✏️</button>
            <button data-del-ed="${e.id}" class="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400 text-sm">🗑️</button>
          </div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
    document.querySelectorAll('[data-edit-ed]').forEach(btn => { btn.onclick = () => { const e = list.find(x => x.id === parseInt(btn.dataset.editEd)); if (e) openModal(e); }; });
    document.querySelectorAll('[data-del-ed]').forEach(btn => { btn.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteEducationEvent(parseInt(btn.dataset.delEd)); render(); showToast('Eğitim silindi', 'success'); } }; });
  }

  function openModal(existing) {
    const modal = document.getElementById('ed-modal');
    document.getElementById('ed-modal-title').textContent = existing ? '✏️ Eğitim Düzenle' : '📋 Yeni Eğitim';
    document.getElementById('ed-title').value = existing?.title || '';
    document.getElementById('ed-date').value = existing?.date || '';
    document.getElementById('ed-time').value = existing?.time || '09:00';
    document.getElementById('ed-duration').value = existing?.duration || 2;
    document.getElementById('ed-max').value = existing?.maxParticipants || 30;
    document.getElementById('ed-trainer').value = existing?.trainer || '';
    document.getElementById('ed-dept').value = existing?.department || 'Genel';
    document.getElementById('ed-location').value = existing?.location || '';
    modal.classList.remove('hidden');
    document.getElementById('ed-save').onclick = () => {
      const title = document.getElementById('ed-title').value.trim();
      if (!title) { showToast('Başlık gereklidir', 'error'); return; }
      const data = { title, date: document.getElementById('ed-date').value, time: document.getElementById('ed-time').value, duration: parseInt(document.getElementById('ed-duration').value) || 2, maxParticipants: parseInt(document.getElementById('ed-max').value) || 30, trainer: document.getElementById('ed-trainer').value, department: document.getElementById('ed-dept').value, location: document.getElementById('ed-location').value, participants: existing?.participants || [] };
      if (existing) { updateEducationEvent(existing.id, data); showToast('Eğitim güncellendi', 'success'); }
      else { addEducationEvent(data); showToast('Eğitim eklendi', 'success'); }
      modal.classList.add('hidden'); render();
    };
  }

  document.getElementById('ed-cancel').onclick = () => document.getElementById('ed-modal').classList.add('hidden');
  document.getElementById('ed-modal').onclick = (e) => { if (e.target.id === 'ed-modal') document.getElementById('ed-modal').classList.add('hidden'); };
  document.getElementById('add-ed-btn')?.addEventListener('click', () => openModal(null));
  document.getElementById('ed-prev').onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render(); };
  document.getElementById('ed-next').onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render(); };
  render();
}
