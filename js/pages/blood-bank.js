// ===== KAN BANKASI YÖNETİMİ =====
const bloodStock = [
  { group: 'A Rh+', units: 45, expiring: 3, critical: false },
  { group: 'A Rh-', units: 12, expiring: 1, critical: false },
  { group: 'B Rh+', units: 38, expiring: 2, critical: false },
  { group: 'B Rh-', units: 5, expiring: 0, critical: true },
  { group: 'AB Rh+', units: 8, expiring: 1, critical: false },
  { group: 'AB Rh-', units: 2, expiring: 0, critical: true },
  { group: '0 Rh+', units: 52, expiring: 4, critical: false },
  { group: '0 Rh-', units: 7, expiring: 1, critical: true },
];

const transfusions = [
  { id: 1, patient: 'Elif Şahin', bloodGroup: 'A Rh+', units: 2, date: '2026-01-12', doctor: 'Dr. Öztürk', reason: 'Anemi', status: 'completed' },
  { id: 2, patient: 'Kemal Doğan', bloodGroup: '0 Rh+', units: 3, date: '2026-01-11', doctor: 'Dr. Çelik', reason: 'Travma', status: 'completed' },
  { id: 3, patient: 'Aylin Koç', bloodGroup: 'B Rh-', units: 1, date: '2026-01-13', doctor: 'Dr. Yılmaz', reason: 'Cerrahi', status: 'pending' },
  { id: 4, patient: 'Murat Özkan', bloodGroup: 'AB Rh+', units: 2, date: '2026-01-13', doctor: 'Dr. Öztürk', reason: 'Sepsis', status: 'in-progress' },
];

export function renderBloodBankPage(el) {
  const totalUnits = bloodStock.reduce((s, b) => s + b.units, 0);
  const critical = bloodStock.filter(b => b.critical).length;
  const expiring = bloodStock.reduce((s, b) => s + b.expiring, 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🩸 Kan Bankası Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Kan stoku, transfüzyon takibi, uyumluluk kontrolü</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${totalUnits}</p><p class="text-xs text-slate-400">Toplam Ünite</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${critical}</p><p class="text-xs text-slate-400">Kritik Stok</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-orange-300">${expiring}</p><p class="text-xs text-slate-400">Süresi Dolacak</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${transfusions.length}</p><p class="text-xs text-slate-400">Transfüzyon</p></div>
    </div>

    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🩸 Kan Grubu Stok Durumu</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${bloodStock.map(b => `
          <div class="rounded-xl ${b.critical ? 'bg-red-500/10 border border-red-500/30' : 'bg-white/5 border border-white/10'} p-4 text-center">
            <p class="text-2xl font-bold ${b.critical ? 'text-red-300' : 'text-white'}">${b.group}</p>
            <p class="text-3xl font-bold ${b.units < 10 ? 'text-red-300' : b.units < 20 ? 'text-amber-300' : 'text-green-300'} mt-1">${b.units}</p>
            <p class="text-xs text-slate-400">ünite</p>
            ${b.expiring > 0 ? `<p class="text-[10px] text-orange-400 mt-1">⚠️ ${b.expiring} ünite son kullanma yakın</p>` : ''}
            ${b.critical ? '<p class="text-[10px] text-red-400 mt-1">🔴 KRİTİK SEVİYE</p>' : ''}
          </div>`).join('')}
      </div>
    </div>

    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">💉 Son Transfüzyonlar</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Hasta</th><th class="th">Kan Grubu</th><th class="th">Ünite</th><th class="th">Doktor</th><th class="th">Neden</th><th class="th">Tarih</th><th class="th">Durum</th></tr></thead>
          <tbody>${transfusions.map(t => `
            <tr class="border-t border-white/5 hover:bg-white/5">
              <td class="td font-medium">${t.patient}</td>
              <td class="td"><span class="badge bg-red-500/20 text-red-300">${t.bloodGroup}</span></td>
              <td class="td font-bold">${t.units}</td>
              <td class="td">${t.doctor}</td>
              <td class="td">${t.reason}</td>
              <td class="td text-xs">${t.date}</td>
              <td class="td">${t.status === 'completed' ? '<span class="badge bg-green-500/20 text-green-300">Tamamlandı</span>' : t.status === 'in-progress' ? '<span class="badge bg-blue-500/20 text-blue-300">Devam Ediyor</span>' : '<span class="badge bg-amber-500/20 text-amber-300">Bekliyor</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}
