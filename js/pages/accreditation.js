// ===== AKREDİTASYON HAZIRLIK (JCI/SKYS) =====
const standards = [
  { id: 'IPSG', name: 'Hasta Güvenliği Hedefleri', total: 6, completed: 5, status: 'on-track' },
  { id: 'ACC', name: 'Hasta Bakımına Erişim', total: 12, completed: 10, status: 'on-track' },
  { id: 'ASC', name: 'Hasta Değerlendirme', total: 18, completed: 14, status: 'in-progress' },
  { id: 'COP', name: 'Hasta Bakımı', total: 22, completed: 16, status: 'in-progress' },
  { id: 'GLD', name: 'Yönetim ve Liderlik', total: 15, completed: 12, status: 'on-track' },
  { id: 'SQE', name: 'Kalite Güvencesi ve Eğitim', total: 14, completed: 9, status: 'behind' },
  { id: 'FMS', name: 'Tesis Yönetimi ve Güvenlik', total: 20, completed: 18, status: 'on-track' },
  { id: 'MMU', name: 'İlaç Yönetimi', total: 10, completed: 8, status: 'in-progress' },
];

export function renderAccreditationPage(el) {
  const totalItems = standards.reduce((s, st) => s + st.total, 0);
  const completedItems = standards.reduce((s, st) => s + st.completed, 0);
  const pct = Math.round((completedItems / totalItems) * 100);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 Akreditasyon Hazırlık (JCI/SKYS)</h1>
      <p class="text-slate-400 text-sm mt-1">Standart bazlı checklist, doküman hazırlığı, uyumluluk takibi</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="rounded-2xl ${pct >= 80 ? 'bg-green-500/10 border border-green-500/20' : 'bg-amber-500/10 border border-amber-500/20'} p-5 text-center">
        <p class="text-4xl font-bold ${pct >= 80 ? 'text-green-300' : 'text-amber-300'}">%${pct}</p>
        <p class="text-xs text-slate-400">Genel Hazırlık</p>
      </div>
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${totalItems}</p><p class="text-xs text-slate-400">Toplam Standart</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completedItems}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${totalItems - completedItems}</p><p class="text-xs text-slate-400">Eksik</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Standart Bazlı İlerleme</h3>
      <div class="space-y-3">
        ${standards.map(s => {
          const sPct = Math.round((s.completed / s.total) * 100);
          return `<div class="rounded-xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-center justify-between mb-2">
              <div><span class="badge mr-2">${s.id}</span><span class="font-medium text-white">${s.name}</span></div>
              <span class="font-bold ${sPct >= 80 ? 'text-green-300' : sPct >= 60 ? 'text-amber-300' : 'text-red-300'}">${s.completed}/${s.total} (%${sPct})</span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full ${sPct >= 80 ? 'bg-green-400' : sPct >= 60 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${sPct}%"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}
