// ===== KRİTİK ENTEGRASYON SLA, HATA VE ALARM SERVİSİ =====
import { readPlatform, writePlatform, uid } from './platform-storage.js';
import { appendEnterpriseAudit } from './enterprise-storage.js';
import { loadGatewayState, testEndpoint } from './integration-gateway.js';

const STATE_KEY = 'integration_sla_state';
const now = () => new Date().toISOString();
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || min));
const normalizeMonitor = (item = {}) => ({
  id: item.id || uid('sla'), name: String(item.name || 'Kritik entegrasyon'), connectionId: String(item.connectionId || ''),
  endpoint: String(item.endpoint || ''), owner: String(item.owner || 'Entegrasyon Operasyonları'),
  target: clamp(item.target ?? 99.5, 90, 100), responseLimit: clamp(item.responseLimit ?? 1500, 100, 60000),
  escalationMinutes: clamp(item.escalationMinutes ?? 15, 5, 1440), enabled: item.enabled !== false,
  status: ['healthy', 'degraded', 'down', 'pending', 'not_configured'].includes(item.status) ? item.status : 'pending',
  lastCheckedAt: item.lastCheckedAt || null, lastLatencyMs: Number(item.lastLatencyMs || 0), lastHttpStatus: item.lastHttpStatus || null,
});
const normalizeIncident = (item = {}) => ({
  id: item.id || uid('incident'), monitorId: String(item.monitorId || ''), severity: ['critical', 'high', 'medium'].includes(item.severity) ? item.severity : 'high',
  title: String(item.title || 'Entegrasyon alarmı'), detail: String(item.detail || ''), status: ['open', 'acknowledged', 'resolved'].includes(item.status) ? item.status : 'open',
  openedAt: item.openedAt || now(), updatedAt: item.updatedAt || now(), acknowledgedBy: String(item.acknowledgedBy || ''), resolvedBy: String(item.resolvedBy || ''),
});
const seedMonitors = () => [
  { id: 'sla_demo_hbys', name: 'HBYS / FHIR R4', owner: 'Bilgi Teknolojileri', target: 99.5, responseLimit: 1500, status: 'not_configured' },
  { id: 'sla_demo_lis', name: 'LIS / HL7 v2', owner: 'Laboratuvar Bilgi Yönetimi', target: 99.5, responseLimit: 2000, status: 'not_configured' },
  { id: 'sla_demo_pacs', name: 'PACS / DICOMweb', owner: 'Radyoloji Bilgi Yönetimi', target: 99.9, responseLimit: 2500, status: 'not_configured' },
].map(normalizeMonitor);
const defaults = () => ({
  monitors: seedMonitors(), incidents: [], checks: [], policy: { windowHours: 24, defaultTarget: 99.5, defaultResponseLimit: 1500, escalationMinutes: 15, notifyOnRecovery: true }, updatedAt: now(),
});
function normalizeState(value) {
  const base = defaults();
  return { ...base, ...(value || {}), monitors: Array.isArray(value?.monitors) ? value.monitors.map(normalizeMonitor) : [], incidents: Array.isArray(value?.incidents) ? value.incidents.map(normalizeIncident) : [], checks: Array.isArray(value?.checks) ? value.checks.slice(0, 180) : [], policy: { ...base.policy, ...(value?.policy || {}) } };
}
export async function loadSlaState() { return normalizeState(await readPlatform(STATE_KEY, defaults())); }
export async function saveSlaState(state, actor = 'system') { const next = normalizeState({ ...state, updatedAt: now() }); await writePlatform(STATE_KEY, next); await appendEnterpriseAudit({ action: 'integration_sla_state_updated', actor, resource: STATE_KEY, after: { monitors: next.monitors.length, incidents: next.incidents.length } }); return next; }
export async function addMonitor(input, actor = 'system') {
  const state = await loadSlaState();
  const monitor = normalizeMonitor({ ...input, id: uid('sla'), status: input.endpoint ? 'pending' : 'not_configured' });
  state.monitors.unshift(monitor); return saveSlaState(state, actor);
}
export async function updatePolicy(policy, actor = 'system') { const state = await loadSlaState(); state.policy = { ...state.policy, ...policy }; return saveSlaState(state, actor); }
export async function runMonitorCheck(monitorId, actor = 'system') {
  const state = await loadSlaState(); const monitor = state.monitors.find(item => item.id === monitorId); if (!monitor) throw new Error('monitor_not_found');
  let result = { ok: false, latencyMs: 0, status: null, detail: 'endpoint_missing' };
  if (monitor.endpoint) { try { result = await testEndpoint({ endpoint: monitor.endpoint }); } catch (error) { result = { ok: false, latencyMs: 0, status: null, detail: error?.name === 'AbortError' ? 'timeout' : 'network_error' }; } }
  const checkedAt = now();
  const status = !monitor.endpoint ? 'not_configured' : !result.ok ? 'down' : result.latencyMs > monitor.responseLimit ? 'degraded' : 'healthy';
  monitor.status = status; monitor.lastCheckedAt = checkedAt; monitor.lastLatencyMs = result.latencyMs; monitor.lastHttpStatus = result.status || null;
  state.checks.unshift({ id: uid('check'), monitorId, at: checkedAt, ok: status === 'healthy', status, latencyMs: result.latencyMs, httpStatus: result.status || null, detail: result.detail || '' });
  state.checks = state.checks.slice(0, 180);
  const existing = state.incidents.find(item => item.monitorId === monitorId && item.status !== 'resolved');
  if (status === 'healthy' && existing) { existing.status = 'resolved'; existing.resolvedBy = actor; existing.updatedAt = checkedAt; }
  if (['down', 'degraded'].includes(status) && !existing) state.incidents.unshift(normalizeIncident({ monitorId, severity: status === 'down' ? 'critical' : 'high', title: status === 'down' ? 'Entegrasyon erişilemiyor' : 'Entegrasyon yavaş yanıt veriyor', detail: result.detail || `Yanıt süresi ${result.latencyMs} ms`, openedAt: checkedAt }));
  const next = await saveSlaState(state, actor); return { state: next, result: { ...result, status } };
}
export async function removeMonitor(id, actor = 'system') {
  const state = await loadSlaState();
  state.monitors = state.monitors.filter(item => item.id !== id);
  state.incidents = state.incidents.filter(item => item.monitorId !== id);
  state.checks = state.checks.filter(item => item.monitorId !== id);
  return saveSlaState(state, actor);
}
export async function updateIncident(id, status, actor = 'system') {
  const state = await loadSlaState(); const incident = state.incidents.find(item => item.id === id); if (!incident) throw new Error('incident_not_found');
  incident.status = ['open', 'acknowledged', 'resolved'].includes(status) ? status : 'open'; incident.updatedAt = now();
  if (status === 'acknowledged') incident.acknowledgedBy = actor; if (status === 'resolved') incident.resolvedBy = actor;
  return saveSlaState(state, actor);
}
export function slaSummary(state) { const monitors = state.monitors; const checks = state.checks; const windowStart = Date.now() - Number(state.policy.windowHours || 24) * 3600000; const recent = checks.filter(item => new Date(item.at).getTime() >= windowStart); const uptime = recent.length ? (recent.filter(item => item.ok).length / recent.length) * 100 : null; return { total: monitors.length, healthy: monitors.filter(item => item.status === 'healthy').length, degraded: monitors.filter(item => item.status === 'degraded').length, down: monitors.filter(item => item.status === 'down').length, open: state.incidents.filter(item => item.status !== 'resolved').length, uptime, queueErrors: 0 }; }
export async function loadGatewayErrorCount() { const gateway = await loadGatewayState(); return gateway.queue.filter(item => ['failed', 'dead_letter'].includes(item.status)).length; }
export async function exportSlaEvidence(state, actor = 'system') { const payload = { schema: 'integration-sla-v1', exportedAt: now(), actor, ...state }; const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-pys-entegrasyon-sla-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); await appendEnterpriseAudit({ action: 'integration_sla_evidence_exported', actor, resource: STATE_KEY, after: { monitors: state.monitors.length, incidents: state.incidents.length } }); }
