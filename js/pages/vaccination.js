// ===== AŞI TAKİP SİSTEMİ =====
const vaccines = [
  { id: 1, name: 'Hepatit B', dose: '3. doz', personnel: 'Dr. Arslan', date: '2026-01-05', nextDate: '2026-07-05', status: 'completed' },
  { id: 2, name: 'Tetanoz', dose: 'Rapel', personnel: 'Hemşire Ayşe', date: '2025-06-15', nextDate: '2035-06-15', status: 'completed' },
  { id: 3, name: 'COVID-19', dose: '4. doz', personnel: 'Dr. Kaya', date: '2025-11-20', nextDate: '-', status: 'completed' },
  { id: 4, name: 'Grip (Influenza)', dose: 'Yıllık', personnel: 'Tekniker Mehmet', date: '2025-10-01', nextDate: '2026-10-01', status: 'upcoming' },
  { id: 5, name: 'KKK (Kızamık)', dose: '2. doz', personnel: 'Temizlik Fatma', date: '-', nextDate: '2026-02-01', status: 'overdue' },
  { id: 6, name: 'Suçiçeği', dose: '1. doz', personnel: 'Güvenlik Hasan', date: '-', nextDate: '2026-01-20', status: 'upcoming' },
];

export function renderVaccinationPage(el) {
  const completed = vaccines.filter(v => v.status === 'completed').length;
  const upcoming = vaccines.filter(v => v.status === 'upcoming').length;
  const overdue = vaccines.filter(v => v.status === 'overdue').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">💉 Aşı Takip Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Personel aşı kartı, hepatit B takibi, hatırlatmalar</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${vaccines.length}</p><p class="text-xs text-slate-400">Toplam Kayıt</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${upcoming}</p><p class="text-xs text-slate-400">Yaklaşan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${overdue}</p><p class="text-xs text-slate-400">Gecikmiş</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">💉 Aşı Kayıtları</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Personel</th><th class="th">Aşı</th><th class="th">Doz</th><th class="th">Son Tarih</th><th class="th">Sonraki</th><th class="th">Durum</th></tr></thead>
          <tbody>${vaccines.map(v => `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td font-medium">${v.personnel}</td><td class="td">${v.name}</td><td class="td">${v.dose}</td>
            <td class="td text-xs">${v.date}</td><td class="td text-xs">${v.nextDate}</td>
            <td class="td">${v.status==='completed'?'<span class="badge bg-green-500/20 text-green-300">Tamamlandı</span>':v.status==='upcoming'?'<span class="badge bg-blue-500/20 text-blue-300">Yaklaşan</span>':'<span class="badge bg-red-500/20 text-red-300">Gecikmiş</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
