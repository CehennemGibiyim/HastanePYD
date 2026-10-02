// ===== KRİTİK UYARI VE ESKALASYON MERKEZİ =====
import { getCurrentUser, isSuperAdmin } from '../state.js';
import { loadCriticalAlerts, saveCriticalAlerts } from '../services/critical-alerts-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const severityMeta = {
  critical: { label: 'critical', className: 'critical-alert-critical' },
  high: { label: 'high', className: 'critical-alert-high' },
  medium: { label: 'medium', className: 'critical-alert-medium' },
  low: { label: 'low', className: 'critical-alert-low' }
};

export async function renderCriticalAlertsPage(el) {
  el.innerHTML = `<div class="card loading-pulse text-slate-400">${t('critical_alerts.loading')}</div>`;
  let alerts;
  try { alerts = await loadCriticalAlerts(); } catch (error) { el.innerHTML = `<div class="card border-red-400/20 text-red-200">${t('critical_alerts.load_error')}</div>`; return; }

  let severityFilter = 'all';
  let statusFilter = 'all';
  let search = '';
  const currentUser = getCurrentUser();
  const canWrite = isSuperAdmin();
  let lastSyncAt = Date.now();

  async function applyAutomaticEscalation() {
    const now = Date.now();
    let changed = false;
    const next = alerts.map((alert) => {
      if (alert.status !== 'resolved' && !alert.escalated && alert.dueAt <= now && ['critical', 'high'].includes(alert.severity)) {
        changed = true;
        return { ...alert, escalated: true, lastActionAt: now };
      }
      return alert;
    });
    if (!changed) return;
    try { alerts = await saveCriticalAlerts(next); lastSyncAt = now; } catch (error) { console.warn('[Hastane PYS] Otomatik eskalasyon kaydedilemedi', error); }
  }
  await applyAutomaticEscalation();

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function isOverdue(alert) { return alert.status !== 'resolved' && alert.dueAt < Date.now(); }
  function label(key) { return t(`critical_alerts.${key}`); }
  function filteredAlerts() {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    return alerts.filter((alert) => (!severityFilter || severityFilter === 'all' || alert.severity === severityFilter) && (!statusFilter || statusFilter === 'all' || alert.status === statusFilter) && (!query || `${alert.title} ${alert.source} ${alert.owner} ${alert.department}`.toLocaleLowerCase('tr-TR').includes(query)));
  }
  function notice(message, kind = 'success') {
    const target = el.querySelector('#critical-alert-notice');
    if (!target) return;
    target.textContent = message;
    target.className = `critical-alert-notice ${kind === 'error' ? 'is-error' : 'is-success'}`;
    window.setTimeout(() => { if (target) target.textContent = ''; }, 3500);
  }
  async function persist(nextAlerts, message) {
    try { alerts = await saveCriticalAlerts(nextAlerts); render(); notice(message); }
    catch (error) { notice(t('critical_alerts.save_error'), 'error'); }
  }
  function render() {
    const visible = filteredAlerts();
    const open = alerts.filter((a) => a.status !== 'resolved');
    const critical = open.filter((a) => a.severity === 'critical').length;
    const escalated = open.filter((a) => a.escalated).length;
    const overdue = open.filter(isOverdue).length;
    el.innerHTML = `
      <div class="critical-alert-page fade-in">
        <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div><p class="eyebrow">${label('eyebrow')}</p><h1 class="text-2xl font-bold text-white mt-1">${label('title')}</h1><p class="text-slate-400 text-sm mt-1">${label('subtitle')}</p></div>
          ${canWrite ? `<button id="new-critical-alert" class="btn-primary"><span aria-hidden="true">+</span>${label('new_alert')}</button>` : `<span class="market-status status-watch">${label('readonly_notice')}</span>`}
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs"><span class="text-emerald-300">● ${label('live_badge')}</span><span class="text-slate-500">${label('last_sync')}: ${formatTime(lastSyncAt)}</span></div>
        <div class="critical-alert-notice is-success mb-3">${label('auto_escalation_note')}</div>
        <div id="critical-alert-notice" class="critical-alert-notice" role="status" aria-live="polite"></div>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
          <div class="card command-metric"><span class="metric-kicker">${label('open_alerts')}</span><strong class="text-3xl text-white">${open.length}</strong><small>${label('open_alerts_note')}</small></div>
          <div class="card command-metric metric-critical"><span class="metric-kicker">${label('critical_alerts')}</span><strong class="text-3xl text-red-200">${critical}</strong><small>${label('critical_alerts_note')}</small></div>
          <div class="card command-metric metric-amber"><span class="metric-kicker">${label('escalation_count')}</span><strong class="text-3xl text-amber-200">${escalated}</strong><small>${label('escalated_note')}</small></div>
          <div class="card command-metric metric-blue"><span class="metric-kicker">${label('overdue')}</span><strong class="text-3xl text-cyan-200">${overdue}</strong><small>${label('overdue_note')}</small></div>
        </div>
        <div class="card mb-5 critical-alert-filters">
          <div class="flex flex-wrap gap-3 items-end">
            <div class="flex-1 min-w-[220px]"><label class="label" for="critical-search">${label('search_label')}</label><input id="critical-search" class="input-field w-full" value="${escapeHtml(search)}" placeholder="${label('search_placeholder')}"></div>
            <div><label class="label" for="critical-severity">${label('severity_label')}</label><select id="critical-severity" class="input-field"><option value="all">${label('all')}</option>${Object.keys(severityMeta).map((key) => `<option value="${key}" ${severityFilter === key ? 'selected' : ''}>${label(`severity_${key}`)}</option>`).join('')}</select></div>
            <div><label class="label" for="critical-status">${label('status_label')}</label><select id="critical-status" class="input-field"><option value="all">${label('all')}</option><option value="open" ${statusFilter === 'open' ? 'selected' : ''}>${label('status_open')}</option><option value="acknowledged" ${statusFilter === 'acknowledged' ? 'selected' : ''}>${label('status_acknowledged')}</option><option value="resolved" ${statusFilter === 'resolved' ? 'selected' : ''}>${label('status_resolved')}</option></select></div>
          </div>
        </div>
        <div class="critical-alert-list">
          ${visible.length ? visible.map((alert) => {
            const meta = severityMeta[alert.severity] || severityMeta.medium;
            const overdueClass = isOverdue(alert) ? ' is-overdue' : '';
            return `<article class="card critical-alert-card ${meta.className}${overdueClass}">
              <div class="critical-alert-card-head"><div class="critical-alert-status-dot" aria-hidden="true"></div><div class="min-w-0 flex-1"><div class="flex flex-wrap items-center gap-2"><h2 class="text-base font-semibold text-white">${escapeHtml(alert.title)}</h2><span class="critical-alert-badge">${label(`severity_${meta.label}`)}</span>${alert.escalated ? `<span class="critical-alert-escalated">${label('escalated_badge')}</span>` : ''}</div><p class="text-xs text-slate-500 mt-1">${escapeHtml(alert.source)} · ${escapeHtml(alert.department)}</p></div><span class="critical-alert-status ${alert.status}">${label(`status_${alert.status}`)}</span></div>
              <p class="text-sm text-slate-300 mt-4">${escapeHtml(alert.detail)}</p>
              <div class="critical-alert-meta"><span>${label('owner')}: <strong>${escapeHtml(alert.owner)}</strong></span><span>${label('last_action')}: ${formatTime(alert.lastActionAt)}</span><span class="${isOverdue(alert) ? 'text-red-300 font-semibold' : ''}">${label('due')}: ${formatTime(alert.dueAt)}</span></div>
              <div class="flex flex-wrap gap-2 mt-4">${canWrite && alert.status !== 'acknowledged' && alert.status !== 'resolved' ? `<button class="btn-secondary text-xs alert-action" data-action="acknowledge" data-id="${escapeHtml(alert.id)}">${label('acknowledge')}</button>` : ''}${canWrite && alert.status !== 'resolved' ? `<button class="btn-secondary text-xs alert-action" data-action="escalate" data-id="${escapeHtml(alert.id)}">${label('escalate')}</button><button class="btn-primary text-xs alert-action" data-action="resolve" data-id="${escapeHtml(alert.id)}">${label('resolve')}</button>` : alert.status === 'resolved' ? `<span class="text-xs text-emerald-300 self-center">${label('resolved_note')}</span>` : `<span class="text-xs text-slate-500 self-center">${label('readonly_notice')}</span>`}</div>
            </article>`;
          }).join('') : `<div class="card text-center py-12"><div class="critical-alert-empty-icon" aria-hidden="true">✓</div><h2 class="text-lg font-semibold text-white mt-3">${label('empty_title')}</h2><p class="text-sm text-slate-400 mt-1">${label('empty_desc')}</p></div>`}
        </div>
        <dialog id="critical-alert-dialog" class="critical-alert-dialog"><form method="dialog" id="critical-alert-form" class="card"><div class="flex items-start justify-between gap-3 mb-5"><div><h2 class="text-lg font-semibold text-white">${label('new_alert_title')}</h2><p class="text-xs text-slate-400 mt-1">${label('new_alert_note')}</p></div><button type="button" id="close-critical-dialog" class="btn-secondary text-xs">${label('cancel')}</button></div><div class="grid gap-3"><div><label class="label" for="alert-title">${label('alert_title')}</label><input id="alert-title" class="input-field w-full" required></div><div><label class="label" for="alert-detail">${label('alert_detail')}</label><textarea id="alert-detail" class="input-field w-full" rows="3" required></textarea></div><div class="grid grid-cols-2 gap-3"><div><label class="label" for="alert-severity">${label('severity_label')}</label><select id="alert-severity" class="input-field w-full"><option value="critical">${label('severity_critical')}</option><option value="high">${label('severity_high')}</option><option value="medium" selected>${label('severity_medium')}</option><option value="low">${label('severity_low')}</option></select></div><div><label class="label" for="alert-due">${label('due_minutes')}</label><input id="alert-due" class="input-field w-full" type="number" min="5" max="10080" value="60" required></div></div><div><label class="label" for="alert-owner">${label('owner')}</label><input id="alert-owner" class="input-field w-full" value="${escapeHtml(currentUser?.name || '')}" required></div><button class="btn-primary w-full mt-2" type="submit">${label('create_alert')}</button></div></form></dialog>
      </div>`;
    wire();
  }
  function wire() {
    el.querySelector('#critical-search')?.addEventListener('input', (event) => { search = event.target.value; render(); });
    el.querySelector('#critical-severity')?.addEventListener('change', (event) => { severityFilter = event.target.value; render(); });
    el.querySelector('#critical-status')?.addEventListener('change', (event) => { statusFilter = event.target.value; render(); });
    el.querySelector('#new-critical-alert')?.addEventListener('click', () => { if (canWrite) el.querySelector('#critical-alert-dialog')?.showModal(); });
    el.querySelector('#close-critical-dialog')?.addEventListener('click', () => el.querySelector('#critical-alert-dialog')?.close());
    el.querySelectorAll('.alert-action').forEach((button) => button.addEventListener('click', async () => {
      const action = button.dataset.action;
      const id = button.dataset.id;
      const next = alerts.map((alert) => {
        if (alert.id !== id) return alert;
        const status = action === 'resolve' ? 'resolved' : action === 'acknowledge' ? 'acknowledged' : alert.status;
        return { ...alert, status, escalated: action === 'escalate' ? true : alert.escalated, lastActionAt: Date.now() };
      });
      const messageKey = action === 'resolve' ? 'resolved' : action === 'acknowledge' ? 'acknowledged' : 'escalated';
      await persist(next, label(messageKey));
    }));
    el.querySelector('#critical-alert-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!canWrite) return;
      const now = Date.now();
      const next = [{ id: `al-${now}`, title: el.querySelector('#alert-title').value.trim(), detail: el.querySelector('#alert-detail').value.trim(), severity: el.querySelector('#alert-severity').value, status: 'open', owner: el.querySelector('#alert-owner').value.trim(), source: label('manual_source'), department: currentUser?.department || 'Genel', dueAt: now + Number(el.querySelector('#alert-due').value) * 60000, lastActionAt: now, escalated: false }, ...alerts];
      el.querySelector('#critical-alert-dialog')?.close();
      await persist(next, label('created'));
    });
  }
  render();
  const refreshTimer = window.setInterval(async () => {
    if (!el.isConnected || location.hash.slice(1).split('/')[0] !== 'critical-alerts') { window.clearInterval(refreshTimer); return; }
    try { alerts = await loadCriticalAlerts(); await applyAutomaticEscalation(); lastSyncAt = Date.now(); render(); } catch { /* mevcut görünüm korunur */ }
  }, 30000);
}
