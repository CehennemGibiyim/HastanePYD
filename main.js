// ===== HASTANE PYS - GÜVENLİ BAŞLANGIÇ =====
import { hydrateCentralStorage } from './js/services/central-storage-bridge.js?build=v88';
import { initProjectDownload } from './js/utils/project-archive.js?build=v91';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;

async function boot() {
  try {
    await hydrateCentralStorage();
    const app = await import('./js/app-core.js?build=v88');
    app.initApp();
  } catch (error) {
    console.error('[Hastane PYS] Çekirdek uygulama başlatılamadı', error);
    showBootError(error);
    return;
  }
  await loadOptional('./js/hr-suite.js?build=v88', 'initHRSuite');
  await loadOptional('./js/platform-suite.js?build=v88', 'initPlatformSuite');
  setupMobileMenu();
  initProjectDownload();
}

async function loadOptional(path, initializer) {
  try {
    const module = await import(path);
    if (typeof module[initializer] === 'function') await module[initializer]();
  } catch (error) {
    document.documentElement.dataset.optionalModuleError = path;
  }
}

function showBootError(error) {
  const login = document.getElementById('login-screen');
  if (!login) return;
  login.classList.remove('hidden');
  login.replaceChildren();
  const box = document.createElement('div'); box.className = 'card max-w-md text-center';
  const title = document.createElement('h1'); title.className = 'text-xl font-bold text-white'; title.textContent = t('platform.startup_failed');
  const message = document.createElement('p'); message.className = 'mt-2 text-sm text-slate-400'; message.textContent = t('platform.page_error');
  const retry = document.createElement('button'); retry.className = 'btn-primary mt-5'; retry.textContent = t('platform.refresh'); retry.onclick = () => location.reload();
  box.append(title, message, retry); login.append(box);
  document.documentElement.dataset.bootError = error?.name || 'startup';
}

function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  const overlay = document.getElementById('mobile-overlay');
  if (!btn || !menu) return;
  const mobileSidebar = () => document.getElementById('mobile-sidebar');
  const setOpen = (open) => {
    menu.classList.toggle('hidden', !open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) requestAnimationFrame(() => mobileSidebar()?.classList.remove('-translate-x-full'));
    else mobileSidebar()?.classList.add('-translate-x-full');
  };
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
  overlay?.addEventListener('click', () => setOpen(false));
  document.getElementById('mobile-notif-btn')?.addEventListener('click', () => {
    const bell = document.getElementById('notif-bell');
    if (bell) bell.click();
    else location.hash = 'announcements';
  });
  document.getElementById('topbar-notif-btn')?.addEventListener('click', () => {
    const bell = document.getElementById('notif-bell');
    if (bell) bell.click();
    else location.hash = 'announcements';
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) setOpen(false); });
}

document.addEventListener('DOMContentLoaded', boot);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?build=v91').catch(() => {});
