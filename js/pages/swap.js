// ===== VARDİYA DEĞİŞ TAKASI (SWAP SYSTEM) =====

import { getSchedules, getPersonnel, addSchedule, deleteSchedule, checkDutyConflict, checkLeaveConflict, getPersonnelById, hasPermission, getCurrentUser, isDepartmentRestricted, getUserDepartment } from '../state.js';
import { showToast, addNotification } from '../notifications.js';

const SWAP_KEY = 'hospital_swap_requests';

function loadSwaps() {
  try { return JSON.parse(localStorage.getItem(SWAP_KEY)) || []; } catch { return []; }
}
function saveSwaps(swaps) { localStorage.setItem(SWAP_KEY, JSON.stringify(swaps)); }

export function renderSwapPage(el) {
  const user = getCurrentUser();
  const swaps = loadSwaps();
  const canApprove = user.role === 'admin' || user.role === 'supervisor';

  let filtered = [...swaps];
  if (isDepartmentRestricted()) {
    const dept = getUserDepartment();
    const deptPersonnel = getPersonnel().filter(p => p.department === dept).map(p => p.id);
    filtered = filtered.filter(s => deptPersonnel.includes(s.requesterId) || deptPersonnel.includes(s.targetId));
  }

  const pending = filtered.filter(s => s.status === 'pending');
  const approved = filtered.filter(s => s.status === 'approved');
  const rejected = filtered.filter(s => s.status === 'rejected');

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🔄 Vardiya Değiş Takası</h1>
          <p class="text-slate-400 text-sm mt-1">Nöbet/vardiya değişimi talepleri</p>
        </div>
        <button id="new-swap-btn" class="btn-primary">➕ Yeni Talep</button>
      </div>
    </div>

    <!-- İstatistikler -->
    <div class="grid grid-cols-3 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-amber-300">${pending.length}</p>
        <p class="text-xs text-amber-400">Beklemede</p>
      </div>
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-green-300">${approved.length}</p>
        <p class="text-xs text-green-400">Onaylı</p>
      </div>
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-red-300">${rejected.length}</p>
        <p class="text-xs text-red-400">Reddedilen</p>
      </div>
    </div>

    <!-- Talepler -->
    <div class="space-y-3 fade-in" id="swap-list">
      ${filtered.length === 0 ? `
        <div class="empty-state">
          <div class="icon">🔄</div>
          <div class="title">Henüz değiş talebi yok</div>
          <div class="desc">Yeni talep oluşturarak başlayın</div>
        </div>
      ` : filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(swap => renderSwapCard(swap, canApprove)).join('')}
    </div>`;

  document.getElementById('new-swap-btn').onclick = () => openNewSwapModal(el);
  
  // Wire approve/reject buttons
  el.querySelectorAll('[data-approve]').forEach(btn => {
    btn.onclick = () => handleSwapAction(btn.dataset.approve, 'approved', el);
  });
  el.querySelectorAll('[data-reject]').forEach(btn => {
    btn.onclick = () => handleSwapAction(btn.dataset.reject, 'rejected', el);
  });
}

function renderSwapCard(swap, canApprove) {
  const requester = getPersonnelById(swap.requesterId);
  const target = getPersonnelById(swap.targetId);
  const statusColors = { pending: 'amber', approved: 'green', rejected: 'red' };
  const statusLabels = { pending: 'Beklemede', approved: 'Onaylı', rejected: 'Reddedildi' };
  const c = statusColors[swap.status];

  return `
    <div class="card border-${c}-500/20">
      <div class="flex items-start gap-4">
        <div class="w-10 h-10 rounded-xl bg-${c}-500/20 flex items-center justify-center text-${c}-300 text-lg shrink-0">🔄</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="badge bg-${c}-500/15 text-${c}-400">${statusLabels[swap.status]}</span>
            <span class="text-xs text-slate-500">${new Date(swap.createdAt).toLocaleDateString('tr-TR')}</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="rounded-lg bg-white/5 p-3">
              <p class="text-xs text-slate-400 mb-1">👤 Talep Eden</p>
              <p class="text-sm text-white font-medium">${requester ? requester.name + ' ' + requester.surname : 'Bilinmiyor'}</p>
              <p class="text-xs text-slate-500">${swap.requesterDate} · ${swap.requesterShift}</p>
            </div>
            <div class="rounded-lg bg-white/5 p-3">
              <p class="text-xs text-slate-400 mb-1">🔄 Değişeceği Kişi</p>
              <p class="text-sm text-white font-medium">${target ? target.name + ' ' + target.surname : 'Bilinmiyor'}</p>
              <p class="text-xs text-slate-500">${swap.targetDate} · ${swap.targetShift}</p>
            </div>
          </div>
          ${swap.reason ? `<p class="text-xs text-slate-400 mt-2 italic">"${swap.reason}"</p>` : ''}
        </div>
        ${canApprove && swap.status === 'pending' ? `
          <div class="flex flex-col gap-2 shrink-0">
            <button data-approve="${swap.id}" class="btn-primary text-xs px-3 py-1.5">✓ Onayla</button>
            <button data-reject="${swap.id}" class="btn-secondary text-xs px-3 py-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10">✕ Reddet</button>
          </div>
        ` : ''}
      </div>
    </div>`;
}

function openNewSwapModal(el) {
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const existing = document.getElementById('swap-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'swap-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">🔄 Yeni Değiş Talebi</h3>
      <div class="space-y-3">
        <div>
          <label class="label">Talep Eden Personel</label>
          <select id="swap-requester" class="input-field w-full">
            <option value="">Seçiniz</option>
            ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Talep Tarihi</label>
            <input id="swap-req-date" type="date" class="input-field w-full">
          </div>
          <div>
            <label class="label">Vardiya</label>
            <select id="swap-req-shift" class="input-field w-full">
              <option value="morning">🌅 Sabah</option>
              <option value="evening">🌆 Akşam</option>
              <option value="night">🌙 Gece</option>
            </select>
          </div>
        </div>
        <div class="border-t border-white/10 pt-3">
          <label class="label">Değişeceği Personel</label>
          <select id="swap-target" class="input-field w-full">
            <option value="">Seçiniz</option>
            ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Hedef Tarih</label>
            <input id="swap-tgt-date" type="date" class="input-field w-full">
          </div>
          <div>
            <label class="label">Vardiya</label>
            <select id="swap-tgt-shift" class="input-field w-full">
              <option value="morning">🌅 Sabah</option>
              <option value="evening">🌆 Akşam</option>
              <option value="night">🌙 Gece</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label">Açıklama (opsiyonel)</label>
          <textarea id="swap-reason" class="input-field w-full" rows="2" placeholder="Değiş talebinin nedeni..."></textarea>
        </div>
        <div id="swap-error" class="hidden text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"></div>
      </div>
      <div class="flex gap-3 mt-5">
        <button id="swap-save" class="btn-primary flex-1">💾 Talep Oluştur</button>
        <button id="swap-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'swap-modal') modal.remove(); };
  document.getElementById('swap-cancel').onclick = () => modal.remove();
  document.getElementById('swap-save').onclick = () => {
    const requesterId = parseInt(document.getElementById('swap-requester').value);
    const targetId = parseInt(document.getElementById('swap-target').value);
    const reqDate = document.getElementById('swap-req-date').value;
    const tgtDate = document.getElementById('swap-tgt-date').value;
    const reqShift = document.getElementById('swap-req-shift').value;
    const tgtShift = document.getElementById('swap-tgt-shift').value;
    const reason = document.getElementById('swap-reason').value.trim();
    const errEl = document.getElementById('swap-error');

    if (!requesterId || !targetId) { errEl.textContent = 'Her iki personeli de seçin'; errEl.classList.remove('hidden'); return; }
    if (requesterId === targetId) { errEl.textContent = 'Aynı kişi ile değiş yapılamaz'; errEl.classList.remove('hidden'); return; }
    if (!reqDate || !tgtDate) { errEl.textContent = 'Her iki tarihi de girin'; errEl.classList.remove('hidden'); return; }

    // Check conflicts
    const reqConflict = checkDutyConflict(requesterId, reqDate);
    const tgtConflict = checkDutyConflict(targetId, tgtDate);
    if (!reqConflict.length) { errEl.textContent = 'Talep edenin o tarihte nöbeti yok'; errEl.classList.remove('hidden'); return; }
    if (!tgtConflict.length) { errEl.textContent = 'Hedef kişinin o tarihte nöbeti yok'; errEl.classList.remove('hidden'); return; }

    const reqLeave = checkLeaveConflict(requesterId, reqDate);
    const tgtLeave = checkLeaveConflict(targetId, tgtDate);
    if (reqLeave.length) { errEl.textContent = 'Talep eden o tarihte izinli'; errEl.classList.remove('hidden'); return; }
    if (tgtLeave.length) { errEl.textContent = 'Hedef kişi o tarihte izinli'; errEl.classList.remove('hidden'); return; }

    const swaps = loadSwaps();
    swaps.push({
      id: Date.now(),
      requesterId, targetId,
      requesterDate: reqDate, requesterShift: reqShift,
      targetDate: tgtDate, targetShift: tgtShift,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdBy: getCurrentUser().username,
    });
    saveSwaps(swaps);
    modal.remove();
    addNotification('Değiş Talebi', `${getPersonnelById(requesterId)?.name} → ${getPersonnelById(targetId)?.name} değiş talebi oluşturuldu`, 'info', '🔄');
    showToast('Değiş talebi oluşturuldu', 'success');
    renderSwapPage(el);
  };
}

function handleSwapAction(swapId, action, el) {
  const swaps = loadSwaps();
  const swap = swaps.find(s => s.id === parseInt(swapId));
  if (!swap) return;

  if (action === 'approved') {
    // Execute the swap: update schedule entries
    const reqSchedules = getSchedules({ personnelId: swap.requesterId, date: swap.requesterDate });
    const tgtSchedules = getSchedules({ personnelId: swap.targetId, date: swap.targetDate });

    // Swap personnel assignments
    reqSchedules.forEach(s => {
      const idx = s.id;
      deleteSchedule(idx);
    });
    tgtSchedules.forEach(s => {
      deleteSchedule(s.id);
    });

    // Re-create swapped
    reqSchedules.forEach(s => {
      addSchedule({ ...s, id: undefined, personnelId: swap.targetId, date: swap.targetDate, shift: swap.targetShift });
    });
    tgtSchedules.forEach(s => {
      addSchedule({ ...s, id: undefined, personnelId: swap.requesterId, date: swap.requesterDate, shift: swap.requesterShift });
    });

    const req = getPersonnelById(swap.requesterId);
    const tgt = getPersonnelById(swap.targetId);
    addNotification('Değiş Onaylandı', `${req?.name} ↔ ${tgt?.name} nöbet değişimi uygulandı`, 'success', '✅');
  } else {
    addNotification('Değiş Reddedildi', `Değiş talebi reddedildi`, 'warning', '❌');
  }

  swap.status = action;
  swap[action + 'At'] = new Date().toISOString();
  swap[action + 'By'] = getCurrentUser().username;
  saveSwaps(swaps);
  showToast(action === 'approved' ? 'Talep onaylandı ve uygulandı' : 'Talep reddedildi', action === 'approved' ? 'success' : 'warning');
  renderSwapPage(el);
}
