// ===== ROL BAZLI YÖNETİCİ PANELLERİ =====
import { getCurrentUser, getPersonnel, getTodaySchedules, getDepartmentStats } from '../state.js';
import { getCriticalAlertSnapshot } from '../services/critical-alerts-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

const ROLE_CONFIG = {
  admin: {
    label: 'executive_panels.roles.admin',
    scope: 'executive_panels.scopes.hospital',
    focus: ['executive_panels.focus.capacity', 'executive_panels.focus.safety', 'executive_panels.focus.workforce'],
    actions: [['critical-alerts', 'executive_panels.actions.alerts'], ['personnel', 'executive_panels.actions.staff'], ['reports', 'executive_panels.actions.reports'], ['platform-command', 'executive_panels.actions.operations']]
  },
  supervisor: {
    label: 'executive_panels.roles.supervisor',
    scope: 'executive_panels.scopes.department',
    focus: ['executive_panels.focus.staffing', 'executive_panels.focus.pending', 'executive_panels.focus.escalation'],
    actions: [['critical-alerts', 'executive_panels.actions.department_alerts'], ['schedule', 'executive_panels.actions.schedule'], ['attendance', 'executive_panels.actions.attendance'], ['leave', 'executive_panels.actions.leave']]
  },
  viewer: {
    label: 'executive_panels.roles.viewer',
    scope: 'executive_panels.scopes.readonly',
    focus: ['executive_panels.focus.overview', 'executive_panels.focus.safety', 'executive_panels.focus.transparency'],
    actions: [['reports', 'executive_panels.actions.reports'], ['announcements', 'executive_panels.actions.announcements'], ['critical-alerts', 'executive_panels.actions.alerts']]
  }
};

