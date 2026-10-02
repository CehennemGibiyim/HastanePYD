// ===== HASTANE PYS - DAYANIKLI UYGULAMA ÇEKİRDEĞİ =====
import { renderEnhancedDashboard } from './pages/dashboard-pro.js';
import {
  initState, login, logout, getCurrentUser, getPersonnel, getDepartments,
  DEPARTMENTS, getDepartmentStats, getTodaySchedules,
} from './state.js';
import { readIdentityPolicy } from './services/identity-policy.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const routes = {
  personnel: ['personnel.js', 'renderPersonnelPage'], schedule: ['schedule.js', 'renderSchedulePage'],
  attendance: ['attendance.js', 'renderAttendancePage'], dutyboard: ['dutyboard.js', 'renderDutyBoardPage'],
  calendar: ['calendar.js', 'renderCalendarPage'], contacts: ['contacts.js', 'renderContactsPage'],
  leave: ['leave-management.js', 'renderLeaveManagementPage'], performance: ['performance.js', 'renderPerformancePage'],
  reports: ['reports.js', 'renderReportsPage'], tasks: ['tasks.js', 'renderTasksPage'], 'my-work': ['my-work.js', 'renderMyWorkPage'],
  announcements: ['announcements.js', 'renderAnnouncementsPage'], profile: ['profile.js', 'renderProfilePage'],
  'hr-command': ['hr-command-center.js', 'renderHRCommandCenterPage'], 'employee-portal': ['employee-portal.js', 'renderEmployeePortalPage'],
  'workflow-center': ['workflow-center.js', 'renderWorkflowCenterPage'], 'shift-optimizer': ['shift-optimizer.js', 'renderShiftOptimizerPage'],
  'platform-command': ['platform-command.js', 'renderPlatformCommandPage'], 'executive-panels': ['executive-panels.js', 'renderExecutivePanelsPage'], 'personnel-360': ['personnel-360.js', 'renderPersonnel360Page'],
  governance: ['governance.js', 'renderGovernancePage'], 'security-center': ['security-center.js', 'renderSecurityCenterPage'], 'enterprise-risk-center': ['enterprise-risk-center.js', 'renderEnterpriseRiskCenterPage'], 'governance-control-center': ['governance-control-center.js', 'renderGovernanceControlCenterPage'], 'identity-center': ['identity-center.js', 'renderIdentityCenterPage'], 'access-review': ['access-review.js', 'renderAccessReviewPage'], 'data-quality': ['data-quality.js', 'renderDataQualityPage'], 'kvkk-governance': ['kvkk-governance.js', 'renderKvkkGovernancePage'], 'disaster-recovery-reporting': ['disaster-recovery-reporting.js', 'renderDisasterRecoveryReportingPage'], 'mobile-staff': ['mobile-staff.js', 'renderMobileStaffPage'], 'workforce-safety': ['workforce-safety.js', 'renderWorkforceSafetyPage'],
  'employee-operations': ['employee-operations.js', 'renderEmployeeOperationsPage'], 'integration-planning': ['integration-planning.js', 'renderIntegrationPlanningPage'], 'api-integration': ['api-integration.js', 'renderAPIIntegrationPage'], 'integration-operations': ['integration-operations.js', 'renderIntegrationOperationsPage'], 'integration-sla': ['integration-sla.js', 'renderIntegrationSlaPage'], 'it-service-center': ['it-service-center.js', 'renderITServiceCenterPage'], 'next-stage-center': ['next-stage-center.js', 'renderNextStageCenterPage'], 'transformation-center': ['transformation-center.js', 'renderTransformationCenterPage'], committee: ['committee.js', 'renderCommitteePage'], 'reporting-center': ['reporting-center.js', 'renderReportingCenterPage'], 'hospital-control-tower': ['hospital-control-tower.js', 'renderHospitalControlTowerPage'], 'market-roadmap': ['market-roadmap.js', 'renderMarketRoadmapPage'],
  'platform-ai': ['platform-ai.js', 'renderPlatformAIPage'], 'market-command-center': ['market-command-center.js', 'renderMarketCommandCenterPage'], audit: ['audit.js', 'renderAuditPage'], 'production-readiness': ['production-readiness.js', 'renderProductionReadinessPage'], 'enterprise-hub': ['enterprise-hub.js', 'renderEnterpriseHubPage'], 'backup-recovery': ['backup-recovery.js', 'renderBackupRecoveryPage'], 'signature-center': ['signature-center.js', 'renderSignatureCenterPage'], 'signature-chain': ['signature-chain.js', 'renderSignatureChainPage'],
  accessibility: ['accessibility.js', 'renderAccessibilityPage'], settings: ['settings.js', 'renderSettingsPage'],
  education: ['education.js', 'renderEducationPage'], emergency: ['emergency.js', 'renderEmergencyPage'],
  'patient-queue': ['patient-queue.js', 'renderPatientQueuePage'], 'patient-flow': ['patient-flow.js', 'renderPatientFlowPage'], 'bed-management': ['bed-management.js', 'renderBedManagementPage'], triage: ['triage.js', 'renderTriagePage'],
  'visit-checklist': ['visit-checklist.js', 'renderVisitChecklistPage'], 'sbar-handover': ['sbar-handover.js', 'renderSBARPage'],
  'fall-risk': ['fall-risk.js', 'renderFallRiskPage'], 'pressure-ulcer': ['pressure-ulcer.js', 'renderPressureUlcerPage'],
  'hand-hygiene': ['hand-hygiene.js', 'renderHandHygienePage'], 'antibiotic-stewardship': ['antibiotic-stewardship.js', 'renderAntibioticPage'],
  'competency-matrix': ['competency-matrix.js', 'renderCompetencyMatrixPage'], 'simulation-training': ['simulation-training.js', 'renderSimulationTrainingPage'],
  'or-planning': ['or-planning.js', 'renderORPlanningPage'], 'icu-panel': ['icu-panel.js', 'renderICUPanelPage'],
  radiology: ['radiology.js', 'renderRadiologyPage'], telemedicine: ['telemedicine.js', 'renderTelemedicinePage'],
  'patient-portal': ['patient-portal.js', 'renderPatientPortalPage'], 'patient-crm': ['patient-crm.js', 'renderPatientCRMPage'], 'disaster-management': ['disaster-management.js', 'renderDisasterManagementPage'], 'operations-forecast': ['operations-forecast.js', 'renderOperationsForecastPage'], 'revenue-cycle': ['revenue-cycle.js', 'renderRevenueCyclePage'], 'system-monitoring': ['system-monitoring.js', 'renderSystemMonitoringPage'], 'critical-alerts': ['critical-alerts.js', 'renderCriticalAlertsPage'], 'clinical-results': ['clinical-results.js', 'renderClinicalResultsPage'], 'medication-safety': ['medication-safety.js', 'renderMedicationSafetyPage'], 'infection-command-center': ['infection-command-center.js', 'renderInfectionCommandCenterPage'], 'infection-control': ['infection-control.js', 'renderInfectionControlPage'], 'patient-safety-center': ['patient-safety-center.js', 'renderPatientSafetyCenterPage'], 'clinical-risk-center': ['clinical-risk-center.js', 'renderClinicalRiskCenterPage'], 'training-center': ['training-center.js', 'renderTrainingCenterPage'],
  'or-icu-center': ['or-icu-center.js', 'renderORICUCenterPage'], 'sterilization-center': ['sterilization-center.js', 'renderSterilizationCenterPage'], 'blood-transfusion-center': ['blood-transfusion-center.js', 'renderBloodTransfusionCenterPage'], 'clinical-command-center': ['clinical-command-center.js', 'renderClinicalCommandCenterPage'], 'clinical-research-center': ['clinical-research-center.js', 'renderClinicalResearchPage'], 'care-coordination': ['care-coordination.js', 'renderCareCoordinationPage'], 'morbidity-mortality': ['morbidity-mortality.js', 'renderMorbidityMortalityPage'], 'patient-experience-center': ['patient-experience-center.js', 'renderPatientExperiencePage'], 'patient-rights': ['patient-rights.js', 'renderPatientRightsPage'], 'quality-improvement': ['quality-improvement.js', 'renderQualityImprovementPage'], 'clinical-nutrition-center': ['clinical-nutrition-center.js', 'renderClinicalNutritionPage'], 'medication-reconciliation': ['medication-reconciliation.js', 'renderMedicationReconciliationPage'], 'medical-device-center': ['medical-device-center.js', 'renderMedicalDeviceCenterPage'], 'clinical-protocol-compliance': ['clinical-protocol-compliance.js', 'renderClinicalProtocolCompliancePage'], 'sepsis-monitoring': ['sepsis-monitoring.js', 'renderSepsisMonitoringPage'], 'surgical-safety-center': ['surgical-safety-center.js', 'renderSurgicalSafetyPage'], 'patient-prevention-center': ['patient-prevention-center.js', 'renderPatientPreventionPage'], 'patient-identification-center': ['patient-identification-center.js', 'renderPatientIdentificationPage'], 'patient-transfer-center': ['patient-transfer-center.js', 'renderPatientTransferPage'], 'specimen-safety-center': ['specimen-safety-center.js', 'renderSpecimenSafetyPage'], 'discharge-safety-center': ['discharge-safety-center.js', 'renderDischargeSafetyPage'], 'patient-education-center': ['patient-education-center.js', 'renderPatientEducationCenterPage'], 'pain-management-center': ['pain-management-center.js', 'renderPainManagementPage'], 'palliative-care-center': ['palliative-care-center.js', 'renderPalliativeCarePage'],
};
const menuGroups = [
  { title: 'Genel', items: [['dashboard', 'Gösterge Paneli'], ['personnel', 'Personel'], ['schedule', 'Nöbet ve Vardiya'], ['attendance', 'Puantaj'], ['dutyboard', 'Görev Panosu'], ['my-work', 'İşlerim']] },
  { title: 'İK İşlemleri', items: [['hr-command', 'İK Komuta Merkezi'], ['employee-portal', 'Çalışan Portalı'], ['mobile-staff', t('mobile.nav_label')], ['workflow-center', 'Onay ve İş Akışları'], ['shift-optimizer', 'Vardiya Optimizasyonu'], ['leave', 'İzin Yönetimi'], ['performance', 'Performans']] },
  { title: 'Yönetim ve Güvenlik', items: [['platform-command', 'Hastane Komuta Merkezi'], ['executive-panels', t('executive_panels.nav_label')], ['critical-alerts', t('critical_alerts.nav_label')], ['personnel-360', 'Personel 360°'], ['governance', 'Kimlik ve Yetki'], ['identity-center', t('identity.nav_label')], ['access-review', t('access_review.nav_label')], ['data-quality', t('data_quality.nav_label')], ['kvkk-governance', t('kvkk.nav_label')], ['disaster-recovery-reporting', t('drill_reporting.nav_label')], ['security-center', t('security.nav_label')], ['enterprise-risk-center', t('enterprise_risk.nav_label')], ['governance-control-center', t('governance_center.nav_label')], ['disaster-management', t('disaster.nav_label')], ['workforce-safety', 'İş Güvenliği ve Acil Durum'], ['employee-operations', 'Çalışan Yaşam Döngüsü'], ['integration-planning', 'Entegrasyon ve Planlama'], ['api-integration', t('market.api_nav')], ['integration-operations', t('platform.integration_ops_nav')], ['integration-sla', t('integration_sla.nav_label')], ['it-service-center', t('itsm.nav_label')], ['next-stage-center', t('next_stage.nav_label')], ['transformation-center', t('transformation.nav_label')], ['committee', t('committee_center.nav_label')], ['reporting-center', t('reporting_center.nav_label')], ['hospital-control-tower', t('control_tower.nav_label')], ['market-roadmap', t('market.nav_label')], ['market-command-center', t('market_center.nav_label')], ['operations-forecast', t('forecast.nav_label')], ['revenue-cycle', t('revenue.nav_label')], ['platform-ai', 'Yönetici Özeti'], ['audit', 'Denetim Kayıtları'], ['system-monitoring', 'Sistem İzleme'], ['production-readiness', t('readiness.nav_label')], ['enterprise-hub', t('enterprise.nav_label')], ['backup-recovery', t('backup_recovery.nav_label')], ['signature-center', t('signature_center.nav_label')], ['signature-chain', t('signature_center.chain_nav')]] },
  { title: 'Klinik ve Kalite', items: [['patient-flow', t('patient_flow.nav_label')], ['clinical-results', t('clinical_results.nav_label')], ['medication-safety', t('medication_safety.nav_label')], ['antibiotic-stewardship', t('antibiotic.nav_label')], ['infection-command-center', t('infection_center.nav_label')], ['patient-safety-center', t('safety_center.nav_label')], ['clinical-risk-center', t('clinical_risk.nav_label')], ['training-center', t('training_center.nav_label')], ['or-icu-center', t('or_icu.nav_label')], ['sterilization-center', t('sterilization.nav_label')], ['blood-transfusion-center', t('blood_center.nav_label')], ['clinical-command-center', t('clinical_command.nav_label')], ['clinical-research-center', t('research.nav_label')], ['care-coordination', t('care.nav_label')], ['morbidity-mortality', t('mm.nav_label')], ['patient-experience-center', t('experience.feedback.nav_label')], ['patient-rights', t('rights.nav_label')], ['quality-improvement', t('quality.nav_label')], ['clinical-nutrition-center', t('nutrition.nav_label')], ['medication-reconciliation', t('medication_center.nav_label')], ['medical-device-center', t('device_center.nav_label')], ['clinical-protocol-compliance', t('protocol_center.nav_label')], ['sepsis-monitoring', t('sepsis_center.nav_label')], ['surgical-safety-center', t('surgical_center.nav_label')], ['patient-prevention-center', t('prevention_center.nav_label')], ['patient-identification-center', t('identification_center.nav_label')], ['patient-transfer-center', t('transfer_center.nav_label')], ['specimen-safety-center', t('specimen_center.nav_label')], ['discharge-safety-center', t('discharge_center.nav_label')], ['patient-education-center', t('education_center.nav_label')], ['pain-management-center', t('pain_center.nav_label')], ['palliative-care-center', t('palliative_center.nav_label')], ['patient-portal', t('experience.portal.nav_label')], ['telemedicine', t('experience.tele.nav_label')], ['patient-queue', 'Hasta Sırası'], ['triage', 'Triage'], ['visit-checklist', 'Vizit Checklist'], ['sbar-handover', 'SBAR Devir Teslim'], ['fall-risk', 'Düşme Riski'], ['pressure-ulcer', 'Bası Yarası'], ['hand-hygiene', 'El Hijyeni'], ['competency-matrix', 'Yetkinlik Matrisi'], ['or-planning', 'Ameliyathane Planı'], ['icu-panel', 'Yoğun Bakım Paneli']] },
  { title: 'Diğer', items: [['reports', 'Raporlar'], ['tasks', 'Görevler'], ['announcements', 'Duyurular'], ['patient-crm', t('crm.nav_label')], ['contacts', 'İletişim'], ['profile', 'Profil'], ['settings', 'Ayarlar'], ['accessibility', 'Erişilebilirlik']] },
];
let currentPage = 'dashboard';
let loadingPage = false;
let sessionPolicy = { idleMinutes: 30, maxHours: 12 };
let sessionStartedAt = 0;
let lastActivityAt = 0;
let sessionGuardStarted = false;

