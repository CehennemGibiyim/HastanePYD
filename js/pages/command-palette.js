// ===== KOMUT PALETI (⌘K) =====
import { navigate } from '../app.js';

const COMMANDS = [
  { icon: '📊', label: 'Gösterge Paneli', page: 'dashboard', keywords: 'dashboard panel anasayfa' },
  { icon: '📋', label: 'Görev Panosu', page: 'dutyboard', keywords: 'görev panosu duty' },
  { icon: '👥', label: 'Personel Yönetimi', page: 'personnel', keywords: 'personel çalışan listesi' },
  { icon: '📅', label: 'Nöbet Listesi', page: 'schedule', keywords: 'nöbet vardiya çizelge' },
  { icon: '⏰', label: 'Puantaj Sistemi', page: 'attendance', keywords: 'puantaj mesai saat' },
  { icon: '💰', label: 'Maaş Hesaplama', page: 'salary', keywords: 'maaş ücret bordro' },
  { icon: '⭐', label: 'Performans', page: 'performance', keywords: 'performans değerlendirme' },
  { icon: '📋', label: 'Görev Yönetimi', page: 'tasks', keywords: 'görev görevler todo' },
  { icon: '📈', label: 'Analiz Paneli', page: 'analytics', keywords: 'analiz grafik istatistik' },
  { icon: '📊', label: 'Raporlama', page: 'reports', keywords: 'rapor pdf csv' },
  { icon: '📞', label: 'Telefon Rehberi', page: 'contacts', keywords: 'telefon rehber iletişim' },
  { icon: '💬', label: 'Mesajlaşma', page: 'messages', keywords: 'mesaj mesajlaşma chat' },
  { icon: '📝', label: 'Anketler', page: 'surveys', keywords: 'anket oylama' },
  { icon: '🔄', label: 'Vardiya Değiş', page: 'swap', keywords: 'vardiya değiş takas swap' },
  { icon: '🏗️', label: 'Organizasyon Şeması', page: 'orgchart', keywords: 'organizasyon şema hiyerarşi' },
  { icon: '🚨', label: 'Acil Durum', page: 'emergency', keywords: 'acil durum kod alarm' },
  { icon: '📚', label: 'Eğitim/Sertifika', page: 'education', keywords: 'eğitim sertifika' },
  { icon: '📅', label: 'Takvim', page: 'calendar', keywords: 'takvim takvim görünümü' },
  { icon: '🍽️', label: 'Yemekhane', page: 'catering', keywords: 'yemekhane menü yemek' },
  { icon: '👔', label: 'Uniforma', page: 'uniform', keywords: 'uniforma kıyafet' },
  { icon: '📄', label: 'Bordro', page: 'payslip', keywords: 'bordro maaş pusulası' },
  { icon: '🗓️', label: 'Resmi Tatiller', page: 'holidays', keywords: 'tatil resmi tatil' },
  { icon: '⏰', label: 'Kıdem Tazminatı', page: 'seniority', keywords: 'kıdem tazminat emeklilik' },
  { icon: '🕐', label: 'Gecikme Takibi', page: 'lateness', keywords: 'gecikme geç kalma devamsızlık' },
  { icon: '🤖', label: 'AI HR Asistanı', page: 'ai-assistant', keywords: 'yapay zeka ai asistan chatbot' },
  { icon: '📄', label: 'Doküman Yönetimi', page: 'documents', keywords: 'doküman belge dosya' },
  { icon: '📜', label: 'Aktivite Logu', page: 'audit', keywords: 'log aktivite denetim audit' },
  { icon: '🔧', label: 'Gelişmiş Rapor Oluşturucu', page: 'report-builder', keywords: 'rapor oluştur custom builder' },
  { icon: '👥', label: 'Hasta Yönetimi', page: 'patients', keywords: 'hasta hasta yönetimi' },
  { icon: '🏆', label: 'Gamification', page: 'gamification', keywords: 'gamification rozet liderlik' },
  { icon: '🔐', label: 'İki Faktörlü Doğrulama', page: 'two-factor', keywords: '2fa güvenlik doğrulama' },
  { icon: '👤', label: 'Profilim', page: 'profile', keywords: 'profil hesap' },
  { icon: '⚙️', label: 'Ayarlar', page: 'settings', keywords: 'ayarlar ayar config' },
  { icon: '🎂', label: 'Doğum Günleri', page: 'birthdays', keywords: 'doğum günü yıldönümü' },
  { icon: '📦', label: 'Zimmet/Ekipman', page: 'equipment', keywords: 'zimmet ekipman envanter' },
  { icon: '🏥', label: 'Olay Bildirimi', page: 'incidents', keywords: 'olay şikayet bildirim' },
  { icon: '😊', label: 'Ruh Hali', page: 'mood', keywords: 'ruh hali moral mutluluk' },
  { icon: '📚', label: 'Bilgi Bankası', page: 'knowledge', keywords: 'bilgi bankası sop doküman' },
  { icon: '📋', label: 'İşe Alım', page: 'recruitment', keywords: 'işe alım aday başvuru' },
  { icon: '💰', label: 'Bütçe Takibi', page: 'budget', keywords: 'bütçe maliyet departman' },
  { icon: '📝', label: 'Duyuru Panosu', page: 'announcements', keywords: 'duyuru haber bilgilendirme' },
  { icon: '📋', label: 'Sözleşmeler', page: 'contracts', keywords: 'sözleşme belge kontrat' },
  { icon: '🎯', label: 'Hedef & KPI', page: 'goals', keywords: 'hedef kpi performans' },
  { icon: '🔔', label: 'Hatırlatmalar', page: 'reminders', keywords: 'hatırlatma deadline' },
  { icon: '📊', label: 'Turnover Analizi', page: 'turnover', keywords: 'turnover devir oranı' },
  { icon: '⏰', label: 'Mesai Saat Takibi', page: 'timeclock', keywords: 'mesai saat giriş çıkış' },
  { icon: '📊', label: '360° Değerlendirme', page: 'evaluation360', keywords: '360 değerlendirme' },
  { icon: '📊', label: 'İş Gücü Planlama', page: 'workforce', keywords: 'iş gücü planlama personel ihtiyacı' },
];

