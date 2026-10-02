// ===== DEPARTMAN TRANSFER GECMISI =====
import { getTransfers, addTransfer, deleteTransfer } from '../state-extensions.js';
import { getPersonnel, getPersonnelById, hasPermission, getDepartments } from '../state.js';
import { showToast } from '../notifications.js';

export function renderTransfersPage(el) {
  const canWrite = hasPermission('write');
  const transfers = getTransfers();
  const depts = getDepartments();

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">🔄 Transfer Geçmişi</h1>
        <p class="text-slate-400 text-sm mt-1">${transfers.length} transfer kaydı</p>
      </div>
      ${canWrite ? '<button id="tr-add-btn" class="btn-primary">➕ Transfer Ekle</button>' : ''}
    </div>
    <div class="card overflow-hidden fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">#</th>
            <th class="th">Personel</th>
            <th class="th">Eski Departman</th>
            <th class="th">Yeni Departman</th>
            <th class="th">Eski Unvan</th>
            <th class="th">Yeni Unvan</th>
            <th class="th">Neden</th>
            <th class="th">Tarih</th>
            ${canWrite ? '<th class="th">İşlem</th>' : ''}
          </tr></thead>
          <tbody>
            ${transfers.length === 0 ? `<tr><td colspan="${canWrite ? 9 : 8}" class="td text-center text-slate-500 py-8">Transfer kaydı yok</td></tr>` : transfers.map((t, i) => {
              const p = getPersonnelById(t.personnelId);
              return `<tr class="border-b border-white/5 hover:bg-white/5">
                <td class="td text-slate-600 text-xs">${i + 1}</td>
                <td class="td font-medium text-white">${p ? p.name + ' ' + p.surname : 'Bilinmiyor'}</td>
                <td class="td text-slate-400">${t.oldDepartment || '—'}</td>
                <td class="td text-cyan-300">${t.newDepartment || '—'}</td>
                <td class="td text-slate-400">${t.oldTitle || '—'}</td>
                <td class="td text-emerald-300">${t.newTitle || '—'}</td>
                <td class="td text-xs">${t.reason || '—'}</td>
                <td class="td text-xs">${t.date || '—'}</td>
                ${canWrite ? `<td class="td"><button data-del-tr="${t.id}" class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">🗑️</button></td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  document.querySelectorAll('[data-del-tr]').forEach(btn => {
    btn.onclick = () => { deleteTransfer(parseInt(btn.dataset.delTr)); showToast('Transfer silindi', 'success'); renderTransfersPage(el); };
  });
  document.getElementById('tr-add-btn')?.addEventListener('click', () => {
    const personnel = getPersonnel({ status: 'active' });
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 class="text-lg font-bold text-white mb-4">➕ Yeni Transfer</h3>
        <div class="space-y-3">
          <div><label class="label">Personel</label><select id="tr-person" class="input-field w-full">
            <option value="">Seçin...</option>
            ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}
          </select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Yeni Departman</label><select id="tr-new-dept" class="input-field w-full">${depts.map(d => '<option>' + d + '</option>').join('')}</select></div>
            <div><label class="label">Yeni Unvan</label><input id="tr-new-title" class="input-field w-full" placeholder="Yeni unvan"></div>
          </div>
          <div><label class="label">Neden</label><input id="tr-reason" class="input-field w-full" placeholder="Transfer nedeni"></div>
          <div><label class="label">Tarih</label><input id="tr-date" type="date" class="input-field w-full" value="${new Date().toISOString().split('T')[0]}"></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="tr-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="tr-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('tr-cancel').onclick = () => modal.remove();
    document.getElementById('tr-save').onclick = () => {
      const pid = parseInt(document.getElementById('tr-person').value);
      if (!pid) return showToast('Personel seçin', 'error');
      const p = getPersonnelById(pid);
      addTransfer({ personnelId: pid, oldDepartment: p.department, newDepartment: document.getElementById('tr-new-dept').value, oldTitle: p.title, newTitle: document.getElementById('tr-new-title').value || p.title, reason: document.getElementById('tr-reason').value, date: document.getElementById('tr-date').value });
      modal.remove(); showToast('Transfer kaydedildi', 'success'); renderTransfersPage(el);
    };
  });
}
