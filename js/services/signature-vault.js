// ===== İMZA VE ZAMAN DAMGASI KASASI =====
import { getCentral, setCentral } from './central-storage-bridge.js';
import { appendEnterpriseAudit, uid } from './enterprise-storage.js';

const DOCS_KEY = 'signature_center_documents';
const CONFIG_KEY = 'signature_center_config';
const encoder = new TextEncoder();

const seedDocuments = [
  { id: 'sig_seed_1', title: 'Personel Sözleşmesi - Dr. Ahmet Yılmaz', type: 'Personel sözleşmesi', owner: 'İnsan Kaynakları', status: 'pending', createdAt: '2025-01-18T08:30:00.000Z', signedAt: null, timestamp: null, integrityHash: null },
  { id: 'sig_seed_2', title: 'İş Sağlığı ve Güvenliği Yıllık Raporu', type: 'Uyum raporu', owner: 'İSG Birimi', status: 'signed', createdAt: '2025-01-12T10:15:00.000Z', signedAt: '2025-01-13T14:20:00.000Z', timestamp: { at: '2025-01-13T14:20:04.000Z', authority: 'Uygulama doğrulama saati', status: 'local_recorded' }, integrityHash: 'seed-integrity-record' },
];

async function digest(value) {
  if (!window.crypto?.subtle) throw new Error('secure_crypto_unavailable');
  const buffer = await window.crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function documentHash(doc) {
  return digest(JSON.stringify({ id: doc.id, title: doc.title, type: doc.type, owner: doc.owner, createdAt: doc.createdAt, signedAt: doc.signedAt }));
}

export async function listSignatureDocuments() {
  const records = await getCentral(DOCS_KEY, null);
  if (Array.isArray(records)) return records;
  await setCentral(DOCS_KEY, seedDocuments);
  return seedDocuments;
}

export async function createSignatureDocument(input, actor = 'system') {
  const title = String(input?.title || '').trim();
  const type = String(input?.type || '').trim();
  const owner = String(input?.owner || '').trim();
  if (!title || !type || !owner) throw new Error('signature_required_fields');
  const documents = await listSignatureDocuments();
  const record = { id: uid('signature'), title, type, owner, status: 'pending', createdAt: new Date().toISOString(), signedAt: null, timestamp: null, integrityHash: null };
  await setCentral(DOCS_KEY, [record, ...documents]);
  await appendEnterpriseAudit({ action: 'signature_document_created', actor, resource: record.id, after: { title, type, owner } });
  return record;
}

export async function signSignatureDocument(id, actor = 'system', receipt = null) {
  const documents = await listSignatureDocuments();
  const record = documents.find(item => item.id === id);
  if (!record) throw new Error('signature_document_not_found');
  if (record.status === 'signed') return record;
  record.status = 'signed';
  record.signedAt = receipt?.signedAt || new Date().toISOString();
  record.integrityHash = await documentHash(record);
  record.signingProfile = receipt?.provider ? `Harici sağlayıcı: ${receipt.provider}` : 'Kurumsal imza profili';
  if (receipt) record.signingReceipt = { provider: receipt.provider, signatureId: receipt.signatureId || null, certificateSerial: receipt.certificateSerial || '', algorithm: receipt.algorithm || 'provider_defined', receivedAt: new Date().toISOString() };
  await setCentral(DOCS_KEY, documents);
  await appendEnterpriseAudit({ action: 'signature_document_signed', actor, resource: id, after: { integrityHash: record.integrityHash, algorithm: 'SHA-256' } });
  return record;
}

export async function timestampSignatureDocument(id, actor = 'system', receipt = null) {
  const documents = await listSignatureDocuments();
  const record = documents.find(item => item.id === id);
  if (!record) throw new Error('signature_document_not_found');
  if (record.status !== 'signed') throw new Error('signature_required_first');
  record.timestamp = receipt ? { at: receipt.at || new Date().toISOString(), authority: receipt.authority, status: 'provider_recorded', tokenId: receipt.tokenId || null } : { at: new Date().toISOString(), authority: 'Uygulama doğrulama saati', status: 'local_recorded', providerState: 'tsa_provider_pending' };
  await setCentral(DOCS_KEY, documents);
  await appendEnterpriseAudit({ action: 'signature_timestamp_added', actor, resource: id, after: record.timestamp });
  return record;
}

export async function verifySignatureDocument(id) {
  const documents = await listSignatureDocuments();
  const record = documents.find(item => item.id === id);
  if (!record) throw new Error('signature_document_not_found');
  if (!record.integrityHash || record.integrityHash === 'seed-integrity-record') return { valid: record.status === 'signed', reason: 'seed_record' };
  return { valid: record.integrityHash === await documentHash(record), reason: record.integrityHash === await documentHash(record) ? 'integrity_ok' : 'integrity_failed' };
}

export async function readSignatureConfig() { return getCentral(CONFIG_KEY, { provider: '', endpoint: '', signingEndpoint: '', timestampEndpoint: '', certificateExpiry: '', authMode: 'bearer', lastTest: null }); }
export async function saveSignatureConfig(config, actor = 'system') {
  const next = { provider: String(config?.provider || '').trim(), endpoint: String(config?.endpoint || config?.signingEndpoint || '').trim(), signingEndpoint: String(config?.signingEndpoint || config?.endpoint || '').trim(), timestampEndpoint: String(config?.timestampEndpoint || config?.endpoint || '').trim(), certificateExpiry: String(config?.certificateExpiry || '').trim(), authMode: config?.authMode === 'none' ? 'none' : 'bearer', lastTest: config?.lastTest || null, updatedAt: new Date().toISOString() };
  await setCentral(CONFIG_KEY, next);
  await appendEnterpriseAudit({ action: 'signature_provider_configured', actor, resource: CONFIG_KEY, after: { provider: next.provider, endpoint: next.endpoint, certificateExpiry: next.certificateExpiry } });
  return next;
}

export async function exportSignatureEvidence(documents, config) {
  const payload = { schema: 'hospital-pys-signature-evidence-v1', exportedAt: new Date().toISOString(), provider: config?.provider || 'not_configured', documents };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `hastane-pys-imza-kaniti-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  await appendEnterpriseAudit({ action: 'signature_evidence_exported', actor: window.__enterpriseActor || 'system', resource: 'signature_evidence' });
}
