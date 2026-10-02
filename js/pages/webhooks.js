// ===== WEBHOOKS & INTEGRATION READINESS =====
import { showToast } from '../notifications.js';

const save = (key, data) => localStorage.setItem('hospital_' + key, JSON.stringify(data));
const load = (key) => { try { return JSON.parse(localStorage.getItem('hospital_' + key)); } catch { return null; } };

const WEBHOOK_EVENTS = [
  { id: 'personnel.created', label: 'Personel Oluşturuldu', icon: '👤' },
  { id: 'personnel.updated', label: 'Personel Güncellendi', icon: '✏️' },
  { id: 'leave.requested', label: 'İzin Talep Edildi', icon: '🏖️' },
  { id: 'leave.approved', label: 'İzin Onaylandı', icon: '✅' },
  { id: 'schedule.created', label: 'Nöbet Oluşturuldu', icon: '📅' },
  { id: 'incident.reported', label: 'Olay Bildirildi', icon: '🚨' },
  { id: 'task.completed', label: 'Görev Tamamlandı', icon: '📋' },
  { id: 'announcement.published', label: 'Duyuru Yayınlandı', icon: '📝' },
];

const API_ENDPOINTS = [
  { method: 'GET', path: '/api/personnel', desc: 'Personel listesi', auth: true },
  { method: 'GET', path: '/api/personnel/:id', desc: 'Personel detay', auth: true },
  { method: 'POST', path: '/api/personnel', desc: 'Personel oluştur', auth: true },
  { method: 'PUT', path: '/api/personnel/:id', desc: 'Personel güncelle', auth: true },
  { method: 'GET', path: '/api/schedules', desc: 'Nöbet listesi', auth: true },
  { method: 'POST', path: '/api/schedules', desc: 'Nöbet oluştur', auth: true },
  { method: 'GET', path: '/api/attendance', desc: 'Puantaj kayıtları', auth: true },
  { method: 'GET', path: '/api/reports/monthly', desc: 'Aylık rapor', auth: true },
  { method: 'GET', path: '/api/departments', desc: 'Departman listesi', auth: false },
  { method: 'GET', path: '/api/health', desc: 'Sistem sağlık', auth: false },
];

