// ===== İLETİŞİM REHBERİ - KAPSAMLI TELEFON REHBERİ =====

import { getPersonnel, PERSONNEL_TYPES, DEPARTMENTS } from '../state.js';

const ClipboardJS = window.ClipboardJS;

const TYPE_ICONS = {
  doctor: '👨‍⚕️', nurse: '👩‍⚕️', worker: '🧹', officer: '📋',
  security: '🛡️', technical: '🔧',
};

const TYPE_COLORS = {
  doctor: { bg: 'from-blue-500/30 to-blue-600/10', border: 'border-blue-500/20', badge: 'bg-blue-500/15 text-blue-300' },
  nurse:  { bg: 'from-cyan-500/30 to-cyan-600/10', border: 'border-cyan-500/20', badge: 'bg-cyan-500/15 text-cyan-300' },
  worker: { bg: 'from-green-500/30 to-green-600/10', border: 'border-green-500/20', badge: 'bg-green-500/15 text-green-300' },
  officer:{ bg: 'from-emerald-500/30 to-emerald-600/10', border: 'border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-300' },
  security:{ bg: 'from-amber-500/30 to-amber-600/10', border: 'border-amber-500/20', badge: 'bg-amber-500/15 text-amber-300' },
  technical:{ bg: 'from-purple-500/30 to-purple-600/10', border: 'border-purple-500/20', badge: 'bg-purple-500/15 text-purple-300' },
};

let viewMode = 'card'; // 'card' | 'table' | 'group'
let sortField = 'department';
let sortDir = 'asc';

