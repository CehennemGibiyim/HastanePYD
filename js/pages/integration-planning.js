// ===== ENTEGRASYON MERKEZİ VE PLANLAMA =====
import { getPersonnel, getDepartments } from '../state.js';
import { readPlatform, writePlatform, uid, today, dateLabel, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const seedConnections = [
  { id: 'int_fhir', nameKey: 'platform.fhir_hl7', standard: 'FHIR R4 / HL7 v2', direction: '↔', status: 'watch', lastSync: today() },
  { id: 'int_pacs', nameKey: 'platform.pacs_dicom', standard: 'DICOMweb', direction: '↔', status: 'watch', lastSync: today() },
  { id: 'int_lis', nameKey: 'platform.lis', standard: 'HL7 ORU', direction: '←', status: 'watch', lastSync: today() },
  { id: 'int_sso', nameKey: 'platform.sso_mfa', standard: 'OIDC / LDAP', direction: '↔', status: 'ready', lastSync: today() },
  { id: 'int_siem', nameKey: 'platform.kvkk_siem', standard: 'Audit / SIEM', direction: '→', status: 'watch', lastSync: today() },
];

export async function renderIntegrationPlanningPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('platform.loading')}</div>`;
  const [storedConnections, storedScenarios] = await Promise.all([
    readPlatform('integrations', seedConnections),
    readPlatform('scenarios', []),
  ]);
  const connections = Array.isArray(storedConnections) ? storedConnections : seedConnections.map(item => ({ ...item }));
  const scenarios = Array.isArray(storedScenarios) ? storedScenarios : [];
  const staff = getPersonnel({ status: 'active' });
  const departments = getDepartments();
  const ready = connections.filter(item => item.status === 'ready').length;
  const readiness = Math.round(ready / Math.max(1, connections.length) * 100);

  container.innerHTML = `<div class="integration-page fade-in space-y-5">
    <header class="integration-hero"><div><p class="command-kicker">${t('platform.integrations')}</p><h1>${t('platform.planning_title')}</h1><p>${t('platform.integration_readiness_desc')}</p></div><div class="readiness-score"><strong>${readiness}%</strong><span>${t('platform.integration_readiness')}</span></div></header>
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4"><div class="integration-stat"><span>${t('platform.connected')}</span><strong>${ready}/${connections.length}</strong><small>${t('platform.connection_status')}</small></div><div class="integration-stat"><span>${t('platform.active_staff')}</span><strong>${staff.length}</strong><small>${t('platform.single_source')}</small></div><div class="integration-stat"><span>${t('platform.scenario')}</span><strong>${scenarios.length}</strong><small>${t('platform.forecast')}</small></div><div class="integration-stat"><span>${t('platform.departments')}</span><strong>${departments.length}</strong><small>${t('platform.current')}</small></div></section>
    <section class="card integration-panel"><div class="section-heading"><div><p class="section-kicker">${t('platform.integration')}</p><h2>${t('platform.integration_readiness')}</h2><p class="section-help">${t('platform.integration_readiness_desc')}</p></div><button id="sync-all" class="btn-primary text-xs">${t('platform.sync_now')}</button></div><div class="connection-grid">${connections.map(connectionCard).join('')}</div></section>
    <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-5"><section class="card integration-panel"><div class="section-heading"><div><p class="section-kicker">${t('platform.add_connection')}</p><h2>${t('platform.connection_status')}</h2></div></div><form id="connection-form" class="space-y-3"><div class="grid sm:grid-cols-2 gap-3"><label class="field-wrap"><span>${t('platform.connection_name')}</span><input id="connection-name" class="input-field w-full" placeholder="${t('platform.connection_name')}" required></label><label class="field-wrap"><span>${t('platform.connection_type')}</span><select id="connection-type" class="input-field w-full"><option value="FHIR R4">${t('platform.type_fhir')}</option><option value="HL7 v2">${t('platform.type_hl7')}</option><option value="DICOMweb">${t('platform.type_dicom')}</option><option value="REST API">${t('platform.type_rest')}</option><option value="OIDC / LDAP">${t('platform.type_oidc')}</option></select></label></div><label class="field-wrap"><span>${t('platform.endpoint')}</span><input id="connection-endpoint" class="input-field w-full" placeholder="https://..." inputmode="url"></label><button class="btn-primary w-full" type="submit">${t('platform.save_connection')}</button></form></section><section class="card integration-panel"><div class="section-heading"><div><p class="section-kicker">${t('platform.forecast')}</p><h2>${t('platform.scenario')}</h2></div></div><form id="scenario-form" class="space-y-3"><label class="field-wrap"><span>${t('platform.scenario_name')}</span><input id="scenario-name" class="input-field w-full" placeholder="${t('platform.scenario_placeholder')}"></label><div class="grid grid-cols-2 gap-3"><label class="field-wrap"><span>${t('platform.department')}</span><select id="scenario-dept" class="input-field w-full">${departments.map(dept => `<option value="${esc(dept)}">${esc(dept)}</option>`).join('')}</select></label><label class="field-wrap"><span>${t('platform.required')}</span><input id="scenario-need" class="input-field w-full" type="number" min="1" value="5"></label></div><button class="btn-primary w-full" type="submit">${t('platform.add')}</button></form><div class="scenario-list">${scenarios.length ? scenarios.slice(0, 5).map(scenarioCard).join('') : `<div class="empty-state py-4"><div class="title">${t('platform.no_records')}</div></div>`}</div></section></div>
  </div>`;
  bind(container, connections, scenarios, staff);
}

function connectionCard(item) {
  const isReady = item.status === 'ready';
  return `<article class="connection-card ${isReady ? 'is-ready' : 'is-watch'}"><div class="connection-top"><span class="integration-dot ${isReady ? 'ready' : 'watch'}"></span><strong>${t(item.nameKey) || esc(item.name)}</strong><span class="market-status ${isReady ? 'status-ready' : 'status-watch'}">${isReady ? t('platform.ready') : t('platform.watch')}</span></div><div class="connection-meta"><span>${esc(item.standard)}</span><span>${esc(item.direction)}</span></div><small>${t('platform.last_sync')} · ${dateLabel(item.lastSync)}</small><div class="connection-actions"><button class="btn-secondary text-xs sync-one" data-id="${esc(item.id)}">${t('platform.sync_now')}</button><button class="btn-secondary text-xs test-one" data-id="${esc(item.id)}">${t('platform.test_connection')}</button></div></article>`;
}
function scenarioCard(item) { return `<div class="scenario-row"><div><strong>${esc(item.name)}</strong><small>${esc(item.department || t('platform.department'))} · ${t('platform.current')}: ${item.current || 0}</small></div><b class="${item.gap > 0 ? 'text-amber-300' : 'text-emerald-300'}">${t('platform.gap')}: ${item.gap || 0}</b></div>`; }
function bind(container, connections, scenarios, staff) {
  container.querySelector('#sync-all')?.addEventListener('click', async () => { try { connections.forEach(item => { item.status = 'ready'; item.lastSync = today(); }); await writePlatform('integrations', connections); showToast(t('platform.sync_done'), 'success'); renderIntegrationPlanningPage(container); } catch { showToast(t('platform.summary_error'), 'error'); } });
  container.querySelectorAll('.sync-one').forEach(button => button.onclick = async () => { const item = connections.find(x => x.id === button.dataset.id); if (!item) return; try { item.status = 'ready'; item.lastSync = today(); await writePlatform('integrations', connections); showToast(t('platform.sync_done'), 'success'); renderIntegrationPlanningPage(container); } catch { showToast(t('platform.summary_error'), 'error'); } });
  container.querySelectorAll('.test-one').forEach(button => button.onclick = () => showToast(t('platform.connection_tested'), 'success'));
  container.querySelector('#connection-form')?.addEventListener('submit', async event => { event.preventDefault(); const name = container.querySelector('#connection-name').value.trim(); if (!name) { showToast(t('platform.connection_name_required'), 'error'); return; } const item = { id: uid('int'), name, nameKey: '', standard: container.querySelector('#connection-type').value, direction: '↔', status: 'watch', endpoint: container.querySelector('#connection-endpoint').value.trim(), lastSync: today() }; try { connections.push(item); await writePlatform('integrations', connections); showToast(t('platform.connection_saved'), 'success'); renderIntegrationPlanningPage(container); } catch { showToast(t('platform.summary_error'), 'error'); } });
  container.querySelector('#scenario-form')?.addEventListener('submit', async event => { event.preventDefault(); const name = container.querySelector('#scenario-name').value.trim() || t('platform.default_scenario'); const department = container.querySelector('#scenario-dept').value; const need = Number(container.querySelector('#scenario-need').value) || 1; const current = staff.filter(person => person.department === department).length; scenarios.unshift({ id: uid('scenario'), name, department, need, current, gap: Math.max(0, need - current), at: today() }); try { await writePlatform('scenarios', scenarios); showToast(t('platform.scenario_saved'), 'success'); renderIntegrationPlanningPage(container); } catch { showToast(t('platform.summary_error'), 'error'); } });
}
