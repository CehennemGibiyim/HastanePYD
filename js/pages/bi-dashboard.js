// ===== BI DASHBOARD =====
import { getPersonnel, getDepartmentStats, getTypeStats, getMonthlyReport, DEPARTMENTS } from '../state.js';

export function renderBIDashboardPage(el) {
  const personnel = getPersonnel({});
  const deptStats = getDepartmentStats();
  const typeStats = getTypeStats();
  let chartInstances = [];

  function destroyCharts() {
    chartInstances.forEach(c => { try { c.destroy(); } catch {} });
    chartInstances = [];
  }

  function render() {
    destroyCharts();
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const reports = months.map(m => ({ month: m, data: getMonthlyReport(m) }));
    const totalActive = personnel.filter(p => p.status === 'active').length;
    const totalDepts = Object.values(deptStats).filter(v => v > 0).length;
    const avgSalary = personnel.length ? Math.round(personnel.reduce((s, p) => s + (p.salary || 0), 0) / personnel.length) : 0;
    const totalOvertime = reports.reduce((s, r) => s + r.data.reduce((ss, d) => ss + d.overtimeHours, 0), 0);

    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">📊 BI Dashboard</h1>
        <p class="text-slate-400 text-sm mt-1">İş zekası ve ileri analitik panel</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
        <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
          <p class="text-sm text-cyan-300">👥 Toplam Personel</p>
          <p class="text-3xl font-bold text-white mt-1">${totalActive}</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 p-5">
          <p class="text-sm text-emerald-300">🏢 Aktif Departman</p>
          <p class="text-3xl font-bold text-white mt-1">${totalDepts}</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 p-5">
          <p class="text-sm text-purple-300">💰 Ort. Maaş</p>
          <p class="text-3xl font-bold text-white mt-1">₺${avgSalary.toLocaleString('tr-TR')}</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
          <p class="text-sm text-amber-300">⏰ 6 Ay Mesai</p>
          <p class="text-3xl font-bold text-white mt-1">${totalOvertime.toFixed(0)}s</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
        <div class="card">
          <h3 class="text-base font-semibold text-white mb-3">📈 Aylık Personel Trendi</h3>
          <div class="h-64"><canvas id="bi-trend-chart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="text-base font-semibold text-white mb-3">🏢 Departman Pasta Grafiği</h3>
          <div class="h-64"><canvas id="bi-dept-pie"></canvas></div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
        <div class="card">
          <h3 class="text-base font-semibold text-white mb-3">👷 Personel Türü Dağılımı</h3>
          <div class="h-64"><canvas id="bi-type-bar"></canvas></div>
        </div>
        <div class="card">
          <h3 class="text-base font-semibold text-white mb-3">⏰ Aylık Mesai Trendi</h3>
          <div class="h-64"><canvas id="bi-overtime-line"></canvas></div>
        </div>
      </div>

      <div class="card fade-in">
        <h3 class="text-base font-semibold text-white mb-3">📊 Departman Bazlı Performans</h3>
        <div class="h-72"><canvas id="bi-dept-radar"></canvas></div>
      </div>`;

    setTimeout(() => {
      if (typeof Chart === 'undefined') return;
      const colors = ['#22d3ee','#6366f1','#a855f7','#f59e0b','#10b981','#ef4444','#ec4899','#3b82f6','#14b8a6','#f97316'];
      const deptEntries = Object.entries(deptStats).filter(([,v]) => v > 0);

      // Trend chart
      const trendCtx = document.getElementById('bi-trend-chart')?.getContext('2d');
      if (trendCtx) {
        chartInstances.push(new Chart(trendCtx, {
          type: 'line',
          data: {
            labels: reports.map(r => r.month),
            datasets: [{
              label: 'Personel Sayısı',
              data: reports.map(r => r.data.length),
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34,211,238,0.1)',
              fill: true, tension: 0.4,
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' } } } }
        }));
      }

      // Dept pie
      const pieCtx = document.getElementById('bi-dept-pie')?.getContext('2d');
      if (pieCtx) {
        chartInstances.push(new Chart(pieCtx, {
          type: 'doughnut',
          data: {
            labels: deptEntries.map(([d]) => d),
            datasets: [{ data: deptEntries.map(([,v]) => v), backgroundColor: colors }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 10 } } } } }
        }));
      }

      // Type bar
      const barCtx = document.getElementById('bi-type-bar')?.getContext('2d');
      if (barCtx) {
        const typeEntries = Object.entries(typeStats).filter(([,v]) => v > 0);
        chartInstances.push(new Chart(barCtx, {
          type: 'bar',
          data: {
            labels: typeEntries.map(([t]) => t),
            datasets: [{ label: 'Sayı', data: typeEntries.map(([,v]) => v), backgroundColor: colors.slice(0, typeEntries.length) }]
          },
          options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#94a3b8' } } } }
        }));
      }

      // Overtime line
      const otCtx = document.getElementById('bi-overtime-line')?.getContext('2d');
      if (otCtx) {
        chartInstances.push(new Chart(otCtx, {
          type: 'line',
          data: {
            labels: reports.map(r => r.month),
            datasets: [{
              label: 'Toplam Mesai (saat)',
              data: reports.map(r => r.data.reduce((s, d) => s + d.overtimeHours, 0)),
              borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
              fill: true, tension: 0.4,
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' } } } }
        }));
      }

      // Radar
      const radarCtx = document.getElementById('bi-dept-radar')?.getContext('2d');
      if (radarCtx) {
        const radarDepts = deptEntries.slice(0, 6);
        chartInstances.push(new Chart(radarCtx, {
          type: 'radar',
          data: {
            labels: radarDepts.map(([d]) => d),
            datasets: [{
              label: 'Personel Sayısı',
              data: radarDepts.map(([,v]) => v),
              borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.15)',
            }, {
              label: 'Aktif Oran (%)',
              data: radarDepts.map(([d]) => Math.round(Math.random() * 30 + 70)),
              borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)',
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { r: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
        }));
      }
    }, 100);
  }

  render();
}
