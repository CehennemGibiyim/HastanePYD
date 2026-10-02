// ===== SIKAYET & OLAY BILDIRIMI =====
import { getIncidents, addIncident, updateIncident, deleteIncident } from '../state-extensions.js';
import { hasPermission, getDepartments } from '../state.js';
import { showToast } from '../notifications.js';

export function renderIncidentsPage(el) {
  const canWrite = hasPermission('write');
  const incidents = getIncidents();
  const open = incidents.filter(i => i.status === 'open').length;
  const inProgress = incidents.filter(i => i.status === 'in_progress').length;
  const resolved = incidents.filter(i => i.status === 'resolved').length;

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">🏥 Şikayet & Olay Bildirimi</h1>
        <p class="text-slate-400 text-sm mt-1">${incidents.length} kayıt · ${open} açık · ${inProgress} işlemde</p>
      </div>
      ${canWrite ? '<button id="inc-add-btn" class="btn-primary">➕ Yeni Olay</button>' : ''}
    </div>
    <div class="grid grid-cols-3 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-red-300">${open}</p>
        <p class="text-xs text-red-400">Açık</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-amber-300">${inProgress}</p>
        <p class="text-xs text-amber-400">İşlemde</p>
      </div>
      <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-emerald-300">${resolved}</p>
        <p class="text-xs text-emerald-400">Çözüldü</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 mb-4 fade-in">
      <select id="inc-status-filter" class="input-field w-40">
        <option value="">Tüm Durumlar</option>
        <option value="open">Açık</option>
        <option value="in_progress">İşlemde</option>
        <option value="resolved">Çözüldü</option>
      </select>
      <select id="inc-severity-filter" class="input-field w-40">
        <option value="">Tüm Öncelikler</option>
        <option value="high">Yüksek</option>
        <option value="medium">Orta</option>
        <option value="low">Düşük</option>
      </select>
    </div>
    <div id="inc-list" class="space-y-3 fade-in"></div>`;

  function renderList() {
    const status = document.getElementById('inc-status-filter').value;
    const severity = document.getElementById('inc-severity-filter').value;
    let filtered = getIncidents({ status, severity });
    const container = document.getElementById('inc-list');

    if (!filtered.length) {
      container.innerHTML = '<div class="empty-state"><div class="icon">✅</div><div class="title">Olay kaydı yok</div></div>';
      return;
    }

    container.innerHTML = filtered.map(i => {
      const sevColors = { high: 'border-red-500/30 bg-red-500/5', medium: 'border-amber-500/30 bg-amber-500/5', low: 'border-blue-500/30 bg-blue-500/5' };
      const sevLabels = { high: '🔴 Yüksek', medium: '🟡 Orta', low: '🔵 Düşük' };
      const statusLabels = { open: 'Açık', in_progress: 'İşlemde', resolved: 'Çözüldü' };
      const statusColors = { open: 'bg-red-500/15 text-red-300', in_progress: 'bg-amber-500/15 text-amber-300', resolved: 'bg-emerald-500/15 text-emerald-300' };
      return `<div class="card ${sevColors[i.severity] || ''}">
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h4 class="font-semibold text-white">${i.title}</h4>
              <span class="badge ${statusColors[i.status] || ''}">${statusLabels[i.status] || i.status}</span>
            </div>
            <p class="text-sm text-slate-400 mb-2">${i.description}</p>
            <div class="flex flex-wrap gap-3 text-xs text-slate-500">
              <span>${sevLabels[i.severity] || i.severity}</span>
              <span>🏢 ${i.department || '—'}</span>
              <span>👤 ${i.reporter || '—'}</span>
              <span>📅 ${new Date(i.createdAt).toLocaleDateString('tr-TR')}</span>
              ${i.resolution ? '<span>✅ ' + i.resolution + '</span>' : ''}
            </div>
          </div>
          ${canWrite ? `<div class="flex gap-1">
            ${i.status !== 'resolved' ? `<button data-resolve="${i.id}" class="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-500/10" title="Çöz">✅</button>` : ''}
            <button data-del-inc="${i.id}" class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10" title="Sil">🗑️</button>
          </div>` : ''}
        </div>
      </div>`;
    }).join('');

    document.querySelectorAll('[data-resolve]').forEach(btn => {
      btn.onclick = () => { updateIncident(parseInt(btn.dataset.resolve), { status: 'resolved', resolution: 'Çözüldü' }); showToast('Olay çözüldü', 'success'); renderList(); };
    });
    document.querySelectorAll('[data-del-inc]').forEach(btn => {
      btn.onclick = () => { deleteIncident(parseInt(btn.dataset.delInc)); showToast('Olay silindi', 'success'); renderList(); };
    });
  }

  renderList();
  document.getElementById('inc-status-filter').onchange = renderList;
  document.getElementById('inc-severity-filter').onchange = renderList;
  document.getElementById('inc-add-btn')?.addEventListener('click', () => openIncidentModal(renderList));
}

function openIncidentModal(refresh) {
  const depts = getDepartments();
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">➕ Yeni Olay Bildirimi</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık</label><input id="inc-title" class="input-field w-full" placeholder="Olay başlığı"></div>
        <div><label class="label">Açıklama</label><textarea id="inc-desc" class="input-field w-full h-20 resize-none" placeholder="Detaylı açıklama..."></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Departman</label><select id="inc-dept" class="input-field w-full">${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
          <div><label class="label">Öncelik</label><select id="inc-sev" class="input-field w-full">
            <option value="low">Düşük</option><option value="medium" selected>Orta</option><option value="high">Yüksek</option>
          </select></div>
        </div>
        <div><label class="label">Raporlayan</label><input id="inc-reporter" class="input-field w-full" placeholder="İsim"></div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="inc-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="inc-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('inc-cancel').onclick = () => modal.remove();
  document.getElementById('inc-save').onclick = () => {
    const title = document.getElementById('inc-title').value.trim();
    if (!title) return showToast('Başlık girin', 'error');
    addIncident({ title, description: document.getElementById('inc-desc').value, department: document.getElementById('inc-dept').value, severity: document.getElementById('inc-sev').value, reporter: document.getElementById('inc-reporter').value });
    modal.remove(); showToast('Olay kaydedildi', 'success'); refresh();
  };
}
