// ===== KVKK VE SİBER GÜVENLİK MERKEZİ =====
import { getUsers, getCurrentUser } from '../state.js';
import { readPlatform, writePlatform, uid, today, dateLabel, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const seedControls = [
  { id: 'mfa', labelKey: 'security.control_mfa', detailKey: 'security.control_mfa_detail', enabled: true, critical: true },
  { id: 'mask', labelKey: 'security.control_mask', detailKey: 'security.control_mask_detail', enabled: true, critical: true },
  { id: 'session', labelKey: 'security.control_session', detailKey: 'security.control_session_detail', enabled: true, critical: false },
  { id: 'retention', labelKey: 'security.control_retention', detailKey: 'security.control_retention_detail', enabled: true, critical: false },
  { id: 'breakglass', labelKey: 'security.control_breakglass', detailKey: 'security.control_breakglass_detail', enabled: false, critical: true },
  { id: 'export', labelKey: 'security.control_export', detailKey: 'security.control_export_detail', enabled: true, critical: true },
];
const seedEvents = [
  { id: 'evt_1', kind: 'review', titleKey: 'security.event_unusual', detailKey: 'security.event_unusual_detail', subject: 'Acil Servis', at: today(), severity: 'watch', state: 'open' },
  { id: 'evt_2', kind: 'export', titleKey: 'security.event_export', detailKey: 'security.event_export_detail', subject: 'Raporlar', at: today(), severity: 'watch', state: 'open' },
  { id: 'evt_3', kind: 'login', titleKey: 'security.event_login', detailKey: 'security.event_login_detail', subject: 'Yönetici hesabı', at: today(), severity: 'good', state: 'closed' },
];

export async function renderSecurityCenterPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('security.loading')}</div>`;
  const [storedControls, storedEvents] = await Promise.all([
    readPlatform('security_controls', seedControls),
    readPlatform('security_events', seedEvents),
  ]);
  const controls = Array.isArray(storedControls) && storedControls.length ? storedControls : seedControls.map(item => ({ ...item }));
  const events = Array.isArray(storedEvents) ? storedEvents : seedEvents.map(item => ({ ...item }));
  const users = getUsers();
  const current = getCurrentUser();
  const reviews = buildReviews(users);
  const enabled = controls.filter(item => item.enabled).length;
  const openEvents = events.filter(item => item.state === 'open');
  const posture = Math.max(0, Math.min(100, Math.round(enabled / controls.length * 100 - openEvents.length * 3)));
  const criticalGaps = controls.filter(item => item.critical && !item.enabled).length;
  const statusKey = criticalGaps ? 'security.status_critical' : openEvents.length ? 'security.status_watch' : 'security.status_ready';

  container.innerHTML = `<div class="security-page fade-in space-y-5">
    <header class="security-hero"><div><p class="command-kicker">${t('security.eyebrow')}</p><h1>${t('security.title')}</h1><p>${t('security.subtitle')}</p></div><div class="security-badge"><span class="security-pulse"></span>${t('security.live_monitoring')}</div></header>
    <section class="security-overview"><div class="security-posture"><div><span class="stat-label">${t('security.posture')}</span><strong>${posture}%</strong><small>${t(statusKey)}</small></div><div class="security-gauge" style="--posture:${posture}%"><b>${posture}</b><small>%</small></div></div><div class="security-stat"><span>${t('security.open_events')}</span><strong class="${openEvents.length ? 'text-amber-300' : 'text-emerald-300'}">${openEvents.length}</strong><small>${t('security.needs_review')}</small></div><div class="security-stat"><span>${t('security.critical_gaps')}</span><strong class="${criticalGaps ? 'text-red-300' : 'text-emerald-300'}">${criticalGaps}</strong><small>${t('security.control_count', { count: controls.length })}</small></div><div class="security-stat"><span>${t('security.reviewed_accounts')}</span><strong>${reviews.length}</strong><small>${t('security.audit_scope')}</small></div></section>
    <div class="grid xl:grid-cols-[1.05fr_.95fr] gap-5"><section class="card security-panel"><div class="section-heading"><div><p class="section-kicker">${t('security.control_area')}</p><h2>${t('security.control_title')}</h2><p class="section-help">${t('security.control_subtitle')}</p></div><span class="badge">${enabled}/${controls.length} ${t('security.enabled')}</span></div><div class="security-controls">${controls.map(controlCard).join('')}</div></section><section class="card security-panel"><div class="section-heading"><div><p class="section-kicker">${t('security.event_area')}</p><h2>${t('security.event_title')}</h2><p class="section-help">${t('security.event_subtitle')}</p></div><button id="security-export" class="btn-secondary text-xs">${t('security.export_log')}</button></div><div class="security-events">${events.length ? events.map(eventCard).join('') : `<div class="empty-state py-5"><div class="title">${t('security.no_events')}</div></div>`}</div></section></div>
    <section class="card security-panel"><div class="section-heading"><div><p class="section-kicker">${t('security.review_area')}</p><h2>${t('security.review_title')}</h2><p class="section-help">${t('security.review_subtitle')}</p></div><button id="security-refresh" class="btn-secondary text-xs">${t('security.refresh')}</button></div><div class="security-table-wrap"><table class="security-table"><thead><tr><th>${t('security.account')}</th><th>${t('security.role')}</th><th>${t('security.last_access')}</th><th>${t('security.activity')}</th><th>${t('security.risk')}</th><th>${t('security.action')}</th></tr></thead><tbody>${reviews.map(reviewRow).join('')}</tbody></table></div></section>
    <div class="security-note"><strong>${t('security.note_title')}</strong><span>${t('security.note_text')}</span></div>
  </div>`;
  bind(container, controls, events);
}

function buildReviews(users) {
  const source = users.length ? users : [{ username: 'demo-admin', name: t('security.demo_account'), role: 'admin' }];
  return source.map((user, index) => ({
    id: user.username || `user_${index}`,
    name: user.name || user.username || t('security.unknown_account'),
    roleKey: user.role === 'admin' ? 'security.role_admin' : user.role === 'supervisor' ? 'security.role_supervisor' : 'security.role_viewer',
    last: index === 0 ? today() : new Date(Date.now() - index * 86400000).toISOString().slice(0, 10),
    activityKey: index === 0 ? 'security.activity_normal' : 'security.activity_review',
    risk: index === 0 ? 'good' : index > 2 ? 'watch' : 'good',
  }));
}
function controlCard(item) { return `<label class="security-control ${item.enabled ? 'is-enabled' : 'is-disabled'}"><span class="security-control-copy"><strong>${t(item.labelKey)}</strong><small>${t(item.detailKey)}</small></span><span class="security-toggle"><input type="checkbox" data-control="${esc(item.id)}" ${item.enabled ? 'checked' : ''}><i></i></span></label>`; }
function eventCard(item) { const open = item.state === 'open'; return `<article class="security-event event-${esc(item.severity)}"><span class="event-mark">${open ? '!' : '✓'}</span><div><strong>${t(item.titleKey)}</strong><small>${t(item.detailKey)} · ${esc(item.subject)}</small><time>${dateLabel(item.at)}</time></div>${open ? `<button class="btn-secondary text-xs close-event" data-event="${esc(item.id)}">${t('security.resolve')}</button>` : `<span class="event-closed">${t('security.resolved')}</span>`}</article>`; }
function reviewRow(item) { return `<tr><td><strong>${esc(item.name)}</strong></td><td>${t(item.roleKey)}</td><td>${dateLabel(item.last)}</td><td>${t(item.activityKey)}</td><td><span class="risk-pill risk-${item.risk}">${t(item.risk === 'good' ? 'security.risk_low' : 'security.risk_watch')}</span></td><td><button class="icon-button review-account" data-account="${esc(item.id)}" aria-label="${t('security.review_account')}" title="${t('security.review_account')}">→</button></td></tr>`; }
function bind(container, controls, events) {
  container.querySelectorAll('[data-control]').forEach(input => input.addEventListener('change', async () => { const item = controls.find(control => control.id === input.dataset.control); if (!item) return; item.enabled = input.checked; try { await writePlatform('security_controls', controls); showToast(t('security.control_saved'), 'success'); renderSecurityCenterPage(container); } catch { showToast(t('security.save_error'), 'error'); } }));
  container.querySelectorAll('.close-event').forEach(button => button.addEventListener('click', async () => { const item = events.find(event => event.id === button.dataset.event); if (!item) return; item.state = 'closed'; try { await writePlatform('security_events', events); showToast(t('security.event_resolved'), 'success'); renderSecurityCenterPage(container); } catch { showToast(t('security.save_error'), 'error'); } }));
  container.querySelectorAll('.review-account').forEach(button => button.addEventListener('click', () => showToast(t('security.account_reviewed'), 'success')));
  container.querySelector('#security-refresh')?.addEventListener('click', () => renderSecurityCenterPage(container));
  container.querySelector('#security-export')?.addEventListener('click', () => exportLog(events));
}
function exportLog(events) { const rows = [[t('security.csv_event'), t('security.csv_subject'), t('security.csv_date'), t('security.csv_status')], ...events.map(event => [t(event.titleKey), event.subject, event.at, event.state])]; const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = `kvkk-denetim-${today()}.csv`; link.click(); URL.revokeObjectURL(link.href); showToast(t('security.exported'), 'success'); }