function touchSession() { if (getCurrentUser()) lastActivityAt = Date.now(); }
function enforceSessionPolicy() {
  if (!getCurrentUser() || !sessionStartedAt) return;
  const now = Date.now();
  const idleExpired = now - lastActivityAt > Number(sessionPolicy.idleMinutes || 30) * 60000;
  const maximumExpired = now - sessionStartedAt > Number(sessionPolicy.maxHours || 12) * 3600000;
  if (idleExpired || maximumExpired) { logout(); showLogin(); }
}
function startSessionGuard() {
  sessionStartedAt = Date.now();
  lastActivityAt = sessionStartedAt;
  if (sessionGuardStarted) return;
  sessionGuardStarted = true;
  ['pointerdown', 'keydown', 'touchstart'].forEach(eventName => window.addEventListener(eventName, touchSession, { passive: true }));
  window.setInterval(enforceSessionPolicy, 30000);
  readIdentityPolicy().then(policy => { sessionPolicy = policy.session || sessionPolicy; }).catch(() => {});
}

export function initApp() {
  try { initState(); } catch (error) { showError(error); return; }
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1) || 'dashboard'));
  renderShell();
  if (getCurrentUser()) { startSessionGuard(); showApp(); navigate(location.hash.slice(1) || 'dashboard'); } else showLogin();
}

