// ===== HASTA AKIŞ VE YATAK KOORDİNASYON MERKEZİ =====
import { readPlatform, writePlatform, uid, today, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const STORAGE_KEY = 'patient_flow_center';
const FLOW_STATUSES = {
  emergency: { label: 'patient_flow.status.emergency', tone: 'critical' },
  assessment: { label: 'patient_flow.status.assessment', tone: 'warning' },
  bed_wait: { label: 'patient_flow.status.bed_wait', tone: 'warning' },
  admitted: { label: 'patient_flow.status.admitted', tone: 'good' },
  discharge: { label: 'patient_flow.status.discharge', tone: 'good' },
};
const BED_STATUSES = ['available', 'occupied', 'cleaning', 'reserved', 'isolation'];
const seed = () => ({
  patients: [
    { id: 'PF-204', name: 'Elif Şahin', unit: 'Acil Servis', status: 'emergency', priority: 'critical', wait: 8, arrival: today(), note: 'Solunum sıkıntısı', bed: null },
    { id: 'PF-198', name: 'Murat Özkan', unit: 'Kardiyoloji', status: 'bed_wait', priority: 'high', wait: 42, arrival: today(), note: 'Yatak bekliyor', bed: null },
    { id: 'PF-176', name: 'Zeynep Kara', unit: 'Dahiliye', status: 'admitted', priority: 'normal', wait: 0, arrival: today(), note: 'DAH-03', bed: 'DAH-03' },
    { id: 'PF-163', name: 'Ali Vural', unit: 'Genel Cerrahi', status: 'discharge', priority: 'normal', wait: 18, arrival: today(), note: 'Taburculuk onayı bekliyor', bed: 'CER-02' },
    { id: 'PF-211', name: 'Ayşe Demir', unit: 'Acil Servis', status: 'assessment', priority: 'high', wait: 16, arrival: today(), note: 'Triage değerlendirmesi', bed: null },
  ],
  beds: [
    { id: 'DAH-03', unit: 'Dahiliye', status: 'occupied', patient: 'Zeynep Kara' }, { id: 'DAH-04', unit: 'Dahiliye', status: 'available', patient: null },
    { id: 'KAR-01', unit: 'Kardiyoloji', status: 'available', patient: null }, { id: 'KAR-02', unit: 'Kardiyoloji', status: 'occupied', patient: 'Selin Yurt' },
    { id: 'CER-01', unit: 'Genel Cerrahi', status: 'cleaning', patient: null }, { id: 'CER-02', unit: 'Genel Cerrahi', status: 'occupied', patient: 'Ali Vural' },
    { id: 'YBÜ-01', unit: 'Yoğun Bakım', status: 'occupied', patient: 'Murat Çetin' }, { id: 'YBÜ-02', unit: 'Yoğun Bakım', status: 'isolation', patient: null },
    { id: 'ORT-01', unit: 'Ortopedi', status: 'available', patient: null }, { id: 'ORT-02', unit: 'Ortopedi', status: 'reserved', patient: null },
  ],
});

export async function renderPatientFlowPage(el) {
  const data = await readPlatform(STORAGE_KEY, seed());
  let filter = 'all'; let search = ''; let notice = '';

  const persist = async () => { await writePlatform(STORAGE_KEY, data); };
  const label = (key) => t(key);
  const bedLabel = (status) => t(`patient_flow.beds.${status}`);
  const statusLabel = (status) => label(FLOW_STATUSES[status]?.label || 'patient_flow.status.assessment');

  function render() {
    const active = data.patients.filter(p => p.status !== 'admitted' || p.bed);
    const visible = active.filter(p => (filter === 'all' || p.status === filter) && (!search || `${p.name} ${p.id} ${p.unit}`.toLowerCase().includes(search.toLowerCase())));
    const available = data.beds.filter(b => b.status === 'available').length;
    const waiting = data.patients.filter(p => p.status === 'bed_wait').length;
    const discharges = data.patients.filter(p => p.status === 'discharge').length;
    const emergency = data.patients.filter(p => ['emergency', 'assessment'].includes(p.status)).length;
    const units = [...new Set(data.beds.map(b => b.unit))].map(unit => {
      const beds = data.beds.filter(b => b.unit === unit); const used = beds.filter(b => ['occupied', 'reserved', 'isolation'].includes(b.status)).length;
      return { unit, total: beds.length, used, available: beds.filter(b => b.status === 'available').length };
    });
    el.innerHTML = `<div class="patient-flow-page fade-in">
      <section class="flow-hero"><div><p class="eyebrow">${label('patient_flow.eyebrow')}</p><h1>${label('patient_flow.title')}</h1><p>${label('patient_flow.subtitle')}</p></div><div class="flow-live"><i></i>${label('patient_flow.live')}</div></section>
      <div class="flow-kpis"><div class="flow-kpi cyan"><span>${label('patient_flow.kpis.emergency')}</span><strong>${emergency}</strong><small>${label('patient_flow.kpis.emergency_note')}</small></div><div class="flow-kpi amber"><span>${label('patient_flow.kpis.waiting')}</span><strong>${waiting}</strong><small>${label('patient_flow.kpis.waiting_note')}</small></div><div class="flow-kpi green"><span>${label('patient_flow.kpis.available')}</span><strong>${available}</strong><small>${label('patient_flow.kpis.available_note')}</small></div><div class="flow-kpi red"><span>${label('patient_flow.kpis.discharge')}</span><strong>${discharges}</strong><small>${label('patient_flow.kpis.discharge_note')}</small></div></div>
      <p class="flow-notice ${notice.startsWith('!') ? 'error' : ''}">${esc(notice.replace(/^!/, ''))}</p>
      <div class="flow-layout"><section class="card flow-panel"><div class="flow-panel-heading"><div><p class="eyebrow">${label('patient_flow.flow_eyebrow')}</p><h2>${label('patient_flow.flow_title')}</h2></div><button id="flow-add" class="btn-primary text-xs">${label('patient_flow.add')}</button></div>
        <div class="flow-filters"><input id="flow-search" class="input-field flex-1 min-w-[180px]" placeholder="${label('patient_flow.search')}" value="${esc(search)}"><select id="flow-filter" class="input-field"><option value="all">${label('patient_flow.filters.all')}</option>${Object.entries(FLOW_STATUSES).map(([key, value]) => `<option value="${key}" ${filter === key ? 'selected' : ''}>${label(value.label)}</option>`).join('')}</select><button id="flow-refresh" class="btn-secondary text-xs">${label('patient_flow.refresh')}</button></div>
        <div class="flow-list">${visible.length ? visible.map(patientCard).join('') : `<div class="flow-empty">${label('patient_flow.empty')}</div>`}</div></section>
        <aside class="card flow-panel"><div class="flow-panel-heading"><div><p class="eyebrow">${label('patient_flow.beds_eyebrow')}</p><h2>${label('patient_flow.beds_title')}</h2></div><a class="text-link" href="#bed-management">${label('patient_flow.open_beds')}</a></div><div class="flow-occupancy">${units.map(unit => { const pct = Math.round((unit.used / unit.total) * 100); return `<div class="occupancy-row"><div class="occupancy-head"><span>${esc(unit.unit)}</span><strong>${pct}%</strong></div><div class="occupancy-bar"><i style="width:${pct}%"></i></div><small>${unit.used}/${unit.total} · ${unit.available} ${label('patient_flow.beds.available_short')}</small></div>`; }).join('')}</div><div class="bed-legend"><span><i></i>${label('patient_flow.beds.available')}</span><span><i class="occupied"></i>${label('patient_flow.beds.occupied')}</span><span><i class="cleaning"></i>${label('patient_flow.beds.cleaning')}</span><span><i class="reserved"></i>${label('patient_flow.beds.reserved')}</span></div></aside>
      </div></div>`;
    wire();
  }

  function patientCard(p) {
    const meta = FLOW_STATUSES[p.status] || FLOW_STATUSES.assessment; const canAssign = ['emergency', 'bed_wait'].includes(p.status) && data.beds.some(b => b.status === 'available');
    const next = p.status === 'emergency' ? 'assessment' : p.status === 'assessment' ? 'bed_wait' : p.status === 'discharge' ? 'admitted' : null;
    return `<article class="flow-item ${meta.tone}"><span class="flow-token">${esc(p.id.slice(-3))}</span><div><h3>${esc(p.name)} <span class="flow-status ${meta.tone}">${label(meta.label)}</span></h3><p>${esc(p.unit)} · ${esc(p.note || label('patient_flow.no_note'))}</p><small>${p.wait ? `${p.wait} ${label('patient_flow.minutes_waiting')}` : label('patient_flow.in_unit')}${p.bed ? ` · ${esc(p.bed)}` : ''}</small></div><div class="flow-item-actions">${canAssign ? `<button class="btn-primary text-xs py-1.5 px-2" data-action="assign" data-id="${esc(p.id)}">${label('patient_flow.assign_bed')}</button>` : ''}${next ? `<button class="btn-secondary text-xs py-1.5 px-2" data-action="advance" data-id="${esc(p.id)}">${label('patient_flow.advance')}</button>` : ''}</div></article>`;
  }

  function wire() {
    el.querySelector('#flow-search')?.addEventListener('input', e => { search = e.target.value; render(); });
    el.querySelector('#flow-filter')?.addEventListener('change', e => { filter = e.target.value; render(); });
    el.querySelector('#flow-refresh')?.addEventListener('click', () => { notice = label('patient_flow.refreshed'); render(); });
    el.querySelector('#flow-add')?.addEventListener('click', openAddDialog);
    el.querySelectorAll('[data-action="advance"]').forEach(btn => btn.addEventListener('click', () => advance(btn.dataset.id)));
    el.querySelectorAll('[data-action="assign"]').forEach(btn => btn.addEventListener('click', () => assignBed(btn.dataset.id)));
  }
  async function advance(id) { const patient = data.patients.find(p => p.id === id); if (!patient) return; const next = { emergency: 'assessment', assessment: 'bed_wait', discharge: 'admitted' }[patient.status]; if (!next) return; patient.status = next; patient.wait = 0; await persist(); notice = label('patient_flow.saved'); render(); }
  async function assignBed(id) { const patient = data.patients.find(p => p.id === id); const bed = patient ? (data.beds.find(b => b.status === 'available' && b.unit === patient.unit) || data.beds.find(b => b.status === 'available')) : null; if (!patient || !bed) { notice = `!${label('patient_flow.no_bed')}`; render(); return; } patient.status = 'admitted'; patient.bed = bed.id; patient.note = bed.id; bed.status = 'occupied'; bed.patient = patient.name; await persist(); showToast(label('patient_flow.assigned_toast'), 'success'); notice = label('patient_flow.saved'); render(); }
  function openAddDialog() {
    const dialog = document.createElement('dialog'); dialog.className = 'flow-dialog'; dialog.innerHTML = `<form method="dialog" class="p-5"><div class="flex items-center justify-between gap-3 mb-4"><div><p class="eyebrow">${label('patient_flow.new_eyebrow')}</p><h2 class="text-lg font-bold text-white">${label('patient_flow.new_title')}</h2></div><button value="cancel" class="btn-secondary text-xs">${label('patient_flow.cancel')}</button></div><div class="space-y-3"><div><label class="label">${label('patient_flow.form.name')}</label><input id="pf-name" class="input-field w-full" required></div><div class="grid grid-cols-2 gap-3"><div><label class="label">${label('patient_flow.form.unit')}</label><select id="pf-unit" class="input-field w-full"><option>${label('patient_flow.units.emergency')}</option><option>${label('patient_flow.units.internal')}</option><option>${label('patient_flow.units.cardiology')}</option><option>${label('patient_flow.units.surgery')}</option><option>${label('patient_flow.units.orthopedics')}</option></select></div><div><label class="label">${label('patient_flow.form.priority')}</label><select id="pf-priority" class="input-field w-full"><option value="normal">${label('patient_flow.form.normal')}</option><option value="high">${label('patient_flow.form.high')}</option><option value="critical">${label('patient_flow.form.critical')}</option></select></div></div><div><label class="label">${label('patient_flow.form.note')}</label><input id="pf-note" class="input-field w-full"></div></div><button id="pf-save" value="default" class="btn-primary w-full mt-5">${label('patient_flow.save')}</button></form>`;
    document.body.appendChild(dialog); dialog.showModal(); dialog.querySelector('form').addEventListener('submit', async e => { e.preventDefault(); const name = dialog.querySelector('#pf-name').value.trim(); if (!name) return; data.patients.unshift({ id: uid('PF'), name, unit: dialog.querySelector('#pf-unit').value, status: 'emergency', priority: dialog.querySelector('#pf-priority').value, wait: 0, arrival: today(), note: dialog.querySelector('#pf-note').value.trim(), bed: null }); await persist(); dialog.close(); dialog.remove(); notice = label('patient_flow.saved'); render(); }); dialog.addEventListener('close', () => dialog.remove(), { once: true }); dialog.querySelector('#pf-name').focus();
  }
  render();
}
