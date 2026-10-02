// ===== GELISMIS FILTRE & RAPOR MOTORU =====
import { getPersonnel, DEPARTMENTS, PERSONNEL_TYPES } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_filter_presets';

function getPresets() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function savePresets(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

export function renderAdvancedFilterPage(el) {
  const personnel = getPersonnel({});
  const presets = getPresets();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔍 Gelişmiş Filtre & Rapor Motoru</h1>
      <p class="text-slate-400 text-sm mt-1">Birden fazla filtre birleştir, sonuçları kaydet ve dışa aktar</p>
    </div>

    <!-- Filtre Paneli -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🔧 Filtre Oluştur</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="label">Departman</label>
          <select id="af-dept" class="input-field w-full">
            <option value="">Tüm Departmanlar</option>
            ${DEPARTMENTS.map(d => `<option value="${d}">${d}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="label">Personel Türü</label>
          <select id="af-type" class="input-field w-full">
            <option value="">Tüm Türler</option>
            ${PERSONNEL_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="label">Durum</label>
          <select id="af-status" class="input-field w-full">
            <option value="">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="label">Ad Soyad Ara</label>
          <input id="af-name" class="input-field w-full" placeholder="İsim ile ara...">
        </div>
        <div>
          <label class="label">Yaş Aralığı</label>
          <div class="flex gap-2">
            <input id="af-age-min" type="number" class="input-field w-full" placeholder="Min" min="18" max="70">
            <input id="af-age-max" type="number" class="input-field w-full" placeholder="Max" min="18" max="70">
          </div>
        </div>
        <div>
          <label class="label">Kıdem (Yıl)</label>
          <div class="flex gap-2">
            <input id="af-seniority-min" type="number" class="input-field w-full" placeholder="Min" min="0">
            <input id="af-seniority-max" type="number" class="input-field w-full" placeholder="Max" min="0">
          </div>
        </div>
      </div>
      <div class="flex gap-3">
        <button id="af-apply" class="btn-primary">🔍 Filtrele</button>
        <button id="af-reset" class="btn-secondary">🔄 Sıfırla</button>
        <button id="af-save" class="btn-secondary">💾 Şablon Kaydet</button>
        <button id="af-export-csv" class="btn-secondary">📥 CSV İndir</button>
      </div>
    </div>

    <!-- Kayıtlı Şablonlar -->
    ${presets.length > 0 ? `
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">💾 Kayıtlı Şablonlar</h3>
      <div class="flex flex-wrap gap-2">
        ${presets.map((p, i) => `
          <button class="preset-btn text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition" data-idx="${i}">${p.name}</button>
        `).join('')}
      </div>
    </div>` : ''}

    <!-- Sonuçlar -->
    <div class="card fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-white">📊 Sonuçlar</h3>
        <span id="af-count" class="badge">${personnel.length} kayıt</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr>
              <th class="th cursor-pointer" data-sort="name">👤 Ad Soyad ▲▼</th>
              <th class="th cursor-pointer" data-sort="department">🏢 Departman ▲▼</th>
              <th class="th cursor-pointer" data-sort="type">👷 Tür ▲▼</th>
              <th class="th">📱 Telefon</th>
              <th class="th cursor-pointer" data-sort="status">📋 Durum ▲▼</th>
            </tr>
          </thead>
          <tbody id="af-results">
            ${resultRows(personnel)}
          </tbody>
        </table>
      </div>
    </div>`;

  let currentResults = [...personnel];
  let sortField = 'name';
  let sortDir = 'asc';

  const applyFilters = () => {
    const dept = el.querySelector('#af-dept').value;
    const type = el.querySelector('#af-type').value;
    const status = el.querySelector('#af-status').value;
    const name = el.querySelector('#af-name').value.toLowerCase().trim();
    const ageMin = parseInt(el.querySelector('#af-age-min').value) || 0;
    const ageMax = parseInt(el.querySelector('#af-age-max').value) || 200;
    const senMin = parseInt(el.querySelector('#af-seniority-min').value) || 0;
    const senMax = parseInt(el.querySelector('#af-seniority-max').value) || 100;

    currentResults = personnel.filter(p => {
      if (dept && p.department !== dept) return false;
      if (type && p.type !== type) return false;
      if (status && p.status !== status) return false;
      if (name && !p.name.toLowerCase().includes(name)) return false;
      if (p.birthDate) {
        const age = Math.floor((Date.now() - new Date(p.birthDate)) / (365.25 * 24 * 3600 * 1000));
        if (age < ageMin || age > ageMax) return false;
      }
      if (p.startDate) {
        const sen = Math.floor((Date.now() - new Date(p.startDate)) / (365.25 * 24 * 3600 * 1000));
        if (sen < senMin || sen > senMax) return false;
      }
      return true;
    });

    el.querySelector('#af-results').innerHTML = resultRows(currentResults);
    el.querySelector('#af-count').textContent = `${currentResults.length} kayıt`;
  };

  el.querySelector('#af-apply')?.addEventListener('click', applyFilters);
  el.querySelector('#af-reset')?.addEventListener('click', () => {
    el.querySelectorAll('.input-field').forEach(input => { if (input.tagName === 'SELECT') input.selectedIndex = 0; else input.value = ''; });
    currentResults = [...personnel];
    el.querySelector('#af-results').innerHTML = resultRows(currentResults);
    el.querySelector('#af-count').textContent = `${currentResults.length} kayıt`;
  });

  el.querySelector('#af-save')?.addEventListener('click', () => {
    const name = prompt('Şablon adı:');
    if (!name) return;
    const presets = getPresets();
    presets.push({
      name,
      filters: {
        dept: el.querySelector('#af-dept').value,
        type: el.querySelector('#af-type').value,
        status: el.querySelector('#af-status').value,
        name: el.querySelector('#af-name').value,
      }
    });
    savePresets(presets);
    showToast('Şablon kaydedildi!', 'success');
    renderAdvancedFilterPage(el);
  });

  el.querySelector('#af-export-csv')?.addEventListener('click', () => {
    if (currentResults.length === 0) { showToast('Dışa aktarılacak veri yok', 'error'); return; }
    const csv = 'Ad Soyad,Departman,Tür,Telefon,Durum\n' + currentResults.map(p =>
      `"${p.name}","${p.department}","${p.type}","${p.phone || ''}","${p.status}"`
    ).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'filtre_sonuc.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV indirildi!', 'success');
  });

  // Sort
  el.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortField === field) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      else { sortField = field; sortDir = 'asc'; }
      currentResults.sort((a, b) => {
        const va = (a[field] || '').toLowerCase();
        const vb = (b[field] || '').toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
      el.querySelector('#af-results').innerHTML = resultRows(currentResults);
    });
  });

  // Preset load
  el.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = presets[parseInt(btn.dataset.idx)];
      if (preset?.filters) {
        el.querySelector('#af-dept').value = preset.filters.dept || '';
        el.querySelector('#af-type').value = preset.filters.type || '';
        el.querySelector('#af-status').value = preset.filters.status || '';
        el.querySelector('#af-name').value = preset.filters.name || '';
        applyFilters();
        showToast(`"${preset.name}" şablonu yüklendi`, 'success');
      }
    });
  });
}

function resultRows(data) {
  if (data.length === 0) return '<tr><td colspan="5" class="td text-center text-slate-500 py-8">Sonuç bulunamadı</td></tr>';
  return data.slice(0, 50).map(p => `
    <tr class="hover:bg-white/5 transition">
      <td class="td font-medium text-white">${p.name}</td>
      <td class="td">${p.department}</td>
      <td class="td"><span class="badge">${p.type}</span></td>
      <td class="td">${p.phone || '—'}</td>
      <td class="td"><span class="${p.status === 'active' ? 'text-green-400' : 'text-red-400'}">${p.status === 'active' ? '✅ Aktif' : '❌ Pasif'}</span></td>
    </tr>`).join('') + (data.length > 50 ? `<tr><td colspan="5" class="td text-center text-slate-500">... ve ${data.length - 50} kayıt daha</td></tr>` : '');
}
