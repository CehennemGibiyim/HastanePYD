// ===== ÇOKLU DİL DESTEĞİ =====
import { showToast } from '../notifications.js';

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', native: 'Türkçe', flag: '🇹🇷', rtl: false, progress: 100, status: 'complete' },
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', rtl: false, progress: 78, status: 'partial' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦', rtl: true, progress: 45, status: 'partial' },
  { code: 'ku', name: 'Kurdish', native: 'Kurdî', flag: '🟡', rtl: false, progress: 12, status: 'incomplete' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪', rtl: false, progress: 35, status: 'partial' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺', rtl: false, progress: 20, status: 'incomplete' },
];

const TRANSLATION_STATS = {
  totalKeys: 342,
  translated: { tr: 342, en: 267, ar: 154, ku: 41, de: 120, ru: 68 },
  missing: { tr: 0, en: 75, ar: 188, ku: 301, de: 222, ru: 274 },
};

export function renderMultiLanguagePage(el) {
  let currentLang = 'tr';
  let activeTab = 'overview';

  function render() {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">🌐 Çoklu Dil Desteği</h1>
        <p class="text-slate-400 text-sm mt-1">Dil yönetimi, çeviri durumu ve RTL desteği</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
        <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${LANGUAGES.length}</p><p class="text-xs text-slate-400">Desteklenen Dil</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-green-300">${TRANSLATION_STATS.totalKeys}</p><p class="text-xs text-slate-400">Toplam Anahtar</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${LANGUAGES.filter(l => l.status === 'complete').length}</p><p class="text-xs text-slate-400">Tamamlanan Dil</p></div>
        <div class="card text-center"><p class="text-2xl font-bold text-purple-300">${LANGUAGES.filter(l => l.rtl).length}</p><p class="text-xs text-slate-400">RTL Destekli</p></div>
      </div>

      <div class="flex gap-2 mb-6 flex-wrap fade-in">
        <button data-tab="overview" class="ml-tab ${activeTab === 'overview' ? 'tab-active' : 'tab-inactive'}">📊 Genel Bakış</button>
        <button data-tab="manage" class="ml-tab ${activeTab === 'manage' ? 'tab-active' : 'tab-inactive'}">⚙️ Dil Yönetimi</button>
        <button data-tab="preview" class="ml-tab ${activeTab === 'preview' ? 'tab-active' : 'tab-inactive'}">👁️ Önizleme</button>
      </div>

      <div id="ml-content" class="fade-in"></div>`;

    document.querySelectorAll('.ml-tab').forEach(btn => {
      btn.onclick = () => { activeTab = btn.dataset.tab; render(); };
    });

    const content = document.getElementById('ml-content');
    if (activeTab === 'overview') renderOverview(content);
    else if (activeTab === 'manage') renderManage(content);
    else renderPreview(content);
  }

  function renderOverview(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        ${LANGUAGES.map(l => `
          <div class="card ${l.code === currentLang ? 'border-cyan-500/30' : ''}">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">${l.flag}</span>
                <div>
                  <h4 class="text-sm font-semibold text-white">${l.name}</h4>
                  <p class="text-xs text-slate-400">${l.native}</p>
                </div>
              </div>
              <span class="badge ${l.status === 'complete' ? 'bg-green-500/20 text-green-300' : l.status === 'partial' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'} text-[10px]">
                ${l.status === 'complete' ? '✓ Tam' : l.status === 'partial' ? ' Kısmi' : '✗ Eksik'}
              </span>
            </div>
            <div class="h-3 rounded-full bg-white/10 overflow-hidden mb-2">
              <div class="h-full rounded-full ${l.progress >= 80 ? 'bg-green-400' : l.progress >= 40 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${l.progress}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400">${l.progress}% çevrildi</span>
              ${l.rtl ? '<span class="badge bg-purple-500/20 text-purple-300 text-[10px]">RTL</span>' : ''}
            </div>
            <p class="text-[10px] text-slate-500 mt-1">${TRANSLATION_STATS.translated[l.code]}/${TRANSLATION_STATS.totalKeys} anahtar</p>
          </div>`).join('')}
      </div>

      <div class="card">
        <h3 class="text-base font-semibold text-white mb-3">📊 Çeviri İlerleme Grafiği</h3>
        <div class="space-y-3">
          ${LANGUAGES.map(l => `
            <div class="flex items-center gap-3">
              <span class="text-sm w-20">${l.flag} ${l.code.toUpperCase()}</span>
              <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden relative">
                <div class="h-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-end pr-2 transition-all" style="width:${l.progress}%">
                  <span class="text-[10px] font-bold text-white">${l.progress}%</span>
                </div>
              </div>
              <span class="text-xs text-slate-500 w-16 text-right">${TRANSLATION_STATS.missing[l.code]} eksik</span>
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderManage(container) {
    container.innerHTML = `
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">⚙️ Aktif Dil Seçimi</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          ${LANGUAGES.map(l => `
            <button data-set-lang="${l.code}" class="rounded-xl border ${currentLang === l.code ? 'border-cyan-500/30 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:bg-white/8'} p-4 text-left transition">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xl">${l.flag}</span>
                <span class="text-sm font-medium text-white">${l.name}</span>
              </div>
              <p class="text-xs text-slate-400">${l.native}</p>
              ${currentLang === l.code ? '<span class="badge bg-cyan-500/20 text-cyan-300 text-[10px] mt-2">✓ Aktif</span>' : ''}
            </button>`).join('')}
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🔄 RTL Desteği</h3>
        <p class="text-sm text-slate-300 mb-3">Sağdan sola yazılan diller (Arapça, İbranice, Farsça) için otomatik layout desteği</p>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="rtl-toggle" class="w-5 h-5 rounded" ${LANGUAGES.find(l => l.code === currentLang)?.rtl ? 'checked' : ''}>
            <span class="text-sm text-slate-300">RTL modu otomatik algıla</span>
          </label>
        </div>
      </div>`;
  }

  function renderPreview(container) {
    const lang = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
    const sampleTexts = {
      tr: { greeting: 'Merhaba', farewell: 'Hoşça kalın', login: 'Giriş Yap', logout: 'Çıkış Yap', save: 'Kaydet', cancel: 'İptal', personnel: 'Personel', schedule: 'Nöbet Listesi' },
      en: { greeting: 'Hello', farewell: 'Goodbye', login: 'Log In', logout: 'Log Out', save: 'Save', cancel: 'Cancel', personnel: 'Personnel', schedule: 'Schedule' },
      ar: { greeting: 'مرحبا', farewell: 'مع السلامة', login: 'تسجيل الدخول', logout: 'تسجيل الخروج', save: 'حفظ', cancel: 'إلغاء', personnel: 'الموظفون', schedule: 'الجدول' },
      ku: { greeting: 'Silav', farewell: 'Xwedê ew le', login: 'Têketin', logout: 'Derketin', save: 'Tomarkirin', cancel: 'Betal kirin', personnel: 'Personal', schedule: 'Rêzûkirin' },
      de: { greeting: 'Hallo', farewell: 'Auf Wiedersehen', login: 'Anmelden', logout: 'Abmelden', save: 'Speichern', cancel: 'Abbrechen', personnel: 'Personal', schedule: 'Dienstplan' },
      ru: { greeting: 'Здравствуйте', farewell: 'До свидания', login: 'Войти', logout: 'Выйти', save: 'Сохранить', cancel: 'Отмена', personnel: 'Персонал', schedule: 'Расписание' },
    };
    const texts = sampleTexts[currentLang] || sampleTexts.tr;

    container.innerHTML = `
      <div class="card">
        <h3 class="text-base font-semibold text-white mb-4">👁️ Dil Önizleme: ${lang.flag} ${lang.name}</h3>
        <div class="rounded-xl bg-white/5 border border-white/10 p-6" dir="${lang.rtl ? 'rtl' : 'ltr'}">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            ${Object.entries(texts).map(([key, val]) => `
              <div class="rounded-lg bg-white/5 p-3 text-center">
                <p class="text-[10px] text-slate-500 mb-1">${key}</p>
                <p class="text-sm font-medium text-white">${val}</p>
              </div>`).join('')}
          </div>
          <div class="flex gap-3 justify-center">
            <button class="btn-primary">${texts.login}</button>
            <button class="btn-secondary">${texts.cancel}</button>
          </div>
        </div>
      </div>`;
  }

  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    btn.onclick = () => {
      currentLang = btn.dataset.setLang;
      showToast(`Dil değiştirildi: ${LANGUAGES.find(l => l.code === currentLang)?.name}`, 'success');
      render();
    };
  });

  render();
}
