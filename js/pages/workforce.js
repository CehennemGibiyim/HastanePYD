// ===== IS GUCU PLANLAMA =====
import { getWorkforcePlan } from '../state-extensions.js';

export function renderWorkforcePage(el) {
  const data = getWorkforcePlan();
  const totalNeeded = data.reduce((s, d) => s + d.neededStaff, 0);
  const totalCurrent = data.reduce((s, d) => s + d.currentStaff, 0);
  const avgUtil = data.length ? Math.round(data.reduce((s, d) => s + d.utilization, 0) / data.length) : 0;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 İş Gücü Planlama</h1>
      <p class="text-slate-400 text-sm mt-1">Gelecek dönem personel ihtiyacı ve projeksiyon</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-2xl font-bold text-white">${totalCurrent}</p><p class="text-xs text-slate-400">Mevcut Personel</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">%${avgUtil}</p><p class="text-xs text-slate-400">Ort. Kullanım</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-amber-300">+${totalNeeded}</p><p class="text-xs text-slate-400">İhtiyaç Duyulan</p></div>
      <div class="card text-center"><p class="text-2xl font-bold ${data.filter(d => d.status === 'critical').length > 0 ? 'text-red-300' : 'text-green-300'}">${data.filter(d => d.status === 'critical').length}</p><p class="text-xs text-slate-400">Kritik Departman</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Bazlı İhtiyaç</h3>
      <div class="space-y-3">
        ${data.map(d => {
          const color = d.status === 'critical' ? 'from-red-500 to-orange-500' : d.status === 'warning' ? 'from-amber-500 to-yellow-500' : 'from-green-500 to-emerald-500';
          const statusEmoji = d.status === 'critical' ? '🔴' : d.status === 'warning' ? '🟡' : '🟢';
          return `<div class="card border ${d.status === 'critical' ? 'border-red-500/30' : d.status === 'warning' ? 'border-amber-500/20' : 'border-white/10'}">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span>${statusEmoji}</span>
                <span class="text-sm font-semibold text-white">${d.department}</span>
              </div>
              <div class="flex items-center gap-3 text-xs">
                <span class="text-slate-400">Personel: <span class="text-white font-medium">${d.currentStaff}</span></span>
                ${d.neededStaff > 0 ? '<span class="text-amber-300 font-medium">+' + d.neededStaff + ' gerekli</span>' : '<span class="text-green-400">Yeterli</span>'}
              </div>
            </div>
            <div class="h-3 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r ${color}" style="width:${Math.min(100, d.utilization)}%"></div></div>
            <p class="text-[10px] text-slate-500 text-right mt-1">Kullanım: %${d.utilization}</p>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}
