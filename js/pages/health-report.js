// ===== İŞE GİRİŞ SAĞLIK RAPORU =====
const healthReports = [
  { id: 1, personnel: 'Dr. Arslan', dept: 'Kardiyoloji', hireDate: '2020-03-15', lastExam: '2025-03-15', nextExam: '2026-03-15', riskGroup: 'Düşük', status: 'valid', doctor: 'İşyeri Hekimi Dr. Veli' },
  { id: 2, person: 'Temizlik Hasan', dept: 'Temizlik', hireDate: '2022-06-01', lastExam: '2025-06-01', nextExam: '2026-06-01', riskGroup: 'Orta', status: 'valid', doctor: 'İşyeri Hekimi Dr. Veli' },
  { id: 3, personnel: 'Radyoloji Tek. Ayşe', dept: 'Radyoloji', hireDate: '2021-09-10', lastExam: '2025-09-10', nextExam: '2026-03-10', riskGroup: 'Yüksek', status: 'expiring', doctor: 'İşyeri Hekimi Dr. Veli' },
  { id: 4, personnel: 'Güvenlik Kemal', dept: 'Güvenlik', hireDate: '2023-01-20', lastExam: '2024-01-20', nextExam: '2025-01-20', riskGroup: 'Düşük', status: 'expired', doctor: 'İşyeri Hekimi Dr. Veli' },
  { id: 5, personnel: 'Hemşire Fatma', dept: 'Dahiliye', hireDate: '2019-11-01', lastExam: '2025-11-01', nextExam: '2026-11-01', riskGroup: 'Orta', status: 'valid', doctor: 'İşyeri Hekimi Dr. Veli' },
];

export function renderHealthReportPage(el) {
  const valid = healthReports.filter(r => r.status === 'valid').length;
  const expiring = healthReports.filter(r => r.status === 'expiring').length;
  const expired = healthReports.filter(r => r.status === 'expired').length;
  const highRisk = healthReports.filter(r => r.riskGroup === 'Yüksek').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📋 İşe Giriş Sağlık Raporu</h1>
      <p class="text-slate-400 text-sm mt-1">Sağlık muayene kaydı, periyodik muayene, risk grubu takibi</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${healthReports.length}</p><p class="text-xs text-slate-400">Toplam Kayıt</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${valid}</p><p class="text-xs text-slate-400">Geçerli</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${expiring + expired}</p><p class="text-xs text-slate-400">Süresi Dolan/Yakın</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${highRisk}</p><p class="text-xs text-slate-400">Yüksek Risk</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🩺 Sağlık Raporları</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Personel</th><th class="th">Departman</th><th class="th">Risk Grubu</th><th class="th">Son Muayene</th><th class="th">Sonraki</th><th class="th">Hekim</th><th class="th">Durum</th></tr></thead>
          <tbody>${healthReports.map(r => `<tr class="border-t border-white/5 hover:bg-white/5 ${r.status==='expired'?'bg-red-500/5':''}">
            <td class="td font-medium">${r.personnel || r.person}</td><td class="td">${r.dept}</td>
            <td class="td"><span class="badge ${r.riskGroup==='Yüksek'?'bg-red-500/20 text-red-300':r.riskGroup==='Orta'?'bg-amber-500/20 text-amber-300':'bg-green-500/20 text-green-300'}">${r.riskGroup}</span></td>
            <td class="td text-xs">${r.lastExam}</td><td class="td text-xs">${r.nextExam}</td><td class="td text-xs">${r.doctor}</td>
            <td class="td">${r.status==='valid'?'<span class="badge bg-green-500/20 text-green-300">Geçerli</span>':r.status==='expiring'?'<span class="badge bg-amber-500/20 text-amber-300">Yakında Bitecek</span>':'<span class="badge bg-red-500/20 text-red-300">Süresi Dolmuş</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
