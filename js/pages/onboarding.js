// ===== İŞE ALIM & ONBOARDING =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_onboarding';

function getOnboarding() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultOnboarding(); } catch { return getDefaultOnboarding(); }
}
function saveOnboarding(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultOnboarding() {
  const now = new Date().toISOString();
  return [
    { id: 1, name: 'Elif Kara', position: 'Hemşire', department: 'Dahiliye', startDate: '2025-08-01', mentor: 'Fatma Çelik', status: 'in_progress', progress: 65,
      checklist: { contract: true, uniform: true, training: true, system_access: true, badge: false, health_check: false, orientation: true, parking: false } },
    { id: 2, name: 'Burak Yılmaz', position: 'Teknisyen', department: 'Radyoloji', startDate: '2025-08-15', mentor: 'Mehmet Kaya', status: 'pending', progress: 20,
      checklist: { contract: true, uniform: false, training: false, system_access: false, badge: false, health_check: false, orientation: false, parking: false } },
    { id: 3, name: 'Selin Demir', position: 'Doktor', department: 'Cerrahi', startDate: '2025-07-15', mentor: 'Dr. Ayşe Yılmaz', status: 'completed', progress: 100,
      checklist: { contract: true, uniform: true, training: true, system_access: true, badge: true, health_check: true, orientation: true, parking: true } },
  ];
}

const CHECKLIST_ITEMS = {
  contract: { label: '📝 Sözleşme İmzası', desc: 'İş sözleşmesi imzalandı' },
  uniform: { label: '👔 Üniforma Teslimi', desc: 'Çalışan üniforması verildi' },
  training: { label: '📚 Oryantasyon Eğitimi', desc: 'Temel eğitim tamamlandı' },
  system_access: { label: '💻 Sistem Erişimi', desc: 'BT erişimi açıldı' },
  badge: { label: '🪪 Personel Kartı', desc: 'Yaka kartı basıldı' },
  health_check: { label: '🏥 Sağlık Kontrolü', desc: 'İşe giriş sağlık raporu' },
  orientation: { label: '🗺️ Hastane Turu', desc: 'Bina tanıtımı yapıldı' },
  parking: { label: '🚗 Otopark Kartı', desc: 'Otopark erişimi verildi' },
};

const statusColors = { pending: 'text-amber-400 bg-amber-500/10', in_progress: 'text-blue-400 bg-blue-500/10', completed: 'text-green-400 bg-green-500/10' };
const statusLabels = { pending: 'Beklemede', in_progress: 'Devam Ediyor', completed: 'Tamamlandı' };

export function renderOnboardingPage(el) {
  const list = getOnboarding();
  const pending = list.filter(x => x.status === 'pending').length;
  const inProgress = list.filter(x => x.status === 'in_progress').length;
  const completed = list.filter(x => x.status === 'completed').length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🎒 İşe Alım & Onboarding</h1>
          <p class="text-slate-400 text-sm mt-1">Yeni personel süreç takibi ve oryantasyon yönetimi</p>
        </div>
        <button id="add-onboard-btn" class="btn-primary">➕ Yeni Personel</button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${pending}</p><p class="text-xs text-slate-400">⏳ Beklemede</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inProgress}</p><p class="text-xs text-slate-400">🔄 Devam Eden</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">✅ Tamamlanan</p></div>
    </div>

    <div class="space-y-4 fade-in">
      ${list.map(item => {
        const doneCount = Object.values(item.checklist).filter(Boolean).length;
        const totalItems = Object.keys(CHECKLIST_ITEMS).length;
        const pct = Math.round((doneCount / totalItems) * 100);
        return `
        <div class="card">
          <div class="flex items-center gap-4 mb-3 flex-wrap">
            <div class="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-xl font-bold text-cyan-300">${item.name.split(' ').map(n => n[0]).join('')}</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-white">${item.name}</h4>
                <span class="text-[10px] px-2 py-0.5 rounded-full ${statusColors[item.status]}">${statusLabels[item.status]}</span>
              </div>
              <p class="text-xs text-slate-400">${item.position} · ${item.department} · Başlangıç: ${item.startDate}</p>
              ${item.mentor ? `<p class="text-xs text-slate-500">🧑‍🏫 Mentor: ${item.mentor}</p>` : ''}
            </div>
            <div class="text-center">
              <div class="relative w-16 h-16">
                <svg class="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="3"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${pct === 100 ? '#22c55e' : '#22d3ee'}" stroke-width="3" stroke-dasharray="${pct}, 100"/>
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">${pct}%</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${Object.entries(CHECKLIST_ITEMS).map(([key, ci]) => {
              const done = item.checklist[key];
              return `<div class="flex items-center gap-2 rounded-lg ${done ? 'bg-green-500/10' : 'bg-white/5'} p-2 cursor-pointer checklist-toggle" data-id="${item.id}" data-key="${key}">
                <span class="text-sm">${done ? '✅' : '⬜'}</span>
                <span class="text-[10px] ${done ? 'text-green-300' : 'text-slate-400'}">${ci.label}</span>
              </div>`;
            }).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;

  el.querySelectorAll('.checklist-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const id = parseInt(toggle.dataset.id);
      const key = toggle.dataset.key;
      const list = getOnboarding();
      const item = list.find(x => x.id === id);
      if (item) {
        item.checklist[key] = !item.checklist[key];
        const doneCount = Object.values(item.checklist).filter(Boolean).length;
        const total = Object.keys(CHECKLIST_ITEMS).length;
        item.progress = Math.round((doneCount / total) * 100);
        item.status = item.progress === 100 ? 'completed' : item.progress > 0 ? 'in_progress' : 'pending';
        saveOnboarding(list);
        showToast(item.checklist[key] ? 'Tamamlandı ✅' : 'Geri alındı', 'success');
        renderOnboardingPage(el);
      }
    });
  });

  el.querySelector('#add-onboard-btn')?.addEventListener('click', () => {
    const list = getOnboarding();
    list.push({
      id: Date.now(), name: 'Yeni Personel', position: 'Pozisyon', department: 'Departman',
      startDate: new Date().toISOString().split('T')[0], mentor: '', status: 'pending', progress: 0,
      checklist: Object.fromEntries(Object.keys(CHECKLIST_ITEMS).map(k => [k, false]))
    });
    saveOnboarding(list);
    showToast('Yeni onboarding kaydı eklendi', 'success');
    renderOnboardingPage(el);
  });
}