let isOpen = false;

export function initCommandPalette() {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      togglePalette();
    }
    if (e.key === 'Escape' && isOpen) closePalette();
  });
}

export function togglePalette() {
  isOpen = !isOpen;
  let overlay = document.getElementById('cmd-palette');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cmd-palette';
    overlay.className = 'cmd-palette-overlay';
    overlay.innerHTML = `
      <div class="cmd-palette-box">
        <div class="cmd-palette-header">
          <span>🔍</span>
          <input id="cmd-palette-input" type="text" placeholder="Sayfa, özellik veya işlem ara..." class="cmd-palette-input" autocomplete="off">
          <kbd class="cmd-kbd">ESC</kbd>
        </div>
        <div id="cmd-palette-results" class="cmd-palette-results"></div>
        <div class="cmd-palette-footer">
          <span class="text-xs text-slate-500">↑↓ gezin • Enter seç • ESC kapat</span>
          <span class="text-xs text-slate-500">⌘K ile aç</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.onclick = (e) => { if (e.target === overlay) closePalette(); };
    const input = document.getElementById('cmd-palette-input');
    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('keydown', handleKeyNav);
  }
  overlay.classList.add('open');
  const input = document.getElementById('cmd-palette-input');
  input.value = '';
  renderResults('');
  setTimeout(() => input.focus(), 50);
}

function closePalette() {
  isOpen = false;
  document.getElementById('cmd-palette')?.classList.remove('open');
}

let selectedIndex = 0;

function renderResults(query) {
  const q = query.toLowerCase().trim();
  const filtered = q ? COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.keywords.includes(q) || c.page.includes(q)) : COMMANDS.slice(0, 12);
  selectedIndex = 0;
  const container = document.getElementById('cmd-palette-results');
  container.innerHTML = filtered.length === 0
    ? '<div class="cmd-empty">Sonuç bulunamadı</div>'
    : filtered.map((c, i) => `
      <button class="cmd-result-item ${i === 0 ? 'selected' : ''}" data-page="${c.page}" data-index="${i}">
        <span class="text-lg">${c.icon}</span>
        <span class="text-sm">${c.label}</span>
      </button>`).join('');
  container.querySelectorAll('.cmd-result-item').forEach(btn => {
    btn.onclick = () => { navigate(btn.dataset.page); closePalette(); };
  });
}

function handleKeyNav(e) {
  const items = document.querySelectorAll('.cmd-result-item');
  if (!items.length) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, items.length - 1); updateSelection(items); }
  if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); updateSelection(items); }
  if (e.key === 'Enter') { e.preventDefault(); items[selectedIndex]?.click(); }
}

function updateSelection(items) {
  items.forEach((item, i) => item.classList.toggle('selected', i === selectedIndex));
  items[selectedIndex]?.scrollIntoView({ block: 'nearest' });
}
