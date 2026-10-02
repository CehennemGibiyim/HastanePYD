// ===== ÇALIŞAN SELF SERVİS PORTALI =====
import { getCurrentUser, getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';
import { readRecord, writeRecord, uid, dateOnly, formatDate, escapeHTML } from '../services/hr-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const seed = {
  requests: [
    { id: 'req_seed_1', type: 'leave', title: 'Yıllık izin talebi', status: 'pending', createdAt: dateOnly(), detail: '2 gün · 22–23 Temmuz' },
    { id: 'req_seed_2', type: 'document', title: 'Sertifika yükleme', status: 'approved', createdAt: '2026-07-08', detail: 'İleri yaşam desteği sertifikası' },
  ],
  documents: [
    { id: 'doc_1', name: 'İleri Yaşam Desteği Sertifikası', type: 'certificate', expiresAt: '2026-08-16', status: 'valid' },
    { id: 'doc_2', name: 'İşyeri Hekimliği Muayenesi', type: 'health', expiresAt: '2026-09-28', status: 'valid' },
    { id: 'doc_3', name: 'Görev Tanımı ve Sözleşme', type: 'contract', expiresAt: '2027-01-12', status: 'valid' },
  ],
};

export async function renderEmployeePortalPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('hr.loading')}</div>`;
  const data = await readRecord('portal', seed);
  data.requests ||= [];
  data.documents ||= [];
  const user = getCurrentUser() || { name: t('hr.employee') };
  const person = getPersonnel({ status: 'active' }).find(p => `${p.name} ${p.surname}`.includes(user.name)) || getPersonnel({ status: 'active' })[0];
  const activeDocs = data.documents.filter(d => new Date(d.expiresAt) >= new Date());
  const pending = data.requests.filter(r => r.status === 'pending').length;
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><p class="text-xs uppercase tracking-widest text-cyan-300">${t('hr.eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('hr.portal_title')}</h1><p class="text-slate-400 text-sm mt-1">${t('hr.portal_subtitle')}</p></div>
        <div class="flex flex-wrap gap-2"><button id="portal-my-work" class="btn-secondary">✓ ${t('app.my_work')}</button><button id="portal-new-request" class="btn-primary">＋ ${t('hr.new_request')}</button></div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('👤', t('hr.my_profile'), person ? `${person.name} ${person.surname}` : t('hr.employee'), 'cyan')}
        ${statCard('⏳', t('hr.pending_requests'), pending, 'amber')}
        ${statCard('📄', t('hr.valid_documents'), activeDocs.length, 'green')}
        ${statCard('📅', t('hr.next_shift'), person?.department || t('hr.not_defined'), 'purple')}
      </div>
      <div class="flex gap-2 overflow-x-auto pb-2 mb-5">
        ${tabButton('overview', t('hr.overview'), true)}${tabButton('requests', t('hr.my_requests'))}${tabButton('documents', t('hr.documents'))}
      </div>
      <div id="portal-panel"></div>
    </div>`;
  renderPortalTab('overview', data, person);
  container.querySelectorAll('[data-portal-tab]').forEach(btn => btn.onclick = () => {
    container.querySelectorAll('[data-portal-tab]').forEach(b => b.className = 'tab-inactive');
    btn.className = 'tab-active';
    renderPortalTab(btn.dataset.portalTab, data, person);
  });
  document.getElementById('portal-new-request').onclick = () => renderRequestForm(data, person);
  document.getElementById('portal-my-work').onclick = () => { location.hash = 'my-work'; };
}

function renderPortalTab(tab, data, person) {
  const panel = document.getElementById('portal-panel');
  if (!panel) return;
  if (tab === 'requests') panel.innerHTML = requestsHTML(data.requests);
  else if (tab === 'documents') panel.innerHTML = documentsHTML(data.documents);
  else panel.innerHTML = overviewHTML(data, person);
}

