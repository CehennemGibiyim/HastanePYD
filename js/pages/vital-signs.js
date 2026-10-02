// ===== VİTAL BULGU TAKİBİ =====
const vitalData = [
  { patient: 'Ahmet Yılmaz', room: 'DAH-01', vitals: [
    { time: '08:00', hr: 78, bp: '130/85', temp: 36.8, spo2: 97, rr: 16 },
    { time: '12:00', hr: 82, bp: '125/80', temp: 37.1, spo2: 96, rr: 18 },
    { time: '16:00', hr: 76, bp: '128/82', temp: 36.9, spo2: 97, rr: 16 },
  ]},
  { patient: 'Elif Şahin', room: 'YBÜ-01', vitals: [
    { time: '08:00', hr: 110, bp: '90/60', temp: 38.5, spo2: 92, rr: 24 },
    { time: '12:00', hr: 105, bp: '95/65', temp: 38.2, spo2: 93, rr: 22 },
    { time: '16:00', hr: 98, bp: '100/70', temp: 37.8, spo2: 95, rr: 20 },
  ]},
  { patient: 'Kemal Doğan', room: 'ORT-01', vitals: [
    { time: '08:00', hr: 88, bp: '140/90', temp: 37.2, spo2: 96, rr: 18 },
    { time: '12:00', hr: 84, bp: '135/85', temp: 37.0, spo2: 97, rr: 16 },
  ]},
];

export function renderVitalSignsPage(el) {
  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🫀 Vital Bulgu Takibi</h1>
      <p class="text-slate-400 text-sm mt-1">Nabız, tansiyon, sıcaklık, SpO2, solunum hızı grafiksel takibi</p>
    </div>
    <div class="space-y-4 fade-in">
      ${vitalData.map(p => {
        const latest = p.vitals[p.vitals.length - 1];
        const hrStatus = latest.hr > 100 ? 'text-red-300' : latest.hr < 60 ? 'text-amber-300' : 'text-green-300';
        const tempStatus = latest.temp > 38 ? 'text-red-300' : latest.temp < 36 ? 'text-blue-300' : 'text-green-300';
        const spo2Status = latest.spo2 < 94 ? 'text-red-300' : 'text-green-300';
        return `
        <div class="card">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-white">${p.patient}</h3>
              <p class="text-xs text-slate-400">Oda: ${p.room}</p>
            </div>
            <span class="badge bg-blue-500/20 text-blue-300">${p.vitals.length} ölçüm</span>
          </div>
          <div class="grid grid-cols-5 gap-2 mb-3">
            <div class="rounded-lg bg-white/5 p-2 text-center">
              <p class="text-xs text-slate-500">Nabız</p>
              <p class="text-lg font-bold ${hrStatus}">${latest.hr}</p>
              <p class="text-[10px] text-slate-500">bpm</p>
            </div>
            <div class="rounded-lg bg-white/5 p-2 text-center">
              <p class="text-xs text-slate-500">Tansiyon</p>
              <p class="text-lg font-bold text-white">${latest.bp}</p>
              <p class="text-[10px] text-slate-500">mmHg</p>
            </div>
            <div class="rounded-lg bg-white/5 p-2 text-center">
              <p class="text-xs text-slate-500">Sıcaklık</p>
              <p class="text-lg font-bold ${tempStatus}">${latest.temp}°</p>
              <p class="text-[10px] text-slate-500">Celsius</p>
            </div>
            <div class="rounded-lg bg-white/5 p-2 text-center">
              <p class="text-xs text-slate-500">SpO2</p>
              <p class="text-lg font-bold ${spo2Status}">%${latest.spo2}</p>
              <p class="text-[10px] text-slate-500">Oksijen</p>
            </div>
            <div class="rounded-lg bg-white/5 p-2 text-center">
              <p class="text-xs text-slate-500">Solunum</p>
              <p class="text-lg font-bold text-white">${latest.rr}</p>
              <p class="text-[10px] text-slate-500">/dk</p>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead><tr><th class="th">Saat</th><th class="th">Nabız</th><th class="th">Tansiyon</th><th class="th">Sıcaklık</th><th class="th">SpO2</th><th class="th">Solunum</th></tr></thead>
              <tbody>${p.vitals.map(v => `<tr class="border-t border-white/5">
                <td class="td">${v.time}</td><td class="td">${v.hr}</td><td class="td">${v.bp}</td><td class="td">${v.temp}°</td><td class="td">%${v.spo2}</td><td class="td">${v.rr}</td>
              </tr>`).join('')}</tbody>
            </table>
          </div>
        </div>`;
      }).join('')}
    </div>`;
}
