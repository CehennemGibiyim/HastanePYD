// ===== ENFEKSİYON KONTROL MODÜLÜ =====
const haiData = [
  { month: 'Ağu 2025', surgical: 2, cop: 1, urinary: 3, bloodstream: 1, total: 7, rate: 2.1 },
  { month: 'Eyl 2025', surgical: 1, cop: 2, urinary: 2, bloodstream: 0, total: 5, rate: 1.5 },
  { month: 'Eki 2025', surgical: 3, cop: 1, urinary: 4, bloodstream: 2, total: 10, rate: 3.0 },
  { month: 'Kas 2025', surgical: 2, cop: 2, urinary: 3, bloodstream: 1, total: 8, rate: 2.4 },
  { month: 'Ara 2025', surgical: 1, cop: 1, urinary: 2, bloodstream: 0, total: 4, rate: 1.2 },
  { month: 'Oca 2026', surgical: 2, cop: 1, urinary: 3, bloodstream: 1, total: 7, rate: 2.1 },
];

const handHygiene = [
  { dept: 'Yoğun Bakım', compliance: 92, audits: 45, target: 90 },
  { dept: 'Dahiliye', compliance: 88, audits: 38, target: 90 },
  { dept: 'Genel Cerrahi', compliance: 85, audits: 42, target: 90 },
  { dept: 'Kardiyoloji', compliance: 94, audits: 30, target: 90 },
  { dept: 'Pediatri', compliance: 90, audits: 25, target: 90 },
  { dept: 'Ortopedi', compliance: 82, audits: 28, target: 90 },
];

const infections = [
  { id: 1, patient: 'Elif Şahin', type: 'Kan enfeksiyonu (BSI)', ward: 'YBÜ', date: '2026-01-10', organism: 'MRSA', status: 'active', precaution: 'Kontak' },
  { id: 2, patient: 'Hasan Çelik', type: 'Cerrahi alan enfeksiyonu', ward: 'Cerrahi', date: '2026-01-08', organism: 'E. coli', status: 'treating', precaution: 'Standart' },
  { id: 3, patient: 'Zeynep Kara', type: 'Üriner enfeksiyon (CAUTI)', ward: 'Dahiliye', date: '2026-01-05', organism: 'Klebsiella', status: 'resolved', precaution: 'Standart' },
  { id: 4, patient: 'Kemal Bayrak', type: 'Pnömoni (VAP)', ward: 'YBÜ', date: '2026-01-11', organism: 'Pseudomonas', status: 'active', precaution: 'Damlacık' },
];

export function renderInfectionControlPage(el) {
  const latestRate = haiData[haiData.length - 1].rate;
  const activeInf = infections.filter(i => i.status === 'active').length;
  const avgCompliance = Math.round(handHygiene.reduce((s, h) => s + h.compliance, 0) / handHygiene.length);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🧯 Enfeksiyon Kontrol Komitesi</h1>
      <p class="text-slate-400 text-sm mt-1">HAI takibi, antibiyogram, hijyen uyumluluk, dezenfeksiyon</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold ${latestRate > 3 ? 'text-red-300' : latestRate > 2 ? 'text-amber-300' : 'text-green-300'}">%${latestRate}</p><p class="text-xs text-slate-400">HAI Oranı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${activeInf}</p><p class="text-xs text-slate-400">Aktif Enfeksiyon</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${avgCompliance >= 90 ? 'text-green-300' : 'text-amber-300'}">%${avgCompliance}</p><p class="text-xs text-slate-400">El Hijyeni Uyumluluk</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${infections.length}</p><p class="text-xs text-slate-400">Toplam Olay</p></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📊 Aylık HAI Trendi</h3>
        <div class="space-y-2">${haiData.map(h => `<div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 w-20">${h.month}</span>
          <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
            <div class="h-full rounded-lg bg-gradient-to-r from-red-500 to-amber-400 flex items-center justify-end pr-2" style="width:${Math.min(h.rate * 15, 100)}%">
              <span class="text-xs font-bold text-white">${h.rate}%</span>
            </div>
          </div>
          <span class="text-xs text-slate-500 w-8 text-right">${h.total}</span>
        </div>`).join('')}</div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🧼 El Hijyeni Uyumluluk</h3>
        <div class="space-y-3">${handHygiene.map(h => `<div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-slate-300">${h.dept}</span>
            <span class="font-bold ${h.compliance >= h.target ? 'text-green-300' : 'text-red-300'}">%${h.compliance}</span>
          </div>
          <div class="h-2 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full rounded-full ${h.compliance >= h.target ? 'bg-green-400' : 'bg-red-400'}" style="width:${h.compliance}%"></div>
          </div>
          <p class="text-[10px] text-slate-500">${h.audits} denetim · Hedef: %${h.target}</p>
        </div>`).join('')}</div>
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🦠 Aktif Enfeksiyon Kayıtları</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Hasta</th><th class="th">Tür</th><th class="th">Servis</th><th class="th">Organizma</th><th class="th">Önlem</th><th class="th">Tarih</th><th class="th">Durum</th></tr></thead>
          <tbody>${infections.map(i => `<tr class="border-t border-white/5 hover:bg-white/5 ${i.status==='active'?'bg-red-500/5':''}">
            <td class="td font-medium">${i.patient}</td><td class="td text-xs">${i.type}</td><td class="td">${i.ward}</td>
            <td class="td"><span class="badge bg-red-500/20 text-red-300">${i.organism}</span></td>
            <td class="td text-xs">${i.precaution}</td><td class="td text-xs">${i.date}</td>
            <td class="td">${i.status==='active'?'<span class="badge bg-red-500/20 text-red-300">Aktif</span>':i.status==='treating'?'<span class="badge bg-amber-500/20 text-amber-300">Tedavi</span>':'<span class="badge bg-green-500/20 text-green-300">İyileşti</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
