// ===== TAHMİNE DAYALI VARDİYA VE YATAK PLANLAMA =====
import { getPersonnel, getDepartmentStats, getTodaySchedules } from '../state.js';
import { readPlatform, writePlatform, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const KEY = 'operations_forecast_preferences';
const SCENARIOS = { normal: { demand: 1, label: 'forecast.scenario_normal' }, seasonal: { demand: 1.18, label: 'forecast.scenario_seasonal' }, outbreak: { demand: 1.42, label: 'forecast.scenario_outbreak' } };

export async function renderOperationsForecastPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('forecast.loading')}</div>`;
  const saved = await readPlatform(KEY, { scenario: 'normal', horizon: 7, threshold: 85 });
  let preferences = { scenario: 'normal', horizon: 7, threshold: 85, ...(saved || {}) };
  const personnel = getPersonnel({ status: 'active' });
  const stats = getDepartmentStats();
  const shifts = getTodaySchedules();

  const calculate = () => {
    const factor = SCENARIOS[preferences.scenario]?.demand || 1;
    const horizonFactor = Number(preferences.horizon) === 30 ? 1.08 : 1;
    return Object.entries(stats).filter(([, count]) => count > 0).map(([department, current], index) => {
      const base = Math.max(6, current * 1.35 + ((department.length + index) % 5));
      const occupancy = Math.min(99, Math.round(base * factor * horizonFactor));
      const staffNeed = Math.max(0, Math.ceil((occupancy - Number(preferences.threshold)) / 12));
      const beds = Math.max(2, Math.round(current * 0.8));
      return { department, current, occupancy, staffNeed, beds, status: occupancy >= 92 ? 'critical' : occupancy >= Number(preferences.threshold) ? 'watch' : 'good' };
    }).sort((a, b) => b.occupancy - a.occupancy);
  };
  const persist = async () => { try { await writePlatform(KEY, preferences); showToast(t('forecast.saved'), 'success'); } catch { showToast(t('forecast.save_error'), 'error'); } };
  const exportReport = rows => { const values = [[t('forecast.csv_department'), t('forecast.csv_occupancy'), t('forecast.csv_staff'), t('forecast.csv_beds'), t('forecast.csv_status')], ...rows.map(row => [row.department, `%${row.occupancy}`, row.staffNeed, row.beds, t(`forecast.status_${row.status}`)])]; const csv = values.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n'); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = 'hastane-pys-operasyon-tahmini.csv'; link.click(); URL.revokeObjectURL(link.href); showToast(t('forecast.exported'), 'success'); };
  const render = () => {
    const rows = calculate(); const critical = rows.filter(row => row.status === 'critical').length; const avg = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.occupancy, 0) / rows.length) : 0; const staffGap = rows.reduce((sum, row) => sum + row.staffNeed, 0);
    container.innerHTML = `<div class="fade-in space-y-5 forecast-page"><header class="flex flex-wrap items-start justify-between gap-4"><div><p class="section-kicker">${t('forecast.eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('forecast.title')}</h1><p class="text-slate-400 text-sm mt-1 max-w-3xl">${t('forecast.subtitle')}</p></div><div class="flex gap-2"><button id="forecast-export" class="btn-secondary text-xs">${t('forecast.export')}</button><button id="forecast-save" class="btn-primary text-xs">${t('forecast.save_plan')}</button></div></header><section class="grid grid-cols-2 lg:grid-cols-4 gap-3"><div class="card market-stat"><span class="market-stat-label">${t('forecast.avg_demand')}</span><strong>${avg}%</strong><span>${t('forecast.horizon')} ${preferences.horizon} ${t('forecast.days')}</span></div><div class="card market-stat"><span class="market-stat-label">${t('forecast.critical_units')}</span><strong class="text-red-300">${critical}</strong><span>${t('forecast.critical_units_note')}</span></div><div class="card market-stat"><span class="market-stat-label">${t('forecast.staff_gap')}</span><strong class="text-amber-300">+${staffGap}</strong><span>${t('forecast.staff_gap_note')}</span></div><div class="card market-stat"><span class="market-stat-label">${t('forecast.signal_quality')}</span><strong class="text-cyan-300">${Math.min(99, 78 + Math.min(15, personnel.length))}%</strong><span>${shifts.length} ${t('forecast.today_shifts')}</span></div></section><section class="card"><div class="section-heading"><div><p class="section-kicker">${t('forecast.controls_eyebrow')}</p><h2>${t('forecast.controls_title')}</h2></div><span class="badge">${t(SCENARIOS[preferences.scenario].label)}</span></div><div class="grid sm:grid-cols-3 gap-3"><label class="label">${t('forecast.scenario')}<select id="forecast-scenario" class="input-field w-full mt-1">${Object.entries(SCENARIOS).map(([key, value]) => `<option value="${key}" ${preferences.scenario === key ? 'selected' : ''}>${t(value.label)}</option>`).join('')}</select></label><label class="label">${t('forecast.horizon')}<select id="forecast-horizon" class="input-field w-full mt-1"><option value="7" ${Number(preferences.horizon) === 7 ? 'selected' : ''}>7 ${t('forecast.days')}</option><option value="30" ${Number(preferences.horizon) === 30 ? 'selected' : ''}>30 ${t('forecast.days')}</option></select></label><label class="label">${t('forecast.threshold')}<input id="forecast-threshold" type="number" min="60" max="98" value="${esc(preferences.threshold)}" class="input-field w-full mt-1"><small class="text-slate-500">${t('forecast.threshold_note')}</small></label></div></section><section class="card"><div class="section-heading"><div><p class="section-kicker">${t('forecast.results_eyebrow')}</p><h2>${t('forecast.results_title')}</h2></div><span class="text-xs text-slate-500">${t('forecast.advisory')}</span></div><div class="space-y-3">${rows.length ? rows.map(row => `<div class="forecast-row"><div class="min-w-0 flex-1"><div class="flex items-center justify-between gap-3"><strong class="text-white">${esc(row.department)}</strong><span class="market-status status-${row.status === 'critical' ? 'missing' : row.status === 'watch' ? 'partial' : 'ready'}">${t(`forecast.status_${row.status}`)}</span></div><div class="h-2 rounded-full bg-white/10 overflow-hidden mt-3"><div class="h-full rounded-full ${row.status === 'critical' ? 'bg-red-400' : row.status === 'watch' ? 'bg-amber-400' : 'bg-emerald-400'}" style="width:${row.occupancy}%"></div></div><div class="flex flex-wrap gap-3 text-xs text-slate-400 mt-2"><span>${t('forecast.expected_occupancy')}: <b class="text-white">%${row.occupancy}</b></span><span>${t('forecast.staff_need')}: <b class="text-amber-300">+${row.staffNeed}</b></span><span>${t('forecast.reserve_beds')}: <b class="text-cyan-300">${row.beds}</b></span></div></div></div>`).join('') : `<div class="empty-state"><div class="icon">+</div><div class="title">${t('forecast.no_data')}</div></div>`}</div></section><p class="text-xs text-slate-500">${t('forecast.disclaimer')}</p></div>`;
    container.querySelector('#forecast-scenario').onchange = event => { preferences.scenario = event.target.value; render(); };
    container.querySelector('#forecast-horizon').onchange = event => { preferences.horizon = Number(event.target.value); render(); };
    container.querySelector('#forecast-threshold').onchange = event => { preferences.threshold = Math.min(98, Math.max(60, Number(event.target.value) || 85)); render(); };
    container.querySelector('#forecast-save').onclick = persist;
    container.querySelector('#forecast-export').onclick = () => exportReport(rows);
  };
  render();
}