export function renderContactsPage(el) {
  const all = getPersonnel({}).filter(p => p.status === 'active');
  const allDepts = [...new Set(all.map(p => p.department))].sort();
  const allTypes = [...new Set(all.map(p => p.type))];

  // Özet istatistikler
  const stats = {};
  allTypes.forEach(t => { stats[t] = all.filter(p => p.type === t).length; });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📞 Personel Telefon Rehberi</h1>
          <p class="text-slate-400 text-sm mt-1">${all.length} personelin tam iletişim bilgileri</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button id="export-csv-btn" class="btn-secondary text-xs">📄 CSV İndir</button>
          <button id="print-dir-btn" class="btn-secondary text-xs">🖨️ Yazdır</button>
        </div>
      </div>
    </div>

    <!-- Özet Kartları -->
    <div class="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6 fade-in">
      ${Object.entries(stats).map(([t, c]) => {
        const color = TYPE_COLORS[t];
        return `<div class="rounded-xl bg-gradient-to-br ${color?.bg || 'from-slate-500/20 to-slate-600/5'} border ${color?.border || 'border-slate-500/20'} p-3 text-center">
          <p class="text-xl font-bold text-white">${c}</p>
          <p class="text-[10px] text-slate-400 mt-0.5">${TYPE_ICONS[t] || '👤'} ${(PERSONNEL_TYPES[t]?.label || t)}</p>
        </div>`;
      }).join('')}
    </div>

    <!-- Arama & Filtreler -->
    <div class="card mb-4 fade-in">
      <div class="flex flex-wrap items-center gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <input type="text" id="c-search" class="input-field w-full pl-10" placeholder="İsim, departman, unvan veya telefon ara..." aria-label="Personel ara">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
        </div>
        <select id="c-dept" class="input-field min-w-[160px]" aria-label="Departman filtresi">
          <option value="">Tüm Departmanlar</option>
          ${allDepts.map(d => `<option value="${d}">${d} (${all.filter(p => p.department === d).length})</option>`).join('')}
        </select>
        <select id="c-type" class="input-field min-w-[140px]" aria-label="Tür filtresi">
          <option value="">Tüm Türler</option>
          ${Object.entries(PERSONNEL_TYPES).map(([k, v]) => `<option value="${k}">${TYPE_ICONS[k] || ''} ${v.label} (${stats[k] || 0})</option>`).join('')}
        </select>
        <select id="c-sort" class="input-field min-w-[140px]" aria-label="Sıralama">
          <option value="department">Departmana Göre</option>
          <option value="name">İsme Göre</option>
          <option value="type">Türe Göre</option>
          <option value="title">Ünvana Göre</option>
        </select>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-white/5">
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500"><span id="c-count" class="text-white font-medium">${all.length}</span> sonuç</span>
          <span class="text-slate-700">|</span>
          <span class="text-xs text-slate-500" id="c-worker-count">İşçi: ${all.filter(p => PERSONNEL_TYPES[p.type]?.category === 'worker').length}</span>
          <span class="text-slate-700">|</span>
          <span class="text-xs text-slate-500" id="c-officer-count">Memur: ${all.filter(p => PERSONNEL_TYPES[p.type]?.category === 'officer').length}</span>
        </div>
        <div class="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
          <button id="view-card" class="px-2.5 py-1 rounded-md text-xs ${viewMode === 'card' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}" title="Kart Görünümü">▦ Kart</button>
          <button id="view-table" class="px-2.5 py-1 rounded-md text-xs ${viewMode === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}" title="Tablo Görünümü">☰ Liste</button>
          <button id="view-group" class="px-2.5 py-1 rounded-md text-xs ${viewMode === 'group' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}" title="Gruplanmış Görünüm">📂 Grup</button>
        </div>
      </div>
    </div>

    <!-- Departman Hızlı Filtreleri -->
    <div class="flex flex-wrap gap-2 mb-5 fade-in">
      <button class="dept-chip tab-active text-xs" data-dept="">Tümü (${all.length})</button>
      ${allDepts.map(d => {
        const count = all.filter(p => p.department === d).length;
        return `<button class="dept-chip tab-inactive text-xs" data-dept="${d}">${d} (${count})</button>`;
      }).join('')}
    </div>

    <!-- İçerik Alanı -->
    <div id="c-content" class="fade-in"></div>`;

  // İlk render
  renderContent(all);

  // Görünüm değiştirme
  ['view-card', 'view-table', 'view-group'].forEach(id => {
    document.getElementById(id).onclick = () => {
      viewMode = id.split('-')[1];
      ['view-card', 'view-table', 'view-group'].forEach(v => {
        document.getElementById(v).className = `px-2.5 py-1 rounded-md text-xs ${v === id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-300'}`;
      });
      applyFilter(all, allDepts);
    };
  });

  // Sıralama değişimi
  document.getElementById('c-sort').onchange = (e) => {
    sortField = e.target.value;
    applyFilter(all, allDepts);
  };

  // Filtre fonksiyonu
  const applyFilterFn = () => applyFilter(all, allDepts);
  document.getElementById('c-search').oninput = applyFilterFn;
  document.getElementById('c-dept').onchange = () => {
    const val = document.getElementById('c-dept').value;
    document.querySelectorAll('.dept-chip').forEach(b => {
      b.className = `dept-chip text-xs ${b.dataset.dept === val || (!val && !b.dataset.dept) ? 'tab-active' : 'tab-inactive'}`;
    });
    applyFilterFn();
  };
  document.getElementById('c-type').onchange = applyFilterFn;

  // Departman chip tıklama
  document.querySelectorAll('.dept-chip').forEach(chip => {
    chip.onclick = () => {
      document.querySelectorAll('.dept-chip').forEach(b => b.className = 'dept-chip text-xs tab-inactive');
      chip.className = 'dept-chip text-xs tab-active';
      document.getElementById('c-dept').value = chip.dataset.dept;
      applyFilterFn();
    };
  });

  // CSV İndir
  document.getElementById('export-csv-btn').onclick = () => exportCSV(all);
  // Yazdır
  document.getElementById('print-dir-btn').onclick = () => printDirectory(all);
}

