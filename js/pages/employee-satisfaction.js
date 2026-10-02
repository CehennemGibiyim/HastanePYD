// ===== ÇALIŞAN MEMNUNİYET ANKETİ (eNPS) =====
const enpsData = [
  { month: 'Ağu 2025', score: 32, promoters: 55, passives: 30, detractors: 15, responses: 85 },
  { month: 'Eyl 2025', score: 35, promoters: 58, passives: 28, detractors: 14, responses: 88 },
  { month: 'Eki 2025', score: 28, promoters: 50, passives: 32, detractors: 18, responses: 82 },
  { month: 'Kas 2025', score: 38, promoters: 60, passients: 25, detractors: 15, responses: 90 },
  { month: 'Ara 2025', score: 42, promoters: 65, passives: 22, detractors: 13, responses: 92 },
  { month: 'Oca 2026', score: 45, promoters: 68, passives: 20, detractors: 12, responses: 95 },
];

const deptScores = [
  { dept: 'Kardiyoloji', score: 55, responses: 12 },
  { dept: 'Dahiliye', score: 42, responses: 15 },
  { dept: 'Genel Cerrahi', score: 38, responses: 14 },
  { dept: 'Yoğun Bakım', score: 25, responses: 10 },
  { dept: 'Temizlik', score: 20, responses: 18 },
  { dept: 'Güvenlik', score: 30, responses: 8 },
  { dept: 'Radyoloji', score: 48, responses: 6 },
];

const feedbacks = [
  { dept: 'Yoğun Bakım', comment: 'Nöbet sayıları çok fazla, dinlenme süresi yetersiz', sentiment: 'negative', date: '2026-01-10' },
  { dept: 'Temizlik', comment: 'Maaşlarımız piyasanın altında, sosyal haklar yetersiz', sentiment: 'negative', date: '2026-01-09' },
  { dept: 'Kardiyoloji', comment: 'Ekip çalışması çok iyi, yönetim desteği yeterli', sentiment: 'positive', date: '2026-01-08' },
  { dept: 'Dahiliye', comment: 'Eğitim imkanları artırılmalı, kariyer yolu belirsiz', sentiment: 'neutral', date: '2026-01-07' },
  { dept: 'Güvenlik', comment: 'Vardiya sistemi adil değil, esneklik sağlanmalı', sentiment: 'negative', date: '2026-01-06' },
];

export function renderEmployeeSatisfactionPage(el) {
  const latest = enpsData[enpsData.length - 1];
  const avgDept = Math.round(deptScores.reduce((s, d) => s + d.score, 0) / deptScores.length);
  const negativeFeedbacks = feedbacks.filter(f => f.sentiment === 'negative').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Çalışan Memnuniyet Anketi (eNPS)</h1>
      <p class="text-slate-400 text-sm mt-1">eNPS skoru, departman bazlı analiz, trend takibi, geri bildirim</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl ${latest.score >= 40 ? 'bg-green-500/10 border border-green-500/20' : latest.score >= 20 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-red-500/10 border border-red-500/20'} p-5 text-center">
        <p class="text-4xl font-bold ${latest.score >= 40 ? 'text-green-300' : latest.score >= 20 ? 'text-amber-300' : 'text-red-300'}">${latest.score}</p>
        <p class="text-xs text-slate-400">eNPS Skoru</p>
      </div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${latest.promoters}%</p><p class="text-xs text-slate-400">Promotör</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${latest.passives}%</p><p class="text-xs text-slate-400">Pasif</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${latest.detractors}%</p><p class="text-xs text-slate-400">Detraktör</p></div>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 fade-in">
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📈 eNPS Trendi (6 Ay)</h3>
        <div class="space-y-2">${enpsData.map(d => `<div class="flex items-center gap-3">
          <span class="text-xs text-slate-400 w-16">${d.month.split(' ')[0]}</span>
          <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
            <div class="h-full rounded-lg ${d.score >= 40 ? 'bg-green-400' : d.score >= 20 ? 'bg-amber-400' : 'bg-red-400'} flex items-center justify-end pr-2" style="width:${Math.max(d.score + 50, 10)}%">
              <span class="text-xs font-bold text-white">${d.score}</span>
            </div>
          </div>
          <span class="text-xs text-slate-500 w-12 text-right">${d.responses}</span>
        </div>`).join('')}</div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Bazlı</h3>
        <div class="space-y-3">${deptScores.sort((a,b) => b.score - a.score).map(d => `<div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-slate-300">${d.dept}</span>
            <span class="font-bold ${d.score >= 40 ? 'text-green-300' : d.score >= 20 ? 'text-amber-300' : 'text-red-300'}">${d.score}</span>
          </div>
          <div class="h-2 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full rounded-full ${d.score >= 40 ? 'bg-green-400' : d.score >= 20 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${Math.max(d.score + 50, 10)}%"></div>
          </div>
        </div>`).join('')}</div>
      </div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">💬 Son Geri Bildirimler</h3>
      <div class="space-y-3">${feedbacks.map(f => `
        <div class="flex items-start gap-3 rounded-xl p-3 ${f.sentiment === 'positive' ? 'bg-green-500/5 border border-green-500/10' : f.sentiment === 'negative' ? 'bg-red-500/5 border border-red-500/10' : 'bg-blue-500/5 border border-blue-500/10'}">
          <span class="text-lg">${f.sentiment === 'positive' ? '😊' : f.sentiment === 'negative' ? '😟' : '😐'}</span>
          <div class="flex-1">
            <p class="text-sm text-white">${f.comment}</p>
            <p class="text-xs text-slate-500 mt-1">${f.dept} · ${f.date}</p>
          </div>
        </div>`).join('')}
    </div>`;
}
