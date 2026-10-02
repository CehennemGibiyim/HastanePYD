// ===== KİMLİK VE ERİŞİM MERKEZİ =====
import { getCurrentUser, getDepartments, ROLES } from '../state.js';
import { showToast } from '../notifications.js';
import { esc } from '../services/platform-storage.js';
import { readIdentityPolicy, writeIdentityPolicy, markFederationCheck, evaluateAccess, getIdentityReadiness } from '../services/identity-policy.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const roleOptions = ['admin', 'supervisor', 'viewer'];
const resourceOptions = ['workforce', 'clinical', 'sensitive'];
const actionOptions = ['read', 'write', 'export'];

export async function renderIdentityCenterPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('identity.loading')}</div>`;
  const policy = await readIdentityPolicy();
  const current = getCurrentUser() || {};
  const readiness = getIdentityReadiness(policy);
  const admin = current.role === 'admin';
  container.innerHTML = `<div class="identity-page fade-in">
    <header class="identity-hero"><div><p class="identity-kicker">${t('identity.eyebrow')}</p><h1>${t('identity.title')}</h1><p>${t('identity.subtitle')}</p></div><div class="identity-score"><strong>${readiness.score}%</strong><span>${t('identity.readiness')}</span></div></header>
    <div class="identity-warning"><strong>${t('identity.boundary_title')}</strong><span>${t('identity.boundary_text')}</span></div>
    <section class="identity-grid">
      <article class="card identity-panel"><div class="identity-panel-head"><div><p class="identity-kicker">${t('identity.sso_eyebrow')}</p><h2>${t('identity.sso_title')}</h2><p>${t('identity.sso_note')}</p></div><span class="identity-status status-${esc(policy.federation.status)}">${t(`identity.status_${policy.federation.status}`)}</span></div><div class="identity-form-grid"><label>${t('identity.provider')}<select id="identity-provider" class="input-field" ${admin ? '' : 'disabled'}><option>OIDC</option><option>SAML 2.0</option><option>LDAP</option></select></label><label>${t('identity.issuer')}<input id="identity-issuer" class="input-field" value="${esc(policy.federation.issuer)}" placeholder="${t('identity.issuer_placeholder')}" ${admin ? '' : 'disabled'}></label><label>${t('identity.client_id')}<input id="identity-client" class="input-field" value="${esc(policy.federation.clientId)}" placeholder="${t('identity.client_placeholder')}" ${admin ? '' : 'disabled'}></label></div><div class="identity-actions"><button id="identity-save-sso" class="btn-primary" ${admin ? '' : 'disabled'}>${t('identity.save_sso')}</button><button id="identity-check-sso" class="btn-secondary" ${admin ? '' : 'disabled'}>${t('identity.check_sso')}</button></div><small class="identity-help">${policy.federation.lastCheck ? `${t('identity.last_check')}: ${new Date(policy.federation.lastCheck).toLocaleString('tr-TR')}` : t('identity.not_checked')}</small></article>
      <article class="card identity-panel"><div class="identity-panel-head"><div><p class="identity-kicker">${t('identity.mfa_eyebrow')}</p><h2>${t('identity.mfa_title')}</h2><p>${t('identity.mfa_note')}</p></div><span class="identity-status status-configured">${policy.mfa.enforcedRoles.length} ${t('identity.roles')}</span></div><div class="identity-check-list">${roleOptions.map(role => `<label><span><strong>${t(`identity.role_label_${role}`)}</strong><small>${t(`identity.role_${role}`)}</small></span><input type="checkbox" data-mfa-role="${role}" ${policy.mfa.enforcedRoles.includes(role) ? 'checked' : ''} ${admin ? '' : 'disabled'}></label>`).join('')}</div><div class="identity-methods"><span>${t('identity.methods')}</span><b>${policy.mfa.methods.map(esc).join(' · ')}</b></div><div class="identity-session"><label>${t('identity.idle_minutes')}<input id="identity-idle" type="number" min="5" max="240" class="input-field" value="${Number(policy.session.idleMinutes) || 30}" ${admin ? '' : 'disabled'}></label><label>${t('identity.max_hours')}<input id="identity-max" type="number" min="1" max="72" class="input-field" value="${Number(policy.session.maxHours) || 12}" ${admin ? '' : 'disabled'}></label></div><button id="identity-save-mfa" class="btn-primary w-full" ${admin ? '' : 'disabled'}>${t('identity.save_mfa')}</button></article>
    </section>
    <section class="identity-grid lower"><article class="card identity-panel"><div class="identity-panel-head"><div><p class="identity-kicker">${t('identity.abac_eyebrow')}</p><h2>${t('identity.abac_title')}</h2><p>${t('identity.abac_note')}</p></div><span class="identity-status status-configured">${policy.abacRules.length} ${t('identity.rules')}</span></div><div class="identity-rules">${policy.abacRules.map(rule => `<div class="identity-rule ${rule.effect === 'deny' ? 'is-deny' : ''}"><span class="rule-effect">${t(`identity.effect_${rule.effect}`)}</span><div><strong>${ruleLabel('role', rule.role)} · ${ruleLabel('action', rule.action)} · ${ruleLabel('resource', rule.resource)}</strong><small>${esc(rule.reason)}</small></div><code>${ruleLabel('department', rule.department)}</code></div>`).join('')}</div></article><article class="card identity-panel"><div class="identity-panel-head"><div><p class="identity-kicker">${t('identity.test_eyebrow')}</p><h2>${t('identity.test_title')}</h2><p>${t('identity.test_note')}</p></div></div><div class="identity-form-grid"><label>${t('identity.test_role')}<select id="policy-role" class="input-field">${roleOptions.map(role => `<option value="${role}">${t(`identity.role_label_${role}`)}</option>`).join('')}</select></label><label>${t('identity.test_department')}<select id="policy-department" class="input-field">${getDepartments().map(dept => `<option>${esc(dept)}</option>`).join('')}</select></label><label>${t('identity.test_action')}<select id="policy-action" class="input-field">${actionOptions.map(item => `<option value="${item}">${t(`identity.action_${item}`)}</option>`).join('')}</select></label><label>${t('identity.test_resource')}<select id="policy-resource" class="input-field">${resourceOptions.map(item => `<option value="${item}">${t(`identity.resource_${item}`)}</option>`).join('')}</select></label></div><label class="identity-own"><input id="policy-own" type="checkbox">${t('identity.same_department')}</label><button id="policy-test" class="btn-primary w-full">${t('identity.test_button')}</button><div id="policy-result" class="identity-result" aria-live="polite">${t('identity.test_empty')}</div></article></section>
    <div class="identity-checks">${readiness.checks.map(check => `<div class="identity-check ${check.ok ? 'is-ok' : 'is-pending'}"><b>${check.ok ? '✓' : '!'}</b><span>${t(`identity.check_${check.id}`)}</span></div>`).join('')}</div>
  </div>`;
  bind(container, policy, current, admin);
}

function bind(container, policy, current, admin) {
  container.querySelector('#identity-provider').value = policy.federation.provider;
  container.querySelector('#identity-save-sso')?.addEventListener('click', async () => {
    policy.federation = { ...policy.federation, provider: container.querySelector('#identity-provider').value, issuer: container.querySelector('#identity-issuer').value.trim(), clientId: container.querySelector('#identity-client').value.trim(), status: 'not_configured' };
    try { await writeIdentityPolicy(policy, current.username || 'system'); showToast(t('identity.saved'), 'success'); renderIdentityCenterPage(container); } catch { showToast(t('identity.save_error'), 'error'); }
  });
  container.querySelector('#identity-check-sso')?.addEventListener('click', async () => {
    try { await markFederationCheck(policy, current.username || 'system'); showToast(t('identity.checked'), 'success'); renderIdentityCenterPage(container); } catch { showToast(t('identity.save_error'), 'error'); }
  });
  container.querySelector('#identity-save-mfa')?.addEventListener('click', async () => {
    policy.mfa.enforcedRoles = [...container.querySelectorAll('[data-mfa-role]:checked')].map(input => input.dataset.mfaRole);
    policy.session.idleMinutes = Math.max(5, Number(container.querySelector('#identity-idle').value) || 30);
    policy.session.maxHours = Math.max(1, Number(container.querySelector('#identity-max').value) || 12);
    try { await writeIdentityPolicy(policy, current.username || 'system'); showToast(t('identity.saved'), 'success'); renderIdentityCenterPage(container); } catch { showToast(t('identity.save_error'), 'error'); }
  });
  container.querySelector('#policy-test')?.addEventListener('click', () => {
    const role = container.querySelector('#policy-role').value;
    const department = container.querySelector('#policy-department').value;
    const result = evaluateAccess(policy, { role, department, action: container.querySelector('#policy-action').value, resource: container.querySelector('#policy-resource').value, sameDepartment: container.querySelector('#policy-own').checked });
    const target = container.querySelector('#policy-result');
    target.className = `identity-result ${result.allowed ? 'is-allowed' : 'is-denied'}`;
    target.textContent = result.allowed ? `${t('identity.allowed')} · ${result.matchedRule?.reason || ''}` : `${t('identity.denied')} · ${result.matchedRule?.reason || t('identity.no_rule')}`;
  });
}

function ruleLabel(kind, value) {
  if (value === '*') return t('identity.any');
  if (value === 'own') return t('identity.own_department');
  return t(`identity.${kind === 'role' ? 'role_label' : kind}_${value}`);
}
