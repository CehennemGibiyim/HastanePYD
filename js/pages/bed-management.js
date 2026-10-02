// ===== YATAK YÖNETİM SİSTEMİ =====
const beds = [
  { id: 'DAH-01', service: 'Dahiliye', floor: 2, status: 'occupied', patient: 'Ahmet Yılmaz', admitDate: '2026-01-08', doctor: 'Dr. Kaya', diagnosis: 'Pnömoni' },
  { id: 'DAH-02', service: 'Dahiliye', floor: 2, status: 'occupied', patient: 'Fatma Demir', admitDate: '2026-01-10', doctor: 'Dr. Kaya', diagnosis: 'Diyabet Ketoasidoz' },
  { id: 'DAH-03', service: 'Dahiliye', floor: 2, status: 'empty', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'DAH-04', service: 'Dahiliye', floor: 2, status: 'cleaning', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'CER-01', service: 'Genel Cerrahi', floor: 3, status: 'occupied', patient: 'Mehmet Çelik', admitDate: '2026-01-09', doctor: 'Dr. Yıldız', diagnosis: 'Apandisit' },
  { id: 'CER-02', service: 'Genel Cerrahi', floor: 3, status: 'occupied', patient: 'Ayşe Korkmaz', admitDate: '2026-01-11', doctor: 'Dr. Yıldız', diagnosis: 'Kolesistit' },
  { id: 'CER-03', service: 'Genel Cerrahi', floor: 3, status: 'reserved', patient: 'Hasan Aydın', admitDate: '2026-01-13', doctor: 'Dr. Yıldız', diagnosis: 'Planlı Cerrahi' },
  { id: 'CER-04', service: 'Genel Cerrahi', floor: 3, status: 'empty', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'KAR-01', service: 'Kardiyoloji', floor: 4, status: 'occupied', patient: 'Zeynep Kara', admitDate: '2026-01-07', doctor: 'Dr. Arslan', diagnosis: 'AKS' },
  { id: 'KAR-02', service: 'Kardiyoloji', floor: 4, status: 'occupied', patient: 'Ali Yıldırım', admitDate: '2026-01-12', doctor: 'Dr. Arslan', diagnosis: 'Kalp Yetmezliği' },
  { id: 'KAR-03', service: 'Kardiyoloji', floor: 4, status: 'empty', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'KAR-04', service: 'Kardiyoloji', floor: 4, status: 'maintenance', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'YBÜ-01', service: 'Yoğun Bakım', floor: 1, status: 'occupied', patient: 'Elif Şahin', admitDate: '2026-01-06', doctor: 'Dr. Öztürk', diagnosis: 'Sepsis' },
  { id: 'YBÜ-02', service: 'Yoğun Bakım', floor: 1, status: 'occupied', patient: 'Murat Özkan', admitDate: '2026-01-11', doctor: 'Dr. Öztürk', diagnosis: 'ARDS' },
  { id: 'YBÜ-03', service: 'Yoğun Bakım', floor: 1, status: 'occupied', patient: 'Selin Yurt', admitDate: '2026-01-10', doctor: 'Dr. Arslan', diagnosis: 'STEMI' },
  { id: 'YBÜ-04', service: 'Yoğun Bakım', floor: 1, status: 'empty', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'ORT-01', service: 'Ortopedi', floor: 3, status: 'occupied', patient: 'Kemal Doğan', admitDate: '2026-01-09', doctor: 'Dr. Çelik', diagnosis: 'Kalça Kırığı' },
  { id: 'ORT-02', service: 'Ortopedi', floor: 3, status: 'empty', patient: null, admitDate: null, doctor: null, diagnosis: null },
  { id: 'NÖR-01', service: 'Nöroloji', floor: 4, status: 'occupied', patient: 'Aylin Koç', admitDate: '2026-01-11', doctor: 'Dr. Yılmaz', diagnosis: 'Stroke' },
  { id: 'NÖR-02', service: 'Nöroloji', floor: 4, status: 'empty', patient: null, admitDate: null, doctor: null, diagnosis: null },
];

export function renderBedManagementPage(el) {
  const total = beds.length;
  const occupied = beds.filter(b => b.status === 'occupied').length;
  const empty = beds.filter(b => b.status === 'empty').length;
  const occupancy = Math.round((occupied / total) * 100);

  const services = {};
  beds.forEach(b => {
    if (!services[b.service]) services[b.service] = { total: 0, occupied: 0 };
    services[b.service].total++;
    if (b.status === 'occupied') services[b.service].occupied++;
  });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🛏️ Yatak Yönetim Sistemi</h1>
      <p class="text-slate-400 text-sm mt-1">Servis bazlı yatak haritası, doluluk oranı, tahliye planı</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${total}</p><p class="text-xs text-slate-400">Toplam Yatak</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${occupied}</p><p class="text-xs text-slate-400">Dolu</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${empty}</p><p class="text-xs text-slate-400">Boş</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${occupancy > 85 ? 'text-red-300' : occupancy > 70 ? 'text-amber-300' : 'text-green-300'}">%${occupancy}</p><p class="text-xs text-slate-400">Doluluk Oranı</p></div>
    </div>

    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📊 Servis Bazlı Doluluk</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${Object.entries(services).map(([name, s]) => {
          const pct = Math.round((s.occupied / s.total) * 100);
          return `
          <div class="rounded-xl bg-white/5 border border-white/10 p-3">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-white">${name}</span>
              <span class="text-xs ${pct > 85 ? 'text-red-300' : pct > 60 ? 'text-amber-300' : 'text-green-300'}">%${pct}</span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full ${pct > 85 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-green-400'}" style="width:${pct}%"></div>
            </div>
            <p class="text-xs text-slate-500 mt-1">${s.occupied}/${s.total} yatak dolu</p>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🗺️ Yatak Haritası</h3>
      <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
        ${beds.map(b => `
          <div class="rounded-lg p-2 text-center cursor-pointer hover:scale-105 transition ${b.status === 'occupied' ? 'bg-red-500/15 border border-red-500/30' : b.status === 'empty' ? 'bg-green-500/15 border border-green-500/30' : b.status === 'reserved' ? 'bg-blue-500/15 border border-blue-500/30' : b.status === 'cleaning' ? 'bg-amber-500/15 border border-amber-500/30' : 'bg-slate-500/15 border border-slate-500/30'}" title="${b.patient || b.status}">
            <p class="text-xs font-bold ${b.status === 'occupied' ? 'text-red-300' : b.status === 'empty' ? 'text-green-300' : b.status === 'reserved' ? 'text-blue-300' : 'text-amber-300'}">${b.id}</p>
            <p class="text-[8px] text-slate-500">${b.status === 'occupied' ? b.patient?.split(' ')[0] : b.status === 'empty' ? 'Boş' : b.status === 'reserved' ? 'Rezerve' : b.status === 'cleaning' ? 'Temizlik' : 'Bakım'}</p>
          </div>`).join('')}
      </div>
      <div class="flex gap-4 mt-4 text-xs text-slate-400">
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-500/30"></span> Dolu</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-green-500/30"></span> Boş</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-500/30"></span> Rezerve</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-amber-500/30"></span> Temizlik</span>
        <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-slate-500/30"></span> Bakım</span>
      </div>
    </div>`;
}
