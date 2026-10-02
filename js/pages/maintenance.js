// ===== BAKIM & ARIZA BİLDİRİM SİSTEMİ =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_maintenance';

function getTickets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultTickets(); } catch { return getDefaultTickets(); }
}
function saveTickets(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultTickets() {
  const now = new Date().toISOString();
  return [
    { id: 1, title: '3. Kat Tuvalet Tıkanıklığı', description: 'Kadınlar tuvaleti tıkalı, acil müdahale gerekli', category: 'plumbing', priority: 'urgent', status: 'in_progress', location: '3. Kat - Kadınlar Tuvaleti', reporter: 'Hem. Ayşe K.', assignee: 'Teknik Ekip', createdAt: now, resolvedAt: '', photo: '' },
    { id: 2, title: 'Asansör Arızası (B Blok)', description: 'B blok asansörü 2. katta durdu, kapı açılmıyor', category: 'elevator', priority: 'urgent', status: 'open', location: 'B Blok Asansör', reporter: 'Güv. Mehmet D.', assignee: '', createdAt: now, resolvedAt: '', photo: '' },
    { id: 3, title: 'Klima Bakımı - Ameliyathane 2', description: 'Klima yeterli soğutmuyor, sıcaklık 25°C üstüne çıkıyor', category: 'hvac', priority: 'high', status: 'open', location: 'Ameliyathane 2', reporter: 'Dr. Fatma Y.', assignee: '', createdAt: now, resolvedAt: '', photo: '' },
    { id: 4, title: 'Kırık Sandalye - Hemşire İstasyonu', description: 'Hemşire istasyonundaki sandalyenin tekerleği kırık', category: 'furniture', priority: 'low', status: 'resolved', location: '2. Kat Hemşire İst.', reporter: 'Hem. Zeynep A.', assignee: 'Teknik Ekip', createdAt: now, resolvedAt: now, photo: '' },
  ];
}

const categories = { plumbing: '🔧 Tesisat', electrical: '⚡ Elektrik', hvac: '❄️ Klima/HVAC', elevator: '🛗 Asansör', furniture: '🪑 Mobilya', it: '💻 Bilgi İşlem', cleaning: '🧹 Temizlik', security: '🛡️ Güvenlik', other: '📋 Diğer' };
const priorities = { urgent: { label: 'Acil', color: 'text-red-400 bg-red-500/10 border-red-500/20' }, high: { label: 'Yüksek', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }, normal: { label: 'Normal', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' }, low: { label: 'Düşük', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' } };
const statuses = { open: { label: 'Açık', color: 'text-red-400', icon: '🔴' }, in_progress: { label: 'İnceleniyor', color: 'text-amber-400', icon: '🟡' }, resolved: { label: 'Çözüldü', color: 'text-green-400', icon: '🟢' }, closed: { label: 'Kapatıldı', color: 'text-slate-400', icon: '⚪' } };

export function renderMaintenancePage(el) {
  const tickets = getTickets();
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🔧 Bakım & Arıza Bildirim Sistemi</h1>
          <p class="text-slate-400 text-sm mt-1">Arıza bildirimi oluştur, takip et ve çöz</p>
        </div>
        <button id="add-ticket-btn" class="btn-primary">➕ Arıza Bildir</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${openCount}</p><p class="text-xs text-slate-400">🔴 Açık Talepler</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${inProgressCount}</p><p class="text-xs text-slate-400">🟡 İnceleniyor</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${resolvedCount}</p><p class="text-xs text-slate-400">🟢 Çözülen</p></div>
      <div class="card text-center"><p class="text-3xl font-bold ${urgentCount > 0 ? 'text-red-300 animate-pulse' : 'text-slate-300'}">${urgentCount}</p><p class="text-xs text-slate-400">🚨 Acil Bekleyen</p></div>
    </div>

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Talep Listesi</h3>
        <select id="tf-status" class="input-field text-xs"><option value="">Tüm Durumlar</option>${Object.entries(statuses).map(([k,v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select>
        <select id="tf-priority" class="input-field text-xs"><option value="">Tüm Öncelikler</option>${Object.entries(priorities).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}</select>
        <select id="tf-cat" class="input-field text-xs"><option value="">Tüm Kategoriler</option>${Object.entries(categories).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="space-y-3" id="ticket-list">${ticketListHTML(tickets)}</div>
    </div>`;

  const filterAndRender = () => {
    const status = el.querySelector('#tf-status').value;
    const priority = el.querySelector('#tf-priority').value;
    const cat = el.querySelector('#tf-cat').value;
    let filtered = tickets;
    if (status) filtered = filtered.filter(t => t.status === status);
    if (priority) filtered = filtered.filter(t => t.priority === priority);
    if (cat) filtered = filtered.filter(t => t.category === cat);
    el.querySelector('#ticket-list').innerHTML = ticketListHTML(filtered);
    attachTicketHandlers(el, tickets);
  };
  el.querySelector('#tf-status').addEventListener('change', filterAndRender);
  el.querySelector('#tf-priority').addEventListener('change', filterAndRender);
  el.querySelector('#tf-cat').addEventListener('change', filterAndRender);
  el.querySelector('#add-ticket-btn')?.addEventListener('click', () => showTicketModal(el));
  attachTicketHandlers(el, tickets);
}

function attachTicketHandler(el, tickets) {
  el.querySelectorAll('.ticket-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = getTickets();
      const t = list.find(x => x.id === parseInt(btn.dataset.id));
      if (t) {
        t.status = btn.dataset.status;
        if (btn.dataset.status === 'resolved') t.resolvedAt = new Date().toISOString();
        saveTickets(list);
        showToast('Durum güncellendi', 'success');
        renderMaintenancePage(el);
      }
    });
  });
}

function attachTicketHandlers(el, tickets) { attachTicketHandler(el, tickets); }

function ticketListHTML(tickets) {
  if (tickets.length === 0) return '<p class="text-slate-500 text-sm text-center py-8">Talep bulunamadı</p>';
  return tickets.sort((a, b) => {
    const pOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    return (pOrder[a.priority] || 9) - (pOrder[b.priority] || 9);
  }).map(t => `
    <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20 transition">
      <div class="flex items-start gap-3">
        <div class="text-2xl">${categories[t.category]?.split(' ')[0] || '📋'}</div>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h4 class="font-semibold text-white text-sm">${t.title}</h4>
            <span class="text-[10px] px-2 py-0.5 rounded-full border ${priorities[t.priority]?.color}">${priorities[t.priority]?.label}</span>
            <span class="text-[10px] ${statuses[t.status]?.color}">${statuses[t.status]?.icon} ${statuses[t.status]?.label}</span>
          </div>
          <p class="text-xs text-slate-400 mb-2">${t.description}</p>
          <div class="flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
            <span>📍 ${t.location}</span>
            <span>👤 ${t.reporter}</span>
            ${t.assignee ? `<span>🔧 ${t.assignee}</span>` : ''}
            <span>📅 ${new Date(t.createdAt).toLocaleDateString('tr-TR')}</span>
          </div>
        </div>
        <div class="flex gap-1 flex-col">
          ${t.status === 'open' ? `<button class="ticket-status-btn btn-secondary text-[10px] px-2 py-1" data-id="${t.id}" data-status="in_progress">🔧 İncele</button>` : ''}
          ${t.status === 'in_progress' ? `<button class="ticket-status-btn btn-primary text-[10px] px-2 py-1" data-id="${t.id}" data-status="resolved">✅ Çözüldü</button>` : ''}
        </div>
      </div>
    </div>`).join('');
}

function showTicketModal(el) {
  const existing = document.getElementById('ticket-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'ticket-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🔧 Arıza Bildirimi</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık *</label><input id="t-title" class="input-field w-full" placeholder="Sorunu kısaca açıklayın"></div>
        <div><label class="label">Açıklama</label><textarea id="t-desc" class="input-field w-full" rows="3" placeholder="Detaylı açıklama..."></textarea></div>
        <div><label class="label">Kategori</label><select id="t-cat" class="input-field w-full">${Object.entries(categories).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div><label class="label">Öncelik</label><select id="t-priority" class="input-field w-full"><option value="normal">Normal</option><option value="urgent">🚨 Acil</option><option value="high">⬆️ Yüksek</option><option value="low">⬇️ Düşük</option></select></div>
        <div><label class="label">Konum</label><input id="t-location" class="input-field w-full" placeholder="3. Kat, Oda 305"></div>
        <div><label class="label">Bildiren</label><input id="t-reporter" class="input-field w-full" placeholder="Adınız"></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="t-save" class="btn-primary flex-1">📤 Gönder</button>
        <button id="t-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#t-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#t-save').onclick = () => {
    const title = modal.querySelector('#t-title').value.trim();
    if (!title) { showToast('Başlık zorunludur', 'error'); return; }
    const tickets = getTickets();
    tickets.push({
      id: Date.now(), title,
      description: modal.querySelector('#t-desc').value.trim(),
      category: modal.querySelector('#t-cat').value,
      priority: modal.querySelector('#t-priority').value,
      status: 'open',
      location: modal.querySelector('#t-location').value.trim(),
      reporter: modal.querySelector('#t-reporter').value.trim() || 'Anonim',
      assignee: '', createdAt: new Date().toISOString(), resolvedAt: '', photo: ''
    });
    saveTickets(tickets);
    modal.remove();
    showToast('Arıza bildirimi gönderildi!', 'success');
    renderMaintenancePage(el);
  };
}
