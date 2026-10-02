// ===== 20 ÖNCELİKLİ İYİLEŞTİRME - PLATFORM ROUTER =====
import { renderPlatformCommandPage } from './pages/platform-command.js';
import { renderPersonnel360Page } from './pages/personnel-360.js';
import { renderGovernancePage } from './pages/governance.js';
import { renderWorkforceSafetyPage } from './pages/workforce-safety.js';
import { renderEmployeeOperationsPage } from './pages/employee-operations.js';
import { renderIntegrationPlanningPage } from './pages/integration-planning.js';
import { renderPlatformAIPage } from './pages/platform-ai.js';

const routes={
  'platform-command':renderPlatformCommandPage,
  'personnel-360':renderPersonnel360Page,
  'governance':renderGovernancePage,
  'workforce-safety':renderWorkforceSafetyPage,
  'employee-operations':renderEmployeeOperationsPage,
  'planning':renderIntegrationPlanningPage,
  'integrations':renderIntegrationPlanningPage,
  'platform-ai':renderPlatformAIPage,
};
const t=(key,values)=>window.miniappI18n?.t(key,values)??key;

export function initPlatformSuite(){
  window.addEventListener('hashchange',renderPlatformRoute);
  const observer=new MutationObserver(injectNavigation);
  ['sidebar','mobile-sidebar'].forEach(id=>{const node=document.getElementById(id);if(node)observer.observe(node,{childList:true,subtree:true});});
  injectNavigation();
  renderPlatformRoute();
}
function renderPlatformRoute(){
  const route=location.hash.slice(1).split('/')[0],renderer=routes[route];
  if(!renderer)return;
  const content=document.getElementById('content');
  if(content)renderer(content).catch(()=>{content.innerHTML=`<div class="card text-red-300">${t('platform.page_error')}</div>`;});
  requestAnimationFrame(()=>document.querySelectorAll('[data-platform-route]').forEach(x=>x.classList.toggle('bg-white/10',x.dataset.platformRoute===route)));
}
function injectNavigation(){
  ['sidebar','mobile-sidebar'].forEach(id=>{
    const root=document.getElementById(id),nav=root?.querySelector('nav');
    if(!nav||nav.querySelector('[data-platform-suite]'))return;
    const wrap=document.createElement('div');wrap.dataset.platformSuite='true';wrap.className='mb-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-2';
    wrap.innerHTML=`<p class="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-cyan-300">${t('platform.group')}</p>${item('platform-command','▦','platform.command_short')}${item('personnel-360','◉','platform.people')}${item('governance','⌁','platform.governance')}${item('workforce-safety','◇','platform.workforce')}${item('employee-operations','◆','platform.operations')}${item('planning','△','platform.planning')}${item('platform-ai','✦','platform.ai_summary')}`;
    nav.prepend(wrap);
    wrap.querySelectorAll('[data-platform-route]').forEach(link=>link.onclick=e=>{e.preventDefault();location.hash=link.dataset.platformRoute;document.getElementById('mobile-menu')?.classList.add('hidden');});
  });
}
function item(route,icon,key){return `<a href="#${route}" data-platform-route="${route}" class="nav-item flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white transition"><span>${icon}</span><span>${t(key)}</span></a>`;}
