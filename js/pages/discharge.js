// ===== TABURCULUK PLANI =====
const discharges = [
  { id: 1, patient: 'Zeynep Kara', service: 'Kardiyoloji', admitDate: '2026-01-07', dischargeDate: '2026-01-13', doctor: 'Dr. Arslan', diagnosis: 'AKS', status: 'pending', checklist: { medication: true, education: true, followup: false, diet: true, activity: false } },
  { id: 2, patient: 'Mehmet Çelik', service: 'Genel Cerrahi', admitDate: '2026-01-09', dischargeDate: '2026-01-14', doctor: 'Dr. Yıldız', diagnosis: 'Apandisit', status: 'ready', checklist: { medication: true, education: true, followup: true, diet: true, activity: true } },
  { id: 3, patient: 'Fatma Demir', service: 'Dahiliye', admitDate: '2026-01-10', dischargeDate: '2026-01-15', doctor: 'Dr. Kaya', diagnosis: 'Diyabet Ketoasidoz', status: 'pending', checklist: { medication: true, education: false, followup: false, diet: true, activity: true } },
  { id: 4, patient: 'Elif Şahin', service: 'Yoğun Bakım', admitDate: '2026-01-06', dischargeDate: '-', doctor: 'Dr. Öztürk', diagnosis: 'Sepsis', status: 'inpatient', checklist: { medication: false, education: false, followup: false, diet: false, activity: false } },
];

export function renderDischargePage(el) {
  const pending = discharges.filter(d => d.status === 'pending').length;
  const ready = discharges.filter(d => d.status === 'ready').length;
  const inpatient = discharges.filter(d => d.status === 'inpatient').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📋 Taburculuk Planı</h1>
      <p class="text-slate-400 text-sm mt-1">Taburculuk kontrol listesi, ilaç eğitimi, randevu planı</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${discharges.length}</p><p class="text-xs text-slate-400">Toplam Hasta</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${pending}</p><p class="text-xs text-slate-400">Beklemede</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${ready}</p><p class="text-xs text-slate-400">Taburcu Hazır</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inpatient}</p><p class="text-xs text-slate-400">Yatan Hasta</p></div>
    </div>
    <div class="space-y-4 fade-in">
      ${discharges.map(d => {
        const cl = d.checklist;
        const done = Object.values(cl).filter(Boolean).length;
        const total = Object.keys(cl).length;
        const pct = Math.round((done / total) * 100);
        return `
        <div class="card ${d.status === 'ready' ? 'border-green-500/20' : ''}">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-white">${d.patient}</h3>
              <p class="text-xs text-slate-400">${d.service} · ${d.doctor} · ${d.diagnosis}</p>
            </div>
            <span class="badge ${d.status==='ready'?'bg-green-500/20 text-green-300':d.status==='pending'?'bg-amber-500/20 text-amber-300':'bg-blue-500/20 text-blue-300'}">${d.status==='ready'?'✅ Hazır':d.status==='pending'?'⏳ Bekliyor':'🏥 Yatıyor'}</span>
          </div>
          <div class="mb-3">
            <div class="flex justify-between text-xs mb-1">
              <span class="text-slate-400">Kontrol Listesi</span>
              <span class="text-white font-medium">${done}/${total} (%${pct})</span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full ${pct===100?'bg-green-400':'bg-amber-400'}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="grid grid-cols-5 gap-2 text-xs">
            <div class="rounded-lg p-2 text-center ${cl.medication?'bg-green-500/10 text-green-300':'bg-white/5 text-slate-500'}">💊 İlaç</div>
            <div class="rounded-lg p-2 text-center ${cl.education?'bg-green-500/10 text-green-300':'bg-white/5 text-slate-500'}">📚 Eğitim</div>
            <div class="rounded-lg p-2 text-center ${cl.followup?'bg-green-500/10 text-green-300':'bg-white/5 text-slate-500'}">📅 Kontrol</div>
            <div class="rounded-lg p-2 text-center ${cl.diet?'bg-green-500/10 text-green-300':'bg-white/5 text-slate-500'}">🥗 Diyet</div>
            <div class="rounded-lg p-2 text-center ${cl.activity?'bg-green-500/10 text-green-300':'bg-white/5 text-slate-500'}">🏃 Aktivite</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