export function renderWebhooksPage(el) {
  const webhooks = load('webhooks') || [];
  const logs = load('webhookLogs') || [];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔗 Entegrasyon & Webhook</h1>
      <p class="text-slate-400 text-sm mt-1">Webhook yönetimi, API endpoint'leri ve entegrasyon</p>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2 mb-6 fade-in">
      <button data-tab="webhooks" class="tab-active">🪝 Webhook'lar</button>
      <button data-tab="api" class="tab-inactive">🔌 API Endpoint'leri</button>
      <button data-tab="logs" class="tab-inactive">📜 Loglar</button>
      <button data-tab="calendar-int" class="tab-inactive">📅 Takvim Entegrasyonu</button>
    </div>

    <div id="wh-content"></div>`;

  function renderTab(tab) {
    document.querySelectorAll('[data-tab]').forEach(b => {
      b.className = b.dataset.tab === tab ? 'tab-active' : 'tab-inactive';
    });
    const content = document.getElementById('wh-content');

    if (tab === 'webhooks') renderWebhooksTab(content, webhooks);
    else if (tab === 'api') renderAPITab(content);
    else if (tab === 'logs') renderLogsTab(content, logs);
    else if (tab === 'calendar-int') renderCalendarIntegration(content);
  }

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => renderTab(btn.dataset.tab);
  });

  renderTab('webhooks');
}

function renderWebhooksTab(el, webhooks) {
  el.innerHTML = `
    <div class="fade-in">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-base font-semibold text-white">🪝 Kayıtlı Webhook'lar (${webhooks.length})</h3>
        <button id="add-wh-btn" class="btn-primary text-sm">+ Webhook Ekle</button>
      </div>
      ${webhooks.length ? `<div class="space-y-3">${webhooks.map(wh => `
        <div class="card flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full ${wh.active ? 'bg-green-400' : 'bg-slate-500'}"></span>
              <p class="text-sm font-medium text-white truncate">${wh.name}</p>
            </div>
            <p class="text-xs text-slate-500 truncate">${wh.url}</p>
            <div class="flex flex-wrap gap-1 mt-1">
              ${wh.events.map(e => `<span class="badge text-[9px]">${e}</span>`).join('')}
            </div>
          </div>
          <div class="flex gap-2 ml-3">
            <button data-toggle-wh="${wh.id}" class="btn-secondary text-xs px-3 py-1.5">${wh.active ? '⏸️' : '▶️'}</button>
            <button data-test-wh="${wh.id}" class="btn-secondary text-xs px-3 py-1.5">🧪 Test</button>
            <button data-delete-wh="${wh.id}" class="btn-secondary text-xs px-3 py-1.5 text-red-400">🗑️</button>
          </div>
        </div>
      `).join('')}</div>` : '<div class="empty-state"><div class="icon">🪝</div><div class="title">Webhook yok</div><div class="desc">Dış sistemlerle entegrasyon için webhook ekleyin</div></div>'}
    </div>`;

  document.getElementById('add-wh-btn').onclick = () => showWebhookModal(el);
  document.querySelectorAll('[data-toggle-wh]').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.toggleWh);
      const list = load('webhooks') || [];
      const wh = list.find(w => w.id === id);
      if (wh) { wh.active = !wh.active; save('webhooks', list); renderWebhooksTab(el, list); }
    };
  });
  document.querySelectorAll('[data-test-wh]').forEach(btn => {
    btn.onclick = () => showToast('Test webhook gönderildi (simülasyon)', 'success');
  });
  document.querySelectorAll('[data-delete-wh]').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Webhook silinsin mi?')) {
        save('webhooks', (load('webhooks') || []).filter(w => w.id !== parseInt(btn.dataset.deleteWh)));
        showToast('Webhook silindi', 'success');
        renderWebhooksTab(el, load('webhooks') || []);
      }
    };
  });
}

function showWebhookModal(el) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-lg font-bold text-white mb-4">🪝 Yeni Webhook</h3>
      <div class="space-y-3">
        <div><label class="label">Ad</label><input id="wh-name" class="input-field w-full" placeholder="Webhook adı"></div>
        <div><label class="label">URL</label><input id="wh-url" class="input-field w-full" placeholder="https://example.com/webhook"></div>
        <div><label class="label">Secret (opsiyonel)</label><input id="wh-secret" class="input-field w-full" placeholder="Güvenlik anahtarı"></div>
        <div><label class="label">Olaylar</label>
          <div class="grid grid-cols-2 gap-2 mt-1">
            ${WEBHOOK_EVENTS.map(e => `<label class="flex items-center gap-2 cursor-pointer rounded-lg bg-white/5 px-3 py-2"><input type="checkbox" name="wh-event" value="${e.id}" class="w-4 h-4"><span class="text-xs text-slate-300">${e.icon} ${e.label}</span></label>`).join('')}
          </div>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="wh-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="wh-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('wh-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  document.getElementById('wh-save').onclick = () => {
    const name = document.getElementById('wh-name').value.trim();
    const url = document.getElementById('wh-url').value.trim();
    if (!name || !url) { showToast('Ad ve URL gereklidir', 'error'); return; }
    const events = Array.from(document.querySelectorAll('input[name="wh-event"]:checked')).map(c => c.value);
    const webhooks = load('webhooks') || [];
    webhooks.push({ id: Date.now(), name, url, secret: document.getElementById('wh-secret').value.trim(), events, active: true, createdAt: new Date().toISOString() });
    save('webhooks', webhooks);
    modal.remove();
    showToast('Webhook eklendi', 'success');
    renderWebhooksTab(el, webhooks);
  };
}

function renderAPITab(el) {
  const methodColors = { GET: 'bg-green-500/20 text-green-300', POST: 'bg-blue-500/20 text-blue-300', PUT: 'bg-amber-500/20 text-amber-300', DELETE: 'bg-red-500/20 text-red-300' };
  el.innerHTML = `
    <div class="fade-in">
      <div class="card mb-4">
        <h3 class="text-base font-semibold text-white mb-2">🔌 API Endpoint'leri</h3>
        <p class="text-xs text-slate-400 mb-4">RESTful API referansı. Kimlik doğrulama gerektiren endpoint'ler JWT token kullanır.</p>
        <div class="space-y-2">
          ${API_ENDPOINTS.map(ep => `
            <div class="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
              <span class="badge text-[10px] font-mono ${methodColors[ep.method] || ''}">${ep.method}</span>
              <code class="text-sm text-cyan-300 font-mono flex-1">${ep.path}</code>
              <span class="text-xs text-slate-500">${ep.desc}</span>
              ${ep.auth ? '<span class="text-[10px] text-amber-400">🔒</span>' : '<span class="text-[10px] text-green-400">🌐</span>'}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">📋 API Kullanım Örneği</h3>
        <pre class="rounded-lg bg-black/30 p-4 text-xs text-green-300 font-mono overflow-x-auto"><code>// Personel listesi al
const response = await fetch('/api/personnel', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const data = await response.json();

// Yeni personel oluştur
await fetch('/api/personnel', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: 'Ahmet', surname: 'Yılmaz' })
});</code></pre>
      </div>
    </div>`;
}

function renderLogsTab(el, logs) {
  el.innerHTML = `
    <div class="fade-in">
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">📜 Son Webhook Logları</h3>
        ${logs.length ? `<div class="space-y-2">${logs.slice(0, 20).map(l => `
          <div class="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
            <span class="text-lg">${l.success ? '✅' : '❌'}</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs text-white truncate">${l.url}</p>
              <p class="text-[10px] text-slate-500">${l.event} · ${new Date(l.timestamp).toLocaleString('tr-TR')}</p>
            </div>
            <span class="badge text-[10px] ${l.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}">${l.statusCode || '-'}</span>
          </div>
        `).join('')}</div>` : '<p class="text-sm text-slate-500 text-center py-8">Henüz log kaydı yok</p>'}
      </div>
    </div>`;
}

function renderCalendarIntegration(el) {
  el.innerHTML = `
    <div class="fade-in">
      <div class="card mb-4">
        <h3 class="text-base font-semibold text-white mb-3">📅 Takvim Entegrasyonu</h3>
        <p class="text-sm text-slate-400 mb-4">Nöbet ve izin takviminizi dış takvim uygulamalarıyla senkronize edin.</p>
        <div class="space-y-3">
          <div class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📅</span>
              <div><p class="text-sm font-medium text-white">iCal Feed URL</p><p class="text-xs text-slate-500">Nöbet takvimi için iCal formatında feed</p></div>
            </div>
            <button id="copy-ical" class="btn-secondary text-xs">📋 Kopyala</button>
          </div>
          <div class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📆</span>
              <div><p class="text-sm font-medium text-white">Google Calendar</p><p class="text-xs text-slate-500">Google Takvim ile senkronize et</p></div>
            </div>
            <button class="btn-secondary text-xs">🔗 Bağlan</button>
          </div>
          <div class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📧</span>
              <div><p class="text-sm font-medium text-white">Outlook</p><p class="text-xs text-slate-500">Outlook takvim ile senkronize et</p></div>
            </div>
            <button class="btn-secondary text-xs">🔗 Bağlan</button>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('copy-ical')?.addEventListener('click', () => {
    const url = window.location.origin + '/api/calendar/personnel.ics';
    navigator.clipboard?.writeText(url).then(() => showToast('iCal URL kopyalandı', 'success')).catch(() => showToast('Kopyalanamadı', 'error'));
  });
}