function setMenuExpanded(section, expanded) {
  const toggle = section.querySelector('.nav-section-toggle');
  const panel = section.querySelector('.nav-section-panel');
  if (!toggle || !panel) return;
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.classList.toggle('is-open', expanded);
  panel.classList.toggle('is-collapsed', !expanded);
}

function setupCollapsibleMenus(root) {
  root.querySelectorAll('section').forEach((section, index) => {
    const heading = section.querySelector('h2');
    const items = [...section.querySelectorAll('[data-route]')];
    if (!heading || !items.length) return;
    const activeRoute = (location.hash.slice(1).split('/')[0] || currentPage);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-section-toggle';
    toggle.setAttribute('aria-expanded', String(items.some(item => item.dataset.route === activeRoute)));
    const label = document.createElement('span');
    label.textContent = heading.textContent;
    const chevron = document.createElement('span');
    chevron.className = 'nav-section-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';
    toggle.append(label, chevron);
    const panel = document.createElement('div');
    panel.className = 'nav-section-panel';
    panel.id = `${root.id || 'nav'}-section-${index}`;
    items.forEach(item => panel.append(item));
    heading.replaceWith(toggle);
    section.append(panel);
    toggle.setAttribute('aria-controls', panel.id);
    toggle.addEventListener('click', () => setMenuExpanded(section, toggle.getAttribute('aria-expanded') !== 'true'));
    setMenuExpanded(section, toggle.getAttribute('aria-expanded') === 'true');
  });
}

