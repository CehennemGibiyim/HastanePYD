// ===== DİJİTAL TABELA =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_signage';

function getSignageData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultData(); } catch { return getDefaultData(); }
}
function saveSignageData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getDefaultData() {
  return {
    slides: [
      { id: 1, type: 'announcement', title: 'Hoş Geldiniz', content: 'Devlet Hastanesi Personel Yönetim Sistemi', icon: '🏥', color: 'from-cyan-500/20 to-blue-500/20', duration: 5 },
      { id: 2, type: 'duty', title: 'Bugünkü Nöbetçiler', content: 'Dahiliye: Dr. Mehmet K.\nCerrahi: Dr. Ayşe Y.\nAcil: Dr. Fatma D.', icon: '📋', color: 'from-purple-500/20 to-pink-500/20', duration: 8 },
      { id: 3, type: 'weather', title: 'Hava Durumu', content: '☀️ 32°C - Güneşli\n💧 Nem: %45', icon: '🌤️', color: 'from-amber-500/20 to-orange-500/20', duration: 5 },
      { id: 4, type: 'emergency', title: 'Acil Durum', content: 'Aktif acil durum yok', icon: '🟢', color: 'from-green-500/20 to-emerald-500/20', duration: 3 },
      { id: 5, type: 'info', title: 'Hatırlatma', content: 'Periyodik sağlık kontrollerinizi yaptırmayı unutmayın!', icon: '💊', color: 'from-red-500/20 to-rose-500/20', duration: 5 },
    ],
    settings: { autoPlay: true, transition: 'fade', showClock: true, showWeather: true }
  };
}

