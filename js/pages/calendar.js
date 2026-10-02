// ===== TAKVİM GÖRÜNÜMÜ SAYFASI =====

import {
  getSchedules, getPersonnel, getPersonnelById, getCurrentUser,
  isDepartmentRestricted, getUserDepartment, DEPARTMENTS,
  getLeaveRecords,
} from '../state.js';
import { showToast } from '../notifications.js';
import { exportSchedulesToICal } from '../utils/ical.js';

const SHIFT_COLORS = {
  morning: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-300', label: '🌅 Sabah' },
  evening: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-300', label: '🌆 Akşam' },
  night:   { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-300', label: '🌙 Gece' },
};

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function renderCalendarPage(el) {
  const now = new Date();
  let viewYear = now.getFullYear();
  let viewMonth = now.getMonth();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🗓️ Takvim Görünümü</h1>
          <p class="text-slate-400 text-sm mt-1">Nöbet ve vardiya takvimi</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="cal-prev" class="btn-secondary text-sm px-3">◀</button>
          <span id="cal-title" class="text-white font-medium text-sm min-w-[140px] text-center"></span>
          <button id="cal-next" class="btn-secondary text-sm px-3">▶</button>
          <button id="cal-today" class="btn-primary text-sm">Bugün</button>
          <button id="cal-ical" class="btn-secondary text-sm">📅 iCal İndir</button>
        </div>
      </div>
    </div>
    <div id="cal-legend" class="flex flex-wrap gap-4 mb-4 fade-in"></div>
    <div id="cal-grid" class="fade-in"></div>
    <div id="cal-detail" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  renderCalendar(viewYear, viewMonth);

  document.getElementById('cal-prev').onclick = () => { viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; } renderCalendar(viewYear, viewMonth); };
  document.getElementById('cal-next').onclick = () => { viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; } renderCalendar(viewYear, viewMonth); };
  document.getElementById('cal-today').onclick = () => { viewYear = now.getFullYear(); viewMonth = now.getMonth(); renderCalendar(viewYear, viewMonth); };
  document.getElementById('cal-ical').onclick = () => {
    const monthStr2 = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    let schedules = getSchedules({ month: monthStr2 });
    if (isDepartmentRestricted()) {
      const dept = getUserDepartment();
      const deptP = getPersonnel({ department: dept, status: 'active' }).map(p => p.id);
      schedules = schedules.filter(s => deptP.includes(s.personnelId));
    }
    const pMap = {};
    getPersonnel({}).forEach(p => { pMap[p.id] = p; });
    exportSchedulesToICal(schedules, pMap, 'takvim_' + monthStr2);
    showToast('Takvim iCal dosyası indirildi', 'success');
  };

  function renderCalendar(y, m) {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    document.getElementById('cal-title').textContent = `${monthNames[m]} ${y}`;

    const legend = document.getElementById('cal-legend');
    legend.innerHTML = Object.values(SHIFT_COLORS).map(s =>
      `<span class="inline-flex items-center gap-1.5 text-xs ${s.text}"><span class="w-3 h-3 rounded ${s.bg} ${s.border} border"></span>${s.label}</span>`
    ).join('') + '<span class="inline-flex items-center gap-1.5 text-xs text-rose-300"><span class="w-3 h-3 rounded bg-rose-500/15 border border-rose-500/30"></span>🏖️ İzinli</span>';

    const grid = document.getElementById('cal-grid');
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;

    const monthStr = `${y}-${String(m + 1).padStart(2, '0')}`;
    let schedules = getSchedules({ month: monthStr });
    if (isDepartmentRestricted()) {
      const dept = getUserDepartment();
      const deptPersonnel = getPersonnel({ department: dept, status: 'active' }).map(p => p.id);
      schedules = schedules.filter(s => deptPersonnel.includes(s.personnelId));
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Get leave records for this month
    let leaveRecords = getLeaveRecords({ year: String(y) });
    leaveRecords = leaveRecords.filter(r => r.status === 'approved' && r.startDate <= `${monthStr}-31` && r.endDate >= `${monthStr}-01`);

    let html = '<div class="grid grid-cols-7 gap-1">';
    DAY_NAMES.forEach(d => { html += `<div class="text-center text-xs font-semibold text-slate-500 py-2">${d}</div>`; });

    for (let i = 0; i < startDay; i++) html += '<div class="min-h-[100px] rounded-xl bg-white/[0.02] border border-white/5"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`;
      const daySchedules = schedules.filter(s => s.date === dateStr);
      const isToday = dateStr === todayStr;
      const dow = new Date(y, m, day).getDay();
      const isWeekend = dow === 0 || dow === 6;

      const shiftCounts = {};
      daySchedules.forEach(s => { shiftCounts[s.shift] = (shiftCounts[s.shift] || 0) + 1; });

      html += `<div class="min-h-[100px] rounded-xl border ${isToday ? 'border-cyan-400/50 bg-cyan-500/5' : isWeekend ? 'border-white/5 bg-white/[0.02]' : 'border-white/10 bg-white/[0.03]'} p-2 transition hover:bg-white/5 cursor-pointer" data-cal-date="${dateStr}">
        <div class="flex items-center justify-between mb-1">
          <span class="text-sm font-semibold ${isToday ? 'text-cyan-400' : isWeekend ? 'text-slate-500' : 'text-white'}">${day}</span>
          ${isToday ? '<span class="text-[9px] bg-cyan-500 text-white px-1.5 py-0.5 rounded-full font-bold">BUGÜN</span>' : ''}
        </div>
        <div class="space-y-1">`;

      Object.entries(shiftCounts).forEach(([shift, count]) => {
        const sc = SHIFT_COLORS[shift] || SHIFT_COLORS.morning;
        html += `<div class="text-[10px] ${sc.bg} ${sc.border} border rounded px-1.5 py-0.5 ${sc.text}">${sc.label.split(' ')[0]} ${count}</div>`;
      });

      if (daySchedules.length === 0) {
        html += '<div class="text-[10px] text-slate-600 text-center py-2">—</div>';
      }

      // Show leave badges
      const dayLeaves = leaveRecords.filter(r => dateStr >= r.startDate && dateStr <= r.endDate);
      if (dayLeaves.length > 0) {
        html += `<div class="text-[10px] bg-rose-500/15 border border-rose-500/30 rounded px-1.5 py-0.5 text-rose-300">🏖️ ${dayLeaves.length} izinli</div>`;
      }

      html += '</div></div>';
    }

    html += '</div>';
    grid.innerHTML = html;

    grid.querySelectorAll('[data-cal-date]').forEach(cell => {
      cell.onclick = () => showDayDetail(cell.dataset.calDate, schedules);
    });
  }

  function showDayDetail(dateStr, allSchedules) {
    const modal = document.getElementById('cal-detail');
    const daySchedules = allSchedules.filter(s => s.date === dateStr);
    const d = new Date(dateStr);
    const dayName = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'][d.getDay()];

    const grouped = {};
    daySchedules.forEach(s => {
      if (!grouped[s.shift]) grouped[s.shift] = [];
      const p = getPersonnelById(s.personnelId);
      if (p) grouped[s.shift].push({ ...s, personName: `${p.name} ${p.surname}`, dept: p.department });
    });

    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">📅 ${dateStr}</h3>
          <button id="cal-detail-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <p class="text-sm text-slate-400 mb-4">${dayName} · ${daySchedules.length} görev</p>
        <div class="space-y-3">
          ${Object.entries(grouped).map(([shift, items]) => {
            const sc = SHIFT_COLORS[shift] || SHIFT_COLORS.morning;
            return `<div class="rounded-xl ${sc.bg} ${sc.border} border p-3">
              <p class="text-sm font-medium ${sc.text} mb-2">${sc.label} (${items.length})</p>
              <div class="space-y-1.5">
                ${items.map(i => `<div class="flex items-center justify-between text-xs">
                  <span class="text-white">${i.personName}</span>
                  <span class="text-slate-400">${i.dept} · ${i.duration || 8}s</span>
                </div>`).join('')}
              </div>
            </div>`;
          }).join('')}
          ${daySchedules.length === 0 ? '<div class="text-center py-8 text-slate-500 text-sm">Bu tarihte nöbet kaydı yok</div>' : ''}
        </div>
      </div>`;

    modal.classList.remove('hidden');
    modal.onclick = (e) => { if (e.target.id === 'cal-detail') modal.classList.add('hidden'); };
    document.getElementById('cal-detail-close').onclick = () => modal.classList.add('hidden');
  }
}
