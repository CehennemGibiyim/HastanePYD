// ===== ANALİZ PANELİ - GRAFİKLER VE İSTATİSTİKLER =====

import { getPersonnel, getDepartmentStats, getTypeStats, getMonthlyReport, PERSONNEL_TYPES, DEPARTMENTS, getAttendance, getSchedules } from '../state.js';

const CHART_COLORS = ['#22d3ee', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#10b981', '#ef4444', '#f97316', '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6'];

export function renderAnalyticsPage(el) {
  const all = getPersonnel().filter(p => p.status === 'active');
  const typeStats = getTypeStats();
  const deptStats = getDepartmentStats();
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const report = getMonthlyReport(monthStr);

  // Departman bazlı çalışma saatleri
  const deptHours = {};
  report.forEach(r => {
    if (!deptHours[r.department]) deptHours[r.department] = { total: 0, overtime: 0, count: 0 };
    deptHours[r.department].total += r.totalHours;
    deptHours[r.department].overtime += r.overtimeHours;
    deptHours[r.department].count++;
  });

  // Tür bazlı istatistikler
  const typeHours = {};
  report.forEach(r => {
    const label = PERSONNEL_TYPES[r.type]?.label || r.type;
    if (!typeHours[label]) typeHours[label] = { total: 0, overtime: 0, count: 0, weekly: r.weeklyHours };
    typeHours[label].total += r.totalHours;
    typeHours[label].overtime += r.overtimeHours;
    typeHours[label].count++;
  });

  // Puantaj durumu dağılımı
  const normalCount = report.filter(r => r.status === 'normal').length;
  const overtimeCount = report.filter(r => r.status === 'overtime').length;
  const noDataCount = report.filter(r => r.status === 'no_data').length;
  const total = report.length || 1;

  // En çok fazla mesai yapanlar
  const topOvertime = [...report].filter(r => r.overtimeHours > 0).sort((a, b) => b.overtimeHours - a.overtimeHours).slice(0, 5);

  // En az çalışanlar (devamsızlık riski)
  const lowAttendance = [...report].filter(r => r.totalHours > 0 && r.totalHours < r.expectedHours * 0.8).sort((a, b) => a.totalHours - b.totalHours).slice(0, 5);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Analiz Paneli</h1>
      <p class="text-slate-400 text-sm mt-1">Detaylı istatistikler ve grafikler</p>
    </div>

    <!-- Genel Durum Kartları -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-4">
        <p class="text-xs text-cyan-300">Toplam Personel</p>
        <p class="text-3xl font-bold text-white mt-1">${all.length}</p>
        <div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full rounded-full bg-cyan-400" style="width:100%"></div>
        </div>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-4">
        <p class="text-xs text-green-300">Normal Puantaj</p>
        <p class="text-3xl font-bold text-white mt-1">${normalCount}</p>
        <div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full rounded-full bg-green-400" style="width:${Math.round((normalCount / total) * 100)}%"></div>
        </div>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-4">
        <p class="text-xs text-amber-300">Fazla Mesai</p>
        <p class="text-3xl font-bold text-white mt-1">${overtimeCount}</p>
        <div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full rounded-full bg-amber-400" style="width:${Math.round((overtimeCount / total) * 100)}%"></div>
        </div>
      </div>
      <div class="rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-4">
        <p class="text-xs text-red-300">Kayıt Yok</p>
        <p class="text-3xl font-bold text-white mt-1">${noDataCount}</p>
        <div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full rounded-full bg-red-400" style="width:${Math.round((noDataCount / total) * 100)}%"></div>
        </div>
      </div>
    </div>

    <!-- Grafikler -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Departman Dağılımı Bar Chart -->
      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Personel Dağılımı</h3>
        <div class="space-y-2.5">
          ${Object.entries(deptStats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([dept, count]) => {
            const maxCount = Math.max(...Object.values(deptStats).filter(v => v > 0));
            const pct = maxCount ? Math.round((count / maxCount) * 100) : 0;
            return `
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-300 w-28 truncate text-right">${dept}</span>
              <div class="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden relative">
                <div class="h-full rounded-lg bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all flex items-center justify-end pr-2" style="width:${pct}%">
                  <span class="text-[10px] font-bold text-white drop-shadow">${count}</span>
                </div>
              </div>
              <span class="text-[10px] text-slate-500 w-10 text-right">${Math.round((count / all.length) * 100)}%</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Personel Türü Pasta Chart (Chart.js) -->
      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">👷 Personel Türü Dağılımı</h3>
        <div class="flex items-center gap-6">
          <div class="relative w-40 h-40 shrink-0">
            <canvas id="type-chart"></canvas>
          </div>
          <div class="space-y-2.5 flex-1">
            ${Object.entries(typeStats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([type, count], i) => {
              return `
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full shrink-0" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>
                <span class="text-xs text-slate-300 flex-1">${type}</span>
                <span class="text-xs font-medium text-white">${count}</span>
                <span class="text-[10px] text-slate-500">${Math.round((count / all.length) * 100)}%</span>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Çalışma Saatleri Analizi -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Departman Bazlı Ortalama Çalışma -->
      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">⏱️ Departman Bazlı Ortalama Çalışma</h3>
        <div class="space-y-3">
          ${Object.entries(deptHours).filter(([, v]) => v.count > 0).sort((a, b) => (b[1].total / b[1].count) - (a[1].total / a[1].count)).map(([dept, data]) => {
            const avg = Math.round((data.total / data.count) * 10) / 10;
            const avgOvertime = Math.round((data.overtime / data.count) * 10) / 10;
            const maxAvg = Math.max(...Object.values(deptHours).filter(v => v.count > 0).map(v => v.total / v.count));
            const pct = maxAvg ? Math.round((avg / maxAvg) * 100) : 0;
            return `
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-slate-300">${dept} (${data.count} kişi)</span>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-white font-medium">${avg}s</span>
                  ${avgOvertime > 0 ? `<span class="text-[10px] text-amber-400">+${avgOvertime}s fazla</span>` : ''}
                </div>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full rounded-full ${avgOvertime > 0 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-green-500 to-green-400'}" style="width:${pct}%"></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Tür Bazlı Çalışma Grafiği -->
      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">📋 Tür Bazlı Çalışma Analizi</h3>
        <div class="space-y-4">
          ${Object.entries(typeHours).sort((a, b) => b[1].count - a[1].count).map(([type, data]) => {
            const avg = Math.round((data.total / data.count) * 10) / 10;
            const maxHours = data.weekly * 4.33;
            const pct = maxHours ? Math.min(100, Math.round((avg / maxHours) * 100)) : 0;
            const isOver = avg > maxHours;
            return `
            <div class="rounded-xl bg-white/5 border border-white/5 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-white">${type}</span>
                <span class="text-xs text-slate-400">${data.count} kişi · ${data.weekly}s/hafta</span>
              </div>
              <div class="h-3 rounded-full bg-white/10 overflow-hidden mb-1">
                <div class="h-full rounded-full ${isOver ? 'bg-gradient-to-r from-amber-500 to-red-400' : 'bg-gradient-to-r from-cyan-500 to-cyan-400'}" style="width:${pct}%"></div>
              </div>
              <div class="flex justify-between text-[10px]">
                <span class="text-slate-400">Ortalama: ${avg}s / ay</span>
                <span class="${isOver ? 'text-amber-400' : 'text-green-400'}">Hedef: ${Math.round(maxHours)}s</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Uyarılar ve Raporlar -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Fazla Mesai Tablosu -->
      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">⚠️ En Çok Fazla Mesai Yapanlar</h3>
        ${topOvertime.length ? `
          <div class="space-y-2">
            ${topOvertime.map((r, i) => `
              <div class="flex items-center gap-3 rounded-xl bg-amber-500/5 border border-amber-500/10 p-3">
                <span class="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">${i + 1}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-white truncate">${r.name} ${r.surname}</p>
                  <p class="text-xs text-slate-400">${r.department} · ${PERSONNEL_TYPES[r.type]?.label || r.type}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-lg font-bold text-amber-400">${r.overtimeHours}s</p>
                  <p class="text-[10px] text-slate-500">fazla mesai</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-slate-500 text-center py-8 text-sm">Fazla mesai kaydı bulunamadı</p>'}
      </div>

      <!-- Düşük Puantaj Uyarıları -->
      <div class="card fade-in">
        <h3 class="text-lg font-semibold text-white mb-4">🔻 Düşük Puantaj Uyarıları</h3>
        ${lowAttendance.length ? `
          <div class="space-y-2">
            ${lowAttendance.map((r, i) => {
              const pct = Math.round((r.totalHours / r.expectedHours) * 100);
              return `
              <div class="flex items-center gap-3 rounded-xl bg-red-500/5 border border-red-500/10 p-3">
                <span class="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-300 font-bold text-sm shrink-0">${i + 1}</span>
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-white truncate">${r.name} ${r.surname}</p>
                  <p class="text-xs text-slate-400">${r.department} · ${PERSONNEL_TYPES[r.type]?.label || r.type}</p>
                </div>
                <div class="text-right shrink-0">
                  <p class="text-lg font-bold text-red-400">${pct}%</p>
                  <p class="text-[10px] text-slate-500">${r.totalHours}s / ${r.expectedHours}s</p>
                </div>
              </div>`;
            }).join('')}
          </div>
        ` : '<p class="text-slate-500 text-center py-8 text-sm">Düşük puantaj uyarısı yok ✅</p>'}
      </div>
    </div>

    <!-- Sınıf Bazlı Karşılaştırma -->
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">⚖️ İşçi vs Memur Sınıfı Karşılaştırması</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${buildClassComparison('worker', 'İşçi Sınıfı', '45 saat/hafta', all, report, 'blue')}
        ${buildClassComparison('officer', 'Memur Sınıfı', '40 saat/hafta', all, report, 'emerald')}
      </div>
    </div>

    <!-- Aylık Trend -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📈 Son 6 Ay Trend</h3>
      ${buildTrendChart()}
    </div>`;

  // Initialize Chart.js charts after DOM is ready
  setTimeout(() => initCharts(typeStats), 100);
}

function buildPieChart(stats, total) {
  const entries = Object.entries(stats).filter(([, v]) => v > 0);
  const colors = ['#22d3ee', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#10b981'];
  let cumulative = 0;
  const gradientParts = [];

  entries.forEach(([, count], i) => {
    const pct = (count / total) * 100;
    const color = colors[i % colors.length];
    gradientParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  });

  return `
    <div class="w-full h-full rounded-full" style="background: conic-gradient(${gradientParts.join(', ')})">
      <div class="absolute inset-4 rounded-full bg-slate-900 flex items-center justify-center">
        <div class="text-center">
          <p class="text-2xl font-bold text-white">${total}</p>
          <p class="text-[10px] text-slate-400">Toplam</p>
        </div>
      </div>
    </div>`;
}

function buildClassComparison(category, label, weeklyHours, all, report, color) {
  const classTypes = Object.entries(PERSONNEL_TYPES).filter(([, v]) => v.category === category);
  const classPersonnel = all.filter(p => PERSONNEL_TYPES[p.type]?.category === category);
  const classReport = report.filter(r => PERSONNEL_TYPES[r.type]?.category === category);
  const totalHours = classReport.reduce((s, r) => s + r.totalHours, 0);
  const totalOvertime = classReport.reduce((s, r) => s + r.overtimeHours, 0);
  const avgHours = classReport.length ? Math.round((totalHours / classReport.length) * 10) / 10 : 0;

  return `
  <div class="rounded-xl bg-${color}-500/5 border border-${color}-500/10 p-4">
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 rounded-xl bg-${color}-500/20 border border-${color}-500/30 flex items-center justify-center text-${color}-300 text-xl font-bold">
        ${category === 'worker' ? '🔧' : '📋'}
      </div>
      <div>
        <p class="text-base font-bold text-white">${label}</p>
        <p class="text-xs text-${color}-300">${weeklyHours}</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3 mb-3">
      <div class="rounded-lg bg-white/5 p-2.5 text-center">
        <p class="text-xl font-bold text-white">${classPersonnel.length}</p>
        <p class="text-[10px] text-slate-400">Personel</p>
      </div>
      <div class="rounded-lg bg-white/5 p-2.5 text-center">
        <p class="text-xl font-bold text-white">${avgHours}s</p>
        <p class="text-[10px] text-slate-400">Ort. Çalışma</p>
      </div>
    </div>
    <div class="space-y-1.5">
      ${classTypes.map(([type, info]) => {
        const count = classPersonnel.filter(p => p.type === type).length;
        return `<div class="flex items-center justify-between text-xs">
          <span class="text-slate-300">${info.label}</span>
          <span class="text-white font-medium">${count} kişi</span>
        </div>`;
      }).join('')}
    </div>
    ${totalOvertime > 0 ? `<div class="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-300">⚠️ Toplam fazla mesai: ${totalOvertime.toFixed(1)} saat</div>` : ''}
  </div>`;
}

function buildTrendChart() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('tr-TR', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }

  const data = months.map(m => {
    const report = getMonthlyReport(m.key);
    return {
      label: m.label,
      total: report.reduce((s, r) => s + r.totalHours, 0),
      overtime: report.reduce((s, r) => s + r.overtimeHours, 0),
    };
  });

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return `
    <div class="flex items-end gap-3 h-48 px-4">
      ${data.map(d => {
        const h = maxTotal ? Math.round((d.total / maxTotal) * 100) : 0;
        const oh = maxTotal ? Math.round((d.overtime / maxTotal) * 100) : 0;
        return `
        <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span class="text-[10px] text-slate-400">${d.total > 0 ? Math.round(d.total) + 's' : '-'}</span>
          <div class="w-full rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400 transition-all relative" style="height:${h}%">
            ${oh > 0 ? `<div class="absolute bottom-0 left-0 right-0 rounded-t bg-amber-400/30" style="height:${oh}%"></div>` : ''}
          </div>
          <span class="text-xs text-slate-400">${d.label}</span>
        </div>`;
      }).join('')}
    </div>
    <div class="flex justify-center gap-4 mt-4">
      <span class="inline-flex items-center gap-1.5 text-xs"><span class="w-3 h-3 rounded bg-cyan-400"></span><span class="text-slate-400">Toplam Çalışma</span></span>
      <span class="inline-flex items-center gap-1.5 text-xs"><span class="w-3 h-3 rounded bg-amber-400/50"></span><span class="text-slate-400">Fazla Mesai</span></span>
    </div>`;
}

function initCharts(typeStats) {
  if (typeof Chart === 'undefined') return;

  const typeChartEl = document.getElementById('type-chart');
  if (typeChartEl) {
    const entries = Object.entries(typeStats).filter(([, v]) => v > 0);
    new Chart(typeChartEl, {
      type: 'doughnut',
      data: {
        labels: entries.map(([k]) => k),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: CHART_COLORS.slice(0, entries.length),
          borderColor: '#0f172a',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
          },
        },
      },
    });
  }
}
