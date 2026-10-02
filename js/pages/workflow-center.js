// ===== ONAY VE İŞ AKIŞI MERKEZİ =====
import { showToast } from '../notifications.js';
import { getPersonnel, hasPermission } from '../state.js';
import { readRecord, writeRecord, uid, formatDate, escapeHTML } from '../services/hr-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const seed = {
  requests: [
    { id: 'wf_1', title: 'Fazla mesai onayı', type: 'overtime', requester: 'Ayşe Demir', department: 'Hemşirelik', status: 'pending', createdAt: '2026-07-12', step: 1, totalSteps: 3 },
    { id: 'wf_2', title: 'Birim değişikliği', type: 'transfer', requester: 'Mehmet Kaya', department: 'Acil Servis', status: 'pending', createdAt: '2026-07-11', step: 2, totalSteps: 3 },
    { id: 'wf_3', title: 'Yıllık izin talebi', type: 'leave', requester: 'Elif Yıldız', department: 'Dahiliye', status: 'approved', createdAt: '2026-07-09', step: 3, totalSteps: 3 },
  ],
  templates: [
    { id: 'leave', name: 'İzin Talebi', steps: ['Birim sorumlusu', 'İK kontrolü', 'Son onay'] },
    { id: 'overtime', name: 'Fazla Mesai', steps: ['Birim sorumlusu', 'Başhemşire', 'İK puantaj'] },
    { id: 'transfer', name: 'Görev Yeri Değişikliği', steps: ['Birim yöneticisi', 'İK inceleme', 'Üst yönetim'] },
  ],
};

