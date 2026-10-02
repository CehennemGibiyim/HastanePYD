// ===== ZIMMET & EKIPMAN TAKIBI =====
import { getEquipment, addEquipment, updateEquipment, deleteEquipment, assignEquipment, returnEquipment } from '../state-extensions.js';
import { getPersonnel, getPersonnelById, hasPermission } from '../state.js';
import { showToast } from '../notifications.js';

export function renderEquipmentPage(el) {
  const canWrite = hasPermission('write');
  const equipment = getEquipment();
  const assigned = equipment.filter(e => e.status === 'assigned');
  const available = equipment.filter(e => e.status === 'available');
  const categories = [...new Set(equipment.map(e => e.category))];

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">📦 Zimmet & Ekipman Takibi</h1>
        <p class="text-slate-400 text-sm mt-1">${equipment.length} ekipman · ${assigned.length} zimmetli · ${available.length} müsait</p>
      </div>
      ${canWrite ? '<button id="eq-add-btn" class="btn-primary">➕ Ekipman Ekle</button>' : ''}
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-cyan-300">${equipment.length}</p>
        <p class="text-xs text-cyan-400">Toplam Ekipman</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-amber-300">${assigned.length}</p>
        <p class="text-xs text-amber-400">Zimmetli</p>
      </div>
      <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-emerald-300">${available.length}</p>
        <p class="text-xs text-emerald-400">Müsait</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-purple-300">${categories.length}</p>
        <p class="text-xs text-purple-400">Kategori</p>
      </div>
    </div>
    <div class="flex flex-wrap gap-2 mb-4 fade-in">
      <select id="eq-cat-filter" class="input-field w-48">
        <option value="">Tüm Kategoriler</option>
        ${categories.map(c => `<option>${c}</option>`).join('')}
      </select>
      <select id="eq-status-filter" class="input-field w-40">
        <option value="">Tüm Durumlar</option>
        <option value="assigned">Zimmetli</option>
        <option value="available">Müsait</option>
      </select>
    </div>
    <div class="card overflow-hidden fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">#</th>
            <th class="th">Ekipman</th>
            <th class="th">Kategori</th>
            <th class="th">Seri No</th>
            <th class="th">Durum</th>
            <th class="th">Zimmetli Kişi</th>
            <th class="th">Tarih</th>
            <th class="th">Kondisyon</th>
            ${canWrite ? '<th class="th">İşlem</th>' : ''}
          </tr></thead>
          <tbody id="eq-body"></tbody>
        </table>
      </div>
    </div>`;

  function renderRows() {
    const cat = document.getElementById('eq-cat-filter').value;
    const status = document.getElementById('eq-status-filter').value;
    let filtered = getEquipment();
    if (cat) filtered = filtered.filter(e => e.category === cat);
    if (status) filtered = filtered.filter(e => e.status === status);
    document.getElementById('eq-body').innerHTML = filtered.map((e, i) => {
      const person = e.assignedTo ? getPersonnelById(e.assignedTo) : null;
      const condColors = { good: 'text-emerald-400 bg-emerald-500/15', fair: 'text-amber-400 bg-amber-500/15', poor: 'text-red-400 bg-red-500/15' };
      const condLabels = { good: 'İyi', fair: 'Orta', poor: 'Kötü' };
      const statusBadge = e.status === 'assigned' ? '<span class="badge bg-amber-500/15 text-amber-300">Zimmetli</span>' : '<span class="badge bg-emerald-500/15 text-emerald-300">Müsait</span>';
      return `<tr class="border-b border-white/5 hover:bg-white/5">
        <td class="td text-slate-600 text-xs">${i + 1}</td>
        <td class="td font-medium text-white">${e.name}</td>
        <td class="td">${e.category}</td>
        <td class="td text-xs font-mono text-slate-400">${e.serial}</td>
        <td class="td">${statusBadge}</td>
        <td class="td">${person ? person.name + ' ' + person.surname : '<span class="text-slate-600">—</span>'}</td>
        <td class="td text-xs text-slate-400">${e.assignedDate || '—'}</td>
        <td class="td"><span class="inline-block px-2 py-0.5 rounded-full text-xs ${condColors[e.condition] || ''}">${condLabels[e.condition] || e.condition}</span></td>
        ${canWrite ? `<td class="td">
          ${e.status === 'assigned' ? `<button data-return="${e.id}" class="text-xs text-amber-400 hover:text-amber-300 px-2 py-1 rounded hover:bg-amber-500/10" title="İade Al">📥</button>` : `<button data-assign="${e.id}" class="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/10" title="Zimmetle">📤</button>`}
          <button data-del-eq="${e.id}" class="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10" title="Sil">🗑️</button>
        </td>` : ''}
      </tr>`;
    }).join('');

    document.querySelectorAll('[data-return]').forEach(btn => {
      btn.onclick = () => { returnEquipment(parseInt(btn.dataset.return)); showToast('Ekipman iade alındı', 'success'); renderRows(); };
    });
    document.querySelectorAll('[data-assign]').forEach(btn => {
      btn.onclick = () => openAssignModal(parseInt(btn.dataset.assign), renderRows);
    });
    document.querySelectorAll('[data-del-eq]').forEach(btn => {
      btn.onclick = () => { deleteEquipment(parseInt(btn.dataset.delEq)); showToast('Ekipman silindi', 'success'); renderRows(); };
    });
  }

  renderRows();
  document.getElementById('eq-cat-filter').onchange = renderRows;
  document.getElementById('eq-status-filter').onchange = renderRows;
  document.getElementById('eq-add-btn')?.addEventListener('click', () => openAddModal(renderRows));
}

function openAssignModal(eqId, refresh) {
  const personnel = getPersonnel({ status: 'active' });
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">📤 Zimmetle</h3>
      <select id="assign-person" class="input-field w-full">
        <option value="">Personel seçin...</option>
        ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}
      </select>
      <div class="flex gap-3 mt-4">
        <button id="assign-save" class="btn-primary flex-1">✅ Zimmetle</button>
        <button id="assign-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('assign-cancel').onclick = () => modal.remove();
  document.getElementById('assign-save').onclick = () => {
    const pid = parseInt(document.getElementById('assign-person').value);
    if (!pid) return showToast('Personel seçin', 'error');
    assignEquipment(eqId, pid);
    modal.remove();
    showToast('Zimmetlendi', 'success');
    refresh();
  };
}

function openAddModal(refresh) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">➕ Yeni Ekipman</h3>
      <div class="space-y-3">
        <div><label class="label">Ekipman Adı</label><input id="eq-name" class="input-field w-full" placeholder="Örn: Dell Laptop"></div>
        <div><label class="label">Kategori</label><select id="eq-category" class="input-field w-full">
          <option>Bilgisayar</option><option>Telefon</option><option>Medikal</option><option>Telsiz</option><option>Yazici</option><option>Uniforma</option><option>Guvenlik</option><option>Arac</option><option>Diger</option>
        </select></div>
        <div><label class="label">Seri No</label><input id="eq-serial" class="input-field w-full" placeholder="Seri numarası"></div>
        <div><label class="label">Kondisyon</label><select id="eq-condition" class="input-field w-full">
          <option value="good">İyi</option><option value="fair">Orta</option><option value="poor">Kötü</option>
        </select></div>
      </div>
      <div class="flex gap-3 mt-4">
        <button id="eq-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="eq-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('eq-cancel').onclick = () => modal.remove();
  document.getElementById('eq-save').onclick = () => {
    const name = document.getElementById('eq-name').value.trim();
    if (!name) return showToast('Ekipman adı girin', 'error');
    addEquipment({ name, category: document.getElementById('eq-category').value, serial: document.getElementById('eq-serial').value, status: 'available', assignedTo: null, condition: document.getElementById('eq-condition').value });
    modal.remove();
    showToast('Ekipman eklendi', 'success');
    refresh();
  };
}
