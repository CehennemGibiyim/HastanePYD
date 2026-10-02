// ===== DEPARTMAN KARŞILAŞTIRMA RAPORU =====
import { getDepartmentComparison, getMonthlyReport, DEPARTMENTS, getPersonnel } from '../state.js';

export function renderDeptComparisonPage(container) {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const comparison = getDepartmentComparison(monthStr);
  const entries = Object.entries(comparison).sort((a,b) => b[1].avg - a[1].avg);
  const bestDept = entries[0];
  const worstDept = entries[entries.length - 1];

  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">🏢 Departman Karşılaştırma Raporu</h1>
          <p class="text-slate-400 text-sm mt-1">${monthStr} dönemi · Departman bazlı performans analizi</p>
        </div>
        <select id="dc-month" class="input-field">
          ${getLast6Months().map(m => `<option value="${m}" ${m===monthStr?'selected':''}>${m}</option>`).join('')}
        </select>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${dcStat('🏢', 'Departman', entries.length, '', 'cyan')}
        ${dcStat('🏆', 'En İyi', bestDept ? bestDept[0] : '-', bestDept ? bestDept[1].avg + 's ort.' : '', 'green')}
        ${dcStat('📉', 'Gelişim Alanı', worstDept ? worstDept[0] : '-', worstDept ? worstDept[1].avg + 's ort.' : '', 'red')}
        ${dcStat('📊', 'Ortalama', entries.length ? (entries.reduce((s,[,d])=>s+d.avg,0)/entries.length).toFixed(1)+'s' : '-', 'tüm departmanlar', 'purple')}
      </div>
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">📊 Departman Sıralaması</h3>
        <div class="space-y-3">
          ${entries.map(([dept, d], idx) => {
            const maxAvg = entries[0]?.[1]?.avg || 1;
            const pct = Math.round(d.avg / maxAvg * 100);
            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
            return `
              <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition">
                <span class="text-lg w-8">${medal || (idx+1)}</span>
                <span class="text-sm text-white font-medium w-32 truncate">${dept}</span>
                <div class="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden">
                  <div class="h-full rounded-lg transition-all flex items-center pl-3" style="width:${pct}%; background:${idx===0?'rgba(34,197,94,0.4)':idx<3?'rgba(34,211,238,0.3)':'rgba(100,116,139,0.3)'}">
                    <span class="text-xs font-bold text-white">${d.avg}s ortalama</span>
                  </div>
                </div>
                <div class="text-right text-xs text-slate-400 w-20">
                  <p>${d.count} kişi</p>
                  <p>${d.utilization}% verim</p>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">⏱️ Fazla Mesai Karşılaştırması</h3>
          <div class="space-y-2.5">
            ${entries.sort((a,b) => b[1].avgOvertime - a[1].avgOvertime).map(([dept, d]) => {
              const maxOT = Math.max(...entries.map(([,x])=>x.avgOvertime), 1);
              return `<div class="flex items-center gap-3">
                <span class="text-sm text-slate-300 w-28 truncate">${dept}</span>
                <div class="flex-1 h-5 rounded bg-white/5 overflow-hidden">
                  <div class="h-full rounded transition-all" style="width:${Math.round(d.avgOvertime/maxOT*100)}%; background:${d.avgOvertime>5?'rgba(239,68,68,0.4)':'rgba(34,197,94,0.4)'}"></div>
                </div>
                <span class="text-xs text-white w-10 text-right">${d.avgOvertime}s</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">👷 Personel Dağılımı</h3>
          <div class="space-y-2.5">
            ${entries.map(([dept, d]) => `
              <div class="flex items-center gap-3">
                <span class="text-sm text-slate-300 w-28 truncate">${dept}</span>
                <div class="flex-1 flex gap-1">
                  ${Array(d.workerCount).fill('<div class="flex-1 h-5 rounded bg-blue-500/30"></div>').join('')}
                  ${Array(d.officerCount).fill('<div class="flex-1 h-5 rounded bg-green-500/30"></div>').join('')}
                </div>
                <span class="text-xs text-slate-400 w-20 text-right">${d.workerCount}+${d.officerCount}</span>
              </div>`).join('')}
          </div>
          <div class="flex gap-4 mt-3 pt-3 border-t border-white/5 text-xs">
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500/30"></span> İşçi</span>
            <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-500/30"></span> Memur</span>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('dc-month').onchange = (e) => {
    const comp = getDepartmentComparison(e.target.value);
    // Re-render with new month
    renderDeptComparisonPage(container);
  };
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return months;
}

function dcStat(icon, label, value, sub, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-xl font-bold text-white mt-1">${value}</p><p class="text-xs text-${color}-400/60 mt-1">${sub}</p></div>`;
}