export async function renderWorkflowCenterPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('hr.loading')}</div>`;
  const data = await readRecord('workflow', seed);
  data.requests ||= [];
  data.templates ||= [];
  const pending = data.requests.filter(r => r.status === 'pending');
  container.innerHTML = `<div class="fade-in"><div class="flex flex-wrap items-center justify-between gap-3 mb-6"><div><p class="text-xs uppercase tracking-widest text-amber-300">${t('hr.eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('hr.workflow_title')}</h1><p class="text-slate-400 text-sm mt-1">${t('hr.workflow_subtitle')}</p></div>${hasPermission('write') ? `<button id="wf-new" class="btn-primary">＋ ${t('hr.create_request')}</button>` : ''}</div><div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${metric(t('hr.pending_requests'), pending.length, 'amber')}${metric(t('hr.approved'), data.requests.filter(r => r.status === 'approved').length, 'green')}${metric(t('hr.active_flows'), data.templates.length, 'cyan')}${metric(t('hr.avg_step'), pending.length ? Math.round(pending.reduce((s, r) => s + r.step, 0) / pending.length) : 0, 'purple')}</div><div class="flex gap-2 mb-5"><button class="tab-active" data-wf-tab="requests">📥 ${t('hr.approval_inbox')}</button><button class="tab-inactive" data-wf-tab="templates">⚙️ ${t('hr.workflow_templates')}</button></div><div id="wf-panel"></div></div>`;
  renderTab('requests', data);
  container.querySelectorAll('[data-wf-tab]').forEach(btn => btn.onclick = () => { container.querySelectorAll('[data-wf-tab]').forEach(b => b.className = 'tab-inactive'); btn.className = 'tab-active'; renderTab(btn.dataset.wfTab, data); });
  document.getElementById('wf-new')?.addEventListener('click', () => renderCreateForm(data));
}

function renderTab(tab, data) {
  const panel = document.getElementById('wf-panel');
  if (tab === 'templates') { panel.innerHTML = `<div class="grid lg:grid-cols-3 gap-4">${data.templates.map(templateHTML).join('')}</div>`; return; }
  const items = data.requests.filter(r => r.status === 'pending');
  panel.innerHTML = items.length ? `<div class="space-y-3">${items.map(r => requestHTML(r, hasPermission('write'))).join('')}</div>` : `<div class="empty-state card"><div class="icon">✅</div><div class="title">${t('hr.no_pending')}</div><div class="desc">${t('hr.inbox_clear')}</div></div>`;
  panel.querySelectorAll('[data-wf-action]').forEach(btn => btn.onclick = async () => {
    const item = data.requests.find(r => r.id === btn.dataset.id); if (!item) return;
    if (btn.dataset.wfAction === 'approve') { item.step += 1; if (item.step >= item.totalSteps) item.status = 'approved'; }
    else item.status = 'rejected';
    await writeRecord('workflow', data); showToast(item.status === 'approved' ? t('hr.flow_approved') : t('hr.flow_rejected'), item.status === 'approved' ? 'success' : 'warning'); renderWorkflowCenterPage(document.getElementById('content'));
  });
}

function renderCreateForm(data) {
  const panel = document.getElementById('wf-panel');
  const personnel = getPersonnel({ status: 'active' });
  panel.innerHTML = `<div class="card max-w-2xl"><div class="flex justify-between items-center mb-4"><h3 class="text-lg font-semibold text-white">📝 ${t('hr.create_request')}</h3><button id="wf-cancel" class="btn-secondary text-xs">${t('hr.cancel')}</button></div><div class="grid md:grid-cols-2 gap-4"><div><label class="label">${t('hr.request_type')}</label><select id="wf-type" class="input-field w-full">${data.templates.map(x => `<option value="${x.id}">${escapeHTML(x.name)}</option>`).join('')}</select></div><div><label class="label">${t('hr.requester')}</label><select id="wf-requester" class="input-field w-full">${personnel.slice(0, 25).map(p => `<option value="${p.id}">${escapeHTML(`${p.name} ${p.surname}`)}</option>`).join('')}</select></div><div class="md:col-span-2"><label class="label">${t('hr.details')}</label><textarea id="wf-detail" class="input-field w-full" rows="3" placeholder="${t('hr.details_placeholder')}"></textarea></div></div><button id="wf-save" class="btn-primary mt-5">📤 ${t('hr.submit_request')}</button></div>`;
  document.getElementById('wf-cancel').onclick = () => renderTab('requests', data);
  document.getElementById('wf-save').onclick = async () => {
    const p = personnel.find(x => x.id === parseInt(document.getElementById('wf-requester').value)); const template = data.templates.find(x => x.id === document.getElementById('wf-type').value); const detail = document.getElementById('wf-detail').value.trim();
    if (!detail || !p || !template) { showToast(t('hr.details_required'), 'error'); return; }
    data.requests.unshift({ id: uid('workflow'), title: detail.slice(0, 60), detail, type: template.id, requester: `${p.name} ${p.surname}`, department: p.department, status: 'pending', createdAt: new Date().toISOString(), step: 1, totalSteps: template.steps.length });
    await writeRecord('workflow', data); showToast(t('hr.request_saved'), 'success'); renderWorkflowCenterPage(document.getElementById('content'));
  };
}
function requestHTML(r, canApprove) { return `<div class="card flex flex-col lg:flex-row lg:items-center gap-4 border-amber-500/20"><div class="text-2xl">⏳</div><div class="flex-1"><p class="font-semibold text-white">${escapeHTML(r.title)}</p><p class="text-sm text-slate-400">${escapeHTML(r.requester)} · ${escapeHTML(r.department)}</p><div class="flex gap-1 mt-3">${Array.from({ length: r.totalSteps }, (_, i) => `<span class="h-1.5 flex-1 max-w-20 rounded-full ${i < r.step ? 'bg-cyan-400' : 'bg-white/10'}"></span>`).join('')}</div><p class="text-xs text-slate-500 mt-1">${t('hr.step')} ${r.step}/${r.totalSteps} · ${formatDate(r.createdAt)}</p></div><div class="flex gap-2">${canApprove ? `<button class="btn-primary text-xs" data-wf-action="approve" data-id="${r.id}">✅ ${t('hr.approve')}</button><button class="btn-secondary text-xs text-red-300" data-wf-action="reject" data-id="${r.id}">✕ ${t('hr.reject')}</button>` : `<span class="text-xs text-slate-500">${t('hr.read_only')}</span>`}</div></div>`; }
function templateHTML(x) { return `<div class="card"><div class="text-2xl mb-3">⚙️</div><h3 class="font-semibold text-white">${escapeHTML(x.name)}</h3><div class="space-y-2 mt-4">${x.steps.map((s, i) => `<div class="flex gap-2 text-sm text-slate-300"><span class="text-cyan-300">${i + 1}.</span><span>${escapeHTML(s)}</span></div>`).join('')}</div></div>`; }
function metric(label, value, color) { return `<div class="card border-${color}-500/20"><p class="text-xs text-slate-400">${label}</p><p class="text-2xl font-bold text-white mt-2">${value}</p></div>`; }
