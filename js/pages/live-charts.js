// ===== CANLI GRAFİKLER (LIVE CHARTS) =====
import { getDepartmentStats, getTypeStats, getMonthlyReport, getAttendance, getSchedules, getPersonnel } from '../state.js';

let chartInstances = {};

export function renderLiveChartsPage(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">📊 Gerçek Zamanlı Grafikler</h1>
        <p class="text-slate-400 text-sm mt-1">Chart.js ile interaktif veri görselleştirme</p>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Dağılımı</h3>
          <div style="height:300px"><canvas id="lc-dept-chart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">👷 Personel Türleri</h3>
          <div style="height:300px"><canvas id="lc-type-chart"></canvas></div>
        </div>
      </div>
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">📈 Aylık Mesai Trendi (Son 6 Ay)</h3>
        <div style="height:300px"><canvas id="lc-trend-chart"></canvas></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">📅 Nöbet Türü Dağılımı</h3>
          <div style="height:300px"><canvas id="lc-duty-chart"></canvas></div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🔥 Haftalık Nöbet Isı Haritası</h3>
          <div id="lc-heatmap" class="grid grid-cols-7 gap-1"></div>
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">⏰ Son 30 Gün Puantaj Dağılımı</h3>
        <div style="height:250px"><canvas id="lc-attendance-chart"></canvas></div>
      </div>
    </div>`;

  if (typeof Chart === 'undefined') {
    container.innerHTML += '<p class="text-amber-400 text-sm mt-4">⚠️ Chart.js yüklenemedi. Grafikler gösterilemiyor.</p>';
    return;
  }

  renderDeptChart();
  renderTypeChart();
  renderTrendChart();
  renderDutyChart();
  renderHeatmap();
  renderAttendanceChart();
}

function renderDeptChart() {
  const stats = getDepartmentStats();
  const entries = Object.entries(stats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  destroyChart('dept');
  chartInstances.dept = new Chart(document.getElementById('lc-dept-chart'), {
    type: 'doughnut',
    data: {
      labels: entries.map(([d])=>d),
      datasets: [{ data: entries.map(([,v])=>v), backgroundColor: generateColors(entries.length), borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } } },
  });
}

function renderTypeChart() {
  const stats = getTypeStats();
  const entries = Object.entries(stats).filter(([,v])=>v>0);
  destroyChart('type');
  chartInstances.type = new Chart(document.getElementById('lc-type-chart'), {
    type: 'pie',
    data: {
      labels: entries.map(([t])=>t),
      datasets: [{ data: entries.map(([,v])=>v), backgroundColor: ['#22d3ee','#a78bfa','#4ade80','#fbbf24','#fb7185','#38bdf8'], borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 } } } } },
  });
}

function renderTrendChart() {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  const data = months.map(m => {
    const report = getMonthlyReport(m);
    return { month: m, total: report.reduce((s,r)=>s+r.totalHours,0), overtime: report.reduce((s,r)=>s+r.overtimeHours,0) };
  });
  destroyChart('trend');
  chartInstances.trend = new Chart(document.getElementById('lc-trend-chart'), {
    type: 'line',
    data: {
      labels: data.map(d=>d.month),
      datasets: [
        { label: 'Toplam Mesai', data: data.map(d=>Math.round(d.total)), borderColor: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.1)', fill: true, tension: 0.4 },
        { label: 'Fazla Mesai', data: data.map(d=>Math.round(d.overtime)), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', fill: true, tension: 0.4 },
      ],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } }, scales: { x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
  });
}

function renderDutyChart() {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const schedules = getSchedules({ month: monthStr });
  const byType = {};
  schedules.forEach(s => { byType[s.type] = (byType[s.type]||0)+1; });
  const labels = { doctor:'Doktor',nurse:'Hemşire',security:'Güvenlik',cleaning:'Temizlik' };
  const entries = Object.entries(byType);
  destroyChart('duty');
  chartInstances.duty = new Chart(document.getElementById('lc-duty-chart'), {
    type: 'bar',
    data: {
      labels: entries.map(([t])=>labels[t]||t),
      datasets: [{ label: 'Nöbet Sayısı', data: entries.map(([,v])=>v), backgroundColor: ['#22d3ee','#a78bfa','#f59e0b','#4ade80'], borderRadius: 8, borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
  });
}

function renderHeatmap() {
  const el = document.getElementById('lc-heatmap');
  const days = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'];
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const schedules = getSchedules({ month: monthStr });
  const dayCount = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

  let html = days.map(d => `<div class="text-center text-[10px] text-slate-500 font-medium">${d}</div>`).join('');
  const firstDow = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  for (let i = 0; i < offset; i++) html += '<div></div>';
  for (let d = 1; d <= dayCount; d++) {
    const dateStr = `${monthStr}-${String(d).padStart(2,'0')}`;
    const count = schedules.filter(s=>s.date===dateStr).length;
    const intensity = Math.min(count / 20, 1);
    const bg = count === 0 ? 'bg-white/5' : `rgba(34,211,238,${0.1 + intensity * 0.5})`;
    html += `<div class="aspect-square rounded flex items-center justify-center text-[10px] transition-all hover:scale-110 cursor-default" style="background:${bg}" title="${dateStr}: ${count} nöbet">${d}</div>`;
  }
  el.innerHTML = html;
}

function renderAttendanceChart() {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const attendance = getAttendance({ month: monthStr });
  const buckets = { '0-4s': 0, '4-6s': 0, '6-8s': 0, '8-10s': 0, '10s+': 0 };
  attendance.forEach(a => {
    if (a.hours < 4) buckets['0-4s']++;
    else if (a.hours < 6) buckets['4-6s']++;
    else if (a.hours < 8) buckets['6-8s']++;
    else if (a.hours < 10) buckets['8-10s']++;
    else buckets['10s+']++;
  });
  destroyChart('attendance');
  chartInstances.attendance = new Chart(document.getElementById('lc-attendance-chart'), {
    type: 'bar',
    data: {
      labels: Object.keys(buckets),
      datasets: [{ label: 'Kayıt Sayısı', data: Object.values(buckets), backgroundColor: ['#38bdf8','#22d3ee','#4ade80','#fbbf24','#f87171'], borderRadius: 8, borderWidth: 0 }],
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#64748b' }, grid: { display: false } }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } } } },
  });
}

function destroyChart(key) {
  if (chartInstances[key]) { chartInstances[key].destroy(); delete chartInstances[key]; }
}

export function destroyAllCharts() {
  Object.keys(chartInstances).forEach(destroyChart);
}

function generateColors(n) {
  const colors = ['#22d3ee','#a78bfa','#4ade80','#fbbf24','#fb7185','#38bdf8','#f472b6','#a3e635','#facc15','#818cf8','#34d399','#f97316'];
  return Array.from({length:n}, (_,i)=>colors[i%colors.length]);
}
