// ===== VERİ YEDEKLEME YÖNETİMİ =====
const STORAGE_KEY = 'backup_management';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, type: 'full', date: '2026-07-12 03:00', size: '2.4 GB', status: 'success', duration: '12 dk', location: 'Sunucu + Bulut', files: 166, records: 15420, notes: 'Otomatik gece yedekleme', retention: 30 },
    { id: 2, type: 'incremental', date: '2026-07-12 09:00', size: '180 MB', status: 'success', duration: '2 dk', location: 'Sunucu', files: 23, records: 1250, notes: 'Sabah artımlı yedek', retention: 7 },
    { id: 3, type: 'full', date: '2026-07-11 03:00', size: '2.3 GB', status: 'success', duration: '11 dk', location: 'Sunucu + Bulut', files: 164, records: 15100, notes: 'Otomatik gece yedekleme', retention: 30 },
    { id: 4, type: 'full', date: '2026-07-10 03:00', size: '2.2 GB', status: 'partial', duration: '15 dk', location: 'Sunucu', files: 160, records: 14800, notes: 'Bulut yükleme başarısız, yerel kopya alındı', retention: 30 },
    { id: 5, type: 'manual', date: '2026-07-09 17:30', size: '2.1 GB', status: 'success', duration: '10 dk', location: 'USB + Sunucu', files: 158, records: 14500, notes: 'Manuel yedek - bakım öncesi', retention: 90 },
  ];
  saveData(d); return d;
}
const TYPES = { full: { label: 'Tam Yedek', icon: '📦', color: 'blue' }, incremental: { label: 'Artımlı', icon: '📥', color: 'cyan' }, manual: { label: 'Manuel', icon: '👤', color: 'purple' }, differential: { label: 'Diferansiyel', icon: '📊', color: 'amber' } };

export function renderBackupManagementPage(el) {
  let data = getData();
  function render() {
    const lastSuccess = data.find(d => d.status === 'success');
    const failed = data.filter(d => d.status === 'partial' || d.status === 'failed').length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🔐 Veri Yedekleme Yönetimi</h1><p class="text-slate-400 text-sm mt-1">Otomatik yedekleme takvimi, geri yükleme ve felaket kurtarma planı</p></div>
        <button id="backup-now-btn" class="btn-primary">📦 Şimdi Yedekle</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${data.filter(d => d.status === 'success').length}</p><p class="text-xs text-slate-400">✅ Başarılı</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${failed}</p><p class="text-xs text-slate-400">⚠️ Kısmi/Başarısız</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${lastSuccess?.date.split(' ')[0] || '—'}</p><p class="text-xs text-slate-400">📅 Son Başarılı</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${data.length}</p><p class="text-xs text-slate-400">📋 Toplam Yedek</p></div>
      </div>

      <div class="card mb-4 border-l-4 border-green-500">
        <h3 class="text-sm font-semibold text-white mb-3">⏰ Yedekleme Zamanlaması</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-400">🌙 Tam Yedek</p><p class="text-sm font-medium text-white">Her gün 03:00</p><p class="text-xs text-slate-500">Sunucu + Bulut</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-400">📥 Artımlı Yedek</p><p class="text-sm font-medium text-white">Her 6 saatte</p><p class="text-xs text-slate-500">Sunucu</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-400">🗂️ Saklama Süresi</p><p class="text-sm font-medium text-white">Tam: 30 gün · Artımlı: 7 gün</p><p class="text-xs text-slate-500">Manuel: 90 gün</p></div>
        </div>
      </div>

      <div class="card mb-4">
        <h3 class="text-sm font-semibold text-white mb-3">🏢 Felaket Kurtarma Planı</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div class="rounded-lg bg-red-500/10 border border-red-500/20 p-3"><p class="font-bold text-red-300 mb-1">RPO (Recovery Point Objective)</p><p class="text-slate-300">Maksimum veri kaybı: <span class="text-white font-bold">6 saat</span></p><p class="text-slate-500 mt-1">Artımlı yedekler sayesinde son 6 saat içindeki veriler korunur</p></div>
          <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3"><p class="font-bold text-amber-300 mb-1">RTO (Recovery Time Objective)</p><p class="text-slate-300">Kurtarma süresi: <span class="text-white font-bold">2 saat</span></p><p class="text-slate-500 mt-1">Bulut yedekten geri yükleme yaklaşık 2 saat sürer</p></div>
        </div>
      </div>

      <div class="card overflow-x-auto"><table class="w-full min-w-[700px]"><thead><tr>
        <th class="th">Tür</th><th class="th">Tarih</th><th class="th">Boyut</th><th class="th">Durum</th><th class="th">Süre</th><th class="th">Konum</th><th class="th">Kayıt</th><th class="th">Not</th>
      </tr></thead><tbody>
        ${data.map(d => {
          const t = TYPES[d.type]; const sc = d.status === 'success' ? 'green' : d.status === 'partial' ? 'amber' : 'red';
          return `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td"><span class="badge bg-${t.color}-500/20 text-${t.color}-300">${t.icon} ${t.label}</span></td>
            <td class="td text-sm">${d.date}</td><td class="td font-medium">${d.size}</td>
            <td class="td"><span class="badge bg-${sc}-500/20 text-${sc}-300">${d.status === 'success' ? '✅ Başarılı' : d.status === 'partial' ? '⚠️ Kısmi' : '❌ Başarısız'}</span></td>
            <td class="td">${d.duration}</td><td class="td text-sm">${d.location}</td><td class="td">${d.records.toLocaleString()}</td><td class="td text-xs text-slate-400">${d.notes}</td>
          </tr>`;
        }).join('')}
      </tbody></table></div>
    </div>`;
    document.getElementById('backup-now-btn')?.addEventListener('click', () => {
      data.unshift({ id: Date.now(), type: 'manual', date: new Date().toISOString().slice(0, 16).replace('T', ' '), size: '2.4 GB', status: 'success', duration: '10 dk', location: 'Sunucu', files: 166, records: 15420, notes: 'Manuel yedekleme', retention: 90 });
      saveData(data); alert('✅ Yedekleme tamamlandı!'); render();
    });
  }
  render();
}
