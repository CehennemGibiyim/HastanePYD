// ===== DEPARTMAN VERIMLILIK RAPORU =====
import { getDepartmentProductivity } from '../state-extensions.js';
import { getDepartments } from '../state.js';

export function renderProductivityPage(el) {
  const now = new Date();
  let monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Departman Verimlilik Raporu</h1>
      <p class="text-slate-400 text-sm mt-1">Departman bazlı verimlilik ve kaynak kullanımı</p>
    </div>
    <div class="flex gap-3 mb-6 fade-in">
      <input id="prod-month" type="month" class="input-field" value="${monthStr}">
      <button id="prod-refresh" class="btn-secondary text-sm">🔄 Yenile</button>
    </div>
    <div id="prod-content" class="fade-in"></div>`;

  function render() {
    monthStr = document.getElementById('prod-month').value;
    const data = getDepartmentProductivity(monthStr);
    const container = document.getElementById('prod-content');
    if (!data.length) { container.innerHTML = '<div class="empty-state"><div class="icon">📊</div><div class="title">Veri bulunamadı</div></div>'; return; }
    const maxUtil = Math.max(...data.map(d => d.utilization), 1);
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        ${data.map(d => {
          const color = d.utilization > 90 ? 'from-red-500 to-orange-500' : d.utilization > 80 ? 'from-amber-500 to-yellow-500' : 'from-green-500 to-emerald-500';
          const statusEmoji = d.utilization > 90 ? '🔴' : d.utilization > 80 ? '🟡' : '🟢';
          return `<div class="card">
            <div class="flex items-center justify-between mb-3">
              <div><p class="text-sm font-semibold text-white">${d.department}</p><p class="text-xs text-slate-400">${d.personnelCount} personel</p></div>
              <span class="text-2xl">${statusEmoji}</span>
            </div>
            <div class="grid grid-cols-2 gap-3 mb-3">
              <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-lg font-bold text-white">${d.utilization}%</p><p class="text-[10px] text-slate-400">Kullanım</p></div>
              <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-lg font-bold text-white">${d.avgHours}s</p><p class="text-[10px] text-slate-400">Ort. Saat</p></div>
              <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-lg font-bold text-amber-300">${d.overtimeHours}s</p><p class="text-[10px] text-slate-400">Fazla Mesai</p></div>
              <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-lg font-bold text-blue-300">${d.efficiency}%</p><p class="text-[10px] text-slate-400">Verimlilik</p></div>
            </div>
            <div class="h-3 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r ${color}" style="width:${Math.min(100, d.utilization)}%"></div></div>
            <p class="text-[10px] text-slate-500 text-right mt-1">${d.totalHours}s / ${d.expectedHours}s beklenen</p>
          </div>`;
        }).join('')}
      </div>
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">📈 Departman Karşılaştırma</h3>
        <div class="space-y-3">
          ${data.map(d => `
            <div class="flex items-center gap-3">
              <span class="text-xs text-slate-300 w-28 truncate">${d.department}</span>
              <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                <div class="h-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-end pr-2" style="width:${Math.round(d.utilization / maxUtil * 100)}%">
                  <span class="text-[10px] font-bold text-white">${d.utilization}%</span>
                </div>
              </div>
              <span class="text-xs text-slate-400 w-12 text-right">${d.personnelCount} kişi</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  document.getElementById('prod-refresh').onclick = render;
  document.getElementById('prod-month').onchange = render;
  render();
}
