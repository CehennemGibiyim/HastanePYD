// ===== ACCESSIBILITY & THEME CUSTOMIZATION =====
import { showToast } from '../notifications.js';

const save = (key, data) => localStorage.setItem('hospital_' + key, JSON.stringify(data));
const load = (key) => { try { return JSON.parse(localStorage.getItem('hospital_' + key)); } catch { return null; } };

export function renderAccessibilityPage(el) {
  const settings = load('accessibility') || { fontSize: 'normal', contrast: 'normal', compactMode: false, reduceMotion: false, focusIndicators: true, colorTheme: 'cyan' };

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">♿ Erişilebilirlik & Tema</h1>
      <p class="text-slate-400 text-sm mt-1">Görünüm, erişilebilirlik ve tema özelleştirme</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in">
      <!-- Font Size -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">🔤 Yazı Boyutu</h3>
        <div class="flex flex-wrap gap-3">
          ${['small', 'normal', 'large', 'xlarge'].map(size => `
            <button data-font-size="${size}" class="flex-1 min-w-[80px] rounded-xl p-3 text-center transition ${settings.fontSize === size ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300' : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'}">
              <span class="text-${size === 'small' ? 'xs' : size === 'normal' ? 'sm' : size === 'large' ? 'base' : 'lg'} font-bold">Aa</span>
              <p class="text-[10px] mt-1">${size === 'small' ? 'Küçük' : size === 'normal' ? 'Normal' : size === 'large' ? 'Büyük' : 'Çok Büyük'}</p>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Contrast -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">🎨 Kontrast</h3>
        <div class="flex flex-wrap gap-3">
          ${['normal', 'high', 'higher'].map(c => `
            <button data-contrast="${c}" class="flex-1 min-w-[80px] rounded-xl p-3 text-center transition ${settings.contrast === c ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300' : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'}">
              <span class="font-bold">${c === 'normal' ? '◻️' : c === 'high' ? '◼️' : '⬛'}</span>
              <p class="text-[10px] mt-1">${c === 'normal' ? 'Normal' : c === 'high' ? 'Yüksek' : 'Çok Yüksek'}</p>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Color Theme -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">🎨 Tema Rengi</h3>
        <div class="flex flex-wrap gap-3">
          ${[
            { id: 'cyan', color: '#22d3ee', label: 'Cyan' },
            { id: 'blue', color: '#3b82f6', label: 'Mavi' },
            { id: 'purple', color: '#8b5cf6', label: 'Mor' },
            { id: 'green', color: '#22c55e', label: 'Yeşil' },
            { id: 'amber', color: '#f59e0b', label: 'Amber' },
            { id: 'rose', color: '#f43f5e', label: 'Kırmızı' },
          ].map(c => `
            <button data-color-theme="${c.id}" class="w-12 h-12 rounded-xl border-2 transition ${settings.colorTheme === c.id ? 'border-white scale-110' : 'border-white/10 hover:border-white/30'}" style="background:${c.color}" title="${c.label}"></button>
          `).join('')}
        </div>
      </div>

      <!-- Toggle Options -->
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">⚙️ Seçenekler</h3>
        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer">
            <div><p class="text-sm text-white">📐 Kompakt Mod</p><p class="text-xs text-slate-500">Daha fazla veri görmek için sıkışık görünüm</p></div>
            <input type="checkbox" id="opt-compact" class="w-5 h-5" ${settings.compactMode ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <div><p class="text-sm text-white">🎬 Animasyonları Azalt</p><p class="text-xs text-slate-500">Hareket hassasiyeti için</p></div>
            <input type="checkbox" id="opt-motion" class="w-5 h-5" ${settings.reduceMotion ? 'checked' : ''}>
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <div><p class="text-sm text-white">🔲 Odak Göstergeleri</p><p class="text-xs text-slate-500">Klavye navigasyonu için belirgin odak halkaları</p></div>
            <input type="checkbox" id="opt-focus" class="w-5 h-5" ${settings.focusIndicators ? 'checked' : ''}>
          </label>
        </div>
      </div>
    </div>

    <!-- Keyboard Shortcuts -->
    <div class="card mt-6 fade-in">
      <h3 class="text-base font-semibold text-white mb-4">⌨️ Klavye Kısayolları</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${[
          ['Ctrl + K', 'Komut Paleti Aç'],
          ['Ctrl + /', 'Arama Odakla'],
          ['Esc', 'Modal Kapat'],
          ['Tab', 'Sonraki Alan'],
          ['Shift + Tab', 'Önceki Alan'],
          ['Enter', 'Form Gönder'],
        ].map(([key, desc]) => `
          <div class="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
            <kbd class="px-2 py-1 rounded bg-white/10 text-xs font-mono text-slate-300">${key}</kbd>
            <span class="text-sm text-slate-400">${desc}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Preview -->
    <div class="card mt-6 fade-in">
      <h3 class="text-base font-semibold text-white mb-4">👁️ Önizleme</h3>
      <div id="a11y-preview" class="rounded-xl bg-white/5 border border-white/10 p-4">
        <h4 class="text-lg font-bold text-white mb-2">Örnek Başlık</h4>
        <p class="text-sm text-slate-300 mb-3">Bu bir örnek metindir. Yazı boyutu ve kontrast ayarlarınızın etkisini burada görebilirsiniz.</p>
        <div class="flex gap-2">
          <button class="btn-primary text-sm">Birincil Buton</button>
          <button class="btn-secondary text-sm">İkincil Buton</button>
        </div>
      </div>
    </div>`;

  // Font size handlers
  document.querySelectorAll('[data-font-size]').forEach(btn => {
    btn.onclick = () => {
      settings.fontSize = btn.dataset.fontSize;
      applyAccessibility(settings);
      save('accessibility', settings);
      renderAccessibilityPage(el);
    };
  });

  // Contrast handlers
  document.querySelectorAll('[data-contrast]').forEach(btn => {
    btn.onclick = () => {
      settings.contrast = btn.dataset.contrast;
      applyAccessibility(settings);
      save('accessibility', settings);
      renderAccessibilityPage(el);
    };
  });

  // Color theme handlers
  document.querySelectorAll('[data-color-theme]').forEach(btn => {
    btn.onclick = () => {
      settings.colorTheme = btn.dataset.colorTheme;
      applyAccessibility(settings);
      save('accessibility', settings);
      renderAccessibilityPage(el);
    };
  });

  // Toggle handlers
  document.getElementById('opt-compact').onchange = (e) => { settings.compactMode = e.target.checked; applyAccessibility(settings); save('accessibility', settings); };
  document.getElementById('opt-motion').onchange = (e) => { settings.reduceMotion = e.target.checked; applyAccessibility(settings); save('accessibility', settings); };
  document.getElementById('opt-focus').onchange = (e) => { settings.focusIndicators = e.target.checked; applyAccessibility(settings); save('accessibility', settings); };
}

export function applyAccessibility(settings) {
  if (!settings) settings = load('accessibility') || {};
  const root = document.documentElement;

  // Font size
  const fontSizes = { small: '14px', normal: '16px', large: '18px', xlarge: '20px' };
  root.style.fontSize = fontSizes[settings.fontSize] || '16px';

  // Compact mode
  root.classList.toggle('compact-mode', !!settings.compactMode);

  // Reduce motion
  if (settings.reduceMotion) {
    root.style.setProperty('--animation-duration', '0s');
    root.style.setProperty('--transition-duration', '0s');
  } else {
    root.style.removeProperty('--animation-duration');
    root.style.removeProperty('--transition-duration');
  }

  // Focus indicators
  root.classList.toggle('enhanced-focus', !!settings.focusIndicators);

  // Color theme
  const colorMap = {
    cyan: { primary: '#22d3ee', hover: '#67e8f9', bg: 'rgba(34,211,238,', text: '#67e8f9' },
    blue: { primary: '#3b82f6', hover: '#60a5fa', bg: 'rgba(59,130,246,', text: '#60a5fa' },
    purple: { primary: '#8b5cf6', hover: '#a78bfa', bg: 'rgba(139,92,246,', text: '#a78bfa' },
    green: { primary: '#22c55e', hover: '#4ade80', bg: 'rgba(34,197,94,', text: '#4ade80' },
    amber: { primary: '#f59e0b', hover: '#fbbf24', bg: 'rgba(245,158,11,', text: '#fbbf24' },
    rose: { primary: '#f43f5e', hover: '#fb7185', bg: 'rgba(244,63,94,', text: '#fb7185' },
  };
  const themeColor = colorMap[settings.colorTheme] || colorMap.cyan;
  root.style.setProperty('--theme-primary', themeColor.primary);
  root.style.setProperty('--theme-hover', themeColor.hover);
  root.style.setProperty('--theme-bg', themeColor.bg);
  root.setAttribute('data-theme-color', settings.colorTheme || 'cyan');
}
