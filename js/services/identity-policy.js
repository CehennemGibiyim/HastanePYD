// ===== KİMLİK, FEDERASYON VE ABAC POLİTİKASI =====
import { readPlatform, writePlatform, uid } from './platform-storage.js';

const KEY = 'identity_policy';
const AUDIT_KEY = 'identity_audit';

const DEFAULT_CONFIG = {
  federation: { provider: 'OIDC', issuer: '', clientId: '', status: 'not_configured', lastCheck: null },
  mfa: { enforcedRoles: ['admin', 'supervisor'], methods: ['TOTP'], graceDays: 0 },
  session: { idleMinutes: 30, maxHours: 12, reauthSensitive: true },
  abacRules: [
    { id: 'abac-clinical', effect: 'allow', role: 'admin', action: 'read', resource: 'clinical', department: '*', reason: 'Yönetici klinik veriyi inceleyebilir' },
    { id: 'abac-supervisor', effect: 'allow', role: 'supervisor', action: 'write', resource: 'workforce', department: 'own', reason: 'Birim yöneticisi kendi birimini yönetebilir' },
    { id: 'abac-viewer', effect: 'allow', role: 'viewer', action: 'read', resource: 'workforce', department: '*', reason: 'Salt okunur iş gücü görünümü' },
    { id: 'abac-sensitive', effect: 'deny', role: '*', action: 'export', resource: 'sensitive', department: '*', reason: 'Hassas dışa aktarma ayrıca onaylanır' },
  ],
};

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function normalize(value) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    federation: { ...DEFAULT_CONFIG.federation, ...(source.federation || {}) },
    mfa: { ...DEFAULT_CONFIG.mfa, ...(source.mfa || {}) },
    session: { ...DEFAULT_CONFIG.session, ...(source.session || {}) },
    abacRules: Array.isArray(source.abacRules) && source.abacRules.length ? source.abacRules : clone(DEFAULT_CONFIG.abacRules),
  };
}

export async function readIdentityPolicy() { return normalize(await readPlatform(KEY, DEFAULT_CONFIG)); }
export async function writeIdentityPolicy(config, actor = 'system') {
  const next = normalize(config);
  await writePlatform(KEY, next);
  await appendIdentityAudit({ action: 'policy_updated', actor, detail: 'Kimlik ve erişim politikası güncellendi' });
  return next;
}
export async function appendIdentityAudit(entry) {
  const logs = await readPlatform(AUDIT_KEY, []);
  const next = [{ id: uid('identity'), at: new Date().toISOString(), ...entry }, ...(Array.isArray(logs) ? logs : [])];
  await writePlatform(AUDIT_KEY, next.slice(0, 200));
  return next[0];
}
export async function markFederationCheck(config, actor = 'system') {
  const next = normalize(config);
  next.federation = { ...next.federation, lastCheck: new Date().toISOString(), status: next.federation.issuer && next.federation.clientId ? 'configured' : 'not_configured' };
  await writePlatform(KEY, next);
  await appendIdentityAudit({ action: 'federation_config_checked', actor, detail: next.federation.status === 'configured' ? 'Yerel yapılandırma tamam' : 'Issuer ve client ID bekleniyor' });
  return next;
}
export function evaluateAccess(config, request) {
  const policy = normalize(config);
  const input = { role: '*', action: 'read', resource: 'workforce', department: '*', ...request };
  const matches = policy.abacRules.filter(rule =>
    (rule.role === '*' || rule.role === input.role) &&
    (rule.action === '*' || rule.action === input.action) &&
    (rule.resource === '*' || rule.resource === input.resource) &&
    (rule.department === '*' || rule.department === input.department || (rule.department === 'own' && input.sameDepartment))
  );
  const decision = matches.find(rule => rule.effect === 'deny') || matches.find(rule => rule.effect === 'allow');
  return { allowed: decision?.effect === 'allow', matchedRule: decision || null, matches };
}
export function getIdentityReadiness(config) {
  const policy = normalize(config);
  const checks = [
    { id: 'federation', ok: policy.federation.status === 'configured', label: 'SSO sağlayıcı yapılandırması' },
    { id: 'mfa', ok: policy.mfa.enforcedRoles.length > 0 && policy.mfa.methods.length > 0, label: 'MFA zorunluluk politikası' },
    { id: 'session', ok: policy.session.idleMinutes > 0 && policy.session.maxHours > 0, label: 'Oturum süre politikası' },
    { id: 'abac', ok: policy.abacRules.length > 0, label: 'ABAC kural matrisi' },
  ];
  return { checks, score: Math.round(checks.filter(item => item.ok).length / checks.length * 100) };
}
export { DEFAULT_CONFIG };
