// ===== SOZLESME & BELGE TAKIBI =====
import { getContracts, addContract, updateContract, deleteContract, getExpiringContracts } from '../state-extensions.js';
import { getPersonnel, getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

export function renderContractsPage(el) {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const allPersonnel = getPersonnel({ status: 'active' });
  const expiring = getExpiringContracts(60);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📋 Sözleşme & Belge Takibi</h1>
          <p class="text-slate-400 text-sm mt-1">Personel sözleşme ve belge yönetimi</p>
        </div>
        ${isAdmin ? '<button id="add-contract-btn" class="btn-primary text-sm">+ Sözleşme Ekle</button>' : ''}
      </div>
    </div>
    ${expiring.length ? `<div class="card mb-6 border border-amber-500/30 bg-amber-500/5 fade-in">
      <h3 class="text-base font-semibold text-amber-300 mb-3">⚠️ Süresi Dolacak Sözleşmeler (${expiring.length})</h3>
      <div class="space-y-2">${expiring.map(c => `
        <div class="flex items-center justify-between rounded-lg bg-white/5 p-3">
          <div><p class="text-sm font-medium text-white">${c.personnelName}</p><p class="text-xs text-slate-400">${c.type} · Bitiş: ${c.endDate}</p></div>
          <span class="badge ${c.daysUntilExpiry <= 7 ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'}">${c.daysUntilExpiry} gün</span>
        </div>`).join('')}
      </div>
    </div>` : ''}
    <div id="contracts-list" class="fade-in"></div>
    <div id="contract-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 id="contract-modal-title" class="text-xl font-bold text-white mb-4">📋 Sözleşme Ekle</h3>
        <div class="space-y-3">
          <div><label class="label">Personel</label><select id="c-person" class="input-field w-full"><option value="">Seçiniz</option>${allPersonnel.map(p => '<option value="' + p.id + '">' + p.name + ' ' + p.surname + ' - ' + p.department + '</option>').join('')}</select></div>
          <div><label class="label">Tür</label><select id="c-type" class="input-field w-full"><option>Sabit Süreli</option><option>Belirsiz Süreli</option><option>Stajyer</option><option>Taşeron</option></select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Başlangıç</label><input id="c-start" type="date" class="input-field w-full"></div>
            <div><label class="label">Bitiş</label><input id="c-end" type="date" class="input-field w-full"></div>
          </div>
          <div><label class="label">Notlar</label><textarea id="c-notes" class="input-field w-full" rows="2" placeholder="Ek bilgi..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-6"><button id="c-save" class="btn-primary flex-1">💾 Kaydet</button><button id="c-cancel" class="btn-secondary flex-1">İptal</button></div>
      </div>
    </div>`;

  function render() {
    const list = getContracts();
    const container = document.getElementById('contracts-list');
    if (!list.length) { container.innerHTML = '<div class="empty-state"><div class="icon">📋</div><div class="title">Sözleşme bulunamadı</div></div>'; return; }
    const statusColors = { active: 'bg-green-500/20 text-green-300', expired: 'bg-red-500/20 text-red-300', unlimited: 'bg-blue-500/20 text-blue-300' };
    container.innerHTML = `<div class="card overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm">
      <thead><tr class="border-b border-white/10 bg-white/5"><th class="th">Personel</th><th class="th">Tür</th><th class="th">Başlangıç</th><th class="th">Bitiş</th><th class="th">Durum</th>${isAdmin ? '<th class="th">İşlem</th>' : ''}</tr></thead>
      <tbody>${list.map(c => {
        const p = allPersonnel.find(x => x.id === c.personnelId);
        const isExpired = c.endDate && new Date(c.endDate) < new Date();
        const status = !c.endDate ? 'unlimited' : isExpired ? 'expired' : 'active';
        const statusLabel = !c.endDate ? 'Süresiz' : isExpired ? 'Süresi Dolmuş' : 'Aktif';
        return `<tr class="border-b border-white/5 hover:bg-white/5">
          <td class="td font-medium text-white">${p ? p.name + ' ' + p.surname : 'Bilinmiyor'}</td>
          <td class="td">${c.type}</td>
          <td class="td">${c.startDate || '-'}</td>
          <td class="td">${c.endDate || 'Süresiz'}</td>
          <td class="td"><span class="badge text-[10px] ${statusColors[status]}">${statusLabel}</span></td>
          ${isAdmin ? `<td class="td"><div class="flex gap-1">
            <button data-edit-c="${c.id}" class="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded hover:bg-cyan-500/10">✏️</button>
            <button data-del-c="${c.id}" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10">🗑️</button>
          </div></td>` : ''}
        </tr>`;
      }).join('')}</tbody></table></div></div>`;
    document.querySelectorAll('[data-edit-c]').forEach(btn => { btn.onclick = () => { const c = list.find(x => x.id === parseInt(btn.dataset.editC)); if (c) openModal(c); }; });
    document.querySelectorAll('[data-del-c]').forEach(btn => { btn.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { deleteContract(parseInt(btn.dataset.delC)); render(); showToast('Sözleşme silindi', 'success'); } }; });
  }

  function openModal(existing) {
    const modal = document.getElementById('contract-modal');
    document.getElementById('contract-modal-title').textContent = existing ? '✏️ Sözleşme Düzenle' : '📋 Yeni Sözleşme';
    document.getElementById('c-person').value = existing?.personnelId || '';
    document.getElementById('c-type').value = existing?.type || 'Sabit Süreli';
    document.getElementById('c-start').value = existing?.startDate || '';
    document.getElementById('c-end').value = existing?.endDate || '';
    document.getElementById('c-notes').value = existing?.notes || '';
    modal.classList.remove('hidden');
    document.getElementById('c-save').onclick = () => {
      const pid = parseInt(document.getElementById('c-person').value);
      if (!pid) { showToast('Personel seçimi gereklidir', 'error'); return; }
      const data = { personnelId: pid, type: document.getElementById('c-type').value, startDate: document.getElementById('c-start').value, endDate: document.getElementById('c-end').value || null, notes: document.getElementById('c-notes').value };
      if (existing) { updateContract(existing.id, data); showToast('Sözleşme güncellendi', 'success'); }
      else { addContract(data); showToast('Sözleşme eklendi', 'success'); }
      modal.classList.add('hidden'); render();
    };
  }

  document.getElementById('c-cancel').onclick = () => document.getElementById('contract-modal').classList.add('hidden');
  document.getElementById('contract-modal').onclick = (e) => { if (e.target.id === 'contract-modal') document.getElementById('contract-modal').classList.add('hidden'); };
  document.getElementById('add-contract-btn')?.addEventListener('click', () => openModal(null));
  render();
}
