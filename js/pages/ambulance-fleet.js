// ===== AMBULANS FİLO YÖNETİMİ =====
const ambulances = [
  { id: 'AMB-01', plate: '34 ABC 001', type: 'A Tipi (Acil)', driver: 'Ahmet Usta', status: 'available', mileage: 45230, lastService: '2025-12-01', nextService: '2026-03-01', fuelLevel: 85 },
  { id: 'AMB-02', plate: '34 ABC 002', type: 'A Tipi (Acil)', driver: 'Mehmet Yolcu', status: 'on-call', mileage: 32150, lastService: '2025-11-15', nextService: '2026-02-15', fuelLevel: 62 },
  { id: 'AMB-03', plate: '34 ABC 003', type: 'C Tipi (Yoğun Bakım)', driver: 'Hasan Güven', status: 'available', mileage: 28900, lastService: '2026-01-05', nextService: '2026-04-05', fuelLevel: 92 },
  { id: 'AMB-04', plate: '34 ABC 004', type: 'B Tipi (Hasta Nakil)', driver: 'Kemal Şahin', status: 'maintenance', mileage: 67800, lastService: '2025-10-01', nextService: '2026-01-01', fuelLevel: 45 },
  { id: 'AMB-05', plate: '34 ABC 005', type: 'A Tipi (Acil)', driver: 'Ali Yıldız', status: 'available', mileage: 15600, lastService: '2026-01-10', nextService: '2026-04-10', fuelLevel: 78 },
];

export function renderAmbulanceFleetPage(el) {
  const available = ambulances.filter(a => a.status === 'available').length;
  const onCall = ambulances.filter(a => a.status === 'on-call').length;
  const maintenance = ambulances.filter(a => a.status === 'maintenance').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🚑 Ambulans Filo Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Ambulans takibi, bakım, yakıt, sürücü atama</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${ambulances.length}</p><p class="text-xs text-slate-400">Toplam Ambulans</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${available}</p><p class="text-xs text-slate-400">Müsait</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${onCall}</p><p class="text-xs text-slate-400">Görevde</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${maintenance}</p><p class="text-xs text-slate-400">Bakımda</p></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 fade-in">
      ${ambulances.map(a => `
        <div class="card ${a.status === 'maintenance' ? 'border-amber-500/20' : ''}">
          <div class="flex items-center justify-between mb-3">
            <div>
              <p class="text-lg font-bold text-white">🚑 ${a.id}</p>
              <p class="text-xs text-slate-400">${a.plate} · ${a.type}</p>
            </div>
            <span class="badge ${a.status==='available'?'bg-green-500/20 text-green-300':a.status==='on-call'?'bg-blue-500/20 text-blue-300':'bg-amber-500/20 text-amber-300'}">${a.status==='available'?'✅ Müsait':a.status==='on-call'?'🔵 Görevde':'🔧 Bakımda'}</span>
          </div>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-400">Şoför</span><span class="text-white">${a.driver}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Kilometre</span><span class="text-white">${a.mileage.toLocaleString('tr-TR')} km</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Yakıt</span>
              <div class="flex items-center gap-2">
                <div class="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full ${a.fuelLevel > 70 ? 'bg-green-400' : a.fuelLevel > 30 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${a.fuelLevel}%"></div>
                </div>
                <span class="text-white">%${a.fuelLevel}</span>
              </div>
            </div>
            <div class="flex justify-between"><span class="text-slate-400">Son Bakım</span><span class="text-xs text-white">${a.lastService}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Sonraki Bakım</span><span class="text-xs ${new Date(a.nextService) < new Date() ? 'text-red-300 font-bold' : 'text-white'}">${a.nextService}</span></div>
          </div>
        </div>`).join('')}
    </div>`;
}
