// ===== ŞİFRELİ YEDEK KASASI =====
import { exportAllData } from '../state.js';
import { getCentral, setCentral } from './central-storage-bridge.js';
import { appendEnterpriseAudit } from './enterprise-storage.js';

const RECORDS_KEY = 'backup_vault_records';
const POLICY_KEY = 'backup_recovery_policy';
const ITERATIONS = 120000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function requireCrypto() {
  if (!window.crypto?.subtle || !window.crypto.getRandomValues) throw new Error('secure_crypto_unavailable');
}
function bytesToBase64(bytes) { let binary = ''; bytes.forEach(byte => { binary += String.fromCharCode(byte); }); return btoa(binary); }
function base64ToBytes(value) { const binary = atob(value); return Uint8Array.from(binary, char => char.charCodeAt(0)); }
function randomBytes(size) { const bytes = new Uint8Array(size); window.crypto.getRandomValues(bytes); return bytes; }
async function digest(text) {
  requireCrypto();
  const hash = await window.crypto.subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function deriveKey(passphrase, salt) {
  const material = await window.crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return window.crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
function validatePassphrase(passphrase) { return typeof passphrase === 'string' && passphrase.trim().length >= 12; }

export function getPassphraseHint(passphrase) {
  const value = String(passphrase || '');
  if (!value) return 'empty';
  if (value.length < 12) return 'weak';
  return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value) ? 'strong' : 'medium';
}

export async function createEncryptedBackup(passphrase, actor = 'system') {
  requireCrypto();
  if (!validatePassphrase(passphrase)) throw new Error('passphrase_too_short');
  const data = exportAllData();
  const plaintext = JSON.stringify({ schema: 'hospital-pys-backup-v2', exportedAt: new Date().toISOString(), data });
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const key = await deriveKey(passphrase, salt);
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  const record = { schema: 'hospital-pys-encrypted-backup-v2', id: `vault_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), actor: String(actor || 'system'), algorithm: 'AES-256-GCM', kdf: 'PBKDF2-SHA-256', iterations: ITERATIONS, salt: bytesToBase64(salt), iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(encrypted)), checksum: await digest(plaintext), counts: { personnel: data.personnel?.length || 0, schedules: data.schedules?.length || 0, attendance: data.attendance?.length || 0 } };
  const records = await listBackupRecords();
  records.unshift(record);
  const policy = await readRecoveryPolicy();
  const cutoff = Date.now() - Number(policy.retention || 30) * 86400000;
  const retained = records.filter(item => new Date(item.createdAt).getTime() >= cutoff).slice(0, 12);
  if (!await setCentral(RECORDS_KEY, retained)) throw new Error('backup_storage_failed');
  await appendEnterpriseAudit({ action: 'encrypted_backup_created', actor, resource: record.id, after: { checksum: record.checksum, counts: record.counts } });
  return record;
}

export async function decryptBackup(record, passphrase) {
  requireCrypto();
  if (!record?.ciphertext || !validatePassphrase(passphrase)) throw new Error('invalid_backup_or_passphrase');
  try {
    const key = await deriveKey(passphrase, base64ToBytes(record.salt));
    const plainBuffer = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: base64ToBytes(record.iv) }, key, base64ToBytes(record.ciphertext));
    const plaintext = decoder.decode(plainBuffer);
    if (await digest(plaintext) !== record.checksum) throw new Error('backup_integrity_failed');
    const envelope = JSON.parse(plaintext);
    if (envelope.schema !== 'hospital-pys-backup-v2' || !envelope.data?.version) throw new Error('invalid_backup_schema');
    return envelope.data;
  } catch (error) {
    if (error?.message === 'backup_integrity_failed' || error?.message === 'invalid_backup_schema') throw error;
    throw new Error('invalid_backup_or_passphrase');
  }
}

export async function listBackupRecords() {
  const value = await getCentral(RECORDS_KEY, []);
  return Array.isArray(value) ? value.filter(record => record?.schema === 'hospital-pys-encrypted-backup-v2') : [];
}
export async function deleteBackupRecord(id) {
  const records = await listBackupRecords();
  await setCentral(RECORDS_KEY, records.filter(record => record.id !== id));
  await appendEnterpriseAudit({ action: 'encrypted_backup_deleted', actor: window.__enterpriseActor || 'system', resource: id });
}
export async function saveRecoveryPolicy(policy) {
  const next = { interval: '6h', retention: 30, updatedAt: new Date().toISOString(), ...policy };
  if (!await setCentral(POLICY_KEY, next)) throw new Error('backup_storage_failed');
  await appendEnterpriseAudit({ action: 'backup_policy_changed', actor: window.__enterpriseActor || 'system', resource: POLICY_KEY, after: next });
  return next;
}
export async function readRecoveryPolicy() { return getCentral(POLICY_KEY, { interval: '6h', retention: 30, updatedAt: null, lastTest: null }); }
export async function recordRecoveryTest(result) { const policy = await readRecoveryPolicy(); const next = { ...policy, lastTest: { ...result, at: new Date().toISOString() } }; if (!await setCentral(POLICY_KEY, next)) throw new Error('backup_storage_failed'); return next.lastTest; }
export async function auditBackupAction(action, resource, after = null) { return appendEnterpriseAudit({ action, actor: window.__enterpriseActor || 'system', resource, after }); }

export function downloadBackupRecord(record) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-pys-sifreli-yedek-${String(record.createdAt).slice(0, 10)}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
