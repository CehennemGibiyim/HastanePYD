/* GitHub Pages fallback: keeps the static demo usable outside Miniapps. */
(function () {
  if (window.miniappI18n) return;

  const localeUrl = new URL('./locales/tr.json', document.baseURI).href;
  let catalog = {};
  const readPath = (key) => String(key || '').split('.').reduce((value, part) => value && typeof value === 'object' ? value[part] : undefined, catalog);
  const interpolate = (value, values) => String(value).replace(/\{([^}]+)\}/g, (_, name) => values && values[name] !== undefined ? String(values[name]) : `{${name}}`);
  const fallback = {
    t(key, values) { const value = readPath(key); return interpolate(value === undefined ? key : value, values); },
    getContext() { return { resolvedLocale: 'tr', dir: 'ltr', availableLocales: ['tr'], canChangeLocale: false }; },
    async setLocale() { return false; },
  };
  window.miniappI18n = fallback;
  window.__githubI18nReady = fetch(localeUrl, { cache: 'no-cache' })
    .then(response => response.ok ? response.json() : {})
    .then(data => { if (data && typeof data === 'object') catalog = data; return fallback; })
    .catch(() => fallback);

  if (!window.miniappsAI) {
    window.__githubPagesMode = true;
    const storage = {
      async getItem(key) { try { return localStorage.getItem(`github_${key}`); } catch { return null; } },
      async setItem(key, value) { try { localStorage.setItem(`github_${key}`, String(value)); return true; } catch { return false; } },
      async removeItem(key) { try { localStorage.removeItem(`github_${key}`); return true; } catch { return false; } },
    };
    // The static GitHub Pages build has no Miniapps account storage, so use
    // browser storage for demo/test persistence without changing app modules.
    window.miniappsAI = { storage };
  }
})();
