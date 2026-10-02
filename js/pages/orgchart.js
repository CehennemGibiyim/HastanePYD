// ===== ORGANİZASYON ŞEMASI =====

import { getPersonnel, DEPARTMENTS, PERSONNEL_TYPES, getPersonnelById } from '../state.js';

export function renderOrgChartPage(el) {
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const doctors = personnel.filter(p => p.type === 'doctor');
  const nurses = personnel.filter(p => p.type === 'nurse');
  const others = personnel.filter(p => !['doctor', 'nurse'].includes(p.type));

  // Build hierarchy
  const ceo = doctors.find(p => p.title?.includes('Başhekim')) || doctors[0];
  const deputies = doctors.filter(p => p.title?.includes('Yardımcı') || p.title?.includes('Müdür'));
  const deptHeads = {};
  DEPARTMENTS.forEach(dept => {
    const deptPersonnel = personnel.filter(p => p.department === dept);
    if (deptPersonnel.length > 0) {
      // Find head (supervisor, senior, or first)
      deptHeads[dept] = deptPersonnel.find(p =>
        p.title?.includes('Şef') || p.title?.includes('Başhemşire') || p.title?.includes('Müdür') || p.title?.includes('Amiri')
      ) || deptPersonnel[0];
    }
  });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏗️ Organizasyon Şeması</h1>
      <p class="text-slate-400 text-sm mt-1">Hastane hiyerarşisi ve departman yapısı</p>
    </div>

    <!-- Filtre -->
    <div class="flex flex-wrap gap-2 mb-6 fade-in">
      <button data-org-filter="all" class="org-filter-btn tab-active">🏢 Tümü</button>
      ${DEPARTMENTS.filter(d => personnel.some(p => p.department === d)).map(d => `
        <button data-org-filter="${d}" class="org-filter-btn tab-inactive">${d}</button>
      `).join('')}
    </div>

    <!-- Org Chart Tree -->
    <div id="org-tree" class="fade-in overflow-x-auto pb-4">
      <div class="org-chart-container">
        <!-- Başhekim -->
        <div class="org-level">
          <div class="org-node org-ceo" data-dept="${ceo?.department || ''}">
            <div class="org-avatar">${ceo?.photo ? `<img src="${ceo.photo}" alt="">` : getInitials(ceo)}</div>
            <p class="org-name">${ceo ? ceo.name + ' ' + ceo.surname : 'Başhekim Yok'}</p>
            <p class="org-title">${ceo?.title || 'Başhekim'}</p>
            <p class="org-dept">${ceo?.department || ''}</p>
          </div>
        </div>

        <!-- Bağlantı çizgisi -->
        <div class="org-connector-v"></div>

        <!-- Müdürler / Yardımcılar -->
        ${deputies.length > 0 ? `
        <div class="org-level">
          <div class="org-children">
            ${deputies.map(d => `
              <div class="org-node org-deputy" data-dept="${d.department}">
                <div class="org-avatar">${d.photo ? `<img src="${d.photo}" alt="">` : getInitials(d)}</div>
                <p class="org-name">${d.name} ${d.surname}</p>
                <p class="org-title">${d.title}</p>
                <p class="org-dept">${d.department}</p>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="org-connector-v"></div>
        ` : ''}

        <!-- Departman Şefleri -->
        <div class="org-level">
          <div class="org-children">
            ${Object.entries(deptHeads).map(([dept, head]) => {
              const deptSize = personnel.filter(p => p.department === dept).length;
              return `
              <div class="org-node org-dept-head" data-dept="${dept}">
                <div class="org-avatar">${head.photo ? `<img src="${head.photo}" alt="">` : getInitials(head)}</div>
                <p class="org-name">${head.name} ${head.surname}</p>
                <p class="org-title">${head.title}</p>
                <div class="org-dept-badge">
                  <span class="text-xs font-medium">${dept}</span>
                  <span class="text-[10px] text-slate-400">${deptSize} kişi</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Departman Detayları -->
        <div class="org-connector-v"></div>
        <div id="org-dept-details" class="mt-6 space-y-4">
          ${renderDeptDetails(personnel)}
        </div>
      </div>
    </div>`;

  // Wire filters
  el.querySelectorAll('.org-filter-btn').forEach(btn => {
    btn.onclick = () => {
      el.querySelectorAll('.org-filter-btn').forEach(b => { b.className = 'org-filter-btn tab-inactive'; });
      btn.className = 'org-filter-btn tab-active';
      const dept = btn.dataset.orgFilter;
      filterOrgChart(dept, personnel);
    };
  });
}

function filterOrgChart(dept, allPersonnel) {
  const nodes = document.querySelectorAll('[data-dept]');
  if (dept === 'all') {
    nodes.forEach(n => n.style.display = '');
    document.getElementById('org-dept-details').innerHTML = renderDeptDetails(allPersonnel);
    return;
  }
  nodes.forEach(n => {
    n.style.display = n.dataset.dept === dept ? '' : 'none';
  });
  const deptPersonnel = allPersonnel.filter(p => p.department === dept);
  document.getElementById('org-dept-details').innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 ${dept} Departmanı (${deptPersonnel.length} kişi)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${deptPersonnel.map(p => `
          <a href="#personnel/${p.id}" class="rounded-xl bg-white/5 border border-white/5 p-3 flex items-center gap-3 hover:bg-white/10 transition cursor-pointer">
            <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm shrink-0">
              ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-lg">` : getInitials(p)}
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium text-white truncate">${p.name} ${p.surname}</p>
              <p class="text-xs text-slate-400 truncate">${p.title}</p>
              <p class="text-[10px] text-cyan-400">${PERSONNEL_TYPES[p.type]?.label || p.type}</p>
            </div>
          </a>
        `).join('')}
      </div>
    </div>`;
}

function renderDeptDetails(personnel) {
  const grouped = {};
  DEPARTMENTS.forEach(d => { grouped[d] = personnel.filter(p => p.department === d); });
  return Object.entries(grouped).filter(([, list]) => list.length > 0).sort((a, b) => b[1].length - a[1].length).map(([dept, list]) => `
    <div class="card" data-dept="${dept}">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-base font-semibold text-white">🏢 ${dept}</h3>
        <span class="badge">${list.length} kişi</span>
      </div>
      <div class="flex flex-wrap gap-2">
        ${list.map(p => `
          <a href="#personnel/${p.id}" class="flex items-center gap-2 rounded-lg bg-white/5 border border-white/5 px-3 py-2 hover:bg-white/10 transition cursor-pointer">
            <span class="w-7 h-7 rounded-md bg-cyan-500/20 flex items-center justify-center text-[10px] text-cyan-300 font-bold shrink-0">
              ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-md">` : getInitials(p)}
            </span>
            <span class="text-xs text-white">${p.name} ${p.surname}</span>
            <span class="text-[10px] text-slate-500">${p.title}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function getInitials(p) {
  if (!p) return '?';
  return (p.name?.[0] || '') + (p.surname?.[0] || '');
}
