// ===== ÜRETİME HAZIRLIK VE VERİ YÖNETİMİ =====
import { getCurrentUser, exportAllDataFull } from '../state.js';
import { readSecure, writeSecure, migrateLegacyStorage, getSecureStatus, appendSecureAudit } from '../services/secure-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
const controls = ['kvkk', 'rbac', 'audit', 'backup', 'integration'];
const integrations = ['HBYS', 'LIS', 'RIS/PACS', 'HL7 v2', 'FHIR R4'];

export async function renderProductionReadinessPage(container) {
  const user = getCurrentUser();
  if (user?.role !== 'admin') {
    container.innerHTML = `<section class="card readiness-denied"><h1>${t('readiness.denied_title')}</h1><p>${t('readiness.denied_note')}</p></section>`;
    return;
  }
  container.innerHTML = `<div class="readiness-page fade-in"><header class="readiness-hero"><div><p class="readiness-kicker">${t('readiness.kicker')}</p><h1>${t('readiness.title')}</h1><p>${t('readiness.subtitle')}</p></div><span class="readiness-live">${t('readiness.local_mode')}</span></header><div id="readiness-body" class="space-y-4"><div class="card loading-pulse">${t('readiness.loading')}</div></div></div>`;
  await renderBody(container.querySelector('#readiness-body'));
}

async function renderBody(root) {
  try {
    const [status, saved] = await Promise.all([getSecureStatus(), readSecure('compliance_controls', {})]);
    const checked = controls.filter(key => saved[key] !== false).length;
    const score = Math.round((checked / controls.length) * 100);
    const migration = status.migration;
    root.innerHTML = `<section class="readiness-kpis"><article><span>${t('readiness.score')}</span><strong>${score}%</strong><small>${t('readiness.score_note')}</small></article><article><span>${t('readiness.platform_storage')}</span><strong class="${status.sdkReady ? 'good' : 'warn'}">${status.sdkReady ? t('readiness.ready') : t('readiness.fallback')}</strong><small>${t('readiness.storage_note')}</small></article><article><span>${t('readiness.legacy_records')}</span><strong>${status.legacyCount}</strong><small>${migration ? t('readiness.migrated', { count: migration.migrated }) : t('readiness.not_migrated')}</small></article><article><span>${t('readiness.audit_records')}</span><strong>${(await readSecure('audit_log', [])).length}</strong><small>${t('readiness.audit_note')}</small></article></section><div class="grid lg:grid-cols-2 gap-4"><section class="card readiness-panel"><div class="panel-heading"><div><p class="readiness-kicker">${t('readiness.controls_kicker')}</p><h2>${t('readiness.controls_title')}</h2></div><span class="readiness-count">${checked}/${controls.length}</span></div><div class="readiness-checks">${controls.map(key => `<label><input type="checkbox" data-control="${key}" ${saved[key] !== false ? 'checked' : ''}><span><b>${t(`readiness.controls.${key}`)}</b><small>${t(`readiness.controls.${key}_note`)}</small></span></label>`).join('')}</div><button id="save-controls" class="btn-primary">${t('readiness.save_controls')}</button></section><section class="card readiness-panel"><div class="panel-heading"><div><p class="readiness-kicker">${t('readiness.storage_kicker')}</p><h2>${t('readiness.storage_title')}</h2></div><span class="readiness-badge">${t('readiness.protected')}</span></div><p class="readiness-copy">${t('readiness.storage_copy')}</p><div class="readiness-actions"><button id="migrate-storage" class="btn-primary">${t('readiness.migrate')}</button><button id="download-backup" class="btn-secondary">${t('readiness.download_backup')}</button></div><p id="readiness-notice" class="readiness-notice" role="status"></p></section></div><section class="card readiness-panel"><div class="panel-heading"><div><p class="readiness-kicker">${t('readiness.integration_kicker')}</p><h2>${t('readiness.integration_title')}</h2></div><span class="readiness-badge">${t('readiness.integration_plan')}</span></div><div class="integration-roadmap">${integrations.map((name, index) => `<div><span>${index + 1}</span><b>${name}</b><small>${t(index < 2 ? 'readiness.integration_priority' : 'readiness.integration_ready')}</small></div>`).join('')}</div></section></div>`;
    bind(root, saved);
  } catch {
    root.innerHTML = `<section class="card readiness-error">${t('readiness.error')}</section>`;
  }
}

function bind(root, saved) {
  root.querySelector('#save-controls')?.addEventListener('click', async () => {
    const next = { ...saved };
    root.querySelectorAll('[data-control]').forEach(input => { next[input.dataset.control] = input.checked; });
    const ok = await writeSecure('compliance_controls', next);
    await appendSecureAudit({ action: 'compliance_controls_update', user: getCurrentUser()?.username || 'system' });
    showToast(ok ? t('readiness.controls_saved') : t('readiness.save_error'), ok ? 'success' : 'error');
    await renderBody(root);
  });
  root.querySelector('#migrate-storage')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = t('readiness.migrating');
    const result = await migrateLegacyStorage();
    await appendSecureAudit({ action: 'legacy_storage_migration', user: getCurrentUser()?.username || 'system', count: result.migrated });
    showToast(t('readiness.migration_done', { count: result.migrated }), 'success');
    await renderBody(root);
  });
  root.querySelector('#download-backup')?.addEventListener('click', async () => {
    try {
      const payload = { ...exportAllDataFull(), backupType: 'production-readiness', generatedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `hastane-pys-yedek-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href);
      await appendSecureAudit({ action: 'secure_backup_export', user: getCurrentUser()?.username || 'system' });
      showToast(t('readiness.backup_done'), 'success');
    } catch { showToast(t('readiness.backup_error'), 'error'); }
  });
}