function applyFilter(all, allDepts) {
  const s = document.getElementById('c-search').value.toLowerCase();
  const dept = document.getElementById('c-dept').value;
  const type = document.getElementById('c-type').value;
  let filtered = [...all];

  if (s) filtered = filtered.filter(p =>
    `${p.name} ${p.surname}`.toLowerCase().includes(s) ||
    p.department.toLowerCase().includes(s) ||
    p.title.toLowerCase().includes(s) ||
    p.phone.includes(s) ||
    p.tc.includes(s)
  );
  if (dept) filtered = filtered.filter(p => p.department === dept);
  if (type) filtered = filtered.filter(p => p.type === type);

  // Sıralama
  filtered.sort((a, b) => {
    let va, vb;
    switch (sortField) {
      case 'name': va = `${a.name} ${a.surname}`; vb = `${b.name} ${b.surname}`; break;
      case 'type': va = a.type; vb = b.type; break;
      case 'title': va = a.title; vb = b.title; break;
      default: va = a.department; vb = b.department;
    }
    return va.localeCompare(vb, 'tr');
  });

  document.getElementById('c-count').textContent = filtered.length;
  document.getElementById('c-worker-count').textContent = `İşçi: ${filtered.filter(p => PERSONNEL_TYPES[p.type]?.category === 'worker').length}`;
  document.getElementById('c-officer-count').textContent = `Memur: ${filtered.filter(p => PERSONNEL_TYPES[p.type]?.category === 'officer').length}`;
  renderContent(filtered);
}

