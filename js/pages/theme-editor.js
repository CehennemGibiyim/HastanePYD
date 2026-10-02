// ===== TEMA DÜZENLEYİCİ =====
import { showToast } from '../notifications.js';

const FONT_OPTIONS = [
  { id: 'Inter', label: 'Inter (Varsayılan)' },
  { id: 'Roboto', label: 'Roboto' },
  { id: 'Open Sans', label: 'Open Sans' },
  { id: 'Noto Sans', label: 'Noto Sans' },
  { id: 'Poppins', label: 'Poppins' },
  { id: 'Lato', label: 'Lato' },
];

const THEME_PRESETS = [
  { id: 'ocean', name: 'Okyanus', primary: '#0891b2', bg: '#0f172a', desc: 'Klasik cyan tema' },
  { id: 'forest', name: 'Orman', primary: '#22c55e', bg: '#0a1a0f', desc: 'Doğal yeşil tema' },
  { id: 'night', name: 'Gece', primary: '#8b5cf6', bg: '#0c0a1a', desc: 'Mor gece teması' },
  { id: 'sunset', name: 'Gün Batımı', primary: '#f59e0b', bg: '#1a0f05', desc: 'Sıcak amber tema' },
  { id: 'rose', name: 'Gül', primary: '#f43f5e', bg: '#1a0a0f', desc: 'Pembe-kırmızı tema' },
  { id: 'arctic', name: 'Kutup', primary: '#38bdf8', bg: '#0a1525', desc: 'Buz mavisi tema' },
];

