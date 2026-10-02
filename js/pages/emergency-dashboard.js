// ===== ACİL SERVİS DASHBOARD =====
const erPatients = [
  { id: 'ER-001', name: 'Ali Veli', age: 65, triage: 'red', complaint: 'Göğüs ağrısı', arrival: '08:15', waitMin: 5, status: 'examining', doctor: 'Dr. Arslan' },
  { id: 'ER-002', name: 'Ayşe Kara', age: 34, triage: 'yellow', complaint: 'Karın ağrısı', arrival: '08:30', waitMin: 20, status: 'waiting', doctor: '-' },
  { id: 'ER-003', name: 'Mehmet Yıldız', age: 45, triage: 'green', complaint: 'Kesik yaralanma', arrival: '08:45', waitMin: 35, status: 'waiting', doctor: '-' },
  { id: 'ER-004', name: 'Fatma Öz', age: 28, triage: 'red', complaint: 'Trafik kazası', arrival: '09:00', waitMin: 2, status: 'resuscitation', doctor: 'Dr. Kaya' },
  { id: 'ER-005', name: 'Hasan Çelik', age: 72, triage: 'yellow', complaint: 'Bilinç bulanıklığı', arrival: '09:15', waitMin: 15, status: 'examining', doctor: 'Dr. Yılmaz' },
  { id: 'ER-006', name: 'Zeynep Aydın', age: 8, triage: 'yellow', complaint: 'Ateş + kusma', arrival: '09:30', waitMin: 25, status: 'waiting', doctor: '-' },
  { id: 'ER-007', name: 'Kemal Bayrak', age: 55, triage: 'green', complaint: 'Burkulma', arrival: '09:45', waitMin: 45, status: 'waiting', doctor: '-' },
  { id: 'ER-008', name: 'Selin Kurt', age: 40, triage: 'orange', complaint: 'Nefes darlığı', arrival: '10:00', waitMin: 10, status: 'examining', doctor: 'Dr. Öztürk' },
];

const codes = [
  { code: 'KOD MAVİ', desc: 'Kardiyak arrest', color: 'blue', action: 'Tüm ekip CPR alanına', active: false },
  { code: 'KOD KIRMIZI', desc: 'Yangın', color: 'red', action: 'Tahliye prosedürü başlat', active: false },
  { code: 'KOD SARI', desc: 'Hasta kayıp', color: 'amber', action: 'Güvenlik + arama başlat', active: false },
  { code: 'KOD PEMBE', desc: 'Çocuk kaçırma', color: 'pink', action: 'Tüm çıkışlar kapat', active: false },
  { code: 'KOD BEYAZ', desc: 'Şiddet/saldırı', color: 'white', action: 'Güvenlik müdahalesi', active: false },
  { code: 'KOD MOR', desc: 'Tehlikeli madde', color: 'purple', action: 'Karantina protokolü', active: false },
];

export function renderEmergencyDashboardPage(el) {
  const red = erPatients.filter(p => p.triage === 'red').length;
  const orange = erPatients.filter(p => p.triage === 'orange').length;
  const yellow = erPatients.filter(p => p.triage === 'yellow').length;
  const green = erPatients.filter(p => p.triage === 'green').length;
  const avgWait = Math.round(erPatients.reduce((s, p) => s + p.waitMin, 0) / erPatients.length);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🚑 Acil Servis Dashboard</h1>
      <p class="text-slate-400 text-sm mt-1">Triyaj sırası, bekleme süresi, hasta akışı, kod yönetimi</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-white">${erPatients.length}</p><p class="text-xs text-slate-400">Toplam Hasta</p></div>
      <div class="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center"><p class="text-3xl font-bold text-red-300">${red}</p><p class="text-xs text-red-400">🔴 Kırmızı (Acil)</p></div>
      <div class="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 text-center"><p class="text-3xl font-bold text-orange-300">${orange}</p><p class="text-xs text-orange-400">🟠 Turuncu</p></div>
      <div class="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-center"><p class="text-3xl font-bold text-amber-300">${yellow}</p><p class="text-xs text-amber-400">🟡 Sarı</p></div>
      <div class="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center"><p class="text-3xl font-bold text-green-300">${green}</p><p class="text-xs text-green-400">🟢 Yeşil</p></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      <div class="lg:col-span-2 card">
        <h3 class="text-lg font-semibold text-white mb-4">🏥 Hasta Akışı (Ort. Bekleme: ${avgWait} dk)</h3>
        <div class="space-y-2">
          ${erPatients.sort((a,b) => {
            const order = {red:0,orange:1,yellow:2,green:3};
            return (order[a.triage]||9) - (order[b.triage]||9);
          }).map(p => `
            <div class="flex items-center gap-3 rounded-xl p-3 ${p.triage === 'red' ? 'bg-red-500/10 border border-red-500/20' : p.triage === 'orange' ? 'bg-orange-500/10 border border-orange-500/20' : p.triage === 'yellow' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-green-500/10 border border-green-500/20'}">
              <div class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${p.triage === 'red' ? 'bg-red-500/20 text-red-300' : p.triage === 'orange' ? 'bg-orange-500/20 text-orange-300' : p.triage === 'yellow' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'}">${p.triage === 'red' ? '🔴' : p.triage === 'orange' ? '🟠' : p.triage === 'yellow' ? '🟡' : '🟢'}</div>
              <div class="flex-1">
                <p class="text-sm font-medium text-white">${p.name} (${p.age})</p>
                <p class="text-xs text-slate-400">${p.complaint} · ${p.arrival}'den beri · ${p.waitMin} dk</p>
              </div>
              <span class="badge text-xs ${p.status === 'resuscitation' ? 'bg-red-600 text-white' : p.status === 'examining' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}">${p.status === 'resuscitation' ? '⚠️ Resüsitasyon' : p.status === 'examining' ? '🩺 Muayenede' : '⏳ Bekliyor'}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🚨 Acil Kod Yönetimi</h3>
        <div class="space-y-2">
          ${codes.map(c => `
            <button class="w-full text-left rounded-xl p-3 transition ${c.active ? 'bg-red-500/20 border border-red-500/40 animate-pulse' : 'bg-white/5 border border-white/10 hover:bg-white/10'}">
              <p class="text-sm font-bold ${c.color === 'red' ? 'text-red-300' : c.color === 'blue' ? 'text-blue-300' : c.color === 'amber' ? 'text-amber-300' : c.color === 'pink' ? 'text-pink-300' : c.color === 'purple' ? 'text-purple-300' : 'text-white'}">${c.code}</p>
              <p class="text-xs text-slate-400">${c.desc}</p>
              <p class="text-[10px] text-slate-500 mt-0.5">${c.action}</p>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
}
