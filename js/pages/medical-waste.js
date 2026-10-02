// ===== TIBBI ATIK YÖNETİMİ =====
const wasteRecords = [
  { id: 1, date: '2026-01-12', type: 'Enfeksiyöz', weight: 12.5, unit: 'kg', source: 'Yoğun Bakım', handler: 'Atık Sorumlusu Kemal', status: 'collected', container: 'Kırmızı Çanta' },
  { id: 2, date: '2026-01-12', type: 'Kesici-Delici', weight: 2.3, unit: 'kg', source: 'Genel Cerrahi', handler: 'Atık Sorumlusu Kemal', status: 'collected', container: 'Sarı Kutu' },
  { id: 3, date: '2026-01-12', type: 'Evsel', weight: 45.0, unit: 'kg', source: 'Tüm Servisler', handler: 'Temizlik Hasan', status: 'collected', container: 'Siyah Çöp' },
  { id: 4, date: '2026-01-11', type: 'Enfeksiyöz', weight: 8.2, unit: 'kg', source: 'Dahiliye', handler: 'Atık Sorumlusu Kemal', status: 'disposed', container: 'Kırmızı Çanta' },
  { id: 5, date: '2026-01-11', type: 'İlaç Atığı', weight: 1.1, unit: 'kg', source: 'Eczane', handler: 'Eczacı Ayşe', status: 'pending', container: 'Mor Kutu' },
  { id: 6, date: '2026-01-11', type: 'Kimyasal', weight: 3.5, unit: 'kg', source: 'Laboratuvar', handler: 'Lab Tek. Mehmet', status: 'pending', container: 'Kahverengi Bidon' },
];

const wasteTypes = [
  { type: 'Enfeksiyöz', icon: '🔴', color: 'red', container: 'Kırmızı Çanta/Kutu', desc: 'Kan, vücut sıvıları, mikrobiyal kültür' },
  { type: 'Kesici-Delici', icon: '🟡', color: 'amber', container: 'Sarı Kutu', desc: 'İğne, bistüri, cam kırığı' },
  { type: 'İlaç Atığı', icon: '🟣', color: 'purple', container: 'Mor Kutu', desc: 'Kullanılmayan ilaçlar, aşı atıkları' },
  { type: 'Kimyasal', icon: '🟤', color: 'orange', container: 'Kahverengi Bidon', desc: 'Laboratuvar kimyasalları, dezenfektanlar' },
  { type: 'Evsel', icon: '⚫', color: 'slate', container: 'Siyah Çöp', desc: 'Genel evsel atıklar' },
];

export function renderMedicalWastePage(el) {
  const totalWeight = wasteRecords.reduce((s, w) => s + w.weight, 0);
  const infectious = wasteRecords.filter(w => w.type === 'Enfeksiyöz').reduce((s, w) => s + w.weight, 0);
  const pending = wasteRecords.filter(w => w.status === 'pending').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📦 Tıbbi Atık Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Atık türü ayrıştırma, taşıma lisansı, bertaraf kaydı</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${totalWeight.toFixed(1)} kg</p><p class="text-xs text-slate-400">Toplam Atık</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${infectious.toFixed(1)} kg</p><p class="text-xs text-slate-400">Enfeksiyöz</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${pending}</p><p class="text-xs text-slate-400">Bekleyen</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${wasteTypes.length}</p><p class="text-xs text-slate-400">Atık Türü</p></div>
    </div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">♻️ Atık Türleri & Ayrıştırma</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        ${wasteTypes.map(w => `
          <div class="rounded-xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-2xl">${w.icon}</span>
              <span class="font-medium text-white">${w.type}</span>
            </div>
            <p class="text-xs text-slate-400 mb-2">${w.desc}</p>
            <p class="text-xs text-cyan-300">${w.container}</p>
          </div>`).join('')}
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Son Atık Kayıtları</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Tarih</th><th class="th">Tür</th><th class="th">Ağırlık</th><th class="th">Kaynak</th><th class="th">Konteyner</th><th class="th">Sorumlu</th><th class="th">Durum</th></tr></thead>
          <tbody>${wasteRecords.map(w => `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td text-xs">${w.date}</td><td class="td"><span class="badge">${w.type}</span></td>
            <td class="td font-bold">${w.weight} ${w.unit}</td><td class="td text-xs">${w.source}</td>
            <td class="td text-xs">${w.container}</td><td class="td text-xs">${w.handler}</td>
            <td class="td">${w.status==='collected'?'<span class="badge bg-green-500/20 text-green-300">Toplandı</span>':w.status==='disposed'?'<span class="badge bg-blue-500/20 text-blue-300">Bertaraf</span>':'<span class="badge bg-amber-500/20 text-amber-300">Bekliyor</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
