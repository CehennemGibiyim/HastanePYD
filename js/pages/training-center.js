import { loadTrainingRecords, saveTrainingRecords } from '../services/training-center-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
const today = () => new Date().toISOString().slice(0, 10);
const soon = () => new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
const typeLabels = { simulation: 'training_center.types.simulation', classroom: 'training_center.types.classroom' };
const statusLabels = { planned: 'training_center.status.planned', 'in-progress': 'training_center.status.in_progress', completed: 'training_center.status.completed' };

export async function renderTrainingCenterPage(el) {
  let records;
  try { records = await loadTrainingRecords(); } catch (error) { renderError(el); return; }
  let search = '';
  let status = '';
  let type = '';
  let notice = '';
  let noticeError = false;

  const render = () => {
    const query = search.toLocaleLowerCase('tr-TR');
    const filtered = records.filter((record) => {
      const haystack = `${record.staff} ${record.department} ${record.module} ${record.instructor}`.toLocaleLowerCase('tr-TR');
      return (!query || haystack.includes(query)) && (!status || record.status === status) && (!type || record.type === type);
    });
    const overdue = records.filter((record) => record.status !== 'completed' && record.dueDate < today()).length;
    const dueSoon = records.filter((record) => record.status !== 'completed' && record.dueDate >= today() && record.dueDate <= soon()).length;
    const completed = records.filter((record) => record.status === 'completed').length;
    const completion = records.length ? Math.round(completed / records.length * 100) : 0;
    el.innerHTML = `<div class="training-center-page fade-in">
      <section class="training-hero"><div><p class="eyebrow">${t('training_center.eyebrow')}</p><h1>${t('training_center.title')}</h1><p>${t('training_center.subtitle')}</p></div><div class="training-live"><i></i>${t('training_center.live')}</div></section>
      <section class="training-kpis" aria-label="${esc(t('training_center.kpi_label'))}">
        <div class="training-kpi"><span>${t('training_center.kpis.total')}</span><strong>${records.length}</strong><small>${t('training_center.kpis.total_note')}</small></div>
        <div class="training-kpi warning"><span>${t('training_center.kpis.due')}</span><strong>${dueSoon}</strong><small>${t('training_center.kpis.due_note')}</small></div>
        <div class="training-kpi danger"><span>${t('training_center.kpis.overdue')}</span><strong>${overdue}</strong><small>${t('training_center.kpis.overdue_note')}</small></div>
        <div class="training-kpi success"><span>${t('training_center.kpis.completion')}</span><strong>%${completion}</strong><small>${t('training_center.kpis.completion_note')}</small></div>
      </section>
      <p class="training-notice${noticeError ? ' error' : ''}" role="status">${esc(notice)}</p>
      <section class="training-toolbar"><div class="training-filters"><input id="training-search" class="input-field" type="search" value="${esc(search)}" placeholder="${esc(t('training_center.search'))}" aria-label="${esc(t('training_center.search_label'))}"><select id="training-status" class="input-field" aria-label="${esc(t('training_center.status_label'))}"><option value="">${t('training_center.filters.all')}</option>${Object.entries(statusLabels).map(([key, label]) => `<option value="${key}" ${status === key ? 'selected' : ''}>${t(label)}</option>`).join('')}</select><select id="training-type" class="input-field" aria-label="${esc(t('training_center.type_label'))}"><option value="">${t('training_center.filters.all_types')}</option>${Object.entries(typeLabels).map(([key, label]) => `<option value="${key}" ${type === key ? 'selected' : ''}>${t(label)}</option>`).join('')}</select></div><button id="add-training" class="btn-primary">${t('training_center.add')}</button></section>
      <section class="training-list" aria-live="polite">${filtered.length ? filtered.map(renderRecord).join('') : `<div class="training-empty"><strong>${t('training_center.empty_title')}</strong><p>${t('training_center.empty_note')}</p></div>`}</section>
    </div>`;
    bind();
  };

  const renderRecord = (record) => {
    const isOverdue = record.status !== 'completed' && record.dueDate < today();
    const isDue = record.status !== 'completed' && record.dueDate >= today() && record.dueDate <= soon();
    const progress = record.status === 'completed' ? 100 : record.status === 'in-progress' ? 55 : 12;
    return `<article class="training-record ${record.status === 'completed' ? 'is-complete' : isDue || isOverdue ? 'is-due' : ''}"><div class="training-record-head"><div><h2 class="training-record-title">${esc(record.module)}</h2><p class="training-record-sub">${esc(record.staff)} · ${esc(record.department)} · ${esc(record.role)}</p></div><div class="training-badges"><span class="training-badge ${record.status}">${t(statusLabels[record.status])}</span><span class="training-badge">${t(typeLabels[record.type])}</span>${isOverdue ? `<span class="training-badge overdue">${t('training_center.overdue')}</span>` : ''}</div></div><div class="training-meta"><span><strong>${t('training_center.meta.due')}:</strong> ${esc(record.dueDate)}</span><span><strong>${t('training_center.meta.instructor')}:</strong> ${esc(record.instructor)}</span>${record.score ? `<span><strong>${t('training_center.meta.score')}:</strong> ${record.score}/100</span>` : ''}</div><div class="training-progress" aria-label="${esc(t('training_center.progress'))}"><i style="width:${progress}%"></i></div><div class="training-actions">${record.status !== 'completed' ? `<button class="btn-secondary training-next" data-id="${esc(record.id)}">${t(record.status === 'planned' ? 'training_center.actions.start' : 'training_center.actions.complete')}</button>` : ''}<button class="btn-secondary training-delete" data-id="${esc(record.id)}">${t('training_center.actions.delete')}</button></div></article>`;
  };

  const bind = () => {
    document.getElementById('training-search')?.addEventListener('input', (event) => { search = event.target.value; render(); });
    document.getElementById('training-status')?.addEventListener('change', (event) => { status = event.target.value; render(); });
    document.getElementById('training-type')?.addEventListener('change', (event) => { type = event.target.value; render(); });
    document.getElementById('add-training')?.addEventListener('click', showAdd);
    document.querySelectorAll('.training-next').forEach((button) => button.addEventListener('click', async () => {
      const record = records.find((item) => item.id === button.dataset.id); if (!record) return;
      record.status = record.status === 'planned' ? 'in-progress' : 'completed';
      if (record.status === 'completed') { record.score = record.score || 80; record.completedAt = today(); }
      await persistAndRefresh(t('training_center.notices.updated'));
    }));
    document.querySelectorAll('.training-delete').forEach((button) => button.addEventListener('click', async () => {
      if (!window.confirm(t('training_center.confirm_delete'))) return;
      records = records.filter((item) => item.id !== button.dataset.id);
      await persistAndRefresh(t('training_center.notices.deleted'));
    }));
  };

  const persistAndRefresh = async (message) => {
    try { records = await saveTrainingRecords(records); notice = message; noticeError = false; } catch (error) { notice = t('training_center.save_error'); noticeError = true; }
    render();
  };

  const showAdd = () => {
    const dialog = document.createElement('dialog'); dialog.className = 'training-dialog';
    dialog.innerHTML = `<form method="dialog"><p class="eyebrow">${t('training_center.form.eyebrow')}</p><h2>${t('training_center.form.title')}</h2><p class="note">${t('training_center.form.note')}</p><div class="training-form-grid"><label class="training-field"><span>${t('training_center.form.staff')}</span><input id="tr-staff" class="input-field" required></label><label class="training-field"><span>${t('training_center.form.department')}</span><input id="tr-dept" class="input-field" required></label><label class="training-field"><span>${t('training_center.form.role')}</span><input id="tr-role" class="input-field" value="${esc(t('training_center.form.default_role'))}"></label><label class="training-field"><span>${t('training_center.form.module')}</span><input id="tr-module" class="input-field" required></label><label class="training-field"><span>${t('training_center.form.type')}</span><select id="tr-type" class="input-field"><option value="simulation">${t(typeLabels.simulation)}</option><option value="classroom">${t(typeLabels.classroom)}</option></select></label><label class="training-field"><span>${t('training_center.form.due')}</span><input id="tr-due" class="input-field" type="date" value="${soon()}" required></label><label class="training-field wide"><span>${t('training_center.form.instructor')}</span><input id="tr-instructor" class="input-field" required></label></div><div class="training-dialog-actions"><button id="tr-save" class="btn-primary" value="default">${t('training_center.form.save')}</button><button id="tr-cancel" class="btn-secondary" value="cancel">${t('training_center.cancel')}</button></div></form>`;
    document.body.appendChild(dialog); dialog.showModal();
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.querySelector('#tr-save').addEventListener('click', async (event) => { event.preventDefault(); const form = dialog.querySelector('form'); if (!form.reportValidity()) return; records.push({ id: `TR-${Date.now()}`, staff: dialog.querySelector('#tr-staff').value.trim(), department: dialog.querySelector('#tr-dept').value.trim(), role: dialog.querySelector('#tr-role').value.trim(), module: dialog.querySelector('#tr-module').value.trim(), type: dialog.querySelector('#tr-type').value, status: 'planned', dueDate: dialog.querySelector('#tr-due').value, score: 0, instructor: dialog.querySelector('#tr-instructor').value.trim(), completedAt: '' }); dialog.close(); await persistAndRefresh(t('training_center.notices.created')); });
    dialog.querySelector('#tr-cancel').addEventListener('click', () => dialog.close());
  };
  render();
}

function renderError(el) { el.innerHTML = `<div class="card border-red-400/20"><h1 class="text-xl font-bold text-white">${t('training_center.load_error')}</h1><p class="text-slate-400 mt-2">${t('training_center.retry_note')}</p><button class="btn-primary mt-5" onclick="location.reload()">${t('platform.refresh')}</button></div>`; }