function syncCollapsibleMenus(route) {
  document.querySelectorAll('#sidebar section, #mobile-sidebar section').forEach(section => {
    if ([...section.querySelectorAll('[data-route]')].some(item => item.dataset.route === route)) setMenuExpanded(section, true);
  });
}

function renderShell() {
  const sidebar = document.getElementById('sidebar');
  const mobile = document.getElementById('mobile-sidebar');
  const markup = `<div class="p-5 border-b border-white/10"><p class="text-xs uppercase tracking-widest text-cyan-300">Hastane PYS</p><h1 class="text-lg font-bold text-white mt-1">Personel Yönetimi</h1></div><div class="p-3 space-y-3">${menuGroups.map(group => `<section><h2 class="px-3 mb-1 text-[10px] uppercase tracking-widest text-slate-500">${group.title}</h2>${group.items.map(([id, label]) => `<a href="#${id}" data-route="${id}" class="nav-item flex items-center rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition">${label}</a>`).join('')}</section>`).join('')}</div><div class="mt-auto p-4 border-t border-white/10"><button id="shell-logout" class="btn-secondary w-full text-xs">Oturumu Kapat</button></div>`;
  [sidebar, mobile].forEach(el => { if (el) { el.innerHTML = markup; setupCollapsibleMenus(el); el.querySelector('#shell-logout').onclick = () => { logout(); showLogin(); }; el.querySelectorAll('[data-route]').forEach(a => a.onclick = () => closeMobile()); } });
}