function renderRequestForm(data, person) {
  const panel = document.getElementById('portal-panel');
  panel.innerHTML = `<div class="card max-w-2xl"><div class="flex items-center justify-between mb-5"><h3 class="text-lg font-semibold text-white">📝 ${t('hr.new_request')}</h3><button id="portal-cancel" class="btn-secondary text-xs">${t('hr.cancel')}</button></div><div class="grid md:grid-cols-2 gap-4"><div><label class="label">${t('hr.request_type')}</label><select id="portal-type" class="input-field w-full"><option value="leave">${t('hr.leave_request')}</option><option value="overtime">${t('hr.overtime_request')}</option><option value="shift">${t('hr.shift_change_request')}</option><option value="document">${t('hr.document_request')}</option></select></div><div><label class="label">${t('hr.request_date')}</label><input id="portal-date" type="date" class="input-field w-full" value="${dateOnly()}"></div><div class="md:col-span-2"><label class="label">${t('hr.details')}</label><textarea id="portal-detail" class="input-field w-full" rows="4" placeholder="${t('hr.details_placeholder')}"></textarea></div></div><button id="portal-submit" class="btn-primary mt-5">📤 ${t('hr.submit_request')}</button></div>`;
  document.getElementById('portal-cancel').onclick = () => renderPortalTab('overview', data, person);
  document.getElementById('portal-submit').onclick = async () => {
    const detail = document.getElementById('portal-detail').value.trim();
    if (!detail) { showToast(t('hr.details_required'), 'error'); return; }
    data.requests.unshift({ id: uid('request'), type: document.getElementById('portal-type').value, title: detail.slice(0, 60), detail, status: 'pending', createdAt: dateOnly(), employee: person?.id || null });
    await writeRecord('portal', data); showToast(t('hr.request_saved'), 'success');
    renderEmployeePortalPage(document.getElementById('content'));
  };
}

function overviewHTML(data, person) {
  const latest = data.requests.slice(0, 3);
  return `<div class="grid lg:grid-cols-[1.15fr_.85fr] gap-5"><div class="card"><h3 class="text-lg font-semibold text-white mb-4">👋 ${t('hr.welcome_user', { name: escapeHTML(person ? `${person.name} ${person.surname}` : t('hr.employee')) })}</h3><div class="grid grid-cols-2 gap-3">${detail(t('hr.department'), person?.department || '—')}${detail(t('hr.title'), person?.title || '—')}${detail(t('hr.start_date'), formatDate(person?.startDate))}${detail(t('hr.work_profile'), person?.workProfile || '—')}</div></div><div class="card"><h3 class="text-lg font-semibold text-white mb-4">🔔 ${t('hr.recent_activity')}</h3>${latest.length ? `<div class="space-y-3">${latest.map(r => `<div class="flex gap-3"><span class="text-lg">${statusIcon(r.status)}</span><div><p class="text-sm text-white">${escapeHTML(r.title)}</p><p class="text-xs text-slate-500">${formatDate(r.createdAt)} · ${statusLabel(r.status)}</p></div></div>`).join('')}</div>` : `<div class="empty-state py-5"><div class="title">${t('hr.no_requests')}</div></div>`}</div></div>`;
}
function requestsHTML(requests) { return `<div class="space-y-3">${requests.length ? requests.map(r => `<div class="card flex flex-wrap items-center gap-3"><span class="text-2xl">${statusIcon(r.status)}</span><div class="flex-1 min-w-[180px]"><p class="font-medium text-white">${escapeHTML(r.title)}</p><p class="text-xs text-slate-400">${escapeHTML(r.detail || '')}</p></div><span class="badge">${statusLabel(r.status)}</span><span class="text-xs text-slate-500">${formatDate(r.createdAt)}</span></div>`).join('') : `<div class="empty-state card"><div class="icon">📭</div><div class="title">${t('hr.no_requests')}</div></div>`}</div>`; }
function documentsHTML(docs) { return `<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">${docs.map(d => `<div class="card"><div class="flex justify-between gap-3"><span class="text-2xl">📄</span><span class="badge ${new Date(d.expiresAt) < new Date(Date.now() + 45 * 86400000) ? 'text-amber-300' : ''}">${formatDate(d.expiresAt)}</span></div><h3 class="font-medium text-white mt-4">${escapeHTML(d.name)}</h3><p class="text-xs text-slate-400 mt-1">${t('hr.document_expiry')}</p></div>`).join('')}</div>`; }
function detail(label, value) { return `<div class="rounded-xl bg-white/5 border border-white/5 p-3"><p class="text-xs text-slate-500">${label}</p><p class="text-sm text-white mt-1">${escapeHTML(value)}</p></div>`; }
function statCard(icon, label, value, color) { return `<div class="card border-${color}-500/20"><p class="text-xs text-slate-400">${icon} ${label}</p><p class="text-lg font-bold text-white mt-2 truncate">${escapeHTML(value)}</p></div>`; }
function tabButton(id, label, active = false) { return `<button data-portal-tab="${id}" class="${active ? 'tab-active' : 'tab-inactive'}">${label}</button>`; }
function statusIcon(status) { return ({ pending: '⏳', approved: '✅', rejected: '❌' })[status] || '📌'; }
function statusLabel(status) { return ({ pending: t('hr.pending'), approved: t('hr.approved'), rejected: t('hr.rejected') })[status] || status; }