export function renderThemeEditorPage(container) {
  const current = getThemeConfig();
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">🎨 Tema Düzenleyici</h1>
          <p class="text-slate-400 text-sm mt-1">Renk, font ve görünüm ayarları</p>
        </div>
        <div class="flex gap-2">
          <button id="te-reset" class="btn-secondary">🔄 Sıfırla</button>
          <button id="te-save" class="btn-primary">💾 Kaydet</button>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🎨 Hazır Temalar</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            ${THEME_PRESETS.map(t => `
              <button class="te-preset rounded-xl p-4 border-2 transition-all text-left ${current.preset === t.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}"
                      data-preset="${t.id}">
                <div class="flex gap-2 mb-2">
                  <div class="w-6 h-6 rounded-full" style="background:${t.primary}"></div>
                  <div class="w-6 h-6 rounded-full" style="background:${t.bg}"></div>
                </div>
                <p class="text-sm font-medium text-white">${t.name}</p>
                <p class="text-xs text-slate-400">${t.desc}</p>
              </button>`).join('')}
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🔤 Font Ayarları</h3>
          <div class="space-y-4">
            <div>
              <label class="label">Yazı Tipi</label>
              <select id="te-font" class="input-field w-full">
                ${FONT_OPTIONS.map(f => `<option value="${f.id}" ${current.font === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">Font Boyutu: <span id="te-fs-val">${current.fontSize || 14}px</span></label>
              <input id="te-font-size" type="range" min="12" max="20" value="${current.fontSize || 14}" class="w-full accent-cyan-500">
            </div>
            <div>
              <label class="label">Köşe Yuvarlaklığı: <span id="te-radius-val">${current.radius || 12}px</span></label>
              <input id="te-radius" type="range" min="0" max="24" value="${current.radius || 12}" class="w-full accent-cyan-500">
            </div>
            <div>
              <label class="label">Gölge Yoğunluğu: <span id="te-shadow-val">${current.shadow || 1}</span></label>
              <input id="te-shadow" type="range" min="0" max="3" value="${current.shadow || 1}" class="w-full accent-cyan-500">
            </div>
          </div>
        </div>
      </div>
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">👁️ Canlı Önizleme</h3>
        <div id="te-preview" class="rounded-xl p-6 transition-all" style="background:${current.bg || '#0f172a'}; font-family:${current.font || 'Inter'},sans-serif; font-size:${current.fontSize||14}px; border-radius:${current.radius||12}px">
          <div class="flex items-center gap-3 mb-4">
            <button style="background:${current.primary || '#0891b2'}; color:#0f172a; padding:0.5rem 1rem; border-radius:${current.radius||12}px; font-weight:600; font-size:0.875rem; border:none">Ana Buton</button>
            <button style="background:rgba(255,255,255,0.08); color:#e2e8f0; padding:0.5rem 1rem; border-radius:${current.radius||12}px; font-weight:500; font-size:0.875rem; border:1px solid rgba(255,255,255,0.1)">İkincil Buton</button>
          </div>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:${current.radius||12}px; padding:1rem; margin-bottom:1rem">
            <p style="color:white; font-weight:600; margin-bottom:0.5rem">Örnek Kart Başlığı</p>
            <p style="color:#94a3b8; font-size:0.875rem">Bu bir önizleme kartıdır. Tema değişikliklerini burada görebilirsiniz.</p>
          </div>
          <div style="display:flex; gap:0.5rem">
            <span style="background:${current.primary||'#0891b2'}22; color:${current.primary||'#0891b2'}; padding:0.125rem 0.5rem; border-radius:9999px; font-size:0.75rem">Etiket 1</span>
            <span style="background:rgba(34,197,94,0.15); color:#4ade80; padding:0.125rem 0.5rem; border-radius:9999px; font-size:0.75rem">Etiket 2</span>
          </div>
        </div>
      </div>
    </div>`;

  document.querySelectorAll('.te-preset').forEach(btn => {
    btn.onclick = () => {
      const preset = THEME_PRESETS.find(t => t.id === btn.dataset.preset);
      if (!preset) return;
      document.querySelectorAll('.te-preset').forEach(b => b.classList.remove('border-cyan-500','bg-cyan-500/10'));
      btn.classList.add('border-cyan-500','bg-cyan-500/10');
      applyThemePreview(preset.primary, preset.bg);
    };
  });
  document.getElementById('te-font-size').oninput = (e) => { document.getElementById('te-fs-val').textContent = e.target.value+'px'; updatePreview(); };
  document.getElementById('te-radius').oninput = (e) => { document.getElementById('te-radius-val').textContent = e.target.value+'px'; updatePreview(); };
  document.getElementById('te-shadow').oninput = (e) => { document.getElementById('te-shadow-val').textContent = e.target.value; };
  document.getElementById('te-font').onchange = () => updatePreview();
  document.getElementById('te-reset').onclick = () => { localStorage.removeItem('hospital_theme_config'); showToast('Tema sıfırlandı', 'success'); renderThemeEditorPage(container); };
  document.getElementById('te-save').onclick = () => {
    const config = { font: document.getElementById('te-font').value, fontSize: parseInt(document.getElementById('te-font-size').value), radius: parseInt(document.getElementById('te-radius').value), shadow: parseInt(document.getElementById('te-shadow').value) };
    localStorage.setItem('hospital_theme_config', JSON.stringify(config));
    document.documentElement.style.setProperty('--font-family', config.font+',sans-serif');
    document.documentElement.style.setProperty('--base-font-size', config.fontSize+'px');
    showToast('Tema kaydedildi!', 'success');
  };
}

function applyThemePreview(primary, bg) {
  const preview = document.getElementById('te-preview');
  if (preview) preview.style.background = bg;
}

function updatePreview() {
  const preview = document.getElementById('te-preview');
  if (!preview) return;
  preview.style.fontFamily = document.getElementById('te-font').value + ',sans-serif';
  preview.style.fontSize = document.getElementById('te-font-size').value + 'px';
  preview.style.borderRadius = document.getElementById('te-radius').value + 'px';
}

function getThemeConfig() { try { return JSON.parse(localStorage.getItem('hospital_theme_config') || '{}'); } catch { return {}; } }
