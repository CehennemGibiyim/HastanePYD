// ===== SİSTEM PERFORMANS MONİTÖRİNG =====
const STORAGE_KEY = 'system_monitoring';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = {
    server: { cpu: 34, memory: 62, disk: 45, network: 12, uptime: '45 gün 12 saat', hostname: 'hastane-pys-01', ip: '10.0.1.100', os: 'Ubuntu 22.04 LTS' },
    database: { connections: 24, maxConnections: 100, queryTime: 12, slowQueries: 3, size: '4.2 GB', lastBackup: '2026-07-12 03:00' },
    api: { requestsPerMin: 145, avgResponseTime: 85, errorRate: 0.3, activeUsers: 42, totalEndpoints: 28, healthyEndpoints: 27 },
    services: [
      { name: 'Web Sunucusu', status: 'healthy', cpu: 12, memory: 340, uptime: '45g 12s', port: 443 },
      { name: 'Veritabanı', status: 'healthy', cpu: 8, memory: 1200, uptime: '45g 12s', port: 5432 },
      { name: 'Redis Cache', status: 'healthy', cpu: 2, memory: 256, uptime: '45g 12s', port: 6379 },
      { name: 'Background Worker', status: 'warning', cpu: 45, memory: 512, uptime: '2g 5s', port: 8080 },
      { name: 'SMS Gateway', status: 'healthy', cpu: 1, memory: 64, uptime: '30g 8s', port: 9090 },
      { name: 'File Storage', status: 'healthy', cpu: 3, memory: 128, uptime: '45g 12s', port: 9000 },
      { name: 'Email Service', status: 'down', cpu: 0, memory: 0, uptime: '—', port: 587 },
    ],
    alerts: [
      { time: '16:45', level: 'warning', message: 'Background Worker bellek kullanımı %85 üzerine çıktı', service: 'Background Worker' },
      { time: '14:30', level: 'error', message: 'Email Service bağlantı hatası — SMTP sunucuya ulaşılamıyor', service: 'Email Service' },
      { time: '10:15', level: 'info', message: 'Otomatik yedekleme başarıyla tamamlandı', service: 'Backup' },
      { time: '09:00', level: 'warning', message: 'Yavaş sorgu tespit edildi: personnel_search (2.3s)', service: 'Veritabanı' },
    ],
    metrics: { totalUsers: 156, activeToday: 42, totalRequests: 245000, avgLoadTime: 1.2, errorCount: 12, p95Response: 250 }
  };
  saveData(d); return d;
}