function showLogin() {
  document.getElementById('app')?.classList.add('hidden');
  const root = document.getElementById('login-screen');
  if (!root) return;
  root.classList.remove('hidden');
  root.replaceChildren();
  const card = document.createElement('form');
  card.className = 'login-card';
  card.innerHTML = `<div class="login-layout"><div class="login-visual" aria-hidden="true"><div class="login-visual-top"><div class="login-logo-mark"><svg viewBox="0 0 48 48" fill="none"><path d="M24 5 39 11v11c0 9.3-6.3 17.7-15 21-8.7-3.3-15-11.7-15-21V11L24 5Z" fill="currentColor" opacity=".2"/><path d="M24 5 39 11v11c0 9.3-6.3 17.7-15 21-8.7-3.3-15-11.7-15-21V11L24 5Z" stroke="currentColor" stroke-width="2"/><path d="M24 14v14M17 21h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div><div><p class="login-overline">HASTANE PYS</p><p class="login-visual-title">${t('login.security_note')}</p></div></div><div class="login-emergency-scene" aria-hidden="true"><div class="login-scene-label"><span class="login-scene-pulse"></span><span>${t('login.emergency_scene')}</span></div><svg class="login-scene-svg" viewBox="0 0 420 190" fill="none" role="presentation"><defs><linearGradient id="scene-road" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#0b2940"/><stop offset="1" stop-color="#061521"/></linearGradient><linearGradient id="scene-ambulance" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8fafc"/><stop offset="1" stop-color="#cbd5e1"/></linearGradient></defs><path d="M0 151 420 114v76H0v-39Z" fill="url(#scene-road)"/><path class="login-scene-road-line" d="M20 166h74m26-7h74m28-7h74m28-7h74" stroke="#67e8f9" stroke-width="2" stroke-linecap="round" stroke-dasharray="18 12" opacity=".5"/><g class="login-er-building"><path d="M291 47h92l20 67H274l17-67Z" fill="#082f49" stroke="#67e8f9" stroke-opacity=".35"/><path d="M300 57h75l8 28h-90l7-28Z" fill="#164e63"/><path d="M343 57v28" stroke="#67e8f9" stroke-opacity=".35"/><path d="M284 95h113v19H274l10-19Z" fill="#0e7490" fill-opacity=".55"/><rect x="329" y="75" width="31" height="39" rx="2" fill="#0f172a" stroke="#67e8f9" stroke-opacity=".45"/><path d="M345 77v37" stroke="#67e8f9" stroke-opacity=".28"/><path d="M306 54h50v18h-50z" fill="#ef4444" stroke="#fecaca" stroke-opacity=".45"/><text x="331" y="67" text-anchor="middle" fill="#fff" font-size="8" font-family="Arial,sans-serif" font-weight="700">${t('login.emergency_building')}</text><path d="M337 102h6m5 0h6" stroke="#a5f3fc" stroke-width="2" stroke-linecap="round" opacity=".7"/></g><g class="login-ambulance"><path d="M42 102h142l25 27v25H31v-29l11-23Z" fill="url(#scene-ambulance)" stroke="#e2e8f0" stroke-width="2"/><path d="M184 102h30l26 27v25h-43v-31l-13-21Z" fill="#e2e8f0" stroke="#f8fafc" stroke-width="2"/><path d="M50 109h46v29H42l8-29Zm56 0h42v29h-42v-29Zm50 0h23l15 29h-38v-29Z" fill="#164e63"/><path d="M70 122h27M83.5 108v29M123 116v16M115 124h16" stroke="#67e8f9" stroke-width="3" stroke-linecap="round"/><path d="M47 148h182" stroke="#ef4444" stroke-width="6"/><path d="M84 101h53" stroke="#22d3ee" stroke-width="4" stroke-linecap="round"/><path d="M146 101h18" stroke="#f87171" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="158" r="14" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/><circle cx="202" cy="158" r="14" fill="#0f172a" stroke="#94a3b8" stroke-width="3"/><circle cx="70" cy="158" r="5" fill="#67e8f9"/><circle cx="202" cy="158" r="5" fill="#67e8f9"/><path class="login-siren-glow" d="M116 96h19" stroke="#fb7185" stroke-width="8" stroke-linecap="round"/><path class="login-siren" d="M120 93h11l3 5h-17l3-5Z" fill="#f43f5e"/></g><g class="login-stretcher-patient"><path d="M231 145h67" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/><path d="M237 145v15m55-15v15" stroke="#94a3b8" stroke-width="2"/><path d="M236 160h58" stroke="#67e8f9" stroke-width="2" stroke-linecap="round"/><circle cx="244" cy="166" r="5" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/><circle cx="286" cy="166" r="5" fill="#0f172a" stroke="#94a3b8" stroke-width="2"/><path d="M247 136h43c4 0 6 3 4 6l-3 4h-51l2-7c1-2 2-3 5-3Z" fill="#dbeafe" stroke="#f8fafc" stroke-width="2"/><circle cx="253" cy="131" r="6" fill="#f6c7a8"/><path d="M258 134c7-5 18-4 25 2l6 7h-31l-5-6c-1-1 2-3 5-3Z" fill="#38bdf8"/><path d="M266 137h17" stroke="#bae6fd" stroke-width="2" stroke-linecap="round"/><path d="M249 145h47" stroke="#ef4444" stroke-width="2" stroke-linecap="round" opacity=".8"/></g><g class="login-care-team"><circle cx="273" cy="128" r="7" fill="#f6c7a8"/><path d="M262 140c2-8 20-8 22 0v20h-22v-20Z" fill="#22d3ee"/><path d="M266 137h14" stroke="#e0f2fe" stroke-width="3"/><path d="M268 160v14m12-14v14m-18 0h12m6 0h12" stroke="#a5f3fc" stroke-width="3" stroke-linecap="round"/><path d="m280 144 13 9m-27-9-9 10" stroke="#f6c7a8" stroke-width="4" stroke-linecap="round"/><circle cx="316" cy="133" r="6" fill="#f6c7a8"/><path d="M306 143c2-7 18-7 20 0v17h-20v-17Z" fill="#f8fafc"/><path d="M309 160v14m14-14v14m-20 0h12m7 0h10" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/><path d="M307 145h18" stroke="#0e7490" stroke-width="3"/></g><path class="login-scene-arrow" d="M235 119h21m-7-6 7 6-7 6" stroke="#67e8f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle class="login-scene-beacon" cx="398" cy="43" r="5" fill="#4ade80"/></svg><div class="login-scene-caption">${t('login.emergency_scene_status')}</div></div><div class="login-visual-copy"><span class="login-live-dot"></span><span>${t('login.facility_status')}</span></div><div class="login-visual-grid"><div class="login-mini-card"><span class="login-mini-value">24/7</span><span class="login-mini-label">${t('login.continuous_access')}</span></div><div class="login-mini-card"><span class="login-mini-value">100%</span><span class="login-mini-label">${t('login.secure_session')}</span></div></div><div class="login-signal"><div class="signal-bars"><i></i><i></i><i></i><i></i><i></i></div><div><strong>${t('login.operations_center')}</strong><span>${t('login.single_screen')}</span></div></div></div><div class="login-form-pane"><div class="login-form-header"><div class="login-mobile-mark"><svg viewBox="0 0 48 48" fill="none"><path d="M24 5 39 11v11c0 9.3-6.3 17.7-15 21-8.7-3.3-15-11.7-15-21V11L24 5Z" stroke="currentColor" stroke-width="2"/><path d="M24 14v14M17 21h14" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></div><p class="login-overline">HASTANE PYS</p></div><h1 class="login-title">${t('login.title')}</h1><p class="login-subtitle">${t('login.welcome_note')}</p><div class="login-secure-note"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3 20 6v5.5c0 4.9-3.4 8.6-8 9.5-4.6-.9-8-4.6-8-9.5V6l8-3Z" stroke="currentColor" stroke-width="1.8"/><path d="m8.5 12 2.2 2.2 4.8-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${t('login.secure_connection')}</span></div><div class="login-fields"><label class="label" for="login-user">${t('login.username')}</label><input id="login-user" class="input-field w-full mb-4" autocomplete="username" required><label class="label" for="login-pass">${t('login.password')}</label><div class="password-field"><input id="login-pass" type="password" class="input-field w-full" autocomplete="current-password" required><button id="toggle-pass" type="button" class="password-toggle" aria-label="${t('show_password')}" title="${t('show_password')}"><span class="sr-only">${t('show_password')}</span></button></div><p id="login-error" class="hidden login-error" role="alert"></p><button class="btn-primary login-submit w-full" type="submit"><span>${t('login.submit')}</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div></div></div>`;
  const passInput = card.querySelector('#login-pass');
  const togglePass = card.querySelector('#toggle-pass');
  const eyeIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" stroke-width="1.8"/></svg>';
  const eyeOffIcon = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A10.8 10.8 0 0 1 12 6c6.1 0 9.5 6 9.5 6a17.3 17.3 0 0 1-3.1 3.7M6.2 6.9C3.8 8.6 2.5 12 2.5 12s3.4 6 9.5 6c1.2 0 2.3-.2 3.3-.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  togglePass.innerHTML = eyeIcon;
  togglePass?.addEventListener('click', () => {
    const showing = passInput.type === 'text';
    passInput.type = showing ? 'password' : 'text';
    const label = t(showing ? 'show_password' : 'hide_password');
    togglePass.innerHTML = showing ? eyeIcon : eyeOffIcon;
    togglePass.setAttribute('aria-label', label);
    togglePass.setAttribute('title', label);
  });
  card.onsubmit = (event) => { event.preventDefault(); const result = login(card.querySelector('#login-user').value.trim(), card.querySelector('#login-pass').value); if (!result.ok) { const error = card.querySelector('#login-error'); error.textContent = result.error || t('login.error'); error.classList.remove('hidden'); return; } startSessionGuard(); showApp(); navigate(location.hash.slice(1) || 'dashboard'); };
  root.append(card);
}
function showApp() { document.getElementById('login-screen')?.classList.add('hidden'); document.getElementById('app')?.classList.remove('hidden'); }
function closeMobile() { document.getElementById('mobile-menu')?.classList.add('hidden'); document.getElementById('mobile-sidebar')?.classList.add('-translate-x-full'); }
function showError(error) { const root = document.getElementById('login-screen'); if (!root) return; root.classList.remove('hidden'); root.textContent = t('platform.page_error') || String(error); }

