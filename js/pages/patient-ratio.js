// ===== HASTA-PERSONEL ORANI =====
import { getPatientStaffRatio } from '../state-extensions.js';

export function renderPatientRatioPage(el) {
  const data = getPatientStaffRatio();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏥 Hasta-Personel Oranı</h1>
      <p class="text-slate-400 text-sm mt-1">Vardiya bazlı hasta/personel oranı ve güvenli seviye kontrolü</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 fade-in">
      ${data.map(d => {
        const pct = Math.round(d.ratio / (d.safeRatio * 1.5) * 100);
        const color = d.status === 'critical' ? 'from-red-500 to-orange-500' : d.status === 'warning' ? 'from-amber-500 to-yellow-500' : 'from-green-500 to-emerald-500';
        const borderColor = d.status === 'critical' ? 'border-red-500/30' : d.status === 'warning' ? 'border-amber-500/20' : 'border-white/10';
        const statusEmoji = d.status === 'critical' ? '🔴' : d.status === 'warning' ? '🟡' : '🟢';
        return `<div class="card border ${borderColor}">
          <div class="flex items-center justify-between mb-3">
            <div><p class="text-sm font-semibold text-white">${d.department}</p><p class="text-xs text-slate-400">Güvenli: 1:${d.safeRatio}</p></div>
            <span class="text-2xl">${statusEmoji}</span>
          </div>
          <div class="text-center mb-3">
            <p class="text-3xl font-bold text-white">1:${d.ratio}</p>
            <p class="text-xs text-slate-400">Hasta/Personel Oranı</p>
          </div>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-lg font-bold text-cyan-300">${d.patients}</p><p class="text-[10px] text-slate-400">Hasta</p></div>
            <div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-lg font-bold text-blue-300">${d.staff}</p><p class="text-[10px] text-slate-400">Personel</p></div>
          </div>
          <div class="h-3 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-gradient-to-r ${color}" style="width:${Math.min(100, pct)}%"></div></div>
          ${d.status === 'critical' ? '<p class="text-xs text-red-400 mt-2 text-center font-medium">⚠️ Kritik seviye! Ek personel gerekli</p>' : d.status === 'warning' ? '<p class="text-xs text-amber-400 mt-2 text-center">⚠️ Sınırda, dikkatli olunmalı</p>' : ''}
        </div>`;
      }).join('')}
    </div>
    <div class="card fade-in">
      <h3 class="text-base font-semibold text-white mb-3">💡 Güvenli Hasta/Personel Oranları</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-3"><p class="text-sm text-green-300 font-medium">Yoğun Bakım</p><p class="text-lg font-bold text-white">1:2</p><p class="text-xs text-slate-400">Kritik hasta bakım oranı</p></div>
        <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3"><p class="text-sm text-amber-300 font-medium">Acil Servis</p><p class="text-lg font-bold text-white">1:4</p><p class="text-xs text-slate-400">Acil müdahale kapasitesi</p></div>
        <div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3"><p class="text-sm text-blue-300 font-medium">Servisler</p><p class="text-lg font-bold text-white">1:3</p><p class="text-xs text-slate-400">Standart servis bakımı</p></div>
      </div>
    </div>`;
}
