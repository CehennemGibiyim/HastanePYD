// ===== ISE ALIM PIPELINE =====
import { getCandidates, addCandidate, updateCandidate, deleteCandidate } from '../state-extensions.js';
import { hasPermission, getDepartments } from '../state.js';
import { showToast } from '../notifications.js';

const STAGES = [
  { id: 'application', label: '📩 Başvuru', color: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
  { id: 'interview', label: '🎤 Mülakat', color: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
  { id: 'offer', label: '📋 Teklif', color: 'bg-purple-500/15 border-purple-500/30 text-purple-300' },
  { id: 'hired', label: '✅ İşe Başladı', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  { id: 'rejected', label: '❌ Reddedildi', color: 'bg-red-500/15 border-red-500/30 text-red-300' },
];

export function renderRecruitmentPage(el) {
  const canWrite = hasPermission('write');
  const candidates = getCandidates();

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">📋 İşe Alım Pipeline</h1>
        <p class="text-slate-400 text-sm mt-1">${candidates.length} aday takip ediliyor</p>
      </div>
      ${canWrite ? '<button id="rec-add-btn" class="btn-primary">➕ Aday Ekle</button>' : ''}
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 fade-in">
      ${STAGES.map(s => {
        const count = candidates.filter(c => c.stage === s.id).length;
        return `<div class="rounded-xl ${s.color} border p-3 text-center">
          <p class="text-2xl font-bold">${count}</p>
          <p class="text-xs">${s.label}</p>
        </div>`;
      }).join('')}
    </div>
    <div id="rec-board" class="grid grid-cols-1 lg:grid-cols-5 gap-4 fade-in"></div>`;

  function renderBoard() {
    const all = getCandidates();
    const board = document.getElementById('rec-board');
    board.innerHTML = STAGES.map(stage => {
      const stageCandidates = all.filter(c => c.stage === stage.id);
      return `<div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold ${stage.color.split(' ').pop()}">${stage.label}</h4>
          <span class="text-xs text-slate-500">${stageCandidates.length}</span>
        </div>
        ${stageCandidates.map(c => `
          <div class="card hover:bg-white/10 transition cursor-pointer" data-cand-id="${c.id}">
            <h5 class="font-medium text-white text-sm mb-1">${c.name}</h5>
            <p class="text-xs text-slate-400 mb-2">${c.targetDepartment || ''} · ${c.targetTitle || ''}</p>
            <p class="text-xs text-slate-500 mb-2">${c.notes || ''}</p>
            <div class="flex items-center justify-between text-xs text-slate-600">
              <span>${c.phone || ''}</span>
              <span>${new Date(c.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            ${canWrite ? `<div class="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
              ${STAGES.filter(s => s.id !== c.stage).slice(0, 3).map(s => `
                <button data-move="${c.id}" data-to="${s.id}" class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition">${s.label.split(' ')[0]}</button>
              `).join('')}
            </div>` : ''}
          </div>
        `).join('')}
      </div>`;
    }).join('');

    document.querySelectorAll('[data-move]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        updateCandidate(parseInt(btn.dataset.move), { stage: btn.dataset.to });
        showToast('Aday güncellendi', 'success');
        renderBoard();
      };
    });
    document.querySelectorAll('[data-cand-id]').forEach(card => {
      card.onclick = () => {
        const c = all.find(x => x.id === parseInt(card.dataset.candId));
        if (c && canWrite) openCandidateModal(c, renderBoard);
      };
    });
  }

  renderBoard();
  document.getElementById('rec-add-btn')?.addEventListener('click', () => openCandidateModal(null, renderBoard));
}

function openCandidateModal(candidate, refresh) {
  const depts = getDepartments();
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">${candidate ? '✏️ Aday Düzenle' : '➕ Yeni Aday'}</h3>
      <div class="space-y-3">
        <div><label class="label">Ad Soyad</label><input id="cand-name" class="input-field w-full" value="${candidate?.name || ''}"></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Telefon</label><input id="cand-phone" class="input-field w-full" value="${candidate?.phone || ''}"></div>
          <div><label class="label">E-posta</label><input id="cand-email" class="input-field w-full" value="${candidate?.email || ''}"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Hedef Departman</label><select id="cand-dept" class="input-field w-full">${depts.map(d => `<option ${d === candidate?.targetDepartment ? 'selected' : ''}>${d}</option>`).join('')}</select></div>
          <div><label class="label">Hedef Unvan</label><input id="cand-title" class="input-field w-full" value="${candidate?.targetTitle || ''}"></div>
        </div>
        <div><label class="label">Notlar</label><textarea id="cand-notes" class="input-field w-full h-20 resize-none">${candidate?.notes || ''}</textarea></div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="cand-save" class="btn-primary flex-1">💾 Kaydet</button>
        ${candidate ? '<button id="cand-del" class="btn-secondary text-red-400">🗑️</button>' : ''}
        <button id="cand-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('cand-cancel').onclick = () => modal.remove();
  document.getElementById('cand-del')?.addEventListener('click', () => { deleteCandidate(candidate.id); modal.remove(); showToast('Aday silindi', 'success'); refresh(); });
  document.getElementById('cand-save').onclick = () => {
    const name = document.getElementById('cand-name').value.trim();
    if (!name) return showToast('İsim girin', 'error');
    const data = { name, phone: document.getElementById('cand-phone').value, email: document.getElementById('cand-email').value, targetDepartment: document.getElementById('cand-dept').value, targetTitle: document.getElementById('cand-title').value, notes: document.getElementById('cand-notes').value };
    if (candidate) { updateCandidate(candidate.id, data); showToast('Aday güncellendi', 'success'); }
    else { addCandidate(data); showToast('Aday eklendi', 'success'); }
    modal.remove(); refresh();
  };
}
