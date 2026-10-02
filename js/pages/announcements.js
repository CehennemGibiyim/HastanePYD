// ===== DUYURU PANOSU =====
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement } from '../state-extensions.js';
import { getCurrentUser, getDepartments } from '../state.js';
import { showToast } from '../notifications.js';

export function renderAnnouncementsPage(el) {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const depts = ['Genel', ...getDepartments()];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📝 Duyuru Panosu</h1>
          <p class="text-slate-400 text-sm mt-1">Hastane geneli duyuru ve bilgilendirmeler</p>
        </div>
        ${isAdmin ? '<button id="add-ann-btn" class="btn-primary text-sm">+ Duyuru Ekle</button>' : ''}
      </div>
    </div>
    <div id="ann-list" class="fade-in"></div>
    <div id="ann-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 id="ann-modal-title" class="text-xl font-bold text-white mb-4">📝 Duyuru Ekle</h3>
        <div class="space-y-3">
          <div><label class="label">Başlık</label><input id="ann-title" class="input-field w-full" placeholder="Duyuru başlığı"></div>
          <div><label class="label">İçerik</label><textarea id="ann-content" class="input-field w-full" rows="4" placeholder="Duyuru içeriği..."></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Departman</label><select id="ann-dept" class="input-field w-full">${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
            <div><label class="label">Öncelik</label><select id="ann-priority" class="input-field w-full"><option value="low">Düşük</option><option value="medium" selected>Orta</option><option value="high">Yüksek</option></select></div>
          </div>
          <div class="flex items-center gap-2"><input type="checkbox" id="ann-pinned" class="w-4 h-4"><label for="ann-pinned" class="text-sm text-slate-300">Sabitlenmiş duyuru</label></div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="ann-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="ann-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;

  function render() {
    const list = getAnnouncements();
    const container = document.getElementById('ann-list');
    if (!list.length) { container.innerHTML = '<div class="empty-state"><div class="icon">📝</div><div class="title">Duyuru bulunamadı</div></div>'; return; }
    const pinned = list.filter(a => a.pinned);
    const normal = list.filter(a => !a.pinned);
    const priorityColors = { high: 'border-red-500/30 bg-red-500/5', medium: 'border-amber-500/20 bg-amber-500/5', low: 'border-white/10' };
    const priorityBadges = { high: 'bg-red-500/20 text-red-300', medium: 'bg-amber-500/20 text-amber-300', low: 'bg-slate-500/20 text-slate-400' };
    const priorityLabels = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' };

    const card = (a) => `
      <div class="card border ${priorityColors[a.priority] || ''} mb-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              ${a.pinned ? '<span class="text-xs">📌</span>' : ''}
              <h3 class="text-base font-semibold text-white">${a.title}</h3>
              <span class="badge text-[10px] ${priorityBadges[a.priority] || ''}">${priorityLabels[a.priority] || a.priority}</span>
            </div>
            <p class="text-sm text-slate-300 whitespace-pre-wrap">${a.content}</p>
            <div class="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
              <span>🏢 ${a.department}</span>
              <span>👤 ${a.author || 'Sistem'}</span>
              <span>📅 ${new Date(a.createdAt).toLocaleDateString('tr-TR')}</span>
              <span>👁️ ${a.views || 0}</span>
            </div>
          </div>
          ${isAdmin ? `<div class="flex gap-1 shrink-0">
            <button data-edit-ann="${a.id}" class="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-cyan-300 transition text-sm">✏️</button>
            <button data-del-ann="${a.id}" class="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition text-sm">🗑️</button>
          </div>` : ''}
        </div>
      </div>`;

    container.innerHTML = `
      ${pinned.length ? '<h3 class="text-sm font-semibold text-amber-400 mb-3">📌 Sabitlenmiş Duyurular</h3>' + pinned.map(card).join('') : ''}
      ${normal.length ? '<h3 class="text-sm font-semibold text-slate-400 mb-3 mt-4">📋 Tüm Duyurular</h3>' + normal.map(card).join('') : ''}`;

    document.querySelectorAll('[data-edit-ann]').forEach(btn => {
      btn.onclick = () => { const a = list.find(x => x.id === parseInt(btn.dataset.editAnn)); if (a) openModal(a); };
    });
    document.querySelectorAll('[data-del-ann]').forEach(btn => {
      btn.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteAnnouncement(parseInt(btn.dataset.delAnn)); render(); showToast('Duyuru silindi', 'success'); } };
    });
  }

  function openModal(existing) {
    const modal = document.getElementById('ann-modal');
    document.getElementById('ann-modal-title').textContent = existing ? '✏️ Duyuru Düzenle' : '📝 Yeni Duyuru';
    document.getElementById('ann-title').value = existing?.title || '';
    document.getElementById('ann-content').value = existing?.content || '';
    document.getElementById('ann-dept').value = existing?.department || 'Genel';
    document.getElementById('ann-priority').value = existing?.priority || 'medium';
    document.getElementById('ann-pinned').checked = !!existing?.pinned;
    modal.classList.remove('hidden');
    document.getElementById('ann-save').onclick = () => {
      const title = document.getElementById('ann-title').value.trim();
      const content = document.getElementById('ann-content').value.trim();
      if (!title) { showToast('Başlık gereklidir', 'error'); return; }
      const data = { title, content, department: document.getElementById('ann-dept').value, priority: document.getElementById('ann-priority').value, pinned: document.getElementById('ann-pinned').checked, author: user?.name || 'Sistem' };
      if (existing) { updateAnnouncement(existing.id, data); showToast('Duyuru güncellendi', 'success'); }
      else { addAnnouncement(data); showToast('Duyuru eklendi', 'success'); }
      modal.classList.add('hidden'); render();
    };
  }

  document.getElementById('ann-cancel').onclick = () => document.getElementById('ann-modal').classList.add('hidden');
  document.getElementById('ann-modal').onclick = (e) => { if (e.target.id === 'ann-modal') document.getElementById('ann-modal').classList.add('hidden'); };
  document.getElementById('add-ann-btn')?.addEventListener('click', () => openModal(null));
  render();
}
