// ===== HASTANE KOMUTA MERKEZİ =====
import { getPersonnel, getTodaySchedules, getMonthlyReport } from '../state.js';
import { getPatientStaffRatio } from '../state-extensions.js';
import { readPlatform, writePlatform, today, dateLabel, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const seedTasks = [
  { id: 'task_1', titleKey: 'platform.task_cert', detailKey: 'platform.task_cert_detail', done: false },
  { id: 'task_2', titleKey: 'platform.task_roster', detailKey: 'platform.task_roster_detail', done: false },
  { id: 'task_3', titleKey: 'platform.task_access', detailKey: 'platform.task_access_detail', done: true },
  { id: 'task_4', titleKey: 'platform.task_onboarding', detailKey: 'platform.task_onboarding_detail', done: false },
];
const seedIntegrations = [
  { id: 'fhir', nameKey: 'platform.fhir_hl7', standard: 'FHIR R4 / HL7 v2', direction: '↔', status: 'watch', route: 'integration-planning' },
  { id: 'pacs', nameKey: 'platform.pacs_dicom', standard: 'DICOMweb', direction: '↔', status: 'watch', route: 'radiology' },
  { id: 'lis', nameKey: 'platform.lis', standard: 'HL7 ORU', direction: '←', status: 'watch', route: 'api-integration' },
  { id: 'sgk', nameKey: 'platform.sgk', standard: 'API / SOAP', direction: '→', status: 'ready', route: 'api-integration' },
  { id: 'sso', nameKey: 'platform.sso_mfa', standard: 'OIDC / LDAP', direction: '↔', status: 'ready', route: 'governance' },
  { id: 'siem', nameKey: 'platform.kvkk_siem', standard: 'Audit / SIEM', direction: '→', status: 'watch', route: 'system-monitoring' },
];

export async function renderPlatformCommandPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('platform.loading')}</div>`;
  const [storedTasks, storedIntegrations] = await Promise.all([
    readPlatform('daily_tasks', seedTasks),
    readPlatform('command_integrations', seedIntegrations),
  ]);
  const tasks = Array.isArray(storedTasks) ? storedTasks : seedTasks.map(item => ({ ...item }));
  const integrations = Array.isArray(storedIntegrations) ? storedIntegrations : seedIntegrations.map(item => ({ ...item }));
  const staff = getPersonnel({ status: 'active' });
  const todayShifts = getTodaySchedules();
  const month = new Date().toISOString().slice(0, 7);
  const report = getMonthlyReport(month);
  const ratios = getPatientStaffRatio();
  const missing = staff.filter(p => !p.department || !p.title || !p.phone).length;
  const noAttendance = report.filter(r => r.totalHours === 0).length;
  const overtime = report.filter(r => r.overtimeHours >= 8).length;
  const criticalRatios = ratios.filter(item => item.status === 'critical').length;
  const openTasks = tasks.filter(item => !item.done).length;
  const openRisks = missing + noAttendance + overtime + criticalRatios;
  const score = Math.max(0, Math.min(100, Math.round(100 - (missing / Math.max(1, staff.length)) * 25 - (noAttendance / Math.max(1, staff.length)) * 20 - overtime * 2 - criticalRatios * 8 - openTasks * 3)));
  const scoreTone = score >= 85 ? 'good' : score >= 65 ? 'watch' : 'critical';
  const riskItems = [
    { icon: '01', title: t('platform.risk_profile'), desc: t('platform.risk_profile_desc'), value: missing, route: 'personnel-360', tone: missing ? 'watch' : 'good' },
    { icon: '02', title: t('platform.risk_attendance'), desc: t('platform.risk_attendance_desc'), value: noAttendance, route: 'attendance', tone: noAttendance ? 'critical' : 'good' },
    { icon: '03', title: t('platform.risk_overtime'), desc: t('platform.risk_overtime_desc'), value: overtime, route: 'workforce-safety', tone: overtime ? 'watch' : 'good' },
  ];
  const er = ratios.find(item => item.department === 'Acil Servis');
  const icu = ratios.find(item => item.department === 'Yoğun Bakım');
  const pulse = [
    { label: t('platform.emergency_load'), value: er ? `${er.ratio} : 1` : '—', detail: er ? `${er.patients} / ${er.staff} ${t('platform.staff')}` : '—', tone: er?.status || 'good', route: 'patient-queue' },
    { label: t('platform.icu_capacity'), value: icu ? `${icu.ratio} : 1` : '—', detail: icu ? `${icu.patients} / ${icu.staff} ${t('platform.staff')}` : '—', tone: icu?.status || 'good', route: 'icu-panel' },
    { label: t('platform.or_schedule'), value: String(todayShifts.length), detail: t('platform.on_duty'), tone: todayShifts.length ? 'good' : 'watch', route: 'or-planning' },
  ];

  container.innerHTML = `<div class="command-page fade-in space-y-5">
    <header class="command-hero"><div><p class="command-kicker">${t('platform.eyebrow')}</p><h1>${t('platform.command_center')}</h1><p>${t('platform.command_center_subtitle')}</p></div><div class="command-live"><span></span>${t('platform.live')}</div></header>
    <section class="command-score-grid"><div class="command-score command-score-${scoreTone}"><div><p>${t('platform.decision_support')}</p><strong>${score}%</strong><span>${scoreTone === 'good' ? t('platform.stable') : scoreTone === 'watch' ? t('platform.attention') : t('platform.critical_signal')}</span></div><div class="score-ring" style="--score:${score}%"><b>${score}</b><small>%</small></div></div><div class="command-stat"><span class="stat-label">${t('platform.active_staff')}</span><strong>${staff.length}</strong><small>${t('platform.single_source')}</small></div><div class="command-stat"><span class="stat-label">${t('platform.on_duty')}</span><strong>${todayShifts.length}</strong><small>${dateLabel(today())}</small></div><div class="command-stat"><span class="stat-label">${t('platform.open_risks')}</span><strong class="${openRisks ? 'text-amber-300' : 'text-emerald-300'}">${openRisks}</strong><small>${openRisks ? t('platform.review') : t('platform.no_risk')}</small></div></section>
    <section><div class="section-heading"><div><p class="section-kicker">${t('platform.operations')}</p><h2>${t('platform.operational_pulse')}</h2></div><span class="command-date">${dateLabel(today())}</span></div><div class="pulse-grid">${pulse.map(item => pulseCard(item)).join('')}</div></section>
    <div class="grid lg:grid-cols-[1.15fr_.85fr] gap-5"><section class="card command-panel"><div class="section-heading"><div><p class="section-kicker">${t('platform.governance')}</p><h2>${t('platform.open_risks')}</h2></div><span class="badge">${openRisks ? t('platform.watch') : t('platform.stable')}</span></div><div class="risk-list">${riskItems.map(item => riskCard(item)).join('')}</div></section><section class="card command-panel"><div class="section-heading"><div><p class="section-kicker">${t('platform.daily_tasks')}</p><h2>${t('platform.action_center')}</h2></div><button id="platform-refresh-tasks" class="btn-secondary text-xs">${t('platform.refresh')}</button></div><div class="task-list">${tasks.map(task => `<label class="task-row"><input type="checkbox" data-task="${esc(task.id)}" ${task.done ? 'checked' : ''}><span><strong class="${task.done ? 'is-done' : ''}">${t(task.titleKey)}</strong><small>${t(task.detailKey)}</small></span></label>`).join('')}</div></section></div>
    <section class="card command-panel"><div class="section-heading"><div><p class="section-kicker">${t('platform.integrations')}</p><h2>${t('platform.integration_readiness')}</h2><p class="section-help">${t('platform.integration_readiness_desc')}</p></div><button class="btn-secondary text-xs" data-route="integration-planning">${t('platform.open_integration')}</button></div><div class="integration-strip">${integrations.map(item => `<button class="integration-chip" data-route="${esc(item.route)}"><span class="integration-dot ${item.status}"></span><span><strong>${t(item.nameKey)}</strong><small>${esc(item.standard)} · ${esc(item.direction)}</small></span><em>${item.status === 'ready' ? t('platform.ready') : t('platform.watch')}</em></button>`).join('')}</div></section>
    <section class="action-strip"><span class="section-kicker">${t('platform.action_center')}</span>${action('hr-command', t('platform.open_command'))}${action('security-center', t('platform.open_security'))}${action('workforce-safety', t('platform.open_clinical'))}${action('patient-crm', t('platform.open_crm'))}${action('disaster-management', t('platform.open_disaster'))}${action('operations-forecast', t('platform.open_forecast'))}${action('revenue-cycle', t('platform.open_revenue'))}</section>
  </div>`;

  bind(container, tasks);
}

function pulseCard(item) { const tone = item.tone === 'critical' ? 'critical' : item.tone === 'warning' || item.tone === 'watch' ? 'watch' : 'good'; return `<button class="pulse-card tone-${tone}" data-route="${item.route}"><span>${item.label}</span><strong>${esc(item.value)}</strong><small>${esc(item.detail)}</small><i>→</i></button>`; }
function riskCard(item) { return `<button class="risk-row" data-route="${item.route}"><span class="risk-index">${item.icon}</span><span class="risk-copy"><strong>${item.title}</strong><small>${item.desc}</small></span><b class="risk-value tone-${item.tone}">${item.value}</b><i>→</i></button>`; }
function action(route, label) { return `<button data-route="${route}" class="command-action">${label}<span>→</span></button>`; }
function bind(container, tasks) {
  container.querySelectorAll('[data-route]').forEach(button => { button.onclick = () => { location.hash = button.dataset.route; }; });
  container.querySelectorAll('[data-task]').forEach(input => { input.onchange = async () => { const task = tasks.find(item => item.id === input.dataset.task); if (!task) return; task.done = input.checked; await writePlatform('daily_tasks', tasks); showToast(t('platform.updated'), 'success'); renderPlatformCommandPage(container); }; });
  container.querySelector('#platform-refresh-tasks')?.addEventListener('click', () => renderPlatformCommandPage(container));
}
