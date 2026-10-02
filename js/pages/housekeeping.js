// ===== KAT HİZMETLERİ YÖNETİMİ =====
const housekeepingTasks = [
  { id: 1, room: 'DAH-01', floor: 2, type: 'Günlük Temizlik', assignee: 'Temizlik Ayşe', status: 'completed', time: '08:30', priority: 'normal' },
  { id: 2, room: 'DAH-02', floor: 2, type: 'Günlük Temizlik', assignee: 'Temizlik Ayşe', status: 'completed', time: '08:45', priority: 'normal' },
  { id: 3, room: 'CERRAHİ-01', floor: 3, type: 'Terminal Temizlik', assignee: 'Temizlik Fatma', status: 'in-progress', time: '09:00', priority: 'high' },
  { id: 4, room: 'YBÜ-01', floor: 1, type: 'Dezenfeksiyon', assignee: 'Temizlik Hasan', status: 'pending', time: '10:00', priority: 'high' },
  { id: 5, room: 'Poliklinik-3', floor: 0, type: 'Günlük Temizlik', assignee: 'Temizlik Zeynep', status: 'completed', time: '07:30', priority: 'normal' },
  { id: 6, room: 'Ameliyathane-2', floor: 1, type: 'Terminal Temizlik', assignee: 'Temizlik Hasan', status: 'pending', time: '11:00', priority: 'critical' },
  { id: 7, room: 'Lobi & Bekleme', floor: 0, type: 'Genel Temizlik', assignee: 'Temizlik Mehmet', status: 'completed', time: '07:00', priority: 'normal' },
  { id: 8, room: 'Tuvalet-3.Kat', floor: 3, type: 'Hijyen Temizliği', assignee: 'Temizlik Fatma', status: 'in-progress', time: '09:15', priority: 'normal' },
];

export function renderHousekeepingPage(el) {
  const completed = housekeepingTasks.filter(t => t.status === 'completed').length;
  const pending = housekeepingTasks.filter(t => t.status === 'pending').length;
  const inProgress = housekeepingTasks.filter(t => t.status === 'in-progress').length;
  const highPriority = housekeepingTasks.filter(t => t.priority === 'high' || t.priority === 'critical').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🧹 Kat Hizmetleri Yönetimi</h1>
      <p class="text-slate-400 text-sm mt-1">Oda temizlik programı, çarşaf değişimi, housekeeping checklist</p>
    </div>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${housekeepingTasks.length}</p><p class="text-xs text-slate-400">Toplam Görev</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inProgress}</p><p class="text-xs text-slate-400">Devam Eden</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${highPriority}</p><p class="text-xs text-slate-400">Yüksek Öncelik</p></div>
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Temizlik Görev Listesi</h3>
      <div class="space-y-2">
        ${housekeepingTasks.map(t => `
          <div class="flex items-center gap-3 rounded-xl p-3 ${t.priority === 'critical' ? 'bg-red-500/10 border border-red-500/20' : t.priority === 'high' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-white/5 border border-white/10'}">
            <div class="text-2xl">${t.type === 'Terminal Temizlik' ? '🧪' : t.type === 'Dezenfeksiyon' ? '🧴' : t.type === 'Hijyen Temizliği' ? '🧼' : '🧹'}</div>
            <div class="flex-1">
              <p class="text-sm font-medium text-white">${t.room} <span class="text-xs text-slate-500">(${t.floor}. kat)</span></p>
              <p class="text-xs text-slate-400">${t.type} · ${t.assignee} · ${t.time}</p>
            </div>
            <span class="badge ${t.priority==='critical'?'bg-red-500/20 text-red-300':t.priority==='high'?'bg-amber-500/20 text-amber-300':'bg-slate-500/20 text-slate-400'}">${t.priority==='critical'?'🔴 Kritik':t.priority==='high'?'🟡 Yüksek':'⚪ Normal'}</span>
            <span class="badge ${t.status==='completed'?'bg-green-500/20 text-green-300':t.status==='in-progress'?'bg-blue-500/20 text-blue-300':'bg-amber-500/20 text-amber-300'}">${t.status==='completed'?'✅':t.status==='in-progress'?'🔄':'⏳'}</span>
          </div>`).join('')}
      </div>
    </div>`;
}
