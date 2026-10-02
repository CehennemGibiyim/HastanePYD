// ===== ENTERPRISE HR SUITE ROUTER EXTENSION =====
import { renderEmployeePortalPage } from './pages/employee-portal.js';
import { renderWorkflowCenterPage } from './pages/workflow-center.js';
import { renderShiftOptimizerPage } from './pages/shift-optimizer.js';
import { renderHRCommandCenterPage } from './pages/hr-command-center.js';

const routes = {
  'hr-command': renderHRCommandCenterPage,
  'employee-portal': renderEmployeePortalPage,
  'workflow-center': renderWorkflowCenterPage,
  'shift-optimizer': renderShiftOptimizerPage,
};
const t = (key) => window.miniappI18n?.t(key) ?? key;

export function initHRSuite() {
  window.addEventListener('hashchange', renderRoute);
  const observer = new MutationObserver(injectNavigation);
  ['sidebar', 'mobile-sidebar'].forEach(id => {
    const node = document.getElementById(id);
    if (node) observer.observe(node, { childList: true, subtree: true });
  });
  injectNavigation();
  renderRoute();
}

function renderRoute() {
  const route = location.hash.slice(1).split('/')[0];
  const renderer = routes[route];
  if (!renderer) return;
  const content = document.getElementById('content');
  if (content) renderer(content);
  requestAnimationFrame(() => markActive(route));
}

function injectNavigation() {
  ['sidebar', 'mobile-sidebar'].forEach(id => {
    const root = document.getElementById(id); const nav = root?.querySelector('nav');
    if (!nav || nav.querySelector('[data-hr-suite]')) return;
    nav.insertAdjacentHTML('afterbegin', `<div data-hr-suite class="mb-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-2"><p class="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-300">${t('hr.nav_group')}</p>${navItem('hr-command', '📊', t('hr.command_short'))}${navItem('employee-portal', '👤', t('hr.portal_short'))}${navItem('workflow-center', '✅', t('hr.workflow_short'))}${navItem('shift-optimizer', '✨', t('hr.optimizer_short'))}</div>`);
    nav.querySelectorAll('[data-hr-route]').forEach(link => link.onclick = event => { event.preventDefault(); location.hash = link.dataset.hrRoute; });
  });
}
function navItem(route, icon, label) { return `<a href="#${route}" data-hr-route="${route}" class="nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition"><span>${icon}</span><span>${label}</span></a>`; }
function markActive(route) { document.querySelectorAll('[data-hr-route]').forEach(link => link.classList.toggle('bg-white/10', link.dataset.hrRoute === route)); }