export function renderSystemMonitoringPage(el) {
  let data = getData();
  function render() {
    const s = data.server;
    const healthy = data.services.filter(sv => sv.status === 'healthy').length;
    const total = data.services.length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">📊 Sistem Performans Monitöring</h1><p class="text-slate-400 text-sm mt-1">Sistem sağlık durumu, API yanıt süreleri ve hata oranları</p></div>
        <div class="flex items-center gap-2"><span class="text-2xl">${healthy === total ? '🟢' : '🟡'}</span><span class="text-sm font-medium text-white">${healthy}/${total} Servis Sağlıklı</span></div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold ${s.cpu > 80 ? 'text-red-300' : s.cpu > 60 ? 'text-amber-300' : 'text-green-300'}">${s.cpu}%</p><p class="text-xs text-slate-400">🖥️ CPU</p><div class="w-full h-2 rounded-full bg-white/10 mt-2"><div class="h-full rounded-full ${s.cpu > 80 ? 'bg-red-400' : s.cpu > 60 ? 'bg-amber-400' : 'bg-green-400'}" style="width:${s.cpu}%"></div></div></div>
        <div class="card text-center"><p class="text-3xl font-bold ${s.memory > 80 ? 'text-red-300' : s.memory > 60 ? 'text-amber-300' : 'text-green-300'}">${s.memory}%</p><p class="text-xs text-slate-400">💾 Bellek</p><div class="w-full h-2 rounded-full bg-white/10 mt-2"><div class="h-full rounded-full ${s.memory > 80 ? 'bg-red-400' : s.memory > 60 ? 'bg-amber-400' : 'bg-blue-400'}" style="width:${s.memory}%"></div></div></div>
        <div class="card text-center"><p class="text-3xl font-bold ${s.disk > 80 ? 'text-red-300' : s.disk > 60 ? 'text-amber-300' : 'text-green-300'}">${s.disk}%</p><p class="text-xs text-slate-400">💿 Disk</p><div class="w-full h-2 rounded-full bg-white/10 mt-2"><div class="h-full rounded-full ${s.disk > 80 ? 'bg-red-400' : s.disk > 60 ? 'bg-amber-400' : 'bg-purple-400'}" style="width:${s.disk}%"></div></div></div>
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.api.avgResponseTime}ms</p><p class="text-xs text-slate-400">⚡ API Yanıt</p><p class="text-xs text-slate-500 mt-1">P95: ${data.metrics.p95Response}ms</p></div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${data.api.activeUsers}</p><p class="text-xs text-slate-400">👥 Aktif Kullanıcı</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-green-300">${data.api.requestsPerMin}</p><p class="text-xs text-slate-400">📈 İstek/dk</p></div>
        <div class="card text-center"><p class="text-2xl font-bold ${data.api.errorRate > 1 ? 'text-red-300' : 'text-green-300'}">${data.api.errorRate}%</p><p class="text-xs text-slate-400">❌ Hata Oranı</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-blue-300">${data.metrics.totalRequests.toLocaleString()}</p><p class="text-xs text-slate-400">📊 Toplam İstek</p></div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="card">
          <h3 class="text-sm font-semibold text-white mb-3">🔧 Servis Durumu</h3>
          <div class="space-y-2">${data.services.map(sv => `
            <div class="flex items-center gap-3 rounded-lg bg-white/5 p-3">
              <span class="text-lg">${sv.status === 'healthy' ? '🟢' : sv.status === 'warning' ? '🟡' : '🔴'}</span>
              <div class="flex-1"><p class="text-sm font-medium text-white">${sv.name}</p><p class="text-xs text-slate-500">Port: ${sv.port} · Uptime: ${sv.uptime}</p></div>
              <div class="text-right"><p class="text-xs text-slate-400">CPU: ${sv.cpu}% · RAM: ${sv.memory}MB</p></div>
            </div>`).join('')}</div>
        </div>
        <div class="card">
          <h3 class="text-sm font-semibold text-white mb-3">⚠️ Son Uyarılar</h3>
          <div class="space-y-2">${data.alerts.map(a => `
            <div class="rounded-lg bg-white/5 p-3 border-l-4 ${a.level === 'error' ? 'border-red-500' : a.level === 'warning' ? 'border-amber-500' : 'border-blue-500'}">
              <div class="flex items-center gap-2 mb-1"><span>${a.level === 'error' ? '🔴' : a.level === 'warning' ? '🟡' : 'ℹ️'}</span><span class="text-xs text-slate-500">${a.time}</span><span class="badge bg-white/10 text-xs">${a.service}</span></div>
              <p class="text-sm text-slate-200">${a.message}</p>
            </div>`).join('')}</div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-white mb-3">🖥️ Sunucu Bilgileri</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-500">Hostname</p><p class="text-sm font-medium text-white">${s.hostname}</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-500">IP</p><p class="text-sm font-medium text-white">${s.ip}</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-500">Uptime</p><p class="text-sm font-medium text-white">${s.uptime}</p></div>
          <div class="rounded-lg bg-white/5 p-3"><p class="text-xs text-slate-500">İşletim Sistemi</p><p class="text-sm font-medium text-white">${s.os}</p></div>
        </div>
      </div>
    </div>`;
  }
  render();
}
