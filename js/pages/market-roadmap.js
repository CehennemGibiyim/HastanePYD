// ===== PAZAR KIYASLAMA VE ENTEGRASYON YOL HARITASI =====
import { readPlatform, writePlatform, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const ROADMAP_KEY = 'market_roadmap';
const FILTERS = ['all', 'missing', 'partial', 'ready'];

const systems = [
  { id: 'fhir', name: 'market.fhir_name', area: 'market.clinical', status: 'partial', priority: 'high', score: 55, next: 'market.fhir_next', desc: 'market.fhir_desc' },
  { id: 'sso', name: 'market.sso_name', area: 'market.security', status: 'partial', priority: 'high', score: 60, next: 'market.sso_next', desc: 'market.sso_desc' },
  { id: 'pacs', name: 'market.pacs_name', area: 'market.clinical', status: 'missing', priority: 'high', score: 20, next: 'market.pacs_next', desc: 'market.pacs_desc' },
  { id: 'lis', name: 'market.lis_name', area: 'market.clinical', status: 'partial', priority: 'high', score: 45, next: 'market.lis_next', desc: 'market.lis_desc' },
  { id: 'revenue', name: 'market.revenue_name', area: 'market.finance', status: 'partial', priority: 'high', score: 58, next: 'market.revenue_next', desc: 'market.revenue_desc' },
  { id: 'pharmacy', name: 'market.pharmacy_name', area: 'market.clinical', status: 'missing', priority: 'medium', score: 25, next: 'market.pharmacy_next', desc: 'market.pharmacy_desc' },
  { id: 'patient-crm', name: 'market.patient_crm_name', area: 'market.patient', status: 'partial', priority: 'medium', score: 72, next: 'market.patient_crm_next', desc: 'market.patient_crm_desc' },
  { id: 'mobile', name: 'market.mobile_name', area: 'market.experience', status: 'ready', priority: 'medium', score: 90, next: 'market.mobile_next', desc: 'market.mobile_desc' },
  { id: 'cyber', name: 'market.cyber_name', area: 'market.security', status: 'partial', priority: 'high', score: 50, next: 'market.cyber_next', desc: 'market.cyber_desc' },
  { id: 'bi', name: 'market.bi_name', area: 'market.management', status: 'ready', priority: 'medium', score: 85, next: 'market.bi_next', desc: 'market.bi_desc' },
];

export async function renderMarketRoadmapPage(container) {
  const saved = await readPlatform(ROADMAP_KEY, []);
  let roadmap = Array.isArray(saved) ? saved : [];
  let filter = 'all';

  const render = () => {
    const counts = FILTERS.reduce((result, key) => {
      result[key] = key === 'all' ? systems.length : systems.filter(item => item.status === key).length;
      return result;
    }, {});
    const average = Math.round(systems.reduce((sum, item) => sum + item.score, 0) / systems.length);
    const visible = filter === 'all' ? systems : systems.filter(item => item.status === filter);
    container.innerHTML = `<div class="fade-in space-y-5 market-page">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div><p class="text-xs uppercase tracking-widest text-cyan-300">${t('market.eyebrow')}</p><h1 class="text-2xl font-bold text-white mt-1">${t('market.title')}</h1><p class="text-slate-400 text-sm mt-1 max-w-3xl">${t('market.subtitle')}</p></div>
        <div class="flex gap-2"><button id="market-export" class="btn-secondary text-xs">${t('market.export')}</button><button id="market-refresh" class="btn-primary text-xs">${t('market.refresh')}</button></div>
      </header>
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="card market-stat"><span class="market-stat-label">${t('market.coverage')}</span><strong>${average}%</strong><span>${t('market.coverage_note')}</span></div>
        <div class="card market-stat"><span class="market-stat-label">${t('market.missing')}</span><strong class="text-red-300">${counts.missing}</strong><span>${t('market.missing_note')}</span></div>
        <div class="card market-stat"><span class="market-stat-label">${t('market.partial')}</span><strong class="text-amber-300">${counts.partial}</strong><span>${t('market.partial_note')}</span></div>
        <div class="card market-stat"><span class="market-stat-label">${t('market.roadmap')}</span><strong class="text-cyan-300">${roadmap.length}</strong><span>${t('market.roadmap_note')}</span></div>
      </section>
      <section class="card market-callout"><div class="market-callout-icon">i</div><div><h2 class="text-sm font-semibold text-white">${t('market.callout_title')}</h2><p class="text-xs text-slate-400 mt-1">${t('market.callout_desc')}</p></div></section>
      <div class="grid xl:grid-cols-[1fr_340px] gap-5 items-start">
        <section><div class="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="${t('market.filter_label')}">${FILTERS.map(key => `<button class="market-filter ${filter === key ? 'active' : ''}" data-filter="${key}" role="tab" aria-selected="${filter === key}">${t(`market.filter_${key}`)} <span>${key === 'all' ? counts.all : counts[key]}</span></button>`).join('')}</div><div class="grid md:grid-cols-2 gap-3">${visible.map(cardTemplate).join('')}</div></section>
        <aside class="card sticky top-4"><div class="flex items-center justify-between gap-2 mb-3"><div><p class="text-xs uppercase tracking-widest text-cyan-300">${t('market.roadmap_eyebrow')}</p><h2 class="text-lg font-semibold text-white">${t('market.roadmap_title')}</h2></div><span class="status-pill status-watch">${roadmap.length}</span></div>${roadmap.length ? `<div class="space-y-2">${roadmap.map(item => `<div class="roadmap-item"><div><p class="text-sm text-white">${t(item.name)}</p><p class="text-xs text-slate-500">${t(`market.priority_${item.priority}`)} · ${t('market.next_step')}</p></div><button class="icon-button" data-remove="${esc(item.id)}" aria-label="${t('market.remove')}" title="${t('market.remove')}">×</button></div>`).join('')}</div>` : `<div class="empty-state py-6"><div class="icon">+</div><div class="title">${t('market.roadmap_empty')}</div><p>${t('market.roadmap_empty_desc')}</p></div>`}<p class="text-[11px] text-slate-500 mt-4">${t('market.roadmap_persistence')}</p></aside>
      </div>
    </div>`;
    wire();
  };

  const persist = async () => { await writePlatform(ROADMAP_KEY, roadmap); };
  const add = async (id) => {
    const item = systems.find(system => system.id === id);
    if (!item || roadmap.some(entry => entry.id === id)) return;
    roadmap = [...roadmap, { id: item.id, name: item.name, priority: item.priority }];
    await persist(); showToast(t('market.added'), 'success'); render();
  };
  const remove = async (id) => { roadmap = roadmap.filter(item => item.id !== id); await persist(); showToast(t('market.removed'), 'success'); render(); };
  const wire = () => {
    container.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { filter = button.dataset.filter; render(); });
    container.querySelectorAll('[data-add]').forEach(button => button.onclick = () => add(button.dataset.add));
    container.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => remove(button.dataset.remove));
    container.querySelector('#market-refresh').onclick = () => { showToast(t('market.refreshed'), 'success'); render(); };
    container.querySelector('#market-export').onclick = exportReport;
  };
  const exportReport = () => {
    const rows = [[t('market.csv_system'), t('market.csv_area'), t('market.csv_status'), t('market.csv_priority'), t('market.csv_score')], ...systems.map(item => [t(item.name), t(item.area), t(`market.status_${item.status}`), t(`market.priority_${item.priority}`), `${item.score}%`])];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' })); link.download = 'hastane-pys-pazar-analizi.csv'; link.click(); URL.revokeObjectURL(link.href); showToast(t('market.exported'), 'success');
  };
  render();
}

