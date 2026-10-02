// ===== GERÇEK E-İMZA / TSA SAĞLAYICI ADAPTÖRÜ =====
// Sağlayıcıya ait erişim belirteci yalnızca işlem süresince bellekte tutulur.
const encoder = new TextEncoder();

function endpointOf(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:') throw new Error('https_required');
    return url.toString();
  } catch (error) {
    if (error?.message === 'https_required') throw error;
    throw new Error('https_required');
  }
}

async function hash(value) {
  if (!window.crypto?.subtle) throw new Error('secure_crypto_unavailable');
  const buffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function authHeaders(token) {
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (String(token || '').trim()) headers.Authorization = `Bearer ${String(token).trim()}`;
  return headers;
}

async function request(endpoint, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(endpointOf(endpoint), { ...options, signal: controller.signal, credentials: 'omit', cache: 'no-store' });
    const raw = await response.text();
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch { body = { raw: raw.slice(0, 500) }; }
    if (!response.ok) {
      const error = new Error('provider_http_error');
      error.status = response.status;
      error.detail = body?.message || body?.error || `HTTP ${response.status}`;
      throw error;
    }
    return body || {};
  } finally { clearTimeout(timer); }
}

function accepted(body, kind) {
  const status = String(body?.status || body?.state || '').toLowerCase();
  const acceptedStatus = ['ok', 'success', 'accepted', 'signed', 'timestamped', 'completed'].includes(status);
  return Boolean(body?.ok === true || acceptedStatus || (kind === 'signature' && (body?.signatureId || body?.signature || body?.signedDocument)) || (kind === 'timestamp' && (body?.timestampToken || body?.token || body?.timestamp)));
}

export async function testProviderEndpoint(endpoint, token = '') {
  const started = performance.now();
  const body = await request(endpoint, { method: 'GET', headers: authHeaders(token) });
  return { ok: true, latencyMs: Math.round(performance.now() - started), detail: body?.service || body?.message || 'Sağlayıcı yanıt verdi.' };
}

export async function requestRemoteSignature(document, config, token = '') {
  const endpoint = config?.signingEndpoint || config?.endpoint;
  if (!endpoint) throw new Error('signing_endpoint_required');
  const documentHash = await hash(JSON.stringify({ id: document.id, title: document.title, type: document.type, owner: document.owner, createdAt: document.createdAt }));
  const body = await request(endpoint, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ operation: 'sign', document: { id: document.id, title: document.title, type: document.type, owner: document.owner, createdAt: document.createdAt }, digest: documentHash, digestAlgorithm: 'SHA-256', requestedAt: new Date().toISOString() }),
  });
  if (!accepted(body, 'signature')) throw new Error('provider_signature_rejected');
  return { provider: config.provider || 'configured_provider', response: body, signatureId: body.signatureId || body.id || null, signedAt: body.signedAt || body.completedAt || new Date().toISOString(), certificateSerial: body.certificateSerial || body.certificate?.serialNumber || '', algorithm: body.algorithm || 'provider_defined' };
}

export async function requestRemoteTimestamp(document, config, token = '') {
  const endpoint = config?.timestampEndpoint || config?.endpoint;
  if (!endpoint) throw new Error('timestamp_endpoint_required');
  const body = await request(endpoint, {
    method: 'POST', headers: authHeaders(token),
    body: JSON.stringify({ operation: 'timestamp', documentId: document.id, signatureId: document.signingReceipt?.signatureId || null, digest: document.integrityHash, digestAlgorithm: 'SHA-256', requestedAt: new Date().toISOString() }),
  });
  if (!accepted(body, 'timestamp')) throw new Error('provider_timestamp_rejected');
  return { authority: config.provider || 'configured_tsa_provider', status: 'provider_recorded', tokenId: body.timestampToken || body.token || body.id || null, at: body.timestamp || body.timestampedAt || body.completedAt || new Date().toISOString(), response: body };
}

export function providerErrorKey(error) {
  if (error?.name === 'AbortError') return 'error_provider_timeout';
  if (error?.message === 'https_required') return 'error_https_required';
  if (error?.message === 'secure_crypto_unavailable') return 'error_secure_crypto_unavailable';
  if (error?.message === 'signing_endpoint_required') return 'error_signing_endpoint_required';
  if (error?.message === 'timestamp_endpoint_required') return 'error_timestamp_endpoint_required';
  if (error?.message === 'provider_signature_rejected') return 'error_provider_signature_rejected';
  if (error?.message === 'provider_timestamp_rejected') return 'error_provider_timestamp_rejected';
  if (error?.message === 'provider_http_error') return 'error_provider_http';
  return 'generic_error';
}
