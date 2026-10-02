// ===== KIYAFET / UNİFORMA TAKİBİ =====

import { getPersonnel, getCurrentUser, hasPermission, updatePersonnel } from '../state.js';
import { showToast, addNotification } from '../notifications.js';

const UNIFORM_KEY = 'hospital_uniforms';

function loadData() {
  try { return JSON.parse(localStorage.getItem(UNIFORM_KEY)) || {}; } catch { return {}; }
}
function saveData(d) { localStorage.setItem(UNIFORM_KEY, JSON.stringify(d)); }

const UNIFORM_TYPES = [
  { key: 'scrub', label: 'Forma (Scrub)', icon: '👕', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { key: 'coat', label: 'Önlük/Labcoat', icon: '🥼', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { key: 'shoes', label: 'Çalışma Ayakkabısı', icon: '👟', sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] },
  { key: 'cap', label: 'Bone/Şapka', icon: '🧢', sizes: ['Standart'] },
  { key: 'vest', label: 'Yelek/Güvenlik', icon: '🦺', sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
];

export function renderUniformPage(el) {
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const uniforms = loadData();
  const canEdit = hasPermission('write');

  const stats = {
    total: personnel.length,
    complete: 0,
    missing: 0,
    sizes: {},
  };
  personnel.forEach(p => {
    const u = uniforms[p.id];
    if (u && Object.keys(u).length >= 2) stats.complete++;
    else stats.missing++;
  });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">👔 Kıyafet & Uniforma Takibi</h1>
      <p class="text-slate-400 text-sm mt-1">Personel beden, teslim ve iade yönetimi</p>
    </div>

    <!-- İstatistikler -->
    <div class="grid grid-cols-3 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-cyan-300">${stats.total}</p>
        <p class="text-xs text-cyan-400">Toplam Personel</p>
      </div>
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-green-300">${stats.complete}</p>
        <p class="text-xs text-green-400">Tam Donanımlı</p>
      </div>
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-red-300">${stats.missing}</p>
        <p class="text-xs text-red-400">Eksik</p>
      </div>
    </div>

    <!-- Departman Bazlı Dağılım -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Departman Bazlı Dağılım</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${getDeptUniformStats(personnel, uniforms).map(d => `
          <div class="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
            <p class="text-lg font-bold text-white">${d.complete}/${d.total}</p>
            <p class="text-xs text-slate-400">${d.dept}</p>
            <div class="mt-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full ${d.complete === d.total ? 'bg-green-400' : 'bg-amber-400'}" style="width:${d.total ? Math.round(d.complete / d.total * 100) : 0}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Personel Listesi -->
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">👥 Uniforma Kayıtları</h3>
        ${canEdit ? `<button id="bulk-uniform-btn" class="btn-secondary text-xs">📋 Toplu Giriş</button>` : ''}
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr>
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            ${UNIFORM_TYPES.map(u => `<th class="th text-center">${u.icon}</th>`).join('')}
            <th class="th">Durum</th>
            ${canEdit ? '<th class="th">İşlem</th>' : ''}
          </tr></thead>
          <tbody>
            ${personnel.map(p => {
              const u = uniforms[p.id] || {};
              const completeCount = UNIFORM_TYPES.filter(ut => u[ut.key]?.size).length;
              return `<tr class="border-t border-white/5 hover:bg-white/5">
                <td class="td">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-[10px] font-bold shrink-0">
                      ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-lg">` : (p.name[0] + p.surname[0])}
                    </div>
                    <span class="text-sm">${p.name} ${p.surname}</span>
                  </div>
                </td>
                <td class="td text-xs">${p.department}</td>
                ${UNIFORM_TYPES.map(ut => `<td class="td text-center text-xs">${u[ut.key]?.size || '<span class="text-red-400">-</span>'}</td>`).join('')}
                <td class="td">
                  ${completeCount >= 3 ? '<span class="badge bg-green-500/15 text-green-400">Tam</span>' :
                    completeCount > 0 ? '<span class="badge bg-amber-500/15 text-amber-400">Kısmi</span>' :
                    '<span class="badge bg-red-500/15 text-red-400">Eksik</span>'}
                </td>
                ${canEdit ? `<td class="td"><button data-edit-uniform="${p.id}" class="text-xs text-cyan-400 hover:text-cyan-300">✏️ Düzenle</button></td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  if (canEdit) {
    el.querySelectorAll('[data-edit-uniform]').forEach(btn => {
      btn.onclick = () => openUniformEditModal(parseInt(btn.dataset.editUniform), el);
    });
  }
}

function getDeptUniformStats(personnel, uniforms) {
  const depts = {};
  personnel.forEach(p => {
    if (!depts[p.department]) depts[p.department] = { dept: p.department, total: 0, complete: 0 };
    depts[p.department].total++;
    const u = uniforms[p.id];
    if (u && Object.keys(u).length >= 2) depts[p.department].complete++;
  });
  return Object.values(depts).sort((a, b) => b.total - a.total);
}

function openUniformEditModal(personId, el) {
  const person = getPersonnel().find(p => p.id === personId);
  if (!person) return;
  const uniforms = loadData();
  const current = uniforms[personId] || {};

  const existing = document.getElementById('uniform-edit-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'uniform-edit-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold text-white mb-4">👔 ${person.name} ${person.surname} - Uniforma</h3>
      <div class="space-y-3">
        ${UNIFORM_TYPES.map(ut => `
          <div class="rounded-xl bg-white/5 p-3">
            <p class="text-sm text-white mb-2">${ut.icon} ${ut.label}</p>
            <select id="uniform-${ut.key}" class="input-field w-full">
              <option value="">Beden Seçiniz</option>
              ${ut.sizes.map(s => `<option value="${s}" ${current[ut.key]?.size === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <div class="flex items-center gap-2 mt-2">
              <label class="flex items-center gap-1.5 text-xs text-slate-400">
                <input type="checkbox" id="uniform-${ut.key}-delivered" ${current[ut.key]?.delivered ? 'checked' : ''} class="rounded">
                Teslim edildi
              </label>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="flex gap-3 mt-5">
        <button id="uniform-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="uniform-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.onclick = (e) => { if (e.target.id === 'uniform-edit-modal') modal.remove(); };
  document.getElementById('uniform-cancel').onclick = () => modal.remove();
  document.getElementById('uniform-save').onclick = () => {
    const updated = {};
    UNIFORM_TYPES.forEach(ut => {
      const size = document.getElementById(`uniform-${ut.key}`).value;
      const delivered = document.getElementById(`uniform-${ut.key}-delivered`).checked;
      if (size) updated[ut.key] = { size, delivered, updatedAt: new Date().toISOString() };
    });
    uniforms[personId] = updated;
    saveData(uniforms);
    modal.remove();
    showToast('Uniforma bilgileri kaydedildi', 'success');
    renderUniformPage(el);
  };
}