function cardTemplate(item) {
  return `<article class="market-card"><div class="flex items-start justify-between gap-3"><div><span class="text-[10px] uppercase tracking-widest text-slate-500">${t(item.area)}</span><h3 class="text-base font-semibold text-white mt-1">${t(item.name)}</h3></div><span class="market-status status-${item.status}">${t(`market.status_${item.status}`)}</span></div><p class="text-xs text-slate-400 mt-3 leading-relaxed">${t(item.desc)}</p><div class="mt-4"><div class="flex justify-between text-[11px] text-slate-500 mb-1"><span>${t('market.readiness')}</span><span>${item.score}%</span></div><div class="market-progress"><i style="width:${item.score}%"></i></div></div><div class="flex items-center justify-between gap-2 mt-4"><span class="text-xs ${item.priority === 'high' ? 'text-red-300' : 'text-amber-300'}">${t(`market.priority_${item.priority}`)}</span>${item.status === 'ready' ? `<span class="text-xs text-emerald-300">${t('market.in_place')}</span>` : `<button class="btn-secondary text-xs" data-add="${item.id}">${t('market.add_to_roadmap')}</button>`}</div><p class="text-[11px] text-slate-500 mt-3 border-t border-white/5 pt-3"><strong class="text-slate-400">${t('market.next_step')}:</strong> ${t(item.next)}</p></article>`;
  return `<article class="market-card"><div class="flex items-start justify-between gap-3"><div><span class="text-[10px] uppercase tracking-widest text-slate-500">${t(item.area)}</span><h3 class="text-base font-semibold text-white mt-1">${t(item.name)}</h3></div><span class="market-status status-${item.status}">${t(`market.status_${item.status}`)}</span></div><p class="text-xs text-slate-400 mt-3 leading-relaxed">${t(item.desc)}</p><div class="mt-4"><div class="flex justify-between text-[11px] text-slate-500 mb-1"><span>${t('market.readiness')}</span><span>${item.score}%</span></div><div class="market-progress"><i style="width:${item.score}%"></i></div></div><div class="flex items-center justify-between gap-2 mt-4"><span class="text-xs ${item.priority === 'high' ? 'text-red-300' : 'text-amber-300'}">${t(`market.priority_${item.priority}`)}</span>${item.status === 'ready' ? `<span class="text-xs text-emerald-300">${t('market.in_place')}</span>` : `<button class="btn-secondary text-xs" data-add="${item.id}">${t('market.add_to_roadmap')}</button>`}</div><p class="text-[11px] text-slate-500 mt-3 border-t border-white/5 pt-3"><strong class="text-slate-400">${t('market.next_step')}:</strong> ${t(item.next)}</p></article>`;
}
