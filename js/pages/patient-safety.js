// ===== HASTA GÜVENLİĞİ OLAYLARI =====
const safetyIncidents = [
  { id: 'PS-001', date: '2026-01-12', type: 'İlaç Hatası', severity: 'near-miss', location: 'Dahiliye', description: 'Yanlış doz hazırlandı, hemşire fark etti', reporter: 'Hemşire Fatma', status: 'investigating', rootCause: '' },
  { id: 'PS-002', date: '2026-01-10', type: 'Hasta Düşme', severity: 'minor', location: 'Ortopedi', description: 'Hasta yataktan düştü, hafif morarma', reporter: 'Hemşire Zeynep', status: 'reported', rootCause: 'Yan korkuluk açık unutuldu' },
  { id: 'PS-003', date: '2026-01-08', type: 'Yanlış Hasta', severity: 'near-miss', location: 'Ameliyathane', description: 'Time-out sırasında hasta kimliği düzeltildi', reporter: 'Dr. Yıldız', status: 'closed', rootCause: 'Bileklik kontrolü eksik' },
  { id: 'PS-004', date: '2026-01-06', type: 'Enfeksiyon', severity: 'moderate', location: 'YBÜ', description: 'Cerrahi alan enfeksiyonu gelişti', reporter: 'Dr. Öztürk', status: 'action-taken', rootCause: 'Sterilizasyon protokolüne uyumsuzluk' },
  { id: 'PS-005', date: '2026-01-05', type: 'Ekipman Arızası', severity: 'near-miss', location: 'Acil', description: 'Defibrilatör çalışmadı, yedek kullanıldı', reporter: 'Dr. Arslan', status: 'closed', rootCause: 'Periyodik bakım gecikmiş' },
];

export function renderPatientSafetyPage(el) {
  const nearMiss = safetyIncidents.filter(i => i.severity === 'near-miss').length;
  const moderate = safetyIncidents.filter(i => i.severity === 'moderate' || i.severity === 'minor').length;
  const investigating = safetyIncidents.filter(i => i.status === 'investigating').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🛡️ Hasta Güvenliği Olayları</h1>
      <p class="text-slate-400 text-sm mt-1">Incident report, kök neden analizi, düzeltici faaliyet</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${safetyIncidents.length}</p><p class="text-xs text-slate-400">Toplam Olay</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${nearMiss}</p><p class="text-xs text-slate-400">Near-Miss</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${moderate}</p><p class="text-xs text-slate-400">Gerçekleşen</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${investigating}</p><p class="text-xs text-slate-400">Soruşturma</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Olay Kayıtları</h3>
      <div class="space-y-3">
        ${safetyIncidents.map(i => `
          <div class="rounded-xl ${i.severity==='moderate'?'bg-red-500/10 border border-red-500/20':i.severity==='minor'?'bg-amber-500/10 border border-amber-500/20':'bg-blue-500/10 border border-blue-500/20'} p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="badge">${i.id}</span>
                <span class="font-medium text-white">${i.type}</span>
              </div>
              <span class="badge ${i.severity==='moderate'?'bg-red-500/20 text-red-300':i.severity==='minor'?'bg-amber-500/20 text-amber-300':'bg-blue-500/20 text-blue-300'}">${i.severity==='near-miss'?'🟡 Near-Miss':i.severity==='minor'?'🟠 Hafif':'🔴 Orta'}</span>
            </div>
            <p class="text-sm text-slate-300">${i.description}</p>
            <div class="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
              <span>📍 ${i.location}</span><span>👤 ${i.reporter}</span><span>📅 ${i.date}</span>
            </div>
            ${i.rootCause ? `<p class="text-xs text-amber-300 mt-2">🔍 Kök Neden: ${i.rootCause}</p>` : ''}
            <div class="mt-2">
              <span class="badge ${i.status==='closed'?'bg-green-500/20 text-green-300':i.status==='action-taken'?'bg-blue-500/20 text-blue-300':i.status==='investigating'?'bg-purple-500/20 text-purple-300':'bg-amber-500/20 text-amber-300'}">${i.status==='closed'?'✅ Kapatıldı':i.status==='action-taken'?'🔧 Aksiyon Alındı':i.status==='investigating'?'🔍 Soruşturma':'📋 Raporlandı'}</span>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}