export function renderExecutivePanelsPage(container) {
  const currentUser = getCurrentUser();
  const user = currentUser || { role: 'viewer', name: '', department: null };
  const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.viewer;
  const restricted = user.role === 'supervisor' && user.department;
  const personnel = getPersonnel({ status: 'active', ...(restricted ? { department: user.department } : {}) });
  const schedules = getTodaySchedules().filter(item => !restricted || item.department === user.department);
  const allAlerts = getCriticalAlertSnapshot().filter(alert => alert.status !== 'resolved');
  const alerts = allAlerts.filter(alert => !restricted || alert.department === user.department);
  const allDeptStats = getDepartmentStats();
  const deptStats = restricted ? { [user.department]: allDeptStats[user.department] || personnel.length } : allDeptStats;
  const patients = restricted ? Math.max(8, Math.round((deptStats[user.department] || 1) * 4.5)) : 148;
  const beds = restricted ? Math.max(1, 18 - Math.round((deptStats[user.department] || 1) / 2)) : 18;
  const delayed = alerts.filter(alert => Number(alert.dueAt) < Date.now()).length;
  const critical = alerts.filter(alert => alert.severity === 'critical').length;
  const departmentLabel = restricted ? user.department : t('executive_panels.all_departments');
  const roleName = t(config.label);

  container.innerHTML = `<div class="executive-panels-page fade-in">
    <section class="executive-hero">
      <div><p class="eyebrow">${t('executive_panels.eyebrow')}</p><h1>${t('executive_panels.title')}</h1><p>${t('executive_panels.subtitle')}</p></div>
      <div class="executive-identity"><span class="identity-mark">${escapeHTML((user.name || t('executive_panels.default_user')).slice(0, 1).toUpperCase())}</span><div><strong>${escapeHTML(user.name || t('executive_panels.default_user'))}</strong><span>${roleName}</span><small>${t(config.scope)} · ${escapeHTML(departmentLabel)}</small></div></div>
    </section>
    <div class="executive-toolbar"><div><span class="live-dot"></span>${t('executive_panels.live_data')} <span class="toolbar-separator">·</span> ${t('executive_panels.updated_now')}</div><button class="btn-secondary text-xs" id="executive-refresh">${t('executive_panels.refresh')}</button></div>
    <section class="executive-kpis" aria-label="${t('executive_panels.kpi_label')}">
      ${metric('executive_panels.metrics.patients', patients, t('executive_panels.metrics.patients_note'), 'blue')}
      ${metric('executive_panels.metrics.beds', beds, t('executive_panels.metrics.beds_note'), 'green')}
      ${metric('executive_panels.metrics.staff', personnel.length, t('executive_panels.metrics.staff_note'), 'amber')}
      ${metric('executive_panels.metrics.alerts', critical, t('executive_panels.metrics.alerts_note'), critical ? 'red' : 'green')}
      ${metric('executive_panels.metrics.delayed', delayed, t('executive_panels.metrics.delayed_note'), delayed ? 'purple' : 'green')}
    </section>
    <div class="executive-grid">
      <section class="card executive-focus"><div class="panel-heading"><div><p class="eyebrow">${t('executive_panels.focus_eyebrow')}</p><h2>${t('executive_panels.focus_title')}</h2></div><span class="scope-badge">${roleName}</span></div><div class="focus-list">${config.focus.map((key, index) => `<div class="focus-item"><span class="focus-number">0${index + 1}</span><div><strong>${t(key)}</strong><p>${t(`${key}_note`)}</p></div></div>`).join('')}</div></section>
      <section class="card executive-priorities"><div class="panel-heading"><div><p class="eyebrow">${t('executive_panels.priority_eyebrow')}</p><h2>${t('executive_panels.priority_title')}</h2></div><a class="text-link" href="#critical-alerts">${t('executive_panels.see_all')}</a></div><div class="priority-list">${alerts.slice(0, 4).map(alert => `<a class="priority-item" href="#critical-alerts"><span class="priority-line ${escapeHTML(alert.severity)}"></span><div><strong>${escapeHTML(alert.title)}</strong><small>${escapeHTML(alert.department)} · ${escapeHTML(alert.owner)}</small></div><span class="priority-arrow">→</span></a>`).join('') || `<div class="empty-state"><span>✓</span><p>${t('executive_panels.no_priorities')}</p></div>`}</div></section>
    </div>
    <div class="executive-grid lower-grid">
      <section class="card executive-actions"><div class="panel-heading"><div><p class="eyebrow">${t('executive_panels.actions_eyebrow')}</p><h2>${t('executive_panels.actions_title')}</h2></div></div><div class="action-grid">${config.actions.map(([route, key], index) => `<a class="executive-action" href="#${route}"><span class="action-index">${String(index + 1).padStart(2, '0')}</span><span>${t(key)}</span><span class="priority-arrow">→</span></a>`).join('')}</div></section>
      <section class="card executive-snapshot"><div class="panel-heading"><div><p class="eyebrow">${t('executive_panels.snapshot_eyebrow')}</p><h2>${t('executive_panels.snapshot_title')}</h2></div></div><div class="snapshot-row"><span>${t('executive_panels.snapshot.staff_on_duty')}</span><strong>${schedules.length}</strong></div><div class="snapshot-row"><span>${t('executive_panels.snapshot.departments')}</span><strong>${Object.values(deptStats).filter(value => value > 0).length}</strong></div><div class="snapshot-row"><span>${t('executive_panels.snapshot.capacity')}</span><div class="snapshot-bar"><i style="width:${Math.min(100, Math.round((patients / (patients + beds)) * 100))}%"></i></div><strong>${Math.round((patients / (patients + beds)) * 100)}%</strong></div><div class="snapshot-row"><span>${t('executive_panels.snapshot.top_unit')}</span><strong>${escapeHTML(Object.entries(deptStats).sort((a, b) => b[1] - a[1])[0]?.[0] || t('executive_panels.no_data'))}</strong></div></section>
    </div>
  </div>`;

  container.querySelector('#executive-refresh')?.addEventListener('click', () => { showToast(t('executive_panels.refreshed'), 'success'); renderExecutivePanelsPage(container); });
}

function metric(labelKey, value, note, color) { return `<div class="executive-metric ${color}"><span class="metric-symbol" aria-hidden="true"></span><span class="metric-label">${t(labelKey)}</span><strong>${value}</strong><small>${note}</small></div>`; }
