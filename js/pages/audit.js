// ===== DEĞİŞTİRİLEMEZLİĞİ DOĞRULANABİLİR DENETİM MERKEZİ =====
import { getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';
import { appendEnterpriseAudit, getEnterpriseAudit, verifyEnterpriseAudit, esc } from '../services/enterprise-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const seedEntries = [
  ['personnel_add', 'personnel', 'Yeni personel kaydı oluşturuldu'],
  ['schedule_create', 'schedule', 'Nöbet planı yayımlandı'],
  ['leave_approve', 'leave', 'İzin talebi onaylandı'],
  ['settings_update', 'settings', 'Birim ayarı güncellendi'],
  ['export_data', 'sensitive', 'Güvenli veri dışa aktarma işlemi'],
];

export async function logAudit(action, details, userId, changes = {}) {
  return appendEnterpriseAudit({ action, actor: userId || 'system', resource: changes.resource || 'application', reason: details, before: changes.before ?? null, after: changes.after ?? null });
}

async function ensureSeeded() {
  const existing = await getEnterpriseAudit();
  if (existing.length) return existing;
  for (const [action, resource, detail] of seedEntries) {
    await appendEnterpriseAudit({ action, resource, actor: 'system', reason: detail, after: { seeded: true } });
  }
  return getEnterpriseAudit();
}
function dateText(value) { try { return new Date(value).toLocaleString('tr-TR'); } catch { return value || '—'; } }
function valueText(value) { return value === null || value === undefined ? '—' : JSON.stringify(value); }

