// ===== HEDEF YÖNETİMİ (OKR) =====
const objectives = [
  { id: 1, title: 'Hasta Memnuniyetini %90\'ın Üzerine Çıkar', owner: 'Başhekim Yrd.', dept: 'Genel', quarter: 'Q1 2026', progress: 72, status: 'on-track', keyResults: [
    { kr: 'NPS skorunu 45\'ten 55\'e yükselt', current: 48, target: 55, unit: 'NPS' },
    { kr: 'Şikayet çözüm süresini 48 saate düşür', current: 52, target: 48, unit: 'saat' },
    { kr: 'Hasta anket katılımını %60 yap', current: 55, target: 60, unit: '%' },
  ]},
  { id: 2, title: 'Personel Devir Oranını %15\'in Altına Düşür', owner: 'İK Müdürü', dept: 'İK', quarter: 'Q1 2026', progress: 60, status: 'at-risk', keyResults: [
    { kr: 'Exit interview oranını %100 yap', current: 80, target: 100, unit: '%' },
    { kr: 'eNPS skorunu 50 yap', current: 45, target: 50, unit: 'NPS' },
    { kr: 'Ortalama iş ilanı süresini 30 gün yap', current: 42, target: 30, unit: 'gün' },
  ]},
  { id: 3, title: 'Enfeksiyon Oranını %2\'nin Altına Düşür', owner: 'Enfeksiyon Komitesi', dept: 'Kalite', quarter: 'Q1 2026', progress: 85, status: 'on-track', keyResults: [
    { kr: 'HAI oranını %2.1\'den %1.8\'e düşür', current: 1.9, target: 1.8, unit: '%' },
    { kr: 'El hijyeni uyumluluğunu %95 yap', current: 92, target: 95, unit: '%' },
    { kr: 'Antibiyotik stewardship uyumu %90', current: 88, target: 90, unit: '%' },
  ]},
  { id: 4, title: 'Dijital Dönüşümde %50 İlerleme', owner: 'BT Müdürü', dept: 'Teknoloji', quarter: 'Q1 2026', progress: 45, status: 'behind', keyResults: [
    { kr: 'E-imza kullanımını %70 yap', current: 45, target: 70, unit: '%' },
    { kr: 'QR check-in adaptasyonunu %80 yap', current: 35, target: 80, unit: '%' },
    { kr: 'Mobil uygulama kullanımını %60 yap', current: 40, target: 60, unit: '%' },
  ]},
];

export function renderOKRPage(el) {
  const avgProgress = Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length);
  const onTrack = objectives.filter(o => o.status === 'on-track').length;
  const atRisk = objectives.filter(o => o.status === 'at-risk').length;
  const behind = objectives.filter(o => o.status === 'behind').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🎯 Hedef Yönetimi (OKR)</h1>
      <p class="text-slate-400 text-sm mt-1">Objective-Key Results, quarterly planning, tracking</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">%${avgProgress}</p><p class="text-xs text-slate-400">Ort. İlerleme</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${onTrack}</p><p class="text-xs text-slate-400">Yolunda</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${atRisk}</p><p class="text-xs text-slate-400">Riskli</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${behind}</p><p class="text-xs text-slate-400">Gecikmiş</p></div>
    </div>
    <div class="space-y-4 fade-in">
      ${objectives.map(o => `
        <div class="card ${o.status === 'at-risk' ? 'border-amber-500/20' : o.status === 'behind' ? 'border-red-500/20' : ''}">
          <div class="flex items-center justify-between mb-3">
            <div>
              <h3 class="text-lg font-semibold text-white">${o.title}</h3>
              <p class="text-xs text-slate-400">${o.owner} · ${o.dept} · ${o.quarter}</p>
            </div>
            <span class="badge ${o.status==='on-track'?'bg-green-500/20 text-green-300':o.status==='at-risk'?'bg-amber-500/20 text-amber-300':'bg-red-500/20 text-red-300'}">${o.status==='on-track'?'✅ Yolunda':o.status==='at-risk'?'⚠️ Riskli':'🔴 Gecikmiş'}</span>
          </div>
          <div class="mb-3">
            <div class="flex justify-between text-xs mb-1"><span class="text-slate-400">İlerleme</span><span class="text-white font-bold">%${o.progress}</span></div>
            <div class="h-3 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full ${o.progress >= 80 ? 'bg-green-400' : o.progress >= 50 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${o.progress}%"></div>
            </div>
          </div>
          <div class="space-y-2">
            ${o.keyResults.map(kr => {
              const krPct = Math.round((kr.current / kr.target) * 100);
              return `<div class="rounded-lg bg-white/5 p-3">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-300">${kr.kr}</span>
                  <span class="font-bold ${krPct >= 100 ? 'text-green-300' : krPct >= 75 ? 'text-blue-300' : 'text-amber-300'}">${kr.current}/${kr.target} ${kr.unit}</span>
                </div>
                <div class="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full ${krPct >= 100 ? 'bg-green-400' : krPct >= 75 ? 'bg-blue-400' : 'bg-amber-400'}" style="width:${Math.min(krPct, 100)}%"></div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>`;
}