function renderContent(list) {
  const container = document.getElementById('c-content');
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div class="text-center py-16">
        <p class="text-5xl mb-4">🔍</p>
        <p class="text-slate-300 text-lg font-medium">Personel bulunamadı</p>
        <p class="text-slate-500 text-sm mt-2">Arama kriterlerinizi değiştirmeyi deneyin</p>
      </div>`;
    return;
  }

  switch (viewMode) {
    case 'card': container.innerHTML = cardView(list); break;
    case 'table': container.innerHTML = tableView(list); break;
    case 'group': container.innerHTML = groupView(list); break;
  }

  // Kopyalama butonları (ClipboardJS varsa onu kullan, yoksa fallback)
  if (ClipboardJS) {
    try {
      const clip = new ClipboardJS('.copy-phone-btn');
      clip.on('success', function(e) {
        e.trigger.textContent = '✓';
        e.trigger.classList.add('text-green-400');
        setTimeout(() => { e.trigger.textContent = '📋'; e.trigger.classList.remove('text-green-400'); }, 1500);
        e.clearSelection();
      });
      clip.on('error', function(e) {
        fallbackCopy(e.trigger);
      });
    } catch (err) {
      container.querySelectorAll('.copy-phone-btn').forEach(btn => {
        btn.onclick = () => fallbackCopy(btn);
      });
    }
  } else {
    container.querySelectorAll('.copy-phone-btn').forEach(btn => {
      btn.onclick = () => fallbackCopy(btn);
    });
  }
}

// ===== KART GÖRÜNÜMÜ =====
function cardView(list) {
  return `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    ${list.map(p => personCard(p)).join('')}
  </div>`;
}

function personCard(p) {
  const typeInfo = PERSONNEL_TYPES[p.type] || {};
  const color = TYPE_COLORS[p.type] || TYPE_COLORS.worker;
  const initials = `${p.name.charAt(0)}${p.surname.charAt(0)}`;
  const classLabel = typeInfo.category === 'worker' ? 'İşçi Sınıfı' : 'Memur Sınıfı';
  const classColor = typeInfo.category === 'worker' ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/15 text-emerald-300';
  const startDate = p.startDate ? new Date(p.startDate + 'T12:00:00').toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '-';

  return `
    <div class="card hover:bg-white/8 transition group">
      <div class="flex items-start gap-3 mb-3">
        <div class="w-14 h-14 rounded-xl bg-gradient-to-br ${color.bg} border ${color.border} flex items-center justify-center text-white font-bold text-xl shrink-0 overflow-hidden">
          ${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover" loading="lazy">` : initials}
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-semibold text-white group-hover:text-cyan-300 transition truncate text-base">${p.name} ${p.surname}</p>
          <p class="text-xs text-slate-400 truncate">${p.title}</p>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color.badge}">${typeInfo.label || p.type}</span>
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${classColor}">${classLabel}</span>
          </div>
        </div>
      </div>
      <div class="space-y-2.5 text-sm border-t border-white/5 pt-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-base w-5 text-center">📞</span>
            <a href="tel:${p.phone}" class="text-cyan-400 hover:text-cyan-300 transition font-medium tracking-wide">${p.phone}</a>
          </div>
          <button class="copy-phone-btn text-slate-500 hover:text-white transition text-sm p-1 rounded hover:bg-white/10" data-phone="${p.phone}" title="Numarayı kopyala" aria-label="Telefon numarasını kopyala">📋</button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-base w-5 text-center">🏢</span>
          <span class="text-slate-300">${p.department}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-base w-5 text-center">🪪</span>
          <span class="text-slate-500 text-xs">TC: ${maskTC(p.tc)}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-base w-5 text-center">⏰</span>
          <span class="text-slate-400 text-xs">${typeInfo.weeklyHours || '-'} saat/hafta ${classLabel}</span>
        </div>
      </div>
      <div class="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span class="text-xs text-slate-600">📅 ${startDate}</span>
        <span class="text-xs text-slate-600">🪪 ${maskTC(p.tc)}</span>
      </div>
    </div>`;
}

// ===== TABLO GÖRÜNÜMÜ =====
function tableView(list) {
  return `
    <div class="card overflow-x-auto schedule-table">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-white/10">
            <th class="th sticky left-0 bg-slate-900/95 backdrop-blur z-10 min-w-[44px]">#</th>
            <th class="th min-w-[160px]">Ad Soyad</th>
            <th class="th min-w-[130px]">📞 Telefon</th>
            <th class="th min-w-[130px]">Departman</th>
            <th class="th min-w-[130px]">Ünvan</th>
            <th class="th min-w-[90px]">Tür</th>
            <th class="th min-w-[80px]">Sınıf</th>
            <th class="th min-w-[80px]">Haftalık</th>
            <th class="th min-w-[90px]">TC Kimlik</th>
            <th class="th min-w-[90px]">Başlangıç</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((p, i) => {
            const typeInfo = PERSONNEL_TYPES[p.type] || {};
            const color = TYPE_COLORS[p.type] || TYPE_COLORS.worker;
            const classLabel = typeInfo.category === 'worker' ? 'İşçi' : 'Memur';
            const classColor = typeInfo.category === 'worker' ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/15 text-emerald-300';
            const startDate = p.startDate ? new Date(p.startDate + 'T12:00:00').toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }) : '-';
            return `<tr class="border-b border-white/5 hover:bg-white/5 transition">
              <td class="td sticky left-0 bg-slate-900/95 backdrop-blur z-10 text-slate-500">${i + 1}</td>
              <td class="td">
                <div class="flex items-center gap-2">
                  <span class="text-base">${TYPE_ICONS[p.type] || '👤'}</span>
                  <div>
                    <p class="text-white font-medium">${p.name} ${p.surname}</p>
                  </div>
                </div>
              </td>
              <td class="td">
                <div class="flex items-center gap-1">
                  <a href="tel:${p.phone}" class="text-cyan-400 hover:text-cyan-300 transition font-medium">${p.phone}</a>
                  <button class="copy-phone-btn text-slate-600 hover:text-white transition text-xs p-0.5" data-phone="${p.phone}" title="Kopyala" aria-label="Telefon numarasını kopyala">📋</button>
                </div>
              </td>
              <td class="td text-slate-300">${p.department}</td>
              <td class="td text-slate-300">${p.title}</td>
              <td class="td"><span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color.badge}">${typeInfo.label || p.type}</span></td>
              <td class="td"><span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${classColor}">${classLabel}</span></td>
              <td class="td text-center text-slate-400">${typeInfo.weeklyHours || '-'}s</td>
              <td class="td text-slate-500 text-xs">${maskTC(p.tc)}</td>
              <td class="td text-slate-500 text-xs">${startDate}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

// ===== GRUP GÖRÜNÜMÜ (DEPARTMAN BAZLI) =====
function groupView(list) {
  const grouped = {};
  list.forEach(p => {
    if (!grouped[p.department]) grouped[p.department] = [];
    grouped[p.department].push(p);
  });

  const sortedDepts = Object.keys(grouped).sort();

  return sortedDepts.map(dept => {
    const members = grouped[dept];
    const deptTypes = {};
    members.forEach(m => { deptTypes[m.type] = (deptTypes[m.type] || 0) + 1; });
    const typeBadges = Object.entries(deptTypes).map(([t, c]) =>
      `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${(TYPE_COLORS[t]?.badge || 'bg-slate-500/15 text-slate-300')}">${TYPE_ICONS[t] || '👤'} ${c}</span>`
    ).join(' ');

    return `
      <div class="card mb-4 fade-in">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div class="flex items-center gap-2">
            <span class="text-xl">🏢</span>
            <h3 class="text-lg font-semibold text-white">${dept}</h3>
            <span class="text-xs text-slate-500">${members.length} personel</span>
          </div>
          <div class="flex flex-wrap gap-1">${typeBadges}</div>
        </div>
        <div class="space-y-1">
          ${members.map(p => {
            const typeInfo = PERSONNEL_TYPES[p.type] || {};
            const color = TYPE_COLORS[p.type] || TYPE_COLORS.worker;
            const classLabel = typeInfo.category === 'worker' ? 'İşçi' : 'Memur';
            return `
              <div class="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5 transition group/row">
                <span class="text-lg w-6 text-center shrink-0">${TYPE_ICONS[p.type] || '👤'}</span>
                <div class="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-1 sm:gap-4 items-center">
                  <div class="min-w-0">
                    <p class="text-white font-medium text-sm truncate group-hover/row:text-cyan-300 transition">${p.name} ${p.surname}</p>
                    <p class="text-xs text-slate-500 truncate">${p.title}</p>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <a href="tel:${p.phone}" class="text-cyan-400 hover:text-cyan-300 transition font-medium text-sm">${p.phone}</a>
                    <button class="copy-phone-btn text-slate-600 hover:text-white transition text-xs p-0.5" data-phone="${p.phone}" title="Kopyala" aria-label="Telefon numarasını kopyala">📋</button>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color.badge}">${typeInfo.label}</span>
                    <span class="text-xs text-slate-500">${typeInfo.weeklyHours}s/hafta</span>
                    <span class="text-xs text-slate-600">TC: ${maskTC(p.tc)}</span>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');
}