export async function renderAuditPage(el) {
  el.innerHTML = `<div class="mb-6 fade-in"><div class="flex flex-wrap items-start justify-between gap-4"><div><p class="text-xs uppercase tracking-widest text-cyan-300">${t('audit.integrity_eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('audit.title')}</h1><p class="text-slate-400 text-sm mt-1">${t('audit.subtitle')}</p></div><div class="flex gap-2"><button id="audit-verify" class="btn-secondary">${t('audit.verify_chain')}</button><button id="audit-export" class="btn-primary">${t('audit.export_evidence')}</button></div></div><div id="audit-integrity" class="mt-4"></div></div><div id="audit-stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in"></div><div class="flex flex-wrap gap-2 mb-4 fade-in"><select id="audit-filter-action" class="input-field text-sm" aria-label="${t('audit.action')}"></select><select id="audit-filter-user" class="input-field text-sm" aria-label="${t('audit.user')}"></select><select id="audit-filter-resource" class="input-field text-sm" aria-label="${t('audit.resource')}"></select><input id="audit-filter-date" type="date" class="input-field text-sm" aria-label="${t('audit.date')}" /></div><div id="audit-list" class="space-y-2 fade-in"></div>`;
  let allLogs = await ensureSeeded();
  const current = getCurrentUser() || {};
  const setOptions = (id, first, values) => { const select = el.querySelector(`#${id}`); select.replaceChildren(new Option(first, '')); values.forEach(value => select.add(new Option(value, value))); };
  const fillFilters = () => {
    setOptions('audit-filter-action', t('audit.all_actions'), [...new Set(allLogs.map(item => item.action))].sort());
    setOptions('audit-filter-user', t('audit.all_users'), [...new Set(allLogs.map(item => item.actor))].sort());
    setOptions('audit-filter-resource', t('audit.all_resources'), [...new Set(allLogs.map(item => item.resource))].sort());
  };
  const render = () => {
    const action = el.querySelector('#audit-filter-action').value;
    const actor = el.querySelector('#audit-filter-user').value;
    const resource = el.querySelector('#audit-filter-resource').value;
    const date = el.querySelector('#audit-filter-date').value;
    const filtered = allLogs.filter(item => (!action || item.action === action) && (!actor || item.actor === actor) && (!resource || item.resource === resource) && (!date || item.at.slice(0, 10) === date));
    const dayAgo = Date.now() - 86400000;
    el.querySelector('#audit-stats').innerHTML = [[allLogs.length, t('audit.total_records'), 'text-white'], [new Set(allLogs.map(item => item.actor)).size, t('audit.active_users'), 'text-cyan-300'], [new Set(allLogs.map(item => item.resource)).size, t('audit.resources'), 'text-blue-300'], [allLogs.filter(item => Date.parse(item.at) >= dayAgo).length, t('audit.last_24h'), 'text-amber-300']].map(([value, label, color]) => `<div class="card text-center"><p class="text-2xl font-bold ${color}">${value}</p><p class="text-xs text-slate-400">${label}</p></div>`).join('');
    el.querySelector('#audit-list').innerHTML = filtered.length ? filtered.slice(0, 120).map(item => `<article class="card py-3"><div class="flex flex-wrap items-start gap-3"><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-white">${esc(item.action)}</p><p class="text-xs text-slate-400 mt-1">${esc(item.actor)} · ${esc(item.resource)} · ${dateText(item.at)}</p>${item.reason ? `<p class="text-sm text-slate-300 mt-2">${esc(item.reason)}</p>` : ''}</div><code class="text-[10px] text-cyan-300/70 break-all max-w-[180px]">${esc(item.checksum.slice(0, 16))}…</code></div><details class="mt-3 text-xs text-slate-400"><summary class="cursor-pointer">${t('audit.change_details')}</summary><div class="grid md:grid-cols-2 gap-2 mt-2"><div><span class="text-slate-500">${t('audit.before')}</span><pre class="mt-1 whitespace-pre-wrap break-all text-slate-300">${esc(valueText(item.before))}</pre></div><div><span class="text-slate-500">${t('audit.after')}</span><pre class="mt-1 whitespace-pre-wrap break-all text-slate-300">${esc(valueText(item.after))}</pre></div></div><p class="mt-2 text-slate-500">${t('audit.previous')}: ${esc(item.previous.slice(0, 20))} · ${t('audit.session')}: ${esc(item.context?.sessionId || '—')}</p></details></article>`).join('') : `<div class="empty-state"><div class="title">${t('audit.no_records')}</div></div>`;
  };
  const verify = async () => {
    const result = await verifyEnterpriseAudit(allLogs);
    el.querySelector('#audit-integrity').innerHTML = `<div class="card ${result.valid ? 'border-emerald-400/30' : 'border-red-400/40'}"><div class="flex flex-wrap justify-between gap-2"><strong class="${result.valid ? 'text-emerald-300' : 'text-red-300'}">${result.valid ? t('audit.chain_valid') : t('audit.chain_invalid')}</strong><span class="text-xs text-slate-400">${t('audit.checked_records', { count: result.checked })}</span></div><p class="text-xs text-slate-400 mt-1">${result.valid ? t('audit.chain_valid_note') : t('audit.chain_invalid_note', { count: result.invalid.length })}</p></div>`;
  };
  const exportEvidence = async () => {
    try {
      const verification = await verifyEnterpriseAudit(allLogs);
      const payload = { schema: 'audit-evidence-v2', exportedAt: new Date().toISOString(), exportedBy: current.username || 'system', verification, records: allLogs };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
      const link = document.createElement('a'); link.href = url; link.download = `hastane-pys-denetim-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
      await appendEnterpriseAudit({ action: 'audit_evidence_export', actor: current.username || 'system', resource: 'audit_chain', after: { checked: allLogs.length, valid: verification.valid } });
      allLogs = await getEnterpriseAudit(); render(); await verify(); showToast(t('audit.export_success'), 'success');
    } catch { showToast(t('audit.export_error'), 'error'); }
  };
  el.querySelectorAll('select, #audit-filter-date').forEach(input => input.addEventListener('change', render));
  el.querySelector('#audit-verify').onclick = () => verify().catch(() => showToast(t('audit.verify_error'), 'error'));
  el.querySelector('#audit-export').onclick = exportEvidence;
  fillFilters(); render(); await verify();
}
