// ===== GERÇEK ENTEGRASYON GEÇİDİ =====
// Ağ çağrısı yalnızca kullanıcı tarafından tanımlanan HTTPS adresine yapılır.
// Kimlik bilgileri tarayıcı depolamasına yazılmaz.
import { readPlatform, writePlatform, uid } from './platform-storage.js';

const CONFIG_KEY = 'integration_gateway_configs';
const QUEUE_KEY = 'integration_message_queue';
const ALLOWED_TYPES = ['FHIR R4', 'HL7 v2', 'DICOMweb', 'REST API'];

function now() { return new Date().toISOString(); }
function normalizeConfig(item = {}) {
  return {
    id: item.id || uid('endpoint'), name: String(item.name || 'Bilinmeyen bağlantı'),
    type: ALLOWED_TYPES.includes(item.type) ? item.type : 'REST API',
    endpoint: String(item.endpoint || '').trim(), enabled: item.enabled !== false,
    lastTestAt: item.lastTestAt || null, lastTestStatus: item.lastTestStatus || 'unknown',
    lastError: String(item.lastError || ''), latencyMs: Number(item.latencyMs || 0),
  };
}
function normalizeMessage(item = {}) {
  return {
    id: item.id || uid('msg'), connectionId: String(item.connectionId || ''),
    resourceType: String(item.resourceType || 'Unknown'), direction: item.direction === 'outbound' ? 'outbound' : 'inbound',
    status: ['queued', 'sent', 'failed', 'dead_letter'].includes(item.status) ? item.status : 'queued',
    attempts: Number(item.attempts || 0), createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(), error: String(item.error || ''), payloadPreview: String(item.payloadPreview || ''),
  };
}
export async function loadGatewayState() {
  const [rawConfigs, rawQueue] = await Promise.all([
    readPlatform(CONFIG_KEY, []), readPlatform(QUEUE_KEY, seedQueue()),
  ]);
  return {
    configs: Array.isArray(rawConfigs) ? rawConfigs.map(normalizeConfig) : [],
    queue: Array.isArray(rawQueue) ? rawQueue.map(normalizeMessage) : seedQueue(),
  };
}
function seedQueue() {
  return [
    { id: 'msg_demo_1', connectionId: 'int_lis', resourceType: 'DiagnosticReport', direction: 'inbound', status: 'failed', attempts: 2, createdAt: now(), updatedAt: now(), error: 'Örnek hata: uç nokta yanıt vermedi', payloadPreview: 'HL7 ORU / DiagnosticReport' },
    { id: 'msg_demo_2', connectionId: 'int_hbys', resourceType: 'Practitioner', direction: 'outbound', status: 'queued', attempts: 0, createdAt: now(), updatedAt: now(), error: '', payloadPreview: 'FHIR R4 / Practitioner' },
  ].map(normalizeMessage);
}
export async function saveGatewayState(configs, queue) {
  await Promise.all([writePlatform(CONFIG_KEY, configs.map(normalizeConfig)), writePlatform(QUEUE_KEY, queue.map(normalizeMessage))]);
}
function validEndpoint(endpoint) {
  try { const url = new URL(endpoint); return url.protocol === 'https:'; } catch { return false; }
}
export function validatePayload(type, payload) {
  const text = String(payload || '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (type === 'FHIR R4') {
    try { const value = JSON.parse(text); return Boolean(value.resourceType) ? { ok: true, resourceType: value.resourceType } : { ok: false, reason: 'fhir_resource' }; } catch { return { ok: false, reason: 'fhir_json' }; }
  }
  if (type === 'HL7 v2') return /^MSH[|^]/.test(text) ? { ok: true, resourceType: 'HL7 message' } : { ok: false, reason: 'hl7_header' };
  if (type === 'DICOMweb') return /^https:\/\//.test(text) ? { ok: true, resourceType: 'DICOMweb request' } : { ok: false, reason: 'dicom_url' };
  return { ok: true, resourceType: 'REST request' };
}
export async function testEndpoint(config) {
  const endpoint = String(config?.endpoint || '').trim();
  if (!validEndpoint(endpoint)) throw new Error('https_required');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const started = performance.now();
  try {
    const response = await fetch(endpoint, { method: 'GET', headers: { Accept: 'application/fhir+json, application/json, text/plain' }, signal: controller.signal, credentials: 'omit', cache: 'no-store' });
    return { ok: response.ok, status: response.status, latencyMs: Math.round(performance.now() - started), detail: response.ok ? '' : `HTTP ${response.status}` };
  } finally { clearTimeout(timer); }
}
export function makeMessage({ connectionId, resourceType, direction, payloadPreview }) {
  return normalizeMessage({ id: uid('msg'), connectionId, resourceType, direction, payloadPreview, status: 'queued', attempts: 0 });
}
export function queueStats(queue = []) {
  return queue.reduce((acc, item) => { acc.total += 1; acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, { total: 0, queued: 0, sent: 0, failed: 0, dead_letter: 0 });
}
export function deduplicateQueue(queue = []) {
  const seen = new Set();
  let removed = 0;
  const unique = queue.filter((item) => {
    const key = `${item.connectionId}|${item.direction}|${item.resourceType}|${item.payloadPreview}`;
    if (!key.endsWith('|') && seen.has(key) && item.status !== 'sent') { removed += 1; return false; }
    seen.add(key);
    return true;
  });
  return { queue: unique, removed };
}
export function canRetry(item) { return item && ['failed', 'dead_letter'].includes(item.status) && Number(item.attempts || 0) < 5; }
export function markRetry(item) { return normalizeMessage({ ...item, status: 'queued', error: '', updatedAt: now() }); }
export function markSent(item) { return normalizeMessage({ ...item, status: 'sent', attempts: Number(item.attempts || 0) + 1, error: '', updatedAt: now() }); }
export function markFailed(item, error = 'Bağlantı yanıt vermedi') {
  const attempts = Number(item.attempts || 0) + 1;
  return normalizeMessage({ ...item, status: attempts >= 5 ? 'dead_letter' : 'failed', attempts, error, updatedAt: now() });
}
export { ALLOWED_TYPES };
