// ===== AKILLI RAPORLAMA ASİSTANI =====
import { getPersonnel, getDepartmentStats, getMonthlyReport, getSchedules, getAttendance, getTypeStats } from '../state.js';
import { showToast } from '../notifications.js';

const QUICK_REPORTS = [
  { id: 'personnel-summary', name: 'Personel Özeti', icon: '👥', desc: 'Departman bazlı personel dağılımı' },
  { id: 'overtime-report', name: 'Fazla Mesai Raporu', icon: '⏱️', desc: 'En yüksek mesai yapan personel' },
  { id: 'attendance-report', name: 'Devam Raporu', icon: '📅', desc: 'Aylık devam durumu' },
  { id: 'duty-report', name: 'Nöbet Raporu', icon: '📋', desc: 'Nöbet dağılımı analizi' },
  { id: 'type-distribution', name: 'Tür Dağılımı', icon: '👷', desc: 'Personel türü bazlı analiz' },
  { id: 'leave-report', name: 'İzin Raporu', icon: '🏖️', desc: 'İzin bakiye ve kullanım' },
];

export function renderSmartReportsPage(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">🤖 Akıllı Raporlama Asistanı</h1>
        <p class="text-slate-400 text-sm mt-1">Doğal dille rapor oluşturun veya hazır şablonları kullanın</p>
      </div>
      <div class="card mb-6">
        <div class="flex gap-3">
          <input id="sr-query" class="input-field flex-1" placeholder="💬 Sorunuzu yazın: 'En yüksek mesai yapan 5 personel kim?'">
          <button id="sr-ask-btn" class="btn-primary">🔍 Raporla</button>
        </div>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        ${QUICK_REPORTS.map(r => `
          <button class="sr-quick-btn card hover:border-cyan-500/30 transition text-left cursor-pointer" data-report="${r.id}">
            <span class="text-2xl mb-1 block">${r.icon}</span>
            <p class="text-sm font-medium text-white">${r.name}</p>
            <p class="text-xs text-slate-400">${r.desc}</p>
          </button>`).join('')}
      </div>
      <div id="sr-result" class="card" style="display:none"></div>
    </div>`;

  document.getElementById('sr-ask-btn').onclick = () => processQuery();
  document.getElementById('sr-query').onkeydown = (e) => { if (e.key === 'Enter') processQuery(); };
  document.querySelectorAll('.sr-quick-btn').forEach(b => {
    b.onclick = () => generateReport(b.dataset.report);
  });
}

function processQuery() {
  const query = document.getElementById('sr-query').value.trim().toLowerCase();
  if (!query) return;
  const result = document.getElementById('sr-result');
  result.style.display = 'block';
  result.innerHTML = '<div class="text-center py-4"><div class="loading-pulse text-cyan-400">🔄 Rapor hazırlanıyor...</div></div>';

  setTimeout(() => {
    let html = '';
    if (query.includes('mesai') && query.includes('5')) {
      html = overtimeTopReport(5);
    } else if (query.includes('mesai')) {
      html = overtimeTopReport(10);
    } else if (query.includes('departman') || query.includes('dağılım')) {
      html = personnelSummaryReport();
    } else if (query.includes('nöbet') || query.includes('vardiya')) {
      html = dutyReport();
    } else if (query.includes('izin') || query.includes('tatil')) {
      html = leaveReport();
    } else if (query.includes('devam') || query.includes('puantaj')) {
      html = attendanceReport();
    } else {
      html = personnelSummaryReport();
    }
    result.innerHTML = html;
  }, 500);
}

function generateReport(reportId) {
  const result = document.getElementById('sr-result');
  result.style.display = 'block';
  result.innerHTML = '<div class="text-center py-4"><div class="loading-pulse text-cyan-400">🔄 Rapor hazırlanıyor...</div></div>';
  setTimeout(() => {
    const map = {
      'personnel-summary': personnelSummaryReport,
      'overtime-report': () => overtimeTopReport(10),
      'attendance-report': attendanceReport,
      'duty-report': dutyReport,
      'type-distribution': typeDistributionReport,
      'leave-report': leaveReport,
    };
    result.innerHTML = (map[reportId] || personnelSummaryReport)();
  }, 300);
}

function personnelSummaryReport() {
  const stats = getDepartmentStats();
  const entries = Object.entries(stats).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const total = entries.reduce((s,[,v])=>s+v,0);
  return `<h3 class="text-lg font-semibold text-white mb-4">👥 Personel Dağılım Raporu</h3>
    <p class="text-sm text-slate-400 mb-4">Toplam ${total} aktif personel, ${entries.length} departmanda</p>
    <div class="space-y-2.5">
      ${entries.map(([dept, count]) => `
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-300 w-32 truncate">${dept}</span>
          <div class="flex-1 h-6 rounded bg-white/5 overflow-hidden">
            <div class="h-full rounded bg-cyan-500/40 flex items-center pl-2" style="width:${Math.round(count/total*100)}%"><span class="text-xs font-bold text-white">${count}</span></div>
          </div>
          <span class="text-xs text-slate-400 w-10 text-right">${Math.round(count/total*100)}%</span>
        </div>`).join('')}
    </div>`;
}

function overtimeTopReport(limit) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const report = getMonthlyReport(monthStr).sort((a,b) => b.overtimeHours - a.overtimeHours).slice(0, limit);
  return `<h3 class="text-lg font-semibold text-white mb-4">⏱️ En Yüksek Fazla Mesai (${limit} Personel)</h3>
    <div class="overflow-x-auto"><table class="w-full"><thead><tr>
      <th class="th">#</th><th class="th">Personel</th><th class="th">Departman</th><th class="th">Toplam Saat</th><th class="th">Fazla Mesai</th><th class="th">Durum</th>
    </tr></thead><tbody>
      ${report.map((r, i) => `<tr class="border-t border-white/5"><td class="td">${i+1}</td><td class="td font-medium text-white">${r.name} ${r.surname}</td><td class="td">${r.department}</td><td class="td">${r.totalHours}s</td><td class="td font-bold ${r.overtimeHours>10?'text-red-400':'text-amber-400'}">${r.overtimeHours}s</td><td class="td">${r.overtimeHours>20?'<span class="badge bg-red-500/20 text-red-400">Kritik</span>':r.overtimeHours>10?'<span class="badge bg-amber-500/20 text-amber-400">Uyarı</span>':'<span class="badge bg-green-500/20 text-green-400">Normal</span>'}</td></tr>`).join('')}
    </tbody></table></div>`;
}

function attendanceReport() {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const report = getMonthlyReport(monthStr);
  const avg = report.length ? (report.reduce((s,r)=>s+r.totalHours,0)/report.length).toFixed(1) : 0;
  return `<h3 class="text-lg font-semibold text-white mb-4">📅 Devam Raporu (${monthStr})</h3>
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="rounded-xl bg-cyan-500/10 p-3 text-center"><p class="text-2xl font-bold text-white">${report.length}</p><p class="text-xs text-cyan-400">Kayıt</p></div>
      <div class="rounded-xl bg-green-500/10 p-3 text-center"><p class="text-2xl font-bold text-white">${avg}s</p><p class="text-xs text-green-400">Ortalama</p></div>
      <div class="rounded-xl bg-amber-500/10 p-3 text-center"><p class="text-2xl font-bold text-white">${report.filter(r=>r.status==='overtime').length}</p><p class="text-xs text-amber-400">Fazla Mesai</p></div>
    </div>`;
}

function dutyReport() {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const schedules = getSchedules({ month: monthStr });
  const byType = {};
  schedules.forEach(s => { byType[s.type] = (byType[s.type]||0)+1; });
  return `<h3 class="text-lg font-semibold text-white mb-4">📋 Nöbet Raporu (${monthStr})</h3>
    <p class="text-sm text-slate-400 mb-3">Toplam ${schedules.length} nöbet kaydı</p>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${Object.entries(byType).map(([type, count]) => `
        <div class="rounded-xl bg-white/5 p-3 text-center">
          <p class="text-2xl font-bold text-white">${count}</p>
          <p class="text-xs text-slate-400">{{doctor:'🩺 Doktor',nurse:'👩‍⚕️ Hemşire',security:'🛡️ Güvenlik',cleaning:'🧹 Temizlik'}[type] || type}</p>
        </div>`).join('')}
    </div>`;
}

function typeDistributionReport() {
  const typeStats = getTypeStats();
  const entries = Object.entries(typeStats).filter(([,v])=>v>0);
  const total = entries.reduce((s,[,v])=>s+v,0);
  return `<h3 class="text-lg font-semibold text-white mb-4">👷 Personel Tür Dağılımı</h3>
    <div class="space-y-2.5">${entries.map(([type, count]) => `
      <div class="flex items-center gap-3">
        <span class="text-sm text-slate-300 w-32">${type}</span>
        <div class="flex-1 h-6 rounded bg-white/5 overflow-hidden">
          <div class="h-full rounded bg-emerald-500/40 flex items-center pl-2" style="width:${Math.round(count/total*100)}%"><span class="text-xs font-bold text-white">${count}</span></div>
        </div>
        <span class="text-xs text-slate-400 w-10 text-right">${Math.round(count/total*100)}%</span>
      </div>`).join('')}</div>`;
}

function leaveReport() {
  const personnel = getPersonnel({ status: 'active' });
  const totalBalance = personnel.reduce((s,p)=>s+(p.leaveBalance||0),0);
  const totalUsed = personnel.reduce((s,p)=>s+(p.leaveUsed||0),0);
  return `<h3 class="text-lg font-semibold text-white mb-4">🏖️ İzin Raporu</h3>
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="rounded-xl bg-blue-500/10 p-3 text-center"><p class="text-2xl font-bold text-white">${totalBalance}</p><p class="text-xs text-blue-400">Toplam Bakiye</p></div>
      <div class="rounded-xl bg-amber-500/10 p-3 text-center"><p class="text-2xl font-bold text-white">${totalUsed}</p><p class="text-xs text-amber-400">Kullanılan</p></div>
      <div class="rounded-xl bg-green-500/10 p-3 text-center"><p class="text-2xl font-bold text-white">${totalBalance-totalUsed}</p><p class="text-xs text-green-400">Kalan</p></div>
    </div>`;
}