export function renderDigitalSignagePage(el) {
  const data = getSignageData();

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📱 Dijital Tabela</h1>
          <p class="text-slate-400 text-sm mt-1">Hastane lobisi TV ekranı için içerik yönetimi</p>
        </div>
        <div class="flex gap-2">
          <button id="preview-signage" class="btn-secondary">👁️ Önizleme</button>
          <button id="add-slide-btn" class="btn-primary">➕ Slayt Ekle</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.slides.length}</p><p class="text-xs text-slate-400">📺 Slayt Sayısı</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${data.slides.reduce((s, sl) => s + (sl.duration || 5), 0)}</p><p class="text-xs text-slate-400">⏱️ Toplam Süre (sn)</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${data.settings.autoPlay ? 'Açık' : 'Kapalı'}</p><p class="text-xs text-slate-400">▶️ Otomatik Oynatma</p></div>
    </div>

    <!-- Slayt Düzenleyici -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📺 Slayt Sırası (Sürükle-bırak ile sıralayın)</h3>
      <div class="space-y-3" id="slide-list">
        ${data.slides.map((slide, idx) => `
          <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4 flex items-center gap-4 slide-item" data-idx="${idx}">
            <div class="text-2xl cursor-grab">⠿</div>
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${slide.color} flex items-center justify-center text-2xl">${slide.icon}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-white text-sm">${slide.title}</h4>
                <span class="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400">${slide.type}</span>
              </div>
              <p class="text-xs text-slate-400 truncate">${slide.content}</p>
              <p class="text-[10px] text-slate-600">⏱️ ${slide.duration} saniye</p>
            </div>
            <div class="flex gap-2">
              <button class="edit-slide-btn btn-secondary text-xs px-2 py-1" data-idx="${idx}">✏️</button>
              <button class="del-slide-btn btn-secondary text-xs px-2 py-1" data-idx="${idx}">🗑️</button>
            </div>
          </div>`).join('')}
      </div>
    </div>

    <!-- Ayarlar -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">⚙️ Tabela Ayarları</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label class="flex items-center justify-between rounded-lg bg-white/5 p-3">
          <span class="text-sm text-slate-300">▶️ Otomatik Oynatma</span>
          <input type="checkbox" id="sg-autoplay" ${data.settings.autoPlay ? 'checked' : ''} class="w-5 h-5 accent-cyan-500">
        </label>
        <label class="flex items-center justify-between rounded-lg bg-white/5 p-3">
          <span class="text-sm text-slate-300">🕐 Saat Göster</span>
          <input type="checkbox" id="sg-clock" ${data.settings.showClock ? 'checked' : ''} class="w-5 h-5 accent-cyan-500">
        </label>
        <label class="flex items-center justify-between rounded-lg bg-white/5 p-3">
          <span class="text-sm text-slate-300">🌤️ Hava Durumu</span>
          <input type="checkbox" id="sg-weather" ${data.settings.showWeather ? 'checked' : ''} class="w-5 h-5 accent-cyan-500">
        </label>
        <div>
          <label class="label">Geçiş Efekti</label>
          <select id="sg-transition" class="input-field w-full">
            <option value="fade" ${data.settings.transition === 'fade' ? 'selected' : ''}>Solma</option>
            <option value="slide" ${data.settings.transition === 'slide' ? 'selected' : ''}>Kaydırma</option>
          </select>
        </div>
      </div>
      <button id="save-signage" class="btn-primary mt-4">💾 Ayarları Kaydet</button>
    </div>

    <!-- Preview Overlay -->
    <div id="signage-preview" class="hidden fixed inset-0 z-[70] bg-black">
      <div class="flex items-center justify-center h-full" id="preview-content"></div>
      <button id="close-preview" class="absolute top-4 right-4 text-white text-3xl z-[71] hover:text-cyan-300">✕</button>
    </div>`;

  // Delete slide
  el.querySelectorAll('.del-slide-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const data = getSignageData();
      data.slides.splice(parseInt(btn.dataset.idx), 1);
      saveSignageData(data);
      showToast('Slayt silindi', 'success');
      renderDigitalSignagePage(el);
    });
  });

  // Preview
  el.querySelector('#preview-signage')?.addEventListener('click', () => startPreview(data));
  el.querySelector('#close-preview')?.addEventListener('click', () => {
    document.getElementById('signage-preview')?.classList.add('hidden');
  });

  // Save settings
  el.querySelector('#save-signage')?.addEventListener('click', () => {
    const d = getSignageData();
    d.settings.autoPlay = el.querySelector('#sg-autoplay').checked;
    d.settings.showClock = el.querySelector('#sg-clock').checked;
    d.settings.showWeather = el.querySelector('#sg-weather').checked;
    d.settings.transition = el.querySelector('#sg-transition').value;
    saveSignageData(d);
    showToast('Ayarlar kaydedildi!', 'success');
  });

  el.querySelector('#add-slide-btn')?.addEventListener('click', () => showSlideModal(el));
}

function startPreview(data) {
  const preview = document.getElementById('signage-preview');
  const content = document.getElementById('preview-content');
  if (!preview || !content) return;
  preview.classList.remove('hidden');
  let idx = 0;
  const showSlide = () => {
    const slide = data.slides[idx];
    if (!slide) return;
    const now = new Date();
    content.innerHTML = `
      <div class="text-center fade-in max-w-2xl px-8">
        <div class="text-8xl mb-6">${slide.icon}</div>
        <h1 class="text-5xl font-bold text-white mb-4">${slide.title}</h1>
        <p class="text-2xl text-slate-300 whitespace-pre-line">${slide.content}</p>
        ${data.settings.showClock ? `<p class="text-xl text-slate-500 mt-8">${now.toLocaleTimeString('tr-TR')}</p>` : ''}
      </div>`;
    idx = (idx + 1) % data.slides.length;
    if (data.settings.autoPlay) setTimeout(showSlide, (slide.duration || 5) * 1000);
  };
  showSlide();
}

function showSlideModal(el) {
  const existing = document.getElementById('slide-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'slide-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📺 Slayt Ekle</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık *</label><input id="sl-title" class="input-field w-full" placeholder="Slayt başlığı"></div>
        <div><label class="label">İçerik *</label><textarea id="sl-content" class="input-field w-full" rows="3" placeholder="Slayt içeriği..."></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">İkon</label><input id="sl-icon" class="input-field w-full" placeholder="🏥" value="📢"></div>
          <div><label class="label">Süre (sn)</label><input id="sl-duration" type="number" class="input-field w-full" value="5" min="2"></div>
        </div>
        <div><label class="label">Tür</label><select id="sl-type" class="input-field w-full"><option value="announcement">📢 Duyuru</option><option value="info">📋 Bilgi</option><option value="warning">⚠️ Uyarı</option><option value="emergency">🚨 Acil</option></select></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="sl-save" class="btn-primary flex-1">💾 Ekle</button>
        <button id="sl-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#sl-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#sl-save').onclick = () => {
    const title = modal.querySelector('#sl-title').value.trim();
    const content = modal.querySelector('#sl-content').value.trim();
    if (!title || !content) { showToast('Başlık ve içerik zorunludur', 'error'); return; }
    const data = getSignageData();
    const colors = ['from-cyan-500/20 to-blue-500/20', 'from-purple-500/20 to-pink-500/20', 'from-amber-500/20 to-orange-500/20', 'from-green-500/20 to-emerald-500/20', 'from-red-500/20 to-rose-500/20'];
    data.slides.push({
      id: Date.now(), type: modal.querySelector('#sl-type').value, title, content,
      icon: modal.querySelector('#sl-icon').value || '📢',
      color: colors[data.slides.length % colors.length],
      duration: parseInt(modal.querySelector('#sl-duration').value) || 5
    });
    saveSignageData(data);
    modal.remove();
    showToast('Slayt eklendi!', 'success');
    renderDigitalSignagePage(el);
  };
}
