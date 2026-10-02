// ===== IZIN TAKVIMI =====
import { getLeaveRecords, getPersonnel, getDepartments } from '../state.js';
import { checkMinimumStaff } from '../state-extensions.js';

export function renderLeaveCalendarPage(el) {
  const depts = getDepartments();
  const now = new Date();
  let viewYear = now.getFullYear(), viewMonth = now.getMonth();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏖️ İzin Takvimi</h1>
      <p class="text-slate-400 text-sm mt-1">Departman bazlı izin takvimi ve çakışma kontrolü</p>
    </div>
    <div class="flex flex-wrap gap-3 mb-6 fade-in">
      <select id="lc-dept" class="input-field w-48"><option value="">Tüm Departmanlar</option>${depts.map(d => '<option>' + d + '</option>').join('')}</select>
      <div class="flex items-center gap-2">
        <button id="lc-prev" class="btn-secondary text-sm px-3">◀</button>
        <span id="lc-month-label" class="text-sm font-medium text-white min-w-[140px] text-center"></span>
        <button id="lc-next" class="btn-secondary text-sm px-3">▶</button>
      </div>
    </div>
    <div id="lc-content" class="fade-in"></div>`;

  function render() {
    const dept = document.getElementById('lc-dept').value;
    const monthStr = viewYear + '-' + String(viewMonth + 1).padStart(2, '0');
    document.getElementById('lc-month-label').textContent = new Date(viewYear, viewMonth).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const records = getLeaveRecords({}).filter(r => r.status === 'approved' || r.status === 'supervisor_approved');
    const allPersonnel = getPersonnel({ status: 'active' });
    const filteredP = dept ? allPersonnel.filter(p => p.department === dept) : allPersonnel;
    const filteredIds = new Set(filteredP.map(p => p.id));

    const dayData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = monthStr + '-' + String(d).padStart(2, '0');
      const dow = new Date(viewYear, viewMonth, d).getDay();
      const onLeave = records.filter(r => filteredIds.has(r.personnelId) && dateStr >= r.startDate && dateStr <= r.endDate);
      const staffCheck = dept ? checkMinimumStaff(dept, dateStr, Math.ceil(filteredP.length * 0.5)) : null;
      dayData.push({ day: d, dateStr, dow, onLeave, staffCheck, isWeekend: dow === 0 });
    }

    const dayNames = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
    const container = document.getElementById('lc-content');
    container.innerHTML = `
      <div class="card mb-4">
        <div class="grid grid-cols-7 gap-1 mb-2">${dayNames.map(n => `<div class="text-center text-[10px] font-semibold text-slate-500 py-1">${n}</div>`).join('')}</div>
        <div class="grid grid-cols-7 gap-1">
          ${'<div></div>'.repeat(new Date(viewYear, viewMonth, 1).getDay() === 0 ? 6 : new Date(viewYear, viewMonth, 1).getDay() - 1)}
          ${dayData.map(d => {
            const isToday = d.dateStr === now.toISOString().split('T')[0];
            const leaveCount = d.onLeave.length;
            const isCritical = d.staffCheck && !d.staffCheck.sufficient;
            let bg = d.isWeekend ? 'bg-slate-800/50' : 'bg-white/5';
            if (isCritical) bg = 'bg-red-500/10 border-red-500/30';
            else if (leaveCount > 0) bg = 'bg-amber-500/10';
            return `<div class="rounded-lg ${bg} border border-white/5 p-1.5 min-h-[56px] text-center ${isToday ? 'ring-2 ring-cyan-400' : ''}">
              <p class="text-xs font-bold ${isToday ? 'text-cyan-300' : 'text-white'}">${d.day}</p>
              ${leaveCount > 0 ? `<p class="text-[10px] text-amber-300 mt-0.5">🏖️ ${leaveCount}</p>` : ''}
              ${isCritical ? '<p class="text-[10px] text-red-400">⚠️</p>' : ''}
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="flex flex-wrap gap-4 text-xs text-slate-400">
        <span class="att-legend-item"><span class="att-legend-dot bg-amber-500/30"></span>İzinli personel</span>
        <span class="att-legend-item"><span class="att-legend-dot bg-red-500/30"></span>Yetersiz personel</span>
        <span class="att-legend-item"><span class="att-legend-dot bg-cyan-500/30"></span>Bugün</span>
      </div>
      ${dayData.filter(d => d.onLeave.length > 0).length > 0 ? `
      <div class="card mt-4">
        <h3 class="text-base font-semibold text-white mb-3">📋 İzinli Personel Listesi</h3>
        <div class="space-y-1.5">${dayData.filter(d => d.onLeave.length > 0).slice(0, 20).map(d =>
          d.onLeave.map(r => {
            const p = allPersonnel.find(x => x.id === r.personnelId);
            return `<div class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
              <span class="text-sm text-white">${p ? p.name + ' ' + p.surname : 'Bilinmiyor'}</span>
              <div class="flex items-center gap-2"><span class="text-xs text-slate-400">${r.startDate} → ${r.endDate}</span><span class="badge text-[10px]">${r.days} gün</span></div>
            </div>`;
          }).join('')
        ).join('')}</div>
      </div>` : ''}`;
  }

  document.getElementById('lc-prev').onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } render(); };
  document.getElementById('lc-next').onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } render(); };
  document.getElementById('lc-dept').onchange = render;
  render();
}
