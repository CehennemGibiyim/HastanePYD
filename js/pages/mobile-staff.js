// ===== MOBİL ÇALIŞAN MERKEZİ =====
import { getCurrentUser, getPersonnel, getTodaySchedules } from '../state.js';
import { readPlatform, writePlatform, uid, today, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;

export async function renderMobileStaffPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('mobile.loading')}</div>`;
  const [attendance, incidents] = await Promise.all([
    readPlatform('mobile_attendance', {}),
    readPlatform('mobile_incidents', []),
  ]);
  const user = getCurrentUser() || {};
  const person = getPersonnel({ status: 'active' }).find(item => `${item.name} ${item.surname}`.includes(user.name || '')) || getPersonnel({ status: 'active' })[0];
  const shifts = getTodaySchedules();
  const checkedIn = attendance.date === today() && attendance.checkedIn;
  const displayName = person ? `${person.name} ${person.surname}` : user.name || t('mobile.unknown_user');
  const online = navigator.onLine !== false;
  container.innerHTML = `<div class="mobile-staff-page fade-in space-y-5">
    <header class="mobile-staff-hero"><div><p class="command-kicker">${t('mobile.eyebrow')}</p><h1>${t('mobile.title')}</h1><p>${t('mobile.subtitle')}</p></div><div class="mobile-connectivity ${online ? 'is-online' : 'is-offline'}"><span></span>${online ? t('mobile.online') : t('mobile.offline')}</div></header>
    <section class="mobile-welcome"><div><span>${t('mobile.welcome')}</span><strong>${esc(displayName)}</strong><small>${esc(person?.department || t('mobile.no_department'))} · ${esc(person?.title || t('mobile.no_title'))}</small></div><div class="mobile-date">${new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div></section>
    <section class="mobile-actions"><button class="mobile-action primary" id="mobile-checkin"><span class="action-symbol">${checkedIn ? '✓' : '↗'}</span><strong>${checkedIn ? t('mobile.checked_in') : t('mobile.check_in')}</strong><small>${checkedIn ? t('mobile.checked_in_detail') : t('mobile.check_in_detail')}</small></button><button class="mobile-action" id="mobile-swap"><span class="action-symbol">⇄</span><strong>${t('mobile.swap')}</strong><small>${t('mobile.swap_detail')}</small></button><button class="mobile-action" id="mobile-report"><span class="action-symbol">!</span><strong>${t('mobile.report')}</strong><small>${t('mobile.report_detail')}</small></button><button class="mobile-action danger" id="mobile-emergency"><span class="action-symbol">SOS</span><strong>${t('mobile.emergency')}</strong><small>${t('mobile.emergency_detail')}</small></button></section>
    <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-5"><section class="card mobile-panel"><div class="section-heading"><div><p class="section-kicker">${t('mobile.shift_area')}</p><h2>${t('mobile.today_shift')}</h2></div><span class="badge">${shifts.length} ${t('mobile.shift_count')}</span></div><div class="mobile-shifts">${shifts.length ? shifts.slice(0, 4).map(shiftCard).join('') : `<div class="empty-state py-5"><div class="title">${t('mobile.no_shift')}</div><p>${t('mobile.no_shift_detail')}</p></div>`}</div></section><section class="card mobile-panel"><div class="section-heading"><div><p class="section-kicker">${t('mobile.offline_area')}</p><h2>${t('mobile.offline_title')}</h2></div><span class="mobile-sync-dot ${online ? 'is-online' : 'is-offline'}"></span></div><div class="mobile-offline-list"><div><strong>${t('mobile.queue_title')}</strong><small>${incidents.filter(item => item.state === 'queued').length} ${t('mobile.queue_count')}</small></div><div><strong>${t('mobile.cache_title')}</strong><small>${t('mobile.cache_ready')}</small></div><div><strong>${t('mobile.privacy_title')}</strong><small>${t('mobile.privacy_detail')}</small></div></div></section></div><section id="mobile-report-panel"></section>
  </div>`;
  bind(container, attendance, incidents);
}

function shiftCard(item) { const start = item.start || item.startTime || item.begin || '—'; const end = item.end || item.endTime || item.finish || '—'; return `<div class="mobile-shift"><div class="shift-time"><strong>${esc(start)}</strong><span>— ${esc(end)}</span></div><div><strong>${esc(item.department || item.unit || t('mobile.general_shift'))}</strong><small>${esc(item.type || item.shiftType || t('mobile.scheduled_shift'))}</small></div><span class="shift-state">${t('mobile.planned')}</span></div>`; }
function bind(container, attendance, incidents) {
  container.querySelector('#mobile-checkin')?.addEventListener('click', async () => { const next = attendance.date === today() ? { ...attendance, checkedIn: !attendance.checkedIn } : { date: today(), checkedIn: true, at: new Date().toISOString() }; try { await writePlatform('mobile_attendance', next); showToast(next.checkedIn ? t('mobile.checkin_saved') : t('mobile.checkout_saved'), 'success'); renderMobileStaffPage(container); } catch { showToast(t('mobile.save_error'), 'error'); } });
  container.querySelector('#mobile-swap')?.addEventListener('click', () => { location.hash = 'schedule'; });
  container.querySelector('#mobile-emergency')?.addEventListener('click', async () => { incidents.unshift({ id: uid('mobile_incident'), type: 'emergency', state: 'queued', at: new Date().toISOString(), subject: t('mobile.emergency_subject') }); try { await writePlatform('mobile_incidents', incidents.slice(0, 50)); showToast(t('mobile.emergency_queued'), 'success'); renderMobileStaffPage(container); } catch { showToast(t('mobile.save_error'), 'error'); } });
  container.querySelector('#mobile-report')?.addEventListener('click', () => renderReportForm(container, incidents));
  window.addEventListener('online', () => renderMobileStaffPage(container), { once: true }); window.addEventListener('offline', () => renderMobileStaffPage(container), { once: true });
}
function renderReportForm(container, incidents) { const panel = container.querySelector('#mobile-report-panel'); if (!panel) return; panel.innerHTML = `<div class="card mobile-report-form"><div class="section-heading"><div><p class="section-kicker">${t('mobile.report_area')}</p><h2>${t('mobile.report_title')}</h2></div><button id="mobile-report-cancel" class="btn-secondary text-xs">${t('mobile.cancel')}</button></div><label class="field-wrap"><span>${t('mobile.report_label')}</span><textarea id="mobile-report-text" class="input-field w-full" rows="4" placeholder="${t('mobile.report_placeholder')}"></textarea></label><button id="mobile-report-save" class="btn-primary mt-4">${t('mobile.report_save')}</button></div>`; panel.querySelector('#mobile-report-cancel').onclick = () => { panel.replaceChildren(); }; panel.querySelector('#mobile-report-save').onclick = async () => { const text = panel.querySelector('#mobile-report-text').value.trim(); if (!text) { showToast(t('mobile.report_required'), 'error'); return; } incidents.unshift({ id: uid('mobile_report'), type: 'report', state: 'queued', at: new Date().toISOString(), subject: text.slice(0, 120) }); try { await writePlatform('mobile_incidents', incidents.slice(0, 50)); showToast(t('mobile.report_saved'), 'success'); renderMobileStaffPage(container); } catch { showToast(t('mobile.save_error'), 'error'); } }; }
