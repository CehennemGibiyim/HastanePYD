// ===== ACIL DURUM & TATBIKAT YÖNETİMİ =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_drills';

function getDrills() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultDrills(); } catch { return getDefaultDrills(); }
}
function saveDrills(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultDrills() {
  const now = new Date().toISOString();
  return [
    { id: 1, name: 'Yangın Tahliye Tatbikatı', scenario: 'fire', date: '2025-09-15', time: '10:00', duration: 45, location: 'Tüm Bina', organizer: 'İSG Uzmanı', participants: 120, status: 'planned', notes: 'Tüm personel katılacak. A blok başlangıç.' },
    { id: 2, name: 'Deprem Tatbikatı', scenario: 'earthquake', date: '2025-10-01', time: '14:00', duration: 30, location: 'Tüm Bina', organizer: 'AFAD Koordinatörü', participants: 150, status: 'planned', notes: 'Toplanma alanı: Otopark alanı' },
    { id: 3, name: 'Kimyasal Sızıntı Senaryosu', scenario: 'chemical', date: '2025-08-20', time: '09:00', duration: 60, location: 'Laboratuvar', organizer: 'Lab Müdürü', participants: 25, status: 'completed', notes: 'Laboratuvar personeli özel eğitimi' },
    { id: 4, name: 'Salgın Senaryosu', scenario: 'pandemic', date: '2025-07-10', time: '11:00', duration: 90, location: 'Acil Servis', organizer: 'Başhekim', participants: 40, status: 'completed', notes: 'Triaj ve izolasyon prosedürleri' },
  ];
}

const scenarios = {
  fire: { icon: '🔥', label: 'Yangın', color: 'text-red-400 bg-red-500/10' },
  earthquake: { icon: '🌍', label: 'Deprem', color: 'text-amber-400 bg-amber-500/10' },
  chemical: { icon: '☣️', label: 'Kimyasal Sızıntı', color: 'text-purple-400 bg-purple-500/10' },
  pandemic: { icon: '🦠', label: 'Salgın', color: 'text-green-400 bg-green-500/10' },
  flood: { icon: '🌊', label: 'Sel', color: 'text-blue-400 bg-blue-500/10' },
  power: { icon: '⚡', label: 'Elektrik Kesintisi', color: 'text-yellow-400 bg-yellow-500/10' },
  security: { icon: '🚨', label: 'Güvenlik Tehdidi', color: 'text-orange-400 bg-orange-500/10' },
};

const statusColors = { planned: 'text-blue-400 bg-blue-500/10', in_progress: 'text-amber-400 bg-amber-500/10', completed: 'text-green-400 bg-green-500/10', cancelled: 'text-red-400 bg-red-500/10' };
const statusLabels = { planned: 'Planlandı', in_progress: 'Devam Ediyor', completed: 'Tamamlandı', cancelled: 'İptal' };

const EMERGENCY_CONTACTS = [
  { name: 'İtfaiye', number: '110', icon: '🚒' },
  { name: 'Ambulans', number: '112', icon: '🚑' },
  { name: 'Polis', number: '155', icon: '🚔' },
  { name: 'AFAD', number: '122', icon: '🏗️' },
  { name: 'Zehir Danışma', number: '114', icon: '☠️' },
  { name: 'Elektrik Arıza', number: '186', icon: '⚡' },
];

export function renderDrillManagementPage(el) {
  const drills = getDrills();
  const planned = drills.filter(d => d.status === 'planned').length;
  const completed = drills.filter(d => d.status === 'completed').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📋 Acil Durum & Tatbikat Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Tatbikat planlama, senaryo yönetimi ve acil durum iletişim</p>
        </div>
        <button id="add-drill-btn" class="btn-primary">➕ Tatbikat Planla</button>
      </div>
    </div>

    <!-- Acil Durum Numaraları -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">📞 Acil Durum Numaraları</h3>
      <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
        ${EMERGENCY_CONTACTS.map(c => `
          <a href="tel:${c.number}" class="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center hover:bg-red-500/20 transition">
            <p class="text-2xl mb-1">${c.icon}</p>
            <p class="text-xs font-medium text-white">${c.name}</p>
            <p class="text-lg font-bold text-red-300">${c.number}</p>
          </a>`).join('')}
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${planned}</p><p class="text-xs text-slate-400">📅 Planlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">✅ Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${drills.reduce((s, d) => s + (d.participants || 0), 0)}</p><p class="text-xs text-slate-400">👥 Toplam Katılımcı</p></div>
    </div>

    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Tatbikat Listesi</h3>
      <div class="space-y-3">
        ${drills.sort((a, b) => new Date(b.date) - new Date(a.date)).map(d => {
          const sc = scenarios[d.scenario] || { icon: '📋', label: d.scenario, color: 'text-slate-400' };
          return `
          <div class="rounded-xl border ${d.status === 'completed' ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 bg-white/[0.02]'} p-4">
            <div class="flex items-start gap-4">
              <div class="text-3xl">${sc.icon}</div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 class="font-semibold text-white text-sm">${d.name}</h4>
                  <span class="text-[10px] px-2 py-0.5 rounded-full ${sc.color}">${sc.label}</span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full ${statusColors[d.status]}">${statusLabels[d.status]}</span>
                </div>
                <p class="text-xs text-slate-400">📅 ${d.date} ${d.time} · ⏱️ ${d.duration} dk · 📍 ${d.location}</p>
                <p class="text-xs text-slate-500">👤 ${d.organizer} · 👥 ${d.participants} kişi</p>
                ${d.notes ? `<p class="text-xs text-slate-500 mt-1">📝 ${d.notes}</p>` : ''}
              </div>
              ${d.status === 'planned' ? `<button class="drill-complete-btn btn-secondary text-xs px-3 py-1.5" data-id="${d.id}">✅ Tamamla</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;

  el.querySelectorAll('.drill-complete-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = getDrills();
      const d = list.find(x => x.id === parseInt(btn.dataset.id));
      if (d) { d.status = 'completed'; saveDrills(list); showToast('Tatbikat tamamlandı!', 'success'); renderDrillManagementPage(el); }
    });
  });

  el.querySelector('#add-drill-btn')?.addEventListener('click', () => showDrillModal(el));
}

function showDrillModal(el) {
  const existing = document.getElementById('drill-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'drill-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📋 Tatbikat Planla</h3>
      <div class="space-y-3">
        <div><label class="label">Tatbikat Adı *</label><input id="d-name" class="input-field w-full" placeholder="Yangın tahliye tatbikatı"></div>
        <div><label class="label">Senaryo</label><select id="d-scenario" class="input-field w-full">${Object.entries(scenarios).map(([k,v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Tarih *</label><input id="d-date" type="date" class="input-field w-full"></div>
          <div><label class="label">Saat</label><input id="d-time" type="time" class="input-field w-full" value="10:00"></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label">Süre (dk)</label><input id="d-duration" type="number" class="input-field w-full" value="45"></div>
          <div><label class="label">Katılımcı Sayısı</label><input id="d-participants" type="number" class="input-field w-full" value="50"></div>
        </div>
        <div><label class="label">Konum</label><input id="d-location" class="input-field w-full" placeholder="Tüm bina"></div>
        <div><label class="label">Organizatör</label><input id="d-organizer" class="input-field w-full" placeholder="İSG Uzmanı"></div>
        <div><label class="label">Notlar</label><textarea id="d-notes" class="input-field w-full" rows="2" placeholder="Ek açıklamalar..."></textarea></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="d-save" class="btn-primary flex-1">💾 Planla</button>
        <button id="d-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#d-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#d-save').onclick = () => {
    const name = modal.querySelector('#d-name').value.trim();
    const date = modal.querySelector('#d-date').value;
    if (!name || !date) { showToast('Ad ve tarih zorunludur', 'error'); return; }
    const drills = getDrills();
    drills.push({
      id: Date.now(), name, scenario: modal.querySelector('#d-scenario').value,
      date, time: modal.querySelector('#d-time').value,
      duration: parseInt(modal.querySelector('#d-duration').value) || 45,
      location: modal.querySelector('#d-location').value.trim(),
      organizer: modal.querySelector('#d-organizer').value.trim(),
      participants: parseInt(modal.querySelector('#d-participants').value) || 50,
      status: 'planned', notes: modal.querySelector('#d-notes').value.trim()
    });
    saveDrills(drills);
    modal.remove();
    showToast('Tatbikat planlandı!', 'success');
    renderDrillManagementPage(el);
  };
}
