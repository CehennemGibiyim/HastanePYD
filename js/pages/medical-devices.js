// ===== MEDİKAL CİHAZ YÖNETİMİ =====
const devices = [
  { id: 'MC-001', name: 'Ventilatör Dräger V500', type: 'Solunum', location: 'YBÜ-01', status: 'in-use', patient: 'Elif Şahin', lastCalibration: '2025-12-15', nextCalibration: '2026-03-15', serial: 'DRG-2024-001' },
  { id: 'MC-002', name: 'EKG Siemens', type: 'Tanı', location: 'Kardiyoloji', status: 'available', patient: null, lastCalibration: '2025-11-20', nextCalibration: '2026-02-20', serial: 'SIE-2023-045' },
  { id: 'MC-003', name: 'Defibrilatör Zoll', type: 'Acil', location: 'Acil Servis', status: 'available', patient: null, lastCalibration: '2025-12-01', nextCalibration: '2026-03-01', serial: 'ZOL-2024-012' },
  { id: 'MC-004', name: 'Monitör Philips MX800', type: 'İzlem', location: 'YBÜ-02', status: 'in-use', patient: 'Murat Özkan', lastCalibration: '2025-10-15', nextCalibration: '2026-01-15', serial: 'PHI-2023-089' },
  { id: 'MC-005', name: 'Infüzyon Pompası B.Braun', type: 'İlaç', location: 'Dahiliye', status: 'maintenance', patient: null, lastCalibration: '2025-09-01', nextCalibration: '2026-01-01', serial: 'BBR-2024-033' },
  { id: 'MC-006', name: 'Ultrason GE Vivid', type: 'Görüntüleme', location: 'Radyoloji', status: 'available', patient: null, lastCalibration: '2025-12-10', nextCalibration: '2026-06-10', serial: 'GE-2024-007' },
  { id: 'MC-007', name: 'Anestezi Cihazı Dräger', type: 'Anestezi', location: 'Ameliyathane 1', status: 'in-use', patient: 'Operasyon', lastCalibration: '2025-11-01', nextCalibration: '2026-02-01', serial: 'DRG-2024-019' },
  { id: 'MC-008', name: 'Otoklav Tuttnauer', type: 'Sterilizasyon', location: 'CSSD', status: 'available', patient: null, lastCalibration: '2025-12-20', nextCalibration: '2026-06-20', serial: 'TUT-2023-056' },
];

export function renderMedicalDevicesPage(el) {
  const inUse = devices.filter(d => d.status === 'in-use').length;
  const available = devices.filter(d => d.status === 'available').length;
  const maintenance = devices.filter(d => d.status === 'maintenance').length;
  const today = new Date();
  const calibDue = devices.filter(d => new Date(d.nextCalibration) <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)).length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🦽 Medikal Cihaz Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Kalibrasyon, periyodik bakım, arıza geçmişi,ömür takibi</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${devices.length}</p><p class="text-xs text-slate-400">Toplam Cihaz</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inUse}</p><p class="text-xs text-slate-400">Kullanımda</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${available}</p><p class="text-xs text-slate-400">Müsait</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${calibDue > 0 ? 'text-amber-300' : 'text-green-300'}">${calibDue}</p><p class="text-xs text-slate-400">Kalibrasyon Yakın</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🔧 Cihaz Envanteri</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">Cihaz</th><th class="th">Tür</th><th class="th">Konum</th><th class="th">Seri No</th><th class="th">Son Kalibrasyon</th><th class="th">Sonraki</th><th class="th">Durum</th></tr></thead>
          <tbody>${devices.map(d => `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td font-medium">${d.name}</td>
            <td class="td"><span class="badge">${d.type}</span></td>
            <td class="td text-xs">${d.location}</td>
            <td class="td font-mono text-xs">${d.serial}</td>
            <td class="td text-xs">${d.lastCalibration}</td>
            <td class="td text-xs ${new Date(d.nextCalibration) < today ? 'text-red-300 font-medium' : ''}">${d.nextCalibration}</td>
            <td class="td">${d.status==='in-use'?'<span class="badge bg-blue-500/20 text-blue-300">Kullanımda</span>':d.status==='available'?'<span class="badge bg-green-500/20 text-green-300">Müsait</span>':'<span class="badge bg-amber-500/20 text-amber-300">Bakımda</span>'}</td>
          </tr>`).join('')}</tbody>
        </table>
      </div>
    </div>`;
}
