// ===== KİŞİSEL KPI DASHBOARD =====
import { getPersonnel, getPersonnelById, getAttendance, getMonthlyReport, getSchedules, getTasks, getPerformanceRecords } from '../state.js';

export function renderPersonalKPIPage(container) {
  const personnel = getPersonnel({ status: 'active' });
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">🎯 Kişisel KPI Paneli</h1>
          <p class="text-slate-400 text-sm mt-1">Kişisel hedef ve performans takibi</p>
        </div>
        <select id="kpi-person" class="input-field">
          ${personnel.map(p => `<option value="${p.id}">${p.name} ${p.surname} - ${p.department}</option>`).join('')}
        </select>
      </div>
      <div id="kpi-content"></div>
    </div>`;
  renderKPIContent(personnel[0]?.id);
  document.getElementById('kpi-person').onchange = (e) => renderKPIContent(parseInt(e.target.value));
}

function renderKPIContent(personId) {
  const el = document.getElementById('kpi-content');
  if (!personId || !el) return;
  const p = getPersonnelById(personId);
  if (!p) return;
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const report = getMonthlyReport(monthStr).find(r => r.id === personId);
  const tasks = (getTasks() || []).filter(t => t.assignedTo === personId);
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const schedules = getSchedules({ personnelId: personId, month: monthStr });
  const attendance = getAttendance({ personnelId: personId, month: monthStr });
  const avgHours = attendance.length ? (attendance.reduce((s,a)=>s+a.hours,0)/attendance.length).toFixed(1) : 0;
  const lateDays = attendance.filter(a => a.note?.includes('gecikme')).length;

  const kpis = [
    { label: 'Devam Oranı', value: attendance.length, target: 22, unit: 'gün', icon: '📅', color: 'cyan' },
    { label: 'Ortalama Mesai', value: parseFloat(avgHours), target: 8, unit: 'saat', icon: '⏰', color: 'blue' },
    { label: 'Fazla Mesai', value: report?.overtimeHours || 0, target: 10, unit: 'saat', icon: '⏱️', color: 'amber' },
    { label: 'Görev Tamamlama', value: completedTasks, target: Math.max(tasks.length, 1), unit: 'görev', icon: '✅', color: 'green' },
    { label: 'Nöbet Sayısı', value: schedules.length, target: 20, unit: 'gün', icon: '📋', color: 'purple' },
    { label: 'Gecikme', value: lateDays, target: 0, unit: 'gün', icon: '🕐', color: lateDays > 3 ? 'red' : 'green' },
  ];

  el.innerHTML = `
    <div class="card mb-6">
      <div class="flex items-center gap-4 mb-4">
        <div class="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-2xl font-bold text-cyan-300 overflow-hidden">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : `${p.name[0]}${p.surname[0]}`}</div>
        <div>
          <h2 class="text-xl font-bold text-white">${p.name} ${p.surname}</h2>
          <p class="text-sm text-slate-400">${p.title} · ${p.department}</p>
          <p class="text-xs text-slate-500 mt-1">📅 ${monthStr} dönemi</p>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      ${kpis.map(k => kpiCardHTML(k)).join('')}
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📈 Aylık Trend (Son 6 Ay)</h3>
        <div id="kpi-trend" class="space-y-2"></div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">💡 Gelişim Önerileri</h3>
        <div class="space-y-3">
          ${generateKPIRecommendations(p, report, attendance, tasks).map(r => `
            <div class="flex items-start gap-3 p-3 rounded-xl bg-${r.color}-500/10 border border-${r.color}-500/20">
              <span class="text-xl">${r.icon}</span>
              <div>
                <p class="text-sm font-medium text-${r.color}-300">${r.title}</p>
                <p class="text-xs text-slate-400 mt-0.5">${r.desc}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;

  renderKPITrend(personId);
}

function kpiCardHTML(k) {
  const pct = k.target ? Math.min(Math.round(k.value / k.target * 100), 100) : 0;
  const status = k.label === 'Gecikme' ? (k.value <= k.target ? 'good' : 'bad') : (pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low');
  return `
    <div class="card">
      <div class="flex items-center justify-between mb-2">
        <span class="text-lg">${k.icon}</span>
        <span class="badge ${status==='good'?'bg-green-500/20 text-green-400':status==='mid'?'bg-amber-500/20 text-amber-400':'bg-red-500/20 text-red-400'}">${pct}%</span>
      </div>
      <p class="text-sm text-slate-400 mb-1">${k.label}</p>
      <p class="text-2xl font-bold text-white">${k.value} <span class="text-sm font-normal text-slate-500">/ ${k.target} ${k.unit}</span></p>
      <div class="w-full h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
        <div class="h-full rounded-full bg-${k.color}-500 transition-all" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function renderKPITrend(personId) {
  const el = document.getElementById('kpi-trend');
  if (!el) return;
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  const trendData = months.map(m => {
    const att = getAttendance({ personnelId: personId, month: m });
    return { month: m, hours: att.reduce((s,a)=>s+a.hours,0), days: att.length };
  });
  const maxH = Math.max(...trendData.map(t=>t.hours), 1);
  el.innerHTML = trendData.map(t => `
    <div class="flex items-center gap-3">
      <span class="text-xs text-slate-400 w-16">${t.month.slice(5)}</span>
      <div class="flex-1 h-5 rounded bg-white/5 overflow-hidden">
        <div class="h-full rounded bg-cyan-500/40 transition-all" style="width:${Math.round(t.hours/maxH*100)}%"></div>
      </div>
      <span class="text-xs text-white w-12 text-right">${Math.round(t.hours)}s</span>
    </div>`).join('');
}

function generateKPIRecommendations(p, report, attendance, tasks) {
  const recs = [];
  if (report?.overtimeHours > 10) recs.push({ icon: '⏰', title: 'Fazla Mesai Yüksek', desc: 'Aşırı mesai yapılıyor. İş yükü dengelemesi önerilir.', color: 'red' });
  const pendingTasks = tasks.filter(t => t.status !== 'done').length;
  if (pendingTasks > 5) recs.push({ icon: '📋', title: 'Bekleyen Görevler', desc: pendingTasks + ' görev bekliyor. Önceliklendirme yapılmalı.', color: 'amber' });
  if (attendance.length < 15) recs.push({ icon: '📅', title: 'Devam Takibi', desc: 'Bu ay katılım düşük görünüyor.', color: 'red' });
  if (p.leaveBalance > 10) recs.push({ icon: '🏖️', title: 'İzin Kullanımı', desc: p.leaveBalance + ' gün izin bakiyeniz var. Dinlenme molası düşünün.', color: 'blue' });
  if (recs.length === 0) recs.push({ icon: '🌟', title: 'Mükemmel Performans', desc: 'Tüm KPI\'lar hedef dahilinde, böyle devam edin!', color: 'green' });
  return recs;
}
