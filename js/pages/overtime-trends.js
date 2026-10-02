// ===== MESAI TREND & ANOMALI =====
import { getOvertimeTrends } from '../state-extensions.js';

export function renderOvertimeTrendsPage(el) {
  const data = getOvertimeTrends(12);
  const maxOT = Math.max(...data.map(d => d.totalOvertime), 1);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Mesai Trend & Anomali</h1>
      <p class="text-slate-400 text-sm mt-1">Aylık fazla mesai trendi ve anomali tespiti</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-2xl font-bold text-white">${data[data.length - 1]?.totalOvertime || 0}s</p><p class="text-xs text-slate-400">Bu Ay Toplam Mesai</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${data[data.length - 1]?.avgOvertime || 0}s</p><p class="text-xs text-slate-400">Kişi Başı Ortalama</p></div>
      <div class="card text-center"><p class="text-2xl font-bold ${data.some(d => d.anomaly) ? 'text-red-300' : 'text-green-300'}">${data.some(d => d.anomaly) ? '⚠️ Anomali' : '✅ Normal'}</p><p class="text-xs text-slate-400">Durum</p></div>
    </div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📈 Aylık Mesai Trendi</h3>
      <div class="space-y-2">
        ${data.map(d => {
          const barPct = maxOT ? Math.round(d.totalOvertime / maxOT * 100) : 0;
          const [y, m] = d.month.split('-');
          const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
          const color = d.anomaly ? 'from-red-500 to-orange-500' : 'from-cyan-500 to-blue-500';
          return `<div class="flex items-center gap-3 ${d.anomaly ? 'rounded-lg bg-red-500/5 px-2 py-1' : ''}">
            <span class="text-xs text-slate-400 w-16">${monthNames[parseInt(m) - 1]} ${y.slice(2)}</span>
            <div class="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden relative">
              <div class="h-full rounded-lg bg-gradient-to-r ${color} flex items-center justify-end pr-2 transition-all" style="width:${Math.max(barPct, 3)}%">
                <span class="text-[10px] font-bold text-white">${d.totalOvertime}s</span>
              </div>
            </div>
            <div class="text-right w-20">
              <span class="text-xs text-slate-500">${d.avgOvertime}s/kişi</span>
              ${d.anomaly ? '<span class="text-[10px] text-red-400 block">⚠️ Anomali</span>' : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
    ${data.some(d => d.anomaly) ? `
    <div class="card border border-red-500/30 bg-red-500/5 fade-in">
      <h3 class="text-base font-semibold text-red-300 mb-3">⚠️ Tespit Edilen Anomaliler</h3>
      <div class="space-y-2">${data.filter(d => d.anomaly).map(d => {
        const prev = data.filter(x => x.month < d.month);
        const prevAvg = prev.length ? prev.reduce((s, x) => s + x.totalOvertime, 0) / prev.length : 0;
        const increase = prevAvg ? Math.round((d.totalOvertime - prevAvg) / prevAvg * 100) : 0;
        return `<div class="rounded-lg bg-white/5 p-3">
          <p class="text-sm text-white font-medium">${d.month}</p>
          <p class="text-xs text-slate-400 mt-1">Toplam mesai ${d.totalOvertime}s — önceki aylar ortalamasına göre %${increase} artış</p>
        </div>`;
      }).join('')}</div>
    </div>` : ''}
    <div class="card mt-6 fade-in">
      <h3 class="text-base font-semibold text-white mb-3">💡 Bilgi</h3>
      <p class="text-sm text-slate-400">Anomali tespiti: Bir ayın toplam mesai süresi, önceki ayların ortalamasının 1.5 katından fazlaysa anomali olarak işaretlenir.</p>
    </div>`;
}
