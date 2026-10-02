// ===== HASTA DENEYİMİ VE GERİ BİLDİRİM MERKEZİ =====
import { loadFeedbackRecords, saveFeedbackRecords } from '../services/patient-feedback-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
const statusKeys = ['open', 'in-review', 'resolved'];
const categories = ['care', 'communication', 'access', 'facility', 'other'];
const channels = ['qr', 'portal', 'call', 'survey'];

export async function renderPatientExperiencePage(el) {
  el.innerHTML = `<div class="card loading-pulse text-slate-400">${t('experience.feedback.loading')}</div>`;
  let records;
  try { records = await loadFeedbackRecords(); } catch (error) { el.innerHTML = `<div class="card text-red-200">${t('experience.load_error')}</div>`; return; }
  let query = '', status = 'all', category = 'all', notice = '';

  const filtered = () => records.filter((item) => {
    const haystack = [item.patientRef, item.department, item.comment, item.owner].join(' ').toLocaleLowerCase('tr-TR');
    return (status === 'all' || item.status === status) && (category === 'all' || item.category === category) && (!query || haystack.includes(query.toLocaleLowerCase('tr-TR')));
  });
  const commit = async (next, message) => {
    try { records = await saveFeedbackRecords(next); notice = message; render(); }
    catch (error) { notice = t('experience.save_error'); render(); }
  };
  const render = () => {
    const month = new Date().toISOString().slice(0, 7);
    const average = records.length ? (records.reduce((sum, item) => sum + item.rating, 0) / records.length).toFixed(1) : '0.0';
    const positive = records.length ? Math.round(records.filter((item) => item.rating >= 4).length / records.length * 100) : 0;
    const visible = filtered();
    el.innerHTML = `<div class="pfc-page fade-in"><section class="pfc-hero"><div><p class="eyebrow">${t('experience.feedback.eyebrow')}</p><h1>${t('experience.feedback.title')}</h1><p>${t('experience.feedback.subtitle')}</p></div><div class="pfc-live"><i></i><span>${t('experience.feedback.live')}</span></div></section><section class="pfc-kpis"><div class="pfc-kpi info"><span>${t('experience.feedback.kpis.average')}</span><strong>${average}</strong><small>${t('experience.feedback.kpis.average_note')}</small></div><div class="pfc-kpi warning"><span>${t('experience.feedback.kpis.open')}</span><strong>${records.filter((item) => item.status !== 'resolved').length}</strong><small>${t('experience.feedback.kpis.open_note')}</small></div><div class="pfc-kpi success"><span>${t('experience.feedback.kpis.positive')}</span><strong>%${positive}</strong><small>${t('experience.feedback.kpis.positive_note')}</small></div><div class="pfc-kpi danger"><span>${t('experience.feedback.kpis.month')}</span><strong>${records.filter((item) => item.date.startsWith(month)).length}</strong><small>${t('experience.feedback.kpis.month_note')}</small></div></section><p class="px-notice" role="status">${esc(notice)}</p><section class="card"><div class="pfc-toolbar"><div class="pfc-filters"><input id="pfc-search" class="input-field" value="${esc(query)}" placeholder="${t('experience.feedback.search')}" aria-label="${t('experience.feedback.search_label')}"><select id="pfc-status" class="input-field" aria-label="${t('experience.feedback.status_label')}"><option value="all">${t('experience.feedback.filters.all')}</option>${statusKeys.map((key) => `<option value="${key}" ${status === key ? 'selected' : ''}>${t(`experience.feedback.status.${key}`)}</option>`).join('')}</select><select id="pfc-category" class="input-field" aria-label="${t('experience.feedback.category_label')}"><option value="all">${t('experience.feedback.filters.all_categories')}</option>${categories.map((key) => `<option value="${key}" ${category === key ? 'selected' : ''}>${t(`experience.feedback.category.${key}`)}</option>`).join('')}</select></div><button id="pfc-add" class="btn-primary">${t('experience.feedback.actions.add')}</button></div><div class="pfc-grid">${visible.length ? visible.map(card).join('') : `<div class="pfc-empty col-span-full"><strong>${t('experience.empty_title')}</strong><p>${t('experience.feedback.empty_note')}</p></div>`}</div></section></div>`;
    el.querySelector('#pfc-search').addEventListener('input', (event) => { query = event.target.value; render(); const input = el.querySelector('#pfc-search'); input.focus(); input.setSelectionRange(query.length, query.length); });
    el.querySelector('#pfc-status').addEventListener('change', (event) => { status = event.target.value; render(); });
    el.querySelector('#pfc-category').addEventListener('change', (event) => { category = event.target.value; render(); });
    el.querySelector('#pfc-add').addEventListener('click', openForm);
    el.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => act(button.dataset.id, button.dataset.action)));
  };
  const card = (item) => {
    const overdue = item.status !== 'resolved' && item.responseDue && item.responseDue < new Date().toISOString().slice(0, 10);
    return `<article class="pfc-card ${item.status === 'resolved' ? 'is-resolved' : ''} ${item.rating <= 2 ? 'is-critical' : ''}"><div class="pfc-card-head"><div class="pfc-person"><span class="pfc-avatar">${esc(item.patientRef.slice(0, 1))}</span><div><strong>${esc(item.patientRef)}</strong><small>${esc(item.department)} · ${t(`experience.feedback.channel.${item.channel}`)}</small></div></div><div class="pfc-badges"><span class="pfc-badge ${item.status}">${t(`experience.feedback.status.${item.status}`)}</span>${overdue ? `<span class="pfc-badge open">${t('experience.feedback.overdue')}</span>` : ''}</div></div><div class="pfc-rating" aria-label="${t('experience.feedback.rating_aria', { rating: item.rating })}">${'★'.repeat(item.rating)}<span class="text-slate-600">${'★'.repeat(5 - item.rating)}</span></div><p class="pfc-comment">${esc(item.comment || t('experience.feedback.no_comment'))}</p><div class="pfc-meta"><span>${t('experience.feedback.fields.category')}: <strong>${t(`experience.feedback.category.${item.category}`)}</strong></span><span>${t('experience.feedback.fields.date')}: <strong>${esc(item.date)}</strong></span><span>${t('experience.feedback.fields.owner')}: <strong>${esc(item.owner || t('experience.feedback.unassigned'))}</strong></span></div><div class="pfc-actions">${item.status === 'open' ? `<button class="btn-secondary" data-id="${esc(item.id)}" data-action="review">${t('experience.feedback.actions.review')}</button>` : ''}${item.status !== 'resolved' ? `<button class="btn-primary" data-id="${esc(item.id)}" data-action="resolve">${t('experience.feedback.actions.resolve')}</button>` : `<span class="text-xs text-green-300 self-center">${t('experience.feedback.resolved_note')}</span>`}<button class="btn-secondary" data-id="${esc(item.id)}" data-action="delete">${t('experience.feedback.actions.delete')}</button></div></article>`;
  };
  const act = async (id, action) => {
    const item = records.find((entry) => entry.id === id); if (!item) return;
    if (action === 'delete' && !window.confirm(t('experience.feedback.confirm_delete'))) return;
    const next = records.filter((entry) => action === 'delete' ? entry.id !== id : true).map((entry) => ({ ...entry }));
    const updated = next.find((entry) => entry.id === id);
    if (action === 'review' && updated) { updated.status = 'in-review'; updated.owner = updated.owner || t('experience.feedback.default_owner'); }
    if (action === 'resolve' && updated) { updated.status = 'resolved'; updated.owner = updated.owner || t('experience.feedback.default_owner'); }
    await commit(next, t(`experience.feedback.notices.${action}`));
  };
  const openForm = () => {
    const dialog = document.createElement('dialog'); dialog.className = 'pfc-dialog';
    dialog.innerHTML = `<form method="dialog"><p class="eyebrow">${t('experience.feedback.form.eyebrow')}</p><h2>${t('experience.feedback.form.title')}</h2><p class="pfc-note">${t('experience.feedback.form.note')}</p><div class="pfc-form-grid"><label class="pfc-field wide">${t('experience.feedback.form.patient')}<input id="pfc-patient" class="input-field" placeholder="${t('experience.feedback.form.patient_placeholder')}"></label><label class="pfc-field">${t('experience.feedback.form.department')}<input id="pfc-department" class="input-field" required></label><label class="pfc-field">${t('experience.feedback.form.channel')}<select id="pfc-channel" class="input-field">${channels.map((key) => `<option value="${key}">${t(`experience.feedback.channel.${key}`)}</option>`).join('')}</select></label><label class="pfc-field">${t('experience.feedback.form.category')}<select id="pfc-category-form" class="input-field">${categories.map((key) => `<option value="${key}">${t(`experience.feedback.category.${key}`)}</option>`).join('')}</select></label><label class="pfc-field">${t('experience.feedback.form.rating')}<select id="pfc-rating" class="input-field">${[5, 4, 3, 2, 1].map((value) => `<option value="${value}">${value} / 5</option>`).join('')}</select></label><label class="pfc-field wide">${t('experience.feedback.form.comment')}<textarea id="pfc-comment" class="input-field" rows="4" required></textarea></label></div><div class="pfc-dialog-actions"><button type="button" id="pfc-cancel" class="btn-secondary">${t('experience.feedback.form.cancel')}</button><button class="btn-primary">${t('experience.feedback.form.save')}</button></div></form>`;
    document.body.append(dialog); dialog.showModal(); dialog.querySelector('#pfc-cancel').onclick = () => dialog.close(); dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.querySelector('form').addEventListener('submit', async (event) => { event.preventDefault(); const value = (id) => dialog.querySelector(id).value.trim(); const date = new Date().toISOString().slice(0, 10); const item = { id: `fb-${Date.now()}`, patientRef: value('#pfc-patient') || t('experience.feedback.anonymous'), department: value('#pfc-department'), channel: dialog.querySelector('#pfc-channel').value, category: dialog.querySelector('#pfc-category-form').value, rating: Number(dialog.querySelector('#pfc-rating').value), comment: value('#pfc-comment'), status: 'open', date, owner: '', responseDue: date }; if (!item.department || !item.comment) return; await commit([...records, item], t('experience.feedback.notices.created')); dialog.close(); });
  };
  render();
}
