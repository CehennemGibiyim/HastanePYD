// ===== SESLİ KOMUT SİSTEMİ =====
import { showToast } from '../notifications.js';
import { getPersonnel, getTodaySchedules, getAttendance, getMonthlyReport, getDepartmentStats } from '../state.js';

let recognition = null;
let isListening = false;

export function initVoiceCommands() {
  if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'tr-TR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript.toLowerCase();
    processVoiceCommand(text);
  };
  recognition.onend = () => { isListening = false; updateVoiceButton(); };
  recognition.onerror = () => { isListening = false; updateVoiceButton(); };
}

export function toggleVoice() {
  if (!recognition) { showToast('Tarayıcınız sesli komutu desteklemiyor', 'error'); return; }
  if (isListening) { recognition.stop(); isListening = false; }
  else { recognition.start(); isListening = true; showToast('🎙️ Dinleniyor...', 'success'); }
  updateVoiceButton();
}

function updateVoiceButton() {
  document.querySelectorAll('.voice-btn').forEach(btn => {
    btn.innerHTML = isListening ? '🔴 Durdur' : '🎙️ Sesli Komut';
    btn.classList.toggle('bg-red-500/20', isListening);
  });
}

function processVoiceCommand(text) {
  showToast('🎙️ "' + text + '"', 'success');
  if (text.includes('nöbet') || text.includes('nöbetçi')) {
    location.hash = 'dutyboard';
    speakResult('Nöbet panosuna yönlendiriliyorsunuz');
  } else if (text.includes('personel') || text.includes('çalışan')) {
    location.hash = 'personnel';
    speakResult('Personel sayfasına yönlendiriliyorsunuz');
  } else if (text.includes('mesai') || text.includes('puantaj')) {
    location.hash = 'attendance';
    speakResult('Puantaj sayfasına yönlendiriliyorsunuz');
  } else if (text.includes('takvim') || text.includes('randevu')) {
    location.hash = 'calendar';
    speakResult('Takvime yönlendiriliyorsunuz');
  } else if (text.includes('maaş') || text.includes('ücret')) {
    location.hash = 'salary';
    speakResult('Maaş hesaplama sayfasına yönlendiriliyorsunuz');
  } else if (text.includes('görev') || text.includes('iş')) {
    location.hash = 'kanban';
    speakResult('Kanban panosuna yönlendiriliyorsunuz');
  } else if (text.includes('duyuru')) {
    location.hash = 'announcements';
    speakResult('Duyuru panosuna yönlendiriliyorsunuz');
  } else if (text.includes('dashboard') || text.includes('panel') || text.includes('gösterge')) {
    location.hash = 'dashboard';
    speakResult('Ana panele yönlendiriliyorsunuz');
  } else if (text.includes('kaç kişi') || text.includes('toplam personel')) {
    const total = getPersonnel({ status: 'active' }).length;
    speakResult('Aktif personel sayısı: ' + total);
  } else if (text.includes('bugün kim') || text.includes('bugünkü nöbet')) {
    const today = getTodaySchedules();
    speakResult('Bugün toplam ' + today.length + ' kişi nöbetçi');
  } else if (text.includes('departman')) {
    const stats = getDepartmentStats();
    const top = Object.entries(stats).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1])[0];
    speakResult('En kalabalık departman: ' + (top ? top[0] + ', ' + top[1] + ' kişi' : 'veri yok'));
  } else {
    speakResult('Komut anlaşılamadı. Nöbet, personel, mesai, takvim, maaş, görev diyebilirsiniz.');
  }
}

function speakResult(text) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    u.rate = 1;
    speechSynthesis.speak(u);
  }
}

export function renderVoicePage(container) {
  container.innerHTML = `
    <div class="fade-in">
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-white">🗣️ Sesli Komut Sistemi</h1>
        <p class="text-slate-400 text-sm mt-1">Mikrofon ile eller serbest navigasyon</p>
      </div>
      <div class="card text-center mb-6">
        <div class="text-6xl mb-4">${isListening ? '🔴' : '🎙️'}</div>
        <p class="text-lg text-white mb-2">${isListening ? 'Dinleniyor...' : 'Mikrofon butonuna basın'}</p>
        <p class="text-sm text-slate-400 mb-4">Türkçe komutlar söyleyin</p>
        <button id="voice-toggle-btn" class="voice-btn btn-primary text-lg px-8 py-3">${isListening ? '🔴 Durdur' : '🎙️ Başlat'}</button>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📖 Komut Listesi</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          ${[
            { cmd: '"Nöbet" / "Nöbetçi"', desc: 'Nöbet panosunu açar' },
            { cmd: '"Personel" / "Çalışan"', desc: 'Personel listesini açar' },
            { cmd: '"Mesai" / "Puantaj"', desc: 'Puantaj sayfasını açar' },
            { cmd: '"Takvim"', desc: 'Takvimi açar' },
            { cmd: '"Maaş" / "Ücret"', desc: 'Maaş hesaplamayı açar' },
            { cmd: '"Görev" / "İş"', desc: 'Kanban panosunu açar' },
            { cmd: '"Duyuru"', desc: 'Duyuru panosunu açar' },
            { cmd: '"Dashboard" / "Panel"', desc: 'Ana panele gider' },
            { cmd: '"Kaç kişi"', desc: 'Aktif personel sayısını söyler' },
            { cmd: '"Bugün kim"', desc: 'Bugünkü nöbetçi sayısını söyler' },
            { cmd: '"Departman"', desc: 'En kalabalık departmanı söyler' },
          ].map(c => `
            <div class="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span class="text-lg">🎯</span>
              <div>
                <p class="text-sm font-medium text-cyan-300">${c.cmd}</p>
                <p class="text-xs text-slate-400">${c.desc}</p>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>`;
  document.getElementById('voice-toggle-btn').onclick = toggleVoice;
}
