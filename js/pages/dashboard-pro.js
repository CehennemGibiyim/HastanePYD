// ===== ENHANCED DASHBOARD WITH CHARTS, LIVE CLOCK, ACTIVITY FEED =====
import { getPersonnel, getDepartmentStats, getTypeStats, getTodaySchedules, getMonthlyReport, DEPARTMENTS, getAttendance } from '../state.js';
import { getUpcomingBirthdays, getActiveReminders, getMoodStats, getOvertimeTrends, getPatientStaffRatio } from '../state-extensions.js';
import { getCriticalAlertSnapshot } from '../services/critical-alerts-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
let clockInterval = null;
let chartTimeout = null;
let deptChart = null;
let typeChart = null;
let overtimeChart = null;

export function renderEnhancedDashboard(el) {
  if (clockInterval) clearInterval(clockInterval);
  if (chartTimeout) { clearTimeout(chartTimeout); chartTimeout = null; }

  const now = new Date();
  const total = getPersonnel({}).filter(p => p.status === 'active').length;
  const stats = getDepartmentStats();
  const typeStats = getTypeStats();
  const today = getTodaySchedules();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthReport = getMonthlyReport(monthStr);
  const totalOvertime = monthReport.reduce((s, r) => s + r.overtimeHours, 0);
  const totalWorked = monthReport.reduce((s, r) => s + r.totalHours, 0);
  const activeDepts = Object.values(stats).filter(v => v > 0).length;
  const birthdays = getUpcomingBirthdays(7);
  const reminders = getActiveReminders().slice(0, 5);
  const moodStats = getMoodStats();
  const overtimeTrends = getOvertimeTrends(6);
  const patientRatios = getPatientStaffRatio();
  const currentPatients = 148;
  const availableBeds = 18;
  const staffGaps = patientRatios.filter((item) => item.status === 'critical' || item.status === 'warning').length;
  const criticalAlerts = getCriticalAlertSnapshot().filter((alert) => alert.status !== 'resolved' && alert.severity === 'critical').length;
  const delayedTasks = 3;

  const doctorOnDuty = today.filter(s => s.type === 'doctor').length;
  const nurseOnDuty = today.filter(s => s.type === 'nurse').length;

  // Last month comparison
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthReport = getMonthlyReport(lastMonthStr);
  const lastMonthWorked = lastMonthReport.reduce((s, r) => s + r.totalHours, 0);
  const workedDiff = totalWorked - lastMonthWorked;
  const workedTrend = workedDiff > 0 ? '↑' : workedDiff < 0 ? '↓' : '→';
  const workedColor = workedDiff > 0 ? 'text-red-400' : 'text-green-400';

  el.innerHTML = `
    <div class="dashboard-pro mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="dashboard-heading text-2xl font-bold text-white"><span class="dashboard-heading-icon"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 19V5M4 19h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="m7 15 3-4 3 2 4-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Gösterge Paneli</span></h1>
          <p class="text-slate-400 text-sm mt-1">Genel bakış ve istatistikler</p>
        </div>
        <div class="flex items-center gap-3">
          <div id="live-clock" class="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2">
            <span>🕐</span>
            <span class="text-sm text-white font-mono" id="clock-time"></span>
            <span class="text-xs text-slate-400" id="clock-date"></span>
          </div>
        </div>
      </div>
    </div>

    <section class="card hospital-command-center mb-8 fade-in" aria-labelledby="command-center-title">
      <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div><p class="eyebrow">${t('command_center.eyebrow')}</p><h2 id="command-center-title" class="text-xl font-bold text-white mt-1">${t('command_center.title')}</h2><p class="text-sm text-slate-400 mt-1">${t('command_center.subtitle')}</p></div>
        <a class="btn-secondary text-xs" href="#critical-alerts">${t('command_center.open_alerts')}</a>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="command-center-metric"><span class="command-center-icon blue" aria-hidden="true">H</span><span class="command-center-label">${t('command_center.current_patients')}</span><strong>${currentPatients}</strong><small>${t('command_center.current_patients_note')}</small></div>
        <div class="command-center-metric"><span class="command-center-icon green" aria-hidden="true">Y</span><span class="command-center-label">${t('command_center.available_beds')}</span><strong>${availableBeds}</strong><small>${t('command_center.available_beds_note')}</small></div>
        <div class="command-center-metric"><span class="command-center-icon amber" aria-hidden="true">P</span><span class="command-center-label">${t('command_center.staff_gaps')}</span><strong>${staffGaps}</strong><small>${t('command_center.staff_gaps_note')}</small></div>
        <div class="command-center-metric is-alert"><span class="command-center-icon red" aria-hidden="true">!</span><span class="command-center-label">${t('command_center.critical_alerts')}</span><strong>${criticalAlerts}</strong><small>${t('command_center.critical_alerts_note')}</small></div>
        <div class="command-center-metric"><span class="command-center-icon purple" aria-hidden="true">G</span><span class="command-center-label">${t('command_center.delayed_tasks')}</span><strong>${delayedTasks}</strong><small>${t('command_center.delayed_tasks_note')}</small></div>
      </div>
    </section>

    <!-- KPI Kartları with Trends -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-cyan-300">👥 Toplam Personel</p>
          <span class="text-xs text-green-400">✅ Aktif</span>
        </div>
        <p class="text-3xl font-bold text-white mt-1">${total}</p>
        <p class="text-xs text-cyan-400/60 mt-1">${activeDepts} departmanda</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-green-300">🏢 Aktif Departman</p>
          <span class="text-xs text-slate-500">/${DEPARTMENTS.length}</span>
        </div>
        <p class="text-3xl font-bold text-white mt-1">${activeDepts}</p>
        <div class="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full rounded-full bg-green-400" style="width:${Math.round(activeDepts / DEPARTMENTS.length * 100)}%"></div>
        </div>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 p-5">
        <p class="text-sm text-purple-300">📋 Bugünkü Nöbetçi</p>
        <p class="text-3xl font-bold text-white mt-1">${today.length}</p>
        <p class="text-xs text-purple-400/60 mt-1">🩺${doctorOnDuty} 👩‍⚕️${nurseOnDuty}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 p-5">
        <p class="text-sm text-amber-300">⏰ Toplam Mesai</p>
        <p class="text-3xl font-bold text-white mt-1">${totalWorked.toFixed(0)}s</p>
        <p class="text-xs ${workedColor} mt-1">${workedTrend} Geçen aya göre ${Math.abs(Math.round(workedDiff))}s</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Dağılımı</h3>
        <canvas id="dept-chart" height="200"></canvas>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">👷 Personel Türleri</h3>
        <canvas id="type-chart" height="200"></canvas>
      </div>
    </div>

    <!-- Activity & Reminders Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 fade-in">
      <!-- Quick Actions -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">⚡ Hızlı Aksiyonlar</h3>
        <div class="space-y-2">
          <a href="#attendance" class="flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 p-3 transition text-sm text-slate-300 hover:text-white">
            <span>⏰</span><span>Puantaj Onayla</span><span class="ml-auto text-xs text-slate-500">→</span>
          </a>
          <a href="#schedule" class="flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 p-3 transition text-sm text-slate-300 hover:text-white">
            <span>📅</span><span>Nöbet Düzenle</span><span class="ml-auto text-xs text-slate-500">→</span>
          </a>
          <a href="#tasks" class="flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 p-3 transition text-sm text-slate-300 hover:text-white">
            <span>📋</span><span>Görevlerim</span><span class="ml-auto text-xs text-slate-500">→</span>
          </a>
          <a href="#messages" class="flex items-center gap-3 rounded-lg bg-white/5 hover:bg-white/10 p-3 transition text-sm text-slate-300 hover:text-white">
            <span>💬</span><span>Mesajlar</span><span class="ml-auto text-xs text-slate-500">→</span>
          </a>
        </div>
      </div>

      <!-- Upcoming Birthdays -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">🎂 Yaklaşan Doğum Günleri</h3>
        ${birthdays.length ? birthdays.slice(0, 5).map(b => `
          <div class="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
            <span class="text-xl">${b.isToday ? '🎉' : '🎂'}</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate">${b.name} ${b.surname}</p>
              <p class="text-xs text-slate-500">${b.department}</p>
            </div>
            <span class="text-xs ${b.isToday ? 'text-cyan-400 font-bold' : 'text-slate-500'}">${b.isToday ? 'Bugün!' : b.daysUntil + ' gün'}</span>
          </div>
        `).join('') : '<p class="text-sm text-slate-500 text-center py-4">Yakında doğum günü yok</p>'}
      </div>

      <!-- Reminders -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">🔔 Hatırlatmalar</h3>
        ${reminders.length ? reminders.map(r => `
          <div class="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
            <span class="text-lg">${r.icon}</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-300">${r.message}</p>
            </div>
          </div>
        `).join('') : '<p class="text-sm text-slate-500 text-center py-4">Hatırlatma yok</p>'}
        <a href="#reminders" class="block text-center text-xs text-cyan-400 hover:text-cyan-300 mt-2">Tümünü Gör →</a>
      </div>
    </div>

    <!-- Overtime Trend & Patient Ratio -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">📈 Mesai Trend (Son 6 Ay)</h3>
        <canvas id="overtime-chart" height="180"></canvas>
      </div>
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">🏥 Hasta/Personel Oranı</h3>
        <div class="space-y-2">
          ${patientRatios.map(p => `
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-400 w-24 truncate">${p.department}</span>
              <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
                <div class="h-full rounded-lg transition-all flex items-center justify-end pr-2" style="width:${Math.min(100, Math.round(p.ratio / p.safeRatio * 80))}%;background:${p.status === 'critical' ? 'linear-gradient(to right,#ef4444,#f87171)' : p.status === 'warning' ? 'linear-gradient(to right,#f59e0b,#fbbf24)' : 'linear-gradient(to right,#22c55e,#4ade80)'}">
                  <span class="text-[10px] font-bold text-white">${p.ratio}</span>
                </div>
              </div>
              <span class="text-[10px] w-8 text-right ${p.status === 'critical' ? 'text-red-400' : p.status === 'warning' ? 'text-amber-400' : 'text-green-400'}">${p.status === 'critical' ? '⚠️' : p.status === 'warning' ? '⚡' : '✅'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Hızlı Erişim Kartları -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 fade-in">
      <a href="#dutyboard" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-1">📋</p>
        <p class="text-sm font-medium text-white">Görev Panosu</p>
      </a>
      <a href="#schedule" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-1">📅</p>
        <p class="text-sm font-medium text-white">Nöbet Listesi</p>
      </a>
      <a href="#leaderboard" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-1">🏆</p>
        <p class="text-sm font-medium text-white">Sıralama</p>
      </a>
      <a href="#form-builder" class="card hover:bg-white/10 transition text-center cursor-pointer">
        <p class="text-3xl mb-1">📋</p>
        <p class="text-sm font-medium text-white">Form Oluştur</p>
      </a>
    </div>`;

  // Start live clock
  startClock();
  // Render charts
  chartTimeout = setTimeout(() => {
    chartTimeout = null;
    renderCharts(stats, typeStats, overtimeTrends);
  }, 100);
}

function startClock() {
  function update() {
    const now = new Date();
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
  update();
  clockInterval = setInterval(update, 1000);
}

function renderCharts(stats, typeStats, overtimeTrends) {
  if (typeof Chart === 'undefined') return;

  // Department chart
  const deptEl = document.getElementById('dept-chart');
  if (deptEl) {
    const entries = Object.entries(stats).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 10);
    if (deptChart) deptChart.destroy();
    deptChart = new Chart(deptEl.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: entries.map(([d]) => d),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: ['#22d3ee', '#3b82f6', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 8, usePointStyle: true, pointStyleWidth: 8 } }
        }
      }
    });
  }

  // Type chart
  const typeEl = document.getElementById('type-chart');
  if (typeEl) {
    const entries = Object.entries(typeStats).filter(([, v]) => v > 0);
    if (typeChart) typeChart.destroy();
    typeChart = new Chart(typeEl.getContext('2d'), {
      type: 'bar',
      data: {
        labels: entries.map(([t]) => t),
        datasets: [{
          data: entries.map(([, v]) => v),
          backgroundColor: 'rgba(34,211,238,0.6)',
          borderColor: '#22d3ee',
          borderWidth: 1,
          borderRadius: 6,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  // Overtime trend chart
  const otEl = document.getElementById('overtime-chart');
  if (otEl && overtimeTrends.length) {
    if (overtimeChart) { overtimeChart.destroy(); overtimeChart = null; }
    // Guard against a chart instance left behind when the dashboard was
    // re-rendered before its module cleanup ran.
    const existingChart = typeof Chart.getChart === 'function' ? Chart.getChart(otEl) : null;
    if (existingChart) existingChart.destroy();
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    overtimeChart = new Chart(otEl.getContext('2d'), {
      type: 'line',
      data: {
        labels: overtimeTrends.map(d => { const [, m] = d.month.split('-'); return monthNames[parseInt(m) - 1]; }),
        datasets: [{
          label: 'Toplam Mesai (saat)',
          data: overtimeTrends.map(d => d.totalOvertime),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: overtimeTrends.map(d => d.anomaly ? '#ef4444' : '#f59e0b'),
          pointRadius: overtimeTrends.map(d => d.anomaly ? 6 : 3),
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
          y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}

export function cleanupDashboard() {
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
  if (chartTimeout) { clearTimeout(chartTimeout); chartTimeout = null; }
  if (deptChart) { deptChart.destroy(); deptChart = null; }
  if (typeChart) { typeChart.destroy(); typeChart = null; }
  if (overtimeChart) { overtimeChart.destroy(); overtimeChart = null; }
}
