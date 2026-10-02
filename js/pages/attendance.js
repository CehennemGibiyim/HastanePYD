// ===== PUANTAJ SİSTEMİ SAYFASI =====

import { getPersonnel, getAttendance, addAttendance, deleteAttendance, hasPermission, PERSONNEL_TYPES, getMonthlyReport, WORK_PROFILES, getDefaultProfileForType, calculateShiftHours, isDepartmentRestricted, getUserDepartment, canAccessDepartment, getOvertimeWarnings, bulkCreateAttendance } from '../state.js';
import { navigate } from '../app.js';
import { showToast } from '../notifications.js';

let currentMonth = (() => {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
})();

export function renderAttendancePage(el) {
  const canWrite = hasPermission('write');
  const deptRestricted = isDepartmentRestricted();
  const myDept = getUserDepartment();
  const now = new Date();
  const monthName = new Date(currentMonth.split('-')[0], parseInt(currentMonth.split('-')[1]) - 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  let report = getMonthlyReport(currentMonth);
  if (deptRestricted) report = report.filter(r => r.department === myDept);

  // Özet istatistikler
  const totalPersonnel = report.length;
  const totalHours = report.reduce((s, r) => s + r.totalHours, 0);
  const totalOvertime = report.reduce((s, r) => s + r.overtimeHours, 0);
  const normalCount = report.filter(r => r.status === 'normal').length;
  const overtimeCount = report.filter(r => r.status === 'overtime').length;
  const noDataCount = report.filter(r => r.status === 'no_data').length;

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">⏰ Puantaj Sistemi</h1>
        <p class="text-slate-400 text-sm mt-1">${monthName} ayı puantaj takibi</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button id="prev-month" class="btn-secondary text-xs px-3">◀ Önceki</button>
        <button id="next-month" class="btn-secondary text-xs px-3">Sonraki ▶</button>
        ${canWrite ? '<button id="add-att-btn" class="btn-primary text-xs">+ Puantaj Ekle</button>' : ''}
        ${canWrite ? '<button id="bulk-att-btn" class="btn-secondary text-xs">📋 Toplu Giriş</button>' : ''}
      </div>
    </div>

    <!-- Özet Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6 fade-in">
      <div class="card text-center">
        <p class="text-xl font-bold text-cyan-400">${totalPersonnel}</p>
        <p class="text-xs text-slate-400">Toplam Personel</p>
      </div>
      <div class="card text-center">
        <p class="text-xl font-bold text-green-400">${totalHours.toFixed(0)}s</p>
        <p class="text-xs text-slate-400">Toplam Çalışma</p>
      </div>
      <div class="card text-center">
        <p class="text-xl font-bold text-amber-400">${totalOvertime.toFixed(1)}s</p>
        <p class="text-xs text-slate-400">Fazla Mesai</p>
      </div>
      <div class="card text-center">
        <p class="text-xl font-bold text-emerald-400">${normalCount}</p>
        <p class="text-xs text-slate-400">Normal</p>
      </div>
      <div class="card text-center">
        <p class="text-xl font-bold ${overtimeCount > 0 ? 'text-orange-400' : 'text-slate-500'}">${overtimeCount}</p>
        <p class="text-xs text-slate-400">Fazla Mesai Olan</p>
      </div>
    </div>

    <!-- Fazla Mesai Uyarıları -->
    <div id="overtime-warnings" class="mb-4 fade-in"></div>

    <!-- Filtreler -->
    <div class="flex flex-wrap gap-3 mb-4 fade-in">
      <input type="text" id="att-search" class="input-field w-56" placeholder="🔍 Personel ara...">
      <select id="att-dept" class="input-field w-48">
        <option value="">Tüm Departmanlar</option>
      </select>
      <select id="att-type" class="input-field w-48">
        <option value="">Tüm Türler</option>
        ${Object.entries(PERSONNEL_TYPES).map(([k, v]) => `<option value="${k}">${v.label} (${v.weeklyHours}s)</option>`).join('')}
      </select>
      <select id="att-status" class="input-field w-40">
        <option value="">Tüm Durumlar</option>
        <option value="normal">✅ Normal</option>
        <option value="overtime">⚠️ Fazla Mesai</option>
        <option value="no_data">❌ Kayıt Yok</option>
      </select>
    </div>

    <!-- Puantaj Tablosu -->
    <div class="card overflow-hidden fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            <th class="th">Tür</th>
            <th class="th text-center">Haftalık</th>
            <th class="th text-center">Bu Ay</th>
            <th class="th text-center">Hedef</th>
            <th class="th text-center">Fark</th>
            <th class="th text-center">Fazla Mesai</th>
            <th class="th text-center">Durum</th>
            ${canWrite ? '<th class="th">İşlem</th>' : ''}
          </tr></thead>
          <tbody id="att-body">${buildRows(report, canWrite)}</tbody>
        </table>
      </div>
    </div>

    <!-- Rapor Butonları -->
    <div class="mt-4 flex flex-wrap justify-end gap-2 fade-in">
      <button id="pdf-btn" class="btn-primary text-xs">📄 PDF Rapor</button>
      <button id="print-btn" class="btn-secondary text-xs">🖨️ Yazdır</button>
      <button id="export-btn" class="btn-secondary text-xs">📥 CSV İndir</button>
    </div>

    <!-- Puantaj Ekleme Modalı -->
    <div id="att-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">Puantaj Ekle</h3>
        <div class="space-y-3">
          <div>
            <label class="label">Personel</label>
            <select id="a-person" class="input-field w-full">
              ${getPersonnel().filter(p => p.status === 'active' && (!deptRestricted || p.department === myDept)).map(p => `<option value="${p.id}">${p.name} ${p.surname} (${p.department} - ${PERSONNEL_TYPES[p.type]?.label || p.type})</option>`).join('')}
            </select>
            <div id="a-profile-info" class="mt-2 rounded-lg bg-white/5 border border-white/10 p-2 text-xs text-slate-400"></div>
          </div>
          <div>
            <label class="label">Tarih</label>
            <input id="a-date" type="date" class="input-field w-full" value="${currentMonth}-01">
          </div>
          <div>
            <label class="label">Çalışma Saati</label>
            <input id="a-hours" type="number" min="0" max="24" step="0.5" class="input-field w-full" placeholder="Örn: 8">
          </div>
          <div>
            <label class="label">Tür</label>
            <select id="a-type" class="input-field w-full">
              <option value="Normal mesai">Normal mesai</option>
              <option value="Fazla mesai">Fazla mesai</option>
              <option value="Gece mesaisi">Gece mesaisi</option>
              <option value="Hafta sonu">Hafta sonu mesaisi</option>
              <option value="Resmi tatil">Resmi tatil mesaisi</option>
            </select>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="a-save" class="btn-primary flex-1">Kaydet</button>
          <button id="a-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>

    <!-- Personel Detayı Modalı -->
    <div id="detail-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 id="detail-title" class="text-xl font-bold text-white"></h3>
          <button id="detail-close" class="text-slate-400 hover:text-white text-xl">✕</button>
        </div>
        <div id="detail-content"></div>
      </div>
    </div>`;

  // Departman filtresi seçeneklerini doldur
  const allDepts = [...new Set(report.map(r => r.department))].sort();
  const deptSelect = document.getElementById('att-dept');
  allDepts.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d;
    deptSelect.appendChild(opt);
  });

  // Filtreler
  const applyFilter = () => {
    const search = document.getElementById('att-search').value.toLowerCase();
    const dept = document.getElementById('att-dept').value;
    const type = document.getElementById('att-type').value;
    const status = document.getElementById('att-status').value;
    let filtered = [...report];
    if (search) filtered = filtered.filter(r => `${r.name} ${r.surname}`.toLowerCase().includes(search) || r.title.toLowerCase().includes(search));
    if (dept) filtered = filtered.filter(r => r.department === dept);
    if (type) filtered = filtered.filter(r => r.type === type);
    if (status) filtered = filtered.filter(r => r.status === status);
    document.getElementById('att-body').innerHTML = buildRows(filtered, canWrite);
    bindDetailButtons();
  };

  document.getElementById('att-search').oninput = applyFilter;
  document.getElementById('att-dept').onchange = applyFilter;
  document.getElementById('att-type').onchange = applyFilter;
  document.getElementById('att-status').onchange = applyFilter;

  // Ay navigasyonu
  document.getElementById('prev-month').onclick = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    navigate('attendance');
  };
  document.getElementById('next-month').onclick = () => {
    const [y, m] = currentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    navigate('attendance');
  };

  // PDF Rapor
  document.getElementById('pdf-btn').onclick = () => generatePDFReport(report, currentMonth, monthName);
  document.getElementById('print-btn').onclick = () => window.print();

  // CSV İndirme
  document.getElementById('export-btn').onclick = () => {
    const header = 'Ad Soyad,Departman,Tür,Sınıf,Haftalık Saat,Ay Toplam,Hedef,Fazla Mesai,Durum\n';
    const rows = report.map(r =>
      `"${r.name} ${r.surname}","${r.department}","${PERSONNEL_TYPES[r.type]?.label || r.type}","${PERSONNEL_TYPES[r.type]?.category === 'worker' ? 'İşçi' : 'Memur'}",${r.weeklyHours},${r.totalHours},${r.expectedHours},${r.overtimeHours},${r.status === 'normal' ? 'Normal' : r.status === 'overtime' ? 'Fazla Mesai' : 'Kayıt Yok'}`
    ).join('\n');
    const csv = header + rows;
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `puantaj_${currentMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Puantaj ekleme
  document.getElementById('add-att-btn')?.addEventListener('click', () => {
    document.getElementById('att-modal').classList.remove('hidden');
    updateAttProfileInfo();
  });
  document.getElementById('a-person')?.addEventListener('change', updateAttProfileInfo);

  function updateAttProfileInfo() {
    const pid = parseInt(document.getElementById('a-person')?.value);
    const person = getPersonnel().find(p => p.id === pid);
    const infoEl = document.getElementById('a-profile-info');
    if (!person || !infoEl) return;
    const profile = WORK_PROFILES[person.workProfile] || WORK_PROFILES[getDefaultProfileForType(person.type)];
    if (!profile) return;
    const dailyH = (profile.weeklyHours / 5).toFixed(1);
    infoEl.innerHTML = `
      <div class="flex items-center gap-2">
        <span>${profile.icon}</span>
        <span class="font-medium text-white">${profile.name}</span>
        <span class="text-slate-500">· ${profile.weeklyHours}s/hafta · ${dailyH}s/gün</span>
      </div>`;
  }

  document.getElementById('a-cancel').onclick = () => document.getElementById('att-modal').classList.add('hidden');
  document.getElementById('att-modal').onclick = (e) => { if (e.target.id === 'att-modal') document.getElementById('att-modal').classList.add('hidden'); };
  document.getElementById('a-save').onclick = () => {
    const pid = parseInt(document.getElementById('a-person').value);
    const date = document.getElementById('a-date').value;
    const hours = parseFloat(document.getElementById('a-hours').value);
    const note = document.getElementById('a-type').value;
    if (!date || isNaN(hours)) { alert('Tarih ve çalışma saati gereklidir'); return; }
    addAttendance({ personnelId: pid, date, hours, note });
    document.getElementById('att-modal').classList.add('hidden');
    navigate('attendance');
  };

  // Personel detayı
  document.getElementById('detail-close').onclick = () => document.getElementById('detail-modal').classList.add('hidden');
  document.getElementById('detail-modal').onclick = (e) => { if (e.target.id === 'detail-modal') document.getElementById('detail-modal').classList.add('hidden'); };

  // Fazla mesai uyarılarını göster
  const warnings = getOvertimeWarnings(currentMonth);
  const filteredWarnings = deptRestricted ? warnings.filter(w => w.department === myDept) : warnings;
  const warnEl = document.getElementById('overtime-warnings');
  if (filteredWarnings.length > 0 && warnEl) {
    warnEl.innerHTML = `
      <div class="card border-amber-500/20 bg-amber-500/5">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">⚠️</span>
          <h3 class="text-sm font-semibold text-amber-300">Fazla Mesai Uyarıları (${filteredWarnings.length})</h3>
        </div>
        <div class="space-y-2 max-h-40 overflow-y-auto">
          ${filteredWarnings.slice(0, 8).map(w => `
            <div class="flex items-center justify-between rounded-lg ${w.severity === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'} px-3 py-2">
              <div>
                <span class="text-sm font-medium text-white">${w.name} ${w.surname}</span>
                <span class="text-xs text-slate-400 ml-2">${w.department}</span>
              </div>
              <div class="text-right">
                <span class="text-sm font-bold ${w.severity === 'critical' ? 'text-red-400' : 'text-amber-400'}">+${w.overBy}s</span>
                <span class="text-[10px] text-slate-500 ml-1">/ ${w.limit}s limit</span>
              </div>
            </div>
          `).join('')}
          ${filteredWarnings.length > 8 ? `<p class="text-xs text-slate-500 text-center">+${filteredWarnings.length - 8} kişi daha...</p>` : ''}
        </div>
      </div>`;
  }

  // Toplu puantaj girişi
  document.getElementById('bulk-att-btn')?.addEventListener('click', () => {
    const existing = document.getElementById('bulk-att-modal');
    if (existing) existing.remove();
    const allPersonnel = getPersonnel().filter(p => p.status === 'active' && (!deptRestricted || p.department === myDept));
    const modal = document.createElement('div');
    modal.id = 'bulk-att-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">📋 Toplu Puantaj Girişi</h3>
        <p class="text-xs text-slate-400 mb-4">Seçili tarihteki tüm personele aynı çalışma saati girer.</p>
        <div class="space-y-3">
          <div>
            <label class="label">Tarih</label>
            <input id="bulk-att-date" type="date" class="input-field w-full" value="${currentMonth}-15">
          </div>
          <div>
            <label class="label">Çalışma Saati</label>
            <input id="bulk-att-hours" type="number" min="0" max="24" step="0.5" class="input-field w-full" value="8">
          </div>
          <div>
            <label class="label">Tür</label>
            <select id="bulk-att-type" class="input-field w-full">
              <option value="Normal mesai">Normal mesai</option>
              <option value="Fazla mesai">Fazla mesai</option>
              <option value="Gece mesaisi">Gece mesaisi</option>
            </select>
          </div>
          <div>
            <label class="label">Departman Filtresi</label>
            <select id="bulk-att-dept" class="input-field w-full">
              <option value="">Tüm Departmanlar</option>
              ${[...new Set(allPersonnel.map(p => p.department))].sort().map(d => `<option value="${d}">${d}</option>`).join('')}
            </select>
          </div>
          <div id="bulk-att-preview" class="rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400"></div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="bulk-att-save" class="btn-primary flex-1">⚡ Kaydet</button>
          <button id="bulk-att-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target.id === 'bulk-att-modal') modal.remove(); };
    document.getElementById('bulk-att-cancel').onclick = () => modal.remove();

    const updateBulkPreview = () => {
      const dept = document.getElementById('bulk-att-dept').value;
      const filtered = dept ? allPersonnel.filter(p => p.department === dept) : allPersonnel;
      document.getElementById('bulk-att-preview').innerHTML = `
        <p>📊 <strong>${filtered.length}</strong> personele kayıt oluşturulacak</p>`;
    };
    document.getElementById('bulk-att-dept').onchange = updateBulkPreview;
    updateBulkPreview();

    document.getElementById('bulk-att-save').onclick = () => {
      const date = document.getElementById('bulk-att-date').value;
      const hours = parseFloat(document.getElementById('bulk-att-hours').value);
      const note = document.getElementById('bulk-att-type').value;
      const dept = document.getElementById('bulk-att-dept').value;
      if (!date || isNaN(hours)) { showToast('Tarih ve saat gereklidir', 'error'); return; }
      const filtered = dept ? allPersonnel.filter(p => p.department === dept) : allPersonnel;
      const entries = filtered.map(p => ({ personnelId: p.id, date, hours, note }));
      const count = bulkCreateAttendance(entries);
      showToast(`${count} puantaj kaydı oluşturuldu`, 'success');
      modal.remove();
      navigate('attendance');
    };
  });

  function bindDetailButtons() {
    document.querySelectorAll('[data-detail-id]').forEach(btn => {
      btn.onclick = () => showPersonDetail(parseInt(btn.dataset.detailId));
    });
  }
  bindDetailButtons();

  function showPersonDetail(personId) {
    const person = report.find(r => r.id === personId);
    if (!person) return;
    const records = getAttendance({ personnelId: personId, month: currentMonth });
    const dailyExpected = person.weeklyHours / 5;
    const [yN, mN] = currentMonth.split('-').map(Number);
    const daysInMonth = new Date(yN, mN, 0).getDate();
    const firstDow = new Date(yN, mN - 1, 1).getDay();
    const adjFirst = firstDow === 0 ? 6 : firstDow - 1;
    const nowD = new Date();
    const isCurrMonth = nowD.getMonth() + 1 === mN && nowD.getFullYear() === yN;
    const todayD = nowD.getDate();

    const recMap = {};
    records.forEach(a => { recMap[parseInt(a.date.split('-')[2])] = a; });

    const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
    let calCells = '';
    for (let i = 0; i < adjFirst; i++) calCells += '<div class="att-calendar-day att-day-empty"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(yN, mN - 1, d);
      const dow = dt.getDay();
      const isWknd = dow === 0 || dow === 6;
      const rec = recMap[d];
      const isT = isCurrMonth && d === todayD;
      let cls = 'att-day-empty';
      let hText = '';
      if (rec) { cls = rec.hours > dailyExpected ? 'att-day-overtime' : 'att-day-normal'; hText = `${rec.hours}s`; }
      else if (isWknd) cls = 'att-day-weekend';
      else if (!isCurrMonth || d < todayD) cls = 'att-day-absent';
      if (isT) cls += ' att-day-today';
      calCells += `<div class="att-calendar-day ${cls}" title="${rec ? (rec.note || 'Normal') : isWknd ? 'Hafta sonu' : 'Kayıt yok'}"><span class="day-num">${d}</span>${hText ? `<span class="day-hours">${hText}</span>` : ''}</div>`;
    }

    document.getElementById('detail-title').textContent = `${person.name} ${person.surname}`;
    const profile = WORK_PROFILES[person.workProfile] || WORK_PROFILES[getDefaultProfileForType(person.type)];
    document.getElementById('detail-content').innerHTML = `
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Departman</p>
          <p class="text-sm font-medium text-white">${person.department}</p>
        </div>
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Tür</p>
          <p class="text-sm font-medium text-white">${PERSONNEL_TYPES[person.type]?.label || person.type}</p>
        </div>
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Haftalık Hedef</p>
          <p class="text-sm font-medium text-cyan-400">${person.weeklyHours}s / hafta</p>
        </div>
        <div class="rounded-lg bg-white/5 p-3">
          <p class="text-xs text-slate-400">Günlük Hedef</p>
          <p class="text-sm font-medium text-cyan-400">${dailyExpected.toFixed(1)}s / gün</p>
        </div>
      </div>

      <!-- Mesai Profili -->
      <div class="rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-3 mb-4">
        <div class="flex items-center gap-2 mb-2">
          <span>${profile?.icon || '⚙️'}</span>
          <span class="text-sm font-semibold text-white">${profile?.name || 'Standart'}</span>
          <span class="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400">${profile?.weeklyHours || person.weeklyHours}s/hafta</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${profile ? Object.entries(profile.shifts).map(([dur, rule]) => {
            const breakText = rule.breakMin > 0 ? ` − ${rule.breakMin}dk mola` : '';
            return `<span class="inline-block px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300">${dur}s${breakText} → <strong>${rule.record}s</strong></span>`;
          }).join('') : ''}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-400">Toplam Çalışma</span>
            <span class="text-lg font-bold ${person.status === 'overtime' ? 'text-amber-400' : 'text-green-400'}">${person.totalHours}s</span>
          </div>
        </div>
        <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-400">Fazla Mesai</span>
            <span class="text-lg font-bold ${person.overtimeHours > 0 ? 'text-amber-400' : 'text-slate-500'}">${person.overtimeHours}s</span>
          </div>
        </div>
      </div>

      <!-- Aylık Takvim -->
      <h4 class="text-sm font-semibold text-slate-300 mb-2">📅 Aylık Takvim</h4>
      <div class="flex flex-wrap gap-3 mb-2">
        <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(34,197,94,0.3)"></span> Normal</span>
        <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(245,158,11,0.3)"></span> Fazla Mesai</span>
        <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(100,116,139,0.3)"></span> Hafta Sonu</span>
        <span class="att-legend-item"><span class="att-legend-dot" style="background:rgba(239,68,68,0.2)"></span> Kayıt Yok</span>
      </div>
      <div class="att-calendar mb-4">
        ${dayNames.map(d => `<div class="att-calendar-header">${d}</div>`).join('')}
        ${calCells}
      </div>

      <!-- Günlük Kayıtlar -->
      <h4 class="text-sm font-semibold text-slate-300 mb-2">📋 Günlük Kayıtlar</h4>
      <div class="max-h-48 overflow-y-auto space-y-1.5">
        ${records.length ? records.sort((a, b) => a.date.localeCompare(b.date)).map(r => {
          const isOver = r.hours > dailyExpected;
          return `<div class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
            <span class="text-sm text-slate-300">${new Date(r.date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-500">${r.note || ''}</span>
              <span class="text-sm font-medium ${isOver ? 'text-amber-400' : 'text-green-400'}">${r.hours}s</span>
            </div>
          </div>`;
        }).join('') : '<p class="text-slate-500 text-center py-4 text-sm">Kayıt bulunamadı</p>'}
      </div>`;
    document.getElementById('detail-modal').classList.remove('hidden');
  }
}

function generatePDFReport(report, monthStr, monthName) {
  const totalH = report.reduce((s, r) => s + r.totalHours, 0);
  const totalOT = report.reduce((s, r) => s + r.overtimeHours, 0);
  const workers = report.filter(r => PERSONNEL_TYPES[r.type]?.category === 'worker');
  const officers = report.filter(r => PERSONNEL_TYPES[r.type]?.category === 'officer');
  const workerH = workers.reduce((s, r) => s + r.totalHours, 0);
  const officerH = officers.reduce((s, r) => s + r.totalHours, 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('tr-TR');
  const timeStr = now.toLocaleTimeString('tr-TR');

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><title>Puantaj Raporu - ${monthName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, 'Segoe UI', sans-serif; padding: 24px; color: #111; font-size: 12px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0891b2; padding-bottom: 12px; margin-bottom: 16px; }
    .header h1 { font-size: 18px; color: #0891b2; }
    .header .meta { text-align: right; font-size: 11px; color: #666; }
    .summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 16px 0; }
    .stat { border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center; background: #f8fafc; }
    .stat .val { font-size: 18px; font-weight: bold; color: #0891b2; }
    .stat .lbl { font-size: 10px; color: #64748b; margin-top: 2px; }
    .class-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 12px 0; padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; }
    .class-info div { font-size: 11px; }
    .class-info strong { color: #0369a1; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 12px; }
    th { background: #f1f5f9; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; color: #334155; }
    td { padding: 6px; border-bottom: 1px solid #f1f5f9; }
    tr:nth-child(even) { background: #f8fafc; }
    .status-normal { color: #16a34a; font-weight: bold; }
    .status-overtime { color: #d97706; font-weight: bold; }
    .status-nodata { color: #dc2626; }
    .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    .page-break { page-break-before: always; }
    @media print { body { padding: 12px; } }
  </style></head><body>
  <div class="header">
    <div>
      <h1>🏥 Devlet Hastanesi</h1>
      <p style="font-size:14px;font-weight:600;color:#334155;">Aylık Puantaj Raporu</p>
    </div>
    <div class="meta">
      <p><strong>Dönem:</strong> ${monthName}</p>
      <p><strong>Rapor Tarihi:</strong> ${dateStr}</p>
      <p><strong>Saat:</strong> ${timeStr}</p>
    </div>
  </div>
  <div class="summary">
    <div class="stat"><div class="val">${report.length}</div><div class="lbl">Toplam Personel</div></div>
    <div class="stat"><div class="val">${totalH.toFixed(0)}</div><div class="lbl">Toplam Saat</div></div>
    <div class="stat"><div class="val">${totalOT.toFixed(1)}</div><div class="lbl">Fazla Mesai</div></div>
    <div class="stat"><div class="val">${report.filter(r => r.status === 'normal').length}</div><div class="lbl">Normal</div></div>
    <div class="stat"><div class="val">${report.filter(r => r.status === 'overtime').length}</div><div class="lbl">Fazla Mesai Olan</div></div>
  </div>
  <div class="class-info">
    <div><strong>🔧 İşçi Sınıfı (45s/hafta):</strong> ${workers.length} kişi · ${workerH.toFixed(0)} saat toplam</div>
    <div><strong>📋 Memur Sınıfı (40s/hafta):</strong> ${officers.length} kişi · ${officerH.toFixed(0)} saat toplam</div>
  </div>
  <table><thead><tr>
    <th>#</th><th>Ad Soyad</th><th>Departman</th><th>Tür</th><th>Sınıf</th><th>Haftalık</th><th>Ay Toplam</th><th>Hedef</th><th>Fark</th><th>Fazla Mesai</th><th>Durum</th>
  </tr></thead><tbody>
  ${report.sort((a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name)).map((r, i) => {
    const diff = r.totalHours - r.expectedHours;
    const cat = PERSONNEL_TYPES[r.type]?.category;
    const statusClass = r.status === 'normal' ? 'status-normal' : r.status === 'overtime' ? 'status-overtime' : 'status-nodata';
    return `<tr>
      <td>${i + 1}</td><td style="font-weight:600">${r.name} ${r.surname}</td><td>${r.department}</td>
      <td>${PERSONNEL_TYPES[r.type]?.label || r.type}</td>
      <td>${cat === 'worker' ? 'İşçi' : 'Memur'}</td>
      <td>${r.weeklyHours}s</td><td style="font-weight:600">${r.totalHours}s</td><td>${r.expectedHours}s</td>
      <td style="color:${diff >= 0 ? '#16a34a' : '#dc2626'};font-weight:600">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}s</td>
      <td>${r.overtimeHours > 0 ? r.overtimeHours + 's' : '-'}</td>
      <td class="${statusClass}">${r.status === 'normal' ? '✅ Normal' : r.status === 'overtime' ? '⚠️ Fazla Mesai' : '❌ Kayıt Yok'}</td>
    </tr>`;
  }).join('')}</tbody></table>
  <div class="footer">
    <p>Devlet Hastanesi Personel Yönetim Sistemi | Bu rapor ${dateStr} ${timeStr} tarihinde oluşturulmuştur.</p>
    <p>İşçi Sınıfı: Haftada 45 saat | Memur Sınıfı: Haftada 40 saat | Fazla Mesai: %50 zamlı</p>
  </div>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  } else {
    alert('PDF penceresi açılamadı. Lütfen popup engelleyicisini kapatın.');
  }
}

function buildRows(report, canWrite) {
  if (!report.length) return `<tr><td colspan="${canWrite ? 10 : 9}" class="px-4 py-8 text-center text-slate-500">Personel bulunamadı</td></tr>`;
  return report.map(r => {
    const diff = r.totalHours - r.expectedHours;
    const statusHtml = r.status === 'no_data'
      ? '<span class="text-slate-500">❌ Kayıt Yok</span>'
      : r.status === 'overtime'
        ? '<span class="text-amber-400">⚠️ Fazla Mesai</span>'
        : '<span class="text-green-400">✅ Normal</span>';
    return `<tr class="border-b border-white/5 hover:bg-white/5 transition">
      <td class="td font-medium text-white">
        <button class="hover:text-cyan-400 transition text-left" data-detail-id="${r.id}">${r.name} ${r.surname}</button>
      </td>
      <td class="td">${r.department}</td>
      <td class="td"><span class="badge">${PERSONNEL_TYPES[r.type]?.label || r.type}</span></td>
      <td class="td text-center">${r.weeklyHours}s</td>
      <td class="td text-center font-medium">${r.totalHours}s</td>
      <td class="td text-center text-slate-500">${r.expectedHours}s</td>
      <td class="td text-center ${diff >= 0 ? 'text-green-400' : 'text-red-400'}">${diff >= 0 ? '+' : ''}${diff.toFixed(1)}s</td>
      <td class="td text-center ${r.overtimeHours > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}">${r.overtimeHours}s</td>
      <td class="td text-center">${statusHtml}</td>
      ${canWrite ? `<td class="td"><button class="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/10 transition" data-detail-id="${r.id}">📋</button></td>` : ''}
    </tr>`;
  }).join('');
}
