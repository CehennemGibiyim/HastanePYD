// ===== YETKİNLİK BAZLI VARDİYA OPTİMİZASYONU =====
import { getPersonnel, getSchedules, addSchedule, hasPermission } from '../state.js';
import { showToast } from '../notifications.js';
import { dateOnly, escapeHTML } from '../services/hr-storage.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
let selected = [];

export function renderShiftOptimizerPage(container) {
  const departments = [...new Set(getPersonnel({ status: 'active' }).map(p => p.department))].filter(Boolean);
  container.innerHTML = `<div class="fade-in"><div class="mb-6"><p class="text-xs uppercase tracking-widest text-purple-300">${t('hr.eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('hr.optimizer_title')}</h1><p class="text-slate-400 text-sm mt-1">${t('hr.optimizer_subtitle')}</p></div><div class="card mb-6"><div class="grid md:grid-cols-4 gap-4"><div><label class="label">${t('hr.shift_date')}</label><input id="opt-date" type="date" class="input-field w-full" value="${dateOnly(Date.now() + 86400000)}"></div><div><label class="label">${t('hr.department')}</label><select id="opt-dept" class="input-field w-full"><option value="">${t('hr.all_departments')}</option>${departments.map(d => `<option>${escapeHTML(d)}</option>`).join('')}</select></div><div><label class="label">${t('hr.shift_type')}</label><select id="opt-shift" class="input-field w-full"><option value="morning">🌅 ${t('hr.morning')}</option><option value="evening">🌆 ${t('hr.evening')}</option><option value="night">🌙 ${t('hr.night')}</option></select></div><div><label class="label">${t('hr.required_staff')}</label><input id="opt-count" type="number" min="1" max="12" value="3" class="input-field w-full"></div></div><button id="opt-run" class="btn-primary mt-5">✨ ${t('hr.generate_suggestion')}</button></div><div id="opt-results"></div></div>`;
  document.getElementById('opt-run').onclick = runOptimizer;
  runOptimizer();
}

function runOptimizer() {
  const date = document.getElementById('opt-date').value; const dept = document.getElementById('opt-dept').value; const shift = document.getElementById('opt-shift').value; const count = Math.min(12, Math.max(1, parseInt(document.getElementById('opt-count').value) || 3));
  const people = getPersonnel({ status: 'active' }); const dayAssignments = getSchedules({ date });
  const assignedIds = new Set(dayAssignments.map(s => s.personnelId));
  const candidates = people.filter(p => !assignedIds.has(p.id)).map(p => ({ person: p, score: score(p, dept, shift), reasons: reasons(p, dept, shift) })).sort((a, b) => b.score - a.score);
  selected = candidates.slice(0, count).map(x => x.person.id);
  const results = document.getElementById('opt-results');
  results.innerHTML = `<div class="flex items-center justify-between mb-4"><div><h3 class="text-lg font-semibold text-white">${t('hr.suggestions')}</h3><p class="text-sm text-slate-400">${date} · ${shiftLabel(shift)} · ${dept || t('hr.all_departments')}</p></div><button id="opt-apply" class="btn-primary">✅ ${t('hr.apply_selected')}</button></div>${candidates.length ? `<div class="space-y-3">${candidates.slice(0, Math.max(count, 6)).map((x, i) => candidateHTML(x, i < count)).join('')}</div>` : `<div class="empty-state card"><div class="icon">⚠️</div><div class="title">${t('hr.no_candidates')}</div><div class="desc">${t('hr.no_candidates_desc')}</div></div>`}`;
  results.querySelectorAll('[data-opt-id]').forEach(box => box.onchange = () => { const id = parseInt(box.dataset.optId); selected = box.checked ? [...new Set([...selected, id])] : selected.filter(x => x !== id); });
  document.getElementById('opt-apply')?.addEventListener('click', () => applySuggestions(date, shift, dept));
}

function applySuggestions(date, shift, dept) {
  if (!hasPermission('write')) { showToast(t('hr.read_only'), 'warning'); return; }
  if (!selected.length) { showToast(t('hr.select_staff'), 'error'); return; }
  selected.forEach(personnelId => addSchedule({ personnelId, department: dept || getPersonnel({}).find(p => p.id === personnelId)?.department, date, shift, type: 'staff', duration: 8 }));
  showToast(t('hr.schedule_applied', { count: selected.length }), 'success'); runOptimizer();
}
function score(p, dept, shift) { let score = 50; if (dept && p.department === dept) score += 35; if (['nurse', 'doctor'].includes(p.type) && shift === 'night') score += 8; if (p.workProfile === 'shift') score += 5; const assignments = getSchedules({ personnelId: p.id }).filter(s => s.shift === 'night').length; return score - Math.min(assignments, 12); }
function reasons(p, dept, shift) { const r = []; if (dept && p.department === dept) r.push(t('hr.reason_department')); if (p.workProfile === 'shift') r.push(t('hr.reason_shift_profile')); if (shift === 'night' && ['nurse', 'doctor'].includes(p.type)) r.push(t('hr.reason_clinical')); if (!r.length) r.push(t('hr.reason_available')); return r; }
function candidateHTML(x, checked) { return `<label class="card flex items-center gap-4 cursor-pointer hover:border-purple-400/40"><input type="checkbox" class="w-5 h-5 accent-cyan-400" data-opt-id="${x.person.id}" ${checked ? 'checked' : ''}><div class="flex-1"><p class="font-semibold text-white">${escapeHTML(`${x.person.name} ${x.person.surname}`)}</p><p class="text-xs text-slate-400">${escapeHTML(x.person.department || '—')} · ${escapeHTML(x.person.title || x.person.type || '—')}</p><div class="flex flex-wrap gap-1 mt-2">${x.reasons.map(r => `<span class="badge text-[10px]">${escapeHTML(r)}</span>`).join('')}</div></div><div class="text-right"><p class="text-xl font-bold text-cyan-300">${x.score}</p><p class="text-[10px] text-slate-500">${t('hr.fit_score')}</p></div></label>`; }
function shiftLabel(shift) { return ({ morning: t('hr.morning'), evening: t('hr.evening'), night: t('hr.night') })[shift] || shift; }