export async function navigate(route) {
  if (!getCurrentUser()) { showLogin(); return; }
  const parts = (route || 'dashboard').split('/'); currentPage = parts[0];
  document.querySelectorAll('[data-route]').forEach(item => item.classList.toggle('bg-white/10', item.dataset.route === currentPage));
  document.querySelectorAll('.mob-nav-item').forEach(item => item.classList.toggle('active', item.dataset.page === currentPage));
  syncCollapsibleMenus(currentPage);
  const content = document.getElementById('content'); if (!content || loadingPage) return;
  closeMobile();
  if (currentPage === 'dashboard') { renderEnhancedDashboard(content); return; }
  const spec = currentPage === 'personnel' && parts[1]
    ? ['personnel-detail.js?build=v90', 'renderPersonnelDetailPage']
    : routes[currentPage];
  if (!spec) { content.innerHTML = `<div class="card"><h1 class="text-xl font-bold text-white">${t('platform_core.page_not_found')}</h1><p class="text-slate-400 mt-2">${t('platform_core.not_ready')}</p></div>`; return; }
  loadingPage = true; content.innerHTML = `<div class="card loading-pulse text-slate-400">${t('platform_core.loading')}</div>`;
  try { const module = await import(`./pages/${spec[0]}`); const render = module[spec[1]]; if (typeof render !== 'function') throw new Error('Sayfa bileşeni bulunamadı'); await render(content, parts[1] || null); }
  catch (error) { content.innerHTML = ''; const box = document.createElement('div'); box.className = 'card border-red-400/20'; box.innerHTML = `<h1 class="text-xl font-bold text-white">${t('platform_core.page_load_error')}</h1><p class="text-sm text-slate-400 mt-2">${t('platform_core.continue_working')}</p>`; const retry = document.createElement('button'); retry.className = 'btn-primary mt-5'; retry.textContent = t('platform_core.retry'); retry.onclick = () => navigate(route); box.append(retry); content.append(box); console.error('[Hastane PYS] Sayfa yüklenemedi', currentPage, error); }
  finally { loadingPage = false; }
}