// ===== CSV İNDİRME =====
function exportCSV(list) {
  const headers = ['Sıra', 'Ad', 'Soyad', 'Telefon', 'Departman', 'Ünvan', 'Tür', 'Sınıf', 'Haftalık Saat', 'TC Kimlik', 'Başlangıç'];
  const rows = list.map((p, i) => {
    const typeInfo = PERSONNEL_TYPES[p.type] || {};
    const classLabel = typeInfo.category === 'worker' ? 'İşçi' : 'Memur';
    return [i + 1, p.name, p.surname, p.phone, p.department, p.title, typeInfo.label || p.type, classLabel, typeInfo.weeklyHours || '', p.tc, p.startDate || ''];
  });

  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `telefon_rehberi_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== YAZDIRMA =====
function printDirectory(list) {
  const today = new Date().toLocaleDateString('tr-TR');

  // Departman bazlı grupla
  const grouped = {};
  list.forEach(p => {
    if (!grouped[p.department]) grouped[p.department] = [];
    grouped[p.department].push(p);
  });

  const deptTables = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b, 'tr')).map(([dept, members]) => {
    const rows = members.map((p, i) => {
      const typeInfo = PERSONNEL_TYPES[p.type] || {};
      const classLabel = typeInfo.category === 'worker' ? 'İşçi' : 'Memur';
      return `<tr>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;font-weight:600">${p.name} ${p.surname}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;color:#0891b2;font-weight:600">${p.phone}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb">${p.title}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center">${typeInfo.label || p.type}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center">${classLabel}</td>
        <td style="padding:4px 8px;border:1px solid #e5e7eb;text-align:center">${typeInfo.weeklyHours || '-'}s</td>
      </tr>`;
    }).join('');

    return `
      <h3 style="margin:20px 0 8px;font-size:14px;color:#0e7490;border-bottom:1px solid #e5e7eb;padding-bottom:4px">🏢 ${dept} (${members.length} kişi)</h3>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:#f8fafc">
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center;width:30px">#</th>
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left">Ad Soyad</th>
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left">📞 Telefon</th>
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:left">Ünvan</th>
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">Tür</th>
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">Sınıf</th>
          <th style="padding:6px 8px;border:1px solid #e5e7eb;text-align:center">Haftalık</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }).join('');

  // Özet istatistikler
  const typeStats = {};
  list.forEach(p => { typeStats[p.type] = (typeStats[p.type] || 0) + 1; });
  const statBadges = Object.entries(typeStats).map(([t, c]) =>
    `${TYPE_ICONS[t] || '👤'} ${PERSONNEL_TYPES[t]?.label || t}: ${c}`
  ).join(' | ');

  const workerCount = list.filter(p => PERSONNEL_TYPES[p.type]?.category === 'worker').length;
  const officerCount = list.filter(p => PERSONNEL_TYPES[p.type]?.category === 'officer').length;

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Telefon Rehberi</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #111; font-size: 12px; }
      h1 { font-size: 18px; color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 8px; margin-bottom: 4px; }
      .meta { color: #666; font-size: 11px; margin-bottom: 16px; }
      .stats { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px; color: #0c4a6e; }
      .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #ddd; padding-top: 8px; }
      @media print { body { padding: 10px; } }
    </style></head><body>
    <h1>📞 Devlet Hastanesi - Personel Telefon Rehberi</h1>
    <div class="meta">Rapor Tarihi: ${today} | Toplam ${list.length} Personel | ${Object.keys(grouped).length} Departman</div>
    <div class="stats">
      <strong>📊 Dağılım:</strong> ${statBadges}<br>
      <strong>📋 Sınıf:</strong> İşçi Sınıfı: ${workerCount} kişi (45s/hafta) | Memur Sınıfı: ${officerCount} kişi (40s/hafta)
    </div>
    ${deptTables}
    <div class="footer">Devlet Hastanesi Personel Yönetim Sistemi | ${today} | Bu belge resmi iletişim rehberi olarak kullanılabilir.</div>
    </body></html>`;

  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); setTimeout(() => win.print(), 500); }
}

// ===== YARDIMCI =====
function fallbackCopy(btn) {
  const phone = btn.dataset.phone;
  const ta = document.createElement('textarea');
  ta.value = phone.replace(/\s/g, '');
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  btn.textContent = '✓';
  btn.classList.add('text-green-400');
  setTimeout(() => { btn.textContent = '📋'; btn.classList.remove('text-green-400'); }, 1500);
}

function maskTC(tc) {
  if (!tc || tc.length < 5) return '***';
  return tc.slice(0, 3) + '****' + tc.slice(-2);
}
