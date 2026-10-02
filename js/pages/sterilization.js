// ===== STERİLİZASYON TAKİBİ =====
const cycles = [
  { id: 'ST-001', date: '2026-01-12', machine: 'Otoklav A', type: 'Buhar', duration: '45 dk', temp: '134°C', status: 'passed', operator: 'Tekniker Ayşe', sets: ['Genel Cerrahi Seti', 'Küçük Cerrahi Seti'] },
  { id: 'ST-002', date: '2026-01-12', machine: 'Otoklav B', type: 'Buhar', duration: '30 dk', temp: '121°C', status: 'passed', operator: 'Tekniker Mehmet', sets: ['Jinekoloji Seti'] },
  { id: 'ST-003', date: '2026-01-11', machine: 'Otoklav A', type: 'Buhar', duration: '45 dk', temp: '134°C', status: 'failed', operator: 'Tekniker Ayşe', sets: ['Ortopedi Seti'] },
  { id: 'ST-004', date: '2026-01-11', machine: 'Plazma', type: 'Hidrojen Peroksit', duration: '55 dk', temp: '50°C', status: 'passed', operator: 'Tekniker Mehmet', sets: ['Endoskopi Seti', 'Laparoskopi Seti'] },
  { id: 'ST-005', date: '2026-01-10', machine: 'Otoklav A', type: 'Buhar', duration: '45 dk', temp: '134°C', status: 'passed', operator: 'Tekniker Ayşe', sets: ['Genel Cerrahi Seti'] },
];

const packages = [
  { id: 'PKG-001', set: 'Genel Cerrahi Seti', sterilized: '2026-01-12', expiry: '2026-02-12', location: 'Ameliyathane Deposu', status: 'sterile' },
  { id: 'PKG-002', set: 'Küçük Cerrahi Seti', sterilized: '2026-01-12', expiry: '2026-02-12', location: 'Poliklinik', status: 'sterile' },
  { id: 'PKG-003', set: 'Ortopedi Seti', sterilized: '2026-01-08', expiry: '2026-02-08', location: 'Ameliyathane Deposu', status: 'expired' },
  { id: 'PKG-004', set: 'Endoskopi Seti', sterilized: '2026-01-11', expiry: '2026-02-11', location: 'Endoskopi Ünitesi', status: 'sterile' },
  { id: 'PKG-005', set: 'Jinekoloji Seti', sterilized: '2026-01-12', expiry: '2026-02-12', location: 'Doğumhane', status: 'sterile' },
];

export function renderSterilizationPage(el) {
  const passed = cycles.filter(c => c.status === 'passed').length;
  const failed = cycles.filter(c => c.status === 'failed').length;
  const sterile = packages.filter(p => p.status === 'sterile').length;
  const expired = packages.filter(p => p.status === 'expired').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🧫 Sterilizasyon Takibi</h1>
      <p class="text-slate-400 text-sm mt-1">Otoklav döngü kaydı, paket takibi, biyolojik indikatör</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${cycles.length}</p><p class="text-xs text-slate-400">Toplam Döngü</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${passed}</p><p class="text-xs text-slate-400">Başarılı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${failed}</p><p class="text-xs text-slate-400">Başarısız</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${expired > 0 ? 'text-amber-300' : 'text-green-300'}">${sterile}/${packages.length}</p><p class="text-xs text-slate-400">Steril Paket</p></div>
    </div>
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🔄 Son Sterilizasyon Döngüleri</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">ID</th><th class="th">Makine</th><th class="th">Tür</th><th class="th">Süre</th><th class="th">Sıcaklık</th><th class="th">Setler</th><th class="th">Tarih</th><th class="th">Durum</th></tr></thead>
          <tbody>${cycles.map(c => `<tr class="border-t border-white/5 hover:bg-white/5 ${c.status==='failed'?'bg-red-500/5':''}">
            <td class="td font-mono text-xs">${c.id}</td><td class="td">${c.machine}</td><td class="td text-xs">${c.type}</td>
            <td class="td">${c.duration}</td><td class="td">${c.temp}</td>
            <td class="td text-xs">${c.sets.join(', ')}</td><td class="td text-xs">${c.date}</td>
            <td class="td">${c.status==='passed'?'<span class="badge bg-green-500/20 text-green-300">Başarılı</span>':'<span class="badge bg-red-500/20 text-red-300">Başarısız</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📦 Steril Paket Takibi</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Paket</th><th class="th">Set</th><th class="th">Sterilize</th><th class="th">Son Kullanma</th><th class="th">Konum</th><th class="th">Durum</th></tr></thead>
          <tbody>${packages.map(p => `<tr class="border-t border-white/5 hover:bg-white/5 ${p.status==='expired'?'bg-red-500/5':''}">
            <td class="td font-mono text-xs">${p.id}</td><td class="td">${p.set}</td><td class="td text-xs">${p.sterilized}</td>
            <td class="td text-xs">${p.expiry}</td><td class="td text-xs">${p.location}</td>
            <td class="td">${p.status==='sterile'?'<span class="badge bg-green-500/20 text-green-300">Steril</span>':'<span class="badge bg-red-500/20 text-red-300">Süresi Dolmuş</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
