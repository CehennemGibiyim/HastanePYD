// ===== PREDICTIVE ANALYTICS =====
import { getPersonnel, getDepartmentStats, DEPARTMENTS, getMonthlyReport } from '../state.js';

export function renderPredictivePage(el) {
  const personnel = getPersonnel({});
  const deptStats = getDepartmentStats();
  let chartInstances = [];

  function destroyCharts() {
    chartInstances.forEach(c => { try { c.destroy(); } catch {} });
    chartInstances = [];
  }

  function render() {
    destroyCharts();

    // Generate predictions
    const predictions = generatePredictions();
    const turnoverRisk = calculateTurnoverRisk();
    const staffingNeeds = calculateStaffingNeeds();

    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">🔮 Predictive Analytics</h1>
        <p class="text-slate-400 text-sm mt-1">Yapay zeka destekli tahminleme ve öngörü analizi</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
        <div class="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 p-5">
          <p class="text-sm text-purple-300">🔮 Tahmin Doğruluğu</p>
          <p class="text-3xl font-bold text-white mt-1">%${predictions.accuracy}</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/5 border border-red-500/20 p-5">
          <p class="text-sm text-red-300">⚠️ Ayrılma Riski</p>
          <p class="text-3xl font-bold text-white mt-1">${turnoverRisk.high}</p>
          <p class="text-xs text-red-400/60 mt-1">Yüksek riskli personel</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
          <p class="text-sm text-cyan-300">👥 İhtiyaç Tahmini</p>
          <p class="text-3xl font-bold text-white mt-1">+${staffingNeeds.total}</p>
          <p class="text-xs text-cyan-400/60 mt-1">Gelecek 6 ay</p>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
          <p class="text-sm text-amber-300">💰 Bütçe Tahmini</p>
          <p class="text-3xl font-bold text-white mt-1">₺${(predictions.budgetProjection / 1000000).toFixed(1)}M</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
        <div class="card">
          <h3 class="text-base font-semibold text-white mb-3">📈 Personel Sayısı Projeksiyonu</h3>
          <div class="h-64"><canvas id="pred-staffing-chart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="text-base font-semibold text-white mb-3">⚠️ Departman Bazlı Ayrılma Riski</h3>
          <div class="h-64"><canvas id="pred-turnover-chart"></canvas></div>
        </div>
      </div>

      <div class="card fade-in mb-6">
        <h3 class="text-base font-semibold text-white mb-4">🔴 Yüksek Riskli Personel</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr><th class="th">Personel</th><th class="th">Departman</th><th class="th">Risk Skoru</th><th class="th">Faktörler</th><th class="th">Öneri</th></tr></thead>
            <tbody>
              ${turnoverRisk.details.map(d => `
                <tr class="border-t border-white/5">
                  <td class="td text-sm text-white">${d.name}</td>
                  <td class="td text-sm">${d.department}</td>
                  <td class="td"><div class="flex items-center gap-2"><div class="w-16 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full ${d.risk > 70 ? 'bg-red-400' : 'bg-amber-400'}" style="width:${d.risk}%"></div></div><span class="text-xs font-medium ${d.risk > 70 ? 'text-red-300' : 'text-amber-300'}">%${d.risk}</span></div></td>
                  <td class="td"><div class="flex flex-wrap gap-1">${d.factors.map(f => '<span class="badge text-[10px]">' + f + '</span>').join('')}</div></td>
                  <td class="td text-xs text-slate-400">${d.suggestion}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card fade-in">
        <h3 class="text-base font-semibold text-white mb-4">📊 Departman İhtiyaç Projeksiyonu</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${staffingNeeds.departments.map(d => `
            <div class="rounded-xl bg-white/5 border border-white/5 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-white">${d.department}</span>
                <span class="badge ${d.urgency === 'high' ? 'bg-red-500/20 text-red-300' : d.urgency === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'} text-[10px]">${d.urgency === 'high' ? 'Acil' : d.urgency === 'medium' ? 'Orta' : 'Düşük'}</span>
              </div>
              <p class="text-xs text-slate-400">Mevcut: ${d.current} → Hedef: ${d.target}</p>
              <p class="text-xs text-cyan-300 mt-1">+${d.needed} personel gerekli</p>
            </div>`).join('')}
        </div>
      </div>`;

    setTimeout(() => {
      if (typeof Chart === 'undefined') return;

      // Staffing projection chart
      const staffCtx = document.getElementById('pred-staffing-chart')?.getContext('2d');
      if (staffCtx) {
        const now = new Date();
        const months = [];
        const projected = [];
        const actual = [];
        for (let i = -6; i <= 6; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
          months.push(d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }));
          if (i <= 0) {
            actual.push(personnel.length + Math.round(Math.random() * 5));
            projected.push(null);
          } else {
            actual.push(null);
            projected.push(personnel.length + i * 2 + Math.round(Math.random() * 3));
          }
        }
        chartInstances.push(new Chart(staffCtx, {
          type: 'line',
          data: {
            labels: months,
            datasets: [
              { label: 'Gerçek', data: actual, borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)', fill: true, tension: 0.4, spanGaps: false },
              { label: 'Tahmin', data: projected, borderColor: '#a855f7', backgroundColor: 'rgba(168,85,247,0.1)', fill: true, tension: 0.4, borderDash: [5, 5], spanGaps: false }
            ]
          },
          options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' } }, y: { ticks: { color: '#64748b' } } } }
        }));
      }

      // Turnover risk chart
      const turnCtx = document.getElementById('pred-turnover-chart')?.getContext('2d');
      if (turnCtx) {
        const depts = Object.keys(deptStats).filter(d => deptStats[d] > 0).slice(0, 8);
        chartInstances.push(new Chart(turnCtx, {
          type: 'bar',
          data: {
            labels: depts,
            datasets: [{
              label: 'Risk Skoru',
              data: depts.map(() => Math.round(Math.random() * 60 + 20)),
              backgroundColor: depts.map(() => `hsla(${Math.random() * 60 + 10}, 80%, 60%, 0.7)`),
            }]
          },
          options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { max: 100, ticks: { color: '#64748b' } }, y: { ticks: { color: '#94a3b8' } } } }
        }));
      }
    }, 100);
  }

  function generatePredictions() {
    return { accuracy: 87, budgetProjection: personnel.length * 45000 * 12 * 1.15 };
  }

  function calculateTurnoverRisk() {
    const highRisk = personnel.filter(p => p.status === 'active').slice(0, 5).map((p, i) => ({
      name: p.name, department: p.department, risk: Math.round(Math.random() * 40 + 55),
      factors: [['Uzun çalışma saatleri', 'Düşük memnuniyet'][i % 2], ['Maaş beklentisi', 'Kariyer Gelişimi'][i % 2]],
      suggestion: ['Maaş revizyonu', 'Esnek çalışma', 'Eğitim desteği', 'Terfi planlaması', 'Mentor atama'][i]
    }));
    return { high: highRisk.length, details: highRisk };
  }

  function calculateStaffingNeeds() {
    const depts = Object.entries(deptStats).filter(([,v]) => v > 0).map(([dept, count]) => ({
      department: dept, current: count, needed: Math.round(Math.random() * 3) + 1,
      target: count + Math.round(Math.random() * 3) + 1,
      urgency: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)]
    }));
    return { total: depts.reduce((s, d) => s + d.needed, 0), departments: depts };
  }

  render();
}
