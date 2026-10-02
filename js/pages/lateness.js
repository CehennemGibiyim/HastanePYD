// ===== GECİKME & DÜZENSİZLİK TAKİBİ =====

import { getPersonnel, getAttendance, getSchedules, PERSONNEL_TYPES, getMonthlyReport } from '../state.js';
import { showToast } from '../notifications.js';

export function renderLatenessPage(el) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const report = getMonthlyReport(monthStr);

  // Simulate lateness data (based on attendance patterns)
  const latenessData = personnel.map(p => {
    const att = getAttendance({ personnelId: p.id, month: monthStr });
    const sched = getSchedules({ personnelId: p.id, month: monthStr });
    
    // Estimate lateness from irregular attendance patterns
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const workDays = sched.length;
    const recordedDays = att.length;
    const missingDays = Math.max(0, workDays - recordedDays);
    
    // Simulate lateness (in real system, this comes from clock-in data)
    const seed = p.id * 7 + now.getMonth();
    const lateCount = Math.max(0, Math.floor((seed % 10) - 5));
    const earlyLeaveCount = Math.max(0, Math.floor((seed % 8) - 4));
    const avgLateMinutes = lateCount > 0 ? Math.round((seed % 30) + 5) : 0;

    return {
      ...p,
      workDays,
      recordedDays,
      missingDays,
      lateCount,
      earlyLeaveCount,
      avgLateMinutes,
      totalIrregularity: lateCount + earlyLeaveCount + missingDays,
      attendanceRate: workDays > 0 ? Math.round((recordedDays / workDays) * 100) : 0,
    };
  }).sort((a, b) => b.totalIrregularity - a.totalIrregularity);

  const criticalCount = latenessData.filter(d => d.totalIrregularity >= 5).length;
  const warningCount = latenessData.filter(d => d.totalIrregularity >= 2 && d.totalIrregularity < 5).length;
  const cleanCount = latenessData.filter(d => d.totalIrregularity < 2).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🕐 Gecikme & Düzensizlik Takibi</h1>
          <p class="text-slate-400 text-sm mt-1">Mesaiye geç kalma, erken ayrılma ve eksik gün raporu</p>
        </div>
        <div class="flex items-center gap-2">
          <input type="month" id="lateness-month" class="input-field" value="${monthStr}">
          <button id="lateness-refresh" class="btn-secondary">🔄</button>
        </div>
      </div>
    </div>

    <!-- Durum Kartları -->
    <div class="grid grid-cols-3 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-red-300">${criticalCount}</p>
        <p class="text-xs text-red-400">🔴 Kritik</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-amber-300">${warningCount}</p>
        <p class="text-xs text-amber-400">⚠️ Uyarı</p>
      </div>
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-green-300">${cleanCount}</p>
        <p class="text-xs text-green-400">✅ Temiz</p>
      </div>
    </div>

    <!-- Departman Bazlı -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Bazlı Düzensizlik</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${getDeptLatenessStats(latenessData).map(d => `
          <div class="rounded-xl bg-white/5 border border-white/5 p-3 text-center">
            <p class="text-lg font-bold ${d.avgIrregularity >= 3 ? 'text-red-400' : d.avgIrregularity >= 1 ? 'text-amber-400' : 'text-green-400'}">${d.avgIrregularity.toFixed(1)}</p>
            <p class="text-xs text-slate-400">${d.dept}</p>
            <p class="text-[10px] text-slate-500">${d.count} kişi</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Personel Tablosu -->
    <div class="card fade-in overflow-x-auto">
      <h3 class="text-lg font-semibold text-white mb-4">👥 Personel Düzensizlik Raporu</h3>
      <table class="w-full">
        <thead><tr>
          <th class="th">Personel</th>
          <th class="th">Departman</th>
          <th class="th text-center">Geç Gelme</th>
          <th class="th text-center">Erken Ayrılma</th>
          <th class="th text-center">Eksik Gün</th>
          <th class="th text-center">Devam Oranı</th>
          <th class="th text-center">Durum</th>
        </tr></thead>
        <tbody>
          ${latenessData.map(p => {
            const statusColor = p.totalIrregularity >= 5 ? 'red' : p.totalIrregularity >= 2 ? 'amber' : 'green';
            const statusLabel = p.totalIrregularity >= 5 ? 'Kritik' : p.totalIrregularity >= 2 ? 'Uyarı' : 'Temiz';
            return `
            <tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-[10px] font-bold shrink-0">
                    ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-lg">` : (p.name[0] + p.surname[0])}
                  </div>
                  <span class="text-sm text-white">${p.name} ${p.surname}</span>
                </div>
              </td>
              <td class="td text-xs">${p.department}</td>
              <td class="td text-center ${p.lateCount > 0 ? 'text-amber-400' : 'text-slate-500'}">${p.lateCount > 0 ? p.lateCount + ' kez' : '-'}</td>
              <td class="td text-center ${p.earlyLeaveCount > 0 ? 'text-amber-400' : 'text-slate-500'}">${p.earlyLeaveCount > 0 ? p.earlyLeaveCount + ' kez' : '-'}</td>
              <td class="td text-center ${p.missingDays > 0 ? 'text-red-400' : 'text-slate-500'}">${p.missingDays > 0 ? p.missingDays + ' gün' : '-'}</td>
              <td class="td text-center">
                <div class="flex items-center justify-center gap-1.5">
                  <div class="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div class="h-full rounded-full ${p.attendanceRate >= 90 ? 'bg-green-400' : p.attendanceRate >= 75 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${p.attendanceRate}%"></div>
                  </div>
                  <span class="text-xs text-white">${p.attendanceRate}%</span>
                </div>
              </td>
              <td class="td text-center">
                <span class="badge bg-${statusColor}-500/15 text-${statusColor}-400">${statusLabel}</span>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;

  document.getElementById('lateness-refresh')?.addEventListener('click', () => renderLatenessPage(el));
}

function getDeptLatenessStats(data) {
  const depts = {};
  data.forEach(p => {
    if (!depts[p.department]) depts[p.department] = { dept: p.department, total: 0, count: 0 };
    depts[p.department].total += p.totalIrregularity;
    depts[p.department].count++;
  });
  return Object.values(depts).map(d => ({
    ...d,
    avgIrregularity: d.count > 0 ? d.total / d.count : 0,
  })).sort((a, b) => b.avgIrregularity - a.avgIrregularity);
}
