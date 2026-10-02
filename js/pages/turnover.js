// ===== TURNOVER ANALIZI =====
import { getTurnoverData } from '../state-extensions.js';

export function renderTurnoverPage(el) {
  const data = getTurnoverData(12);
  const totalTransfers = data.reduce((s, d) => s + d.transfers, 0);
  const avgRate = data.length ? (data.reduce((s, d) => s + d.turnoverRate, 0) / data.length) : 0;
  const maxRate = Math.max(...data.map(d => d.turnoverRate), 1);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Turnover Analizi</h1>
      <p class="text-slate-400 text-sm mt-1">Personel transfer ve işten ayrılma trendleri</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-2xl font-bold text-white">${totalTransfers}</p><p class="text-xs text-slate-400">Toplam Transfer (12 ay)</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">%${avgRate.toFixed(1)}</p><p class="text-xs text-slate-400">Ortalama Oran</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${data[data.length - 1]?.totalPersonnel || 0}</p><p class="text-xs text-slate-400">Mevcut Personel</p></div>
      <div class="card text-center"><p class="text-2xl font-bold ${avgRate > 5 ? 'text-red-300' : 'text-green-300'}">${avgRate > 5 ? '⚠️ Yüksek' : '✅ Normal'}</p><p class="text-xs text-slate-400">Durum</p></div>
    </div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📈 Aylık Trend</h3>
      <div class="space-y-2">
        ${data.map(d => {
          const barPct = maxRate ? Math.round(d.turnoverRate / maxRate * 100) : 0;
          const color = d.turnoverRate > 5 ? 'from-red-500 to-orange-500' : d.turnoverRate > 3 ? 'from-amber-500 to-yellow-500' : 'from-green-500 to-emerald-500';
          const [y, m] = d.month.split('-');
          const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
          return `<div class="flex items-center gap-3">
            <span class="text-xs text-slate-400 w-16">${monthNames[parseInt(m) - 1]} ${y.slice(2)}</span>
            <div class="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden">
              <div class="h-full rounded-lg bg-gradient-to-r ${color} flex items-center justify-end pr-2" style="width:${Math.max(barPct, 2)}%">
                ${d.transfers > 0 ? '<span class="text-[10px] font-bold text-white">' + d.transfers + ' transfer · %' + d.turnoverRate + '</span>' : ''}
              </div>
            </div>
            <span class="text-xs text-slate-500 w-12 text-right">${d.totalPersonnel}p</span>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-base font-semibold text-white mb-3">💡 Bilgi</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-3"><p class="text-sm text-green-300 font-medium">%0-3 Normal</p><p class="text-xs text-slate-400 mt-1">Sağlıklı turnover seviyesi</p></div>
        <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3"><p class="text-sm text-amber-300 font-medium">%3-5 Dikkat</p><p class="text-xs text-slate-400 mt-1">İzlenmeli, nedenleri araştırılmalı</p></div>
        <div class="rounded-lg bg-red-500/10 border border-red-500/20 p-3"><p class="text-sm text-red-300 font-medium">%5+ Kritik</p><p class="text-xs text-slate-400 mt-1">Acil müdahale gerekli</p></div>
      </div>
    </div>`;
}
