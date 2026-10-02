// ===== NARKOTİK İLAÇ SAYIMI =====
const narcotics = [
  { id: 1, drug: 'Morfin 10mg/ml', stock: 24, expected: 24, controlledBy: 'Eczacı Ayşe', lastCount: '2026-01-12 08:00', status: 'matched', schedule: 'Yeşil Reçete' },
  { id: 2, drug: 'Fentanil 50mcg/ml', stock: 12, expected: 12, controlledBy: 'Eczacı Ayşe', lastCount: '2026-01-12 08:00', status: 'matched', schedule: 'Kırmızı Reçete' },
  { id: 3, drug: 'Oksikodon 10mg', stock: 30, expected: 30, controlledBy: 'Eczacı Mehmet', lastCount: '2026-01-12 08:00', status: 'matched', schedule: 'Kırmızı Reçete' },
  { id: 4, drug: 'Diazepam 10mg', stock: 45, expected: 44, controlledBy: 'Eczacı Ayşe', lastCount: '2026-01-12 08:00', status: 'discrepancy', schedule: 'Yeşil Reçete' },
  { id: 5, drug: 'Ketamin 50mg/ml', stock: 8, expected: 8, controlledBy: 'Eczacı Mehmet', lastCount: '2026-01-12 08:00', status: 'matched', schedule: 'Kırmızı Reçete' },
  { id: 6, drug: 'Midazolam 5mg/ml', stock: 18, expected: 18, controlledBy: 'Eczacı Ayşe', lastCount: '2026-01-12 08:00', status: 'matched', schedule: 'Yeşil Reçete' },
];

const usageLog = [
  { date: '2026-01-12 14:30', drug: 'Morfin 10mg/ml', qty: 2, patient: 'Elif Şahin', prescriber: 'Dr. Öztürk', witness: 'Hemşire Ayşe' },
  { date: '2026-01-12 10:15', drug: 'Fentanil 50mcg/ml', qty: 1, patient: 'Murat Özkan', prescriber: 'Dr. Kaya', witness: 'Hemşire Fatma' },
  { date: '2026-01-11 22:00', drug: 'Diazepam 10mg', qty: 1, patient: 'Kemal Doğan', prescriber: 'Dr. Çelik', witness: 'Hemşire Zeynep' },
  { date: '2026-01-11 16:45', drug: 'Ketamin 50mg/ml', qty: 1, patient: 'Acil Hasta', prescriber: 'Dr. Arslan', witness: 'Hemşire Ayşe' },
];

export function renderNarcoticCountPage(el) {
  const totalDrugs = narcotics.reduce((s, n) => s + n.stock, 0);
  const discrepancies = narcotics.filter(n => n.status === 'discrepancy').length;
  const matched = narcotics.filter(n => n.status === 'matched').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">💊 Narkotik İlaç Sayımı</h1>
      <p class="text-slate-400 text-sm mt-1">Günlük sayım, imza, eksik/fazla raporu, savcılık bildirimi</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${narcotics.length}</p><p class="text-xs text-slate-400">Kontrollü İlaç</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${totalDrugs}</p><p class="text-xs text-slate-400">Toplam Ünite</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${matched}</p><p class="text-xs text-slate-400">Eşleşen</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${discrepancies > 0 ? 'text-red-300' : 'text-green-300'}">${discrepancies}</p><p class="text-xs text-slate-400">Uyumsuzluk</p></div>
    </div>
    ${discrepancies > 0 ? `<div class="rounded-xl bg-red-500/10 border border-red-500/30 p-4 mb-6 fade-in">
      <p class="text-red-300 font-bold">⚠️ DİKKAT: ${discrepancies} ilaçta uyumsuzluk tespit edildi! Savcılık bildirimi gerekebilir.</p>
    </div>` : ''}
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Günlük Narkotik Sayım</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr><th class="th">İlaç</th><th class="th">Reçete</th><th class="th">Sistem</th><th class="th">Fiziki</th><th class="th">Fark</th><th class="th">Sayan</th><th class="th">Son Sayım</th><th class="th">Durum</th></tr></thead>
          <tbody>${narcotics.map(n => {
            const diff = n.stock - n.expected;
            return `<tr class="border-t border-white/5 hover:bg-white/5 ${n.status==='discrepancy'?'bg-red-500/5':''}">
              <td class="td font-medium">${n.drug}</td>
              <td class="td"><span class="badge ${n.schedule==='Kırmızı Reçete'?'bg-red-500/20 text-red-300':'bg-green-500/20 text-green-300'}">${n.schedule}</span></td>
              <td class="td font-bold">${n.expected}</td>
              <td class="td font-bold ${n.status==='discrepancy'?'text-red-300':''}">${n.stock}</td>
              <td class="td font-bold ${diff!==0?'text-red-300':'text-green-300'}">${diff > 0 ? '+' : ''}${diff}</td>
              <td class="td text-xs">${n.controlledBy}</td>
              <td class="td text-xs">${n.lastCount}</td>
              <td class="td">${n.status==='matched'?'<span class="badge bg-green-500/20 text-green-300">✅ Eşleşti</span>':'<span class="badge bg-red-500/20 text-red-300">⚠️ Uyumsuz</span>'}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📝 Son Kullanım Logu</h3>
      <div class="space-y-2">${usageLog.map(u => `
        <div class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
          <span class="text-lg">💊</span>
          <div class="flex-1">
            <p class="text-sm text-white">${u.drug} × ${u.qty}</p>
            <p class="text-xs text-slate-400">Hasta: ${u.patient} · Reçete: ${u.prescriber} · Tanık: ${u.witness}</p>
          </div>
          <span class="text-xs text-slate-500">${u.date}</span>
        </div>`).join('')}</div>
    </div>`;
}
