// ===== KARIYER YOLU PLANLAMA =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_career_paths';

function getCareerData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultData(); } catch { return getDefaultData(); }
}
function saveCareerData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getDefaultData() {
  return {
    paths: [
      { id: 1, name: 'Hemşirelik Kariyer Yolu', department: 'Hemşirelik',
        levels: [
          { title: 'Stajyer Hemşire', years: '0-1', salary: '₺18,000', skills: ['Temel bakım', 'Hasta gözlemi'] },
          { title: 'Hemşire', years: '1-3', salary: '₺22,000', skills: ['IV erişim', 'İlaç yönetimi', 'Hasta eğitimi'] },
          { title: 'Başhemşire Yardımcısı', years: '3-7', salary: '₺28,000', skills: ['Ekip yönetimi', 'Vardiya planlama', 'Kalite kontrol'] },
          { title: 'Başhemşire', years: '7-12', salary: '₺35,000', skills: ['Departman yönetimi', 'Bütçe planlama', 'Eğitim koordinasyonu'] },
          { title: 'Hemşirelik Müdürü', years: '12+', salary: '₺45,000', skills: ['Stratejik planlama', 'Politika geliştirme', 'Liderlik'] },
        ]},
      { id: 2, name: 'Doktorluk Kariyer Yolu', department: 'Tıp',
        levels: [
          { title: 'Pratisyen Doktor', years: '0-2', salary: '₺30,000', skills: ['Genel muayene', 'Tanı koyma'] },
          { title: 'Asistan Doktor', years: '2-6', salary: '₺35,000', skills: ['Uzmanlık eğitimi', 'Ameliyat asistansı'] },
          { title: 'Uzman Doktor', years: '6-10', salary: '₺50,000', skills: ['Uzmanlık alanı', 'Bağımsız ameliyat'] },
          { title: 'Başhekim Yardımcısı', years: '10-15', salary: '₺65,000', skills: ['Departman koordinasyonu', 'Akademik yayın'] },
          { title: 'Başhekim', years: '15+', salary: '₺85,000', skills: ['Hastane yönetimi', 'Stratejik vizyon'] },
        ]},
    ],
    assessments: [
      { personId: 1, pathId: 2, currentLevel: 2, targetLevel: 3, progress: 65, notes: 'Uzmanlık sınavına hazırlanıyor', targetDate: '2026-06-01' },
      { personId: 5, pathId: 1, currentLevel: 1, targetLevel: 2, progress: 80, notes: 'IV erişim eğitimi tamamlandı', targetDate: '2025-12-01' },
    ]
  };
}

export function renderCareerPathPage(el) {
  const data = getCareerData();
  const personnel = getPersonnel({});

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🛤️ Kariyer Yolu Planlama</h1>
      <p class="text-slate-400 text-sm mt-1">Kariyer basamaklarını tanımla, personelin ilerlemesini takip et</p>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.paths.length}</p><p class="text-xs text-slate-400">🛤️ Kariyer Yolu</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${data.assessments.length}</p><p class="text-xs text-slate-400">👤 Aktif Plan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${data.paths.reduce((s, p) => s + p.levels.length, 0)}</p><p class="text-xs text-slate-400">📊 Toplam Seviye</p></div>
    </div>

    <!-- Kariyer Yolları -->
    ${data.paths.map(path => `
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">${path.name} <span class="text-xs text-slate-500">(${path.department})</span></h3>
      <div class="flex items-center gap-0 overflow-x-auto pb-4">
        ${path.levels.map((level, idx) => `
          <div class="flex items-center shrink-0">
            <div class="rounded-xl border ${idx === 0 ? 'border-green-500/30 bg-green-500/10' : idx === path.levels.length - 1 ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.02]'} p-4 min-w-[200px]">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-2xl">${['🌱','🌿','🌳','🏆','👑'][idx] || '📊'}</span>
                <div>
                  <h4 class="font-semibold text-white text-sm">${level.title}</h4>
                  <p class="text-[10px] text-slate-500">📅 ${level.years} yıl · 💰 ${level.salary}</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                ${level.skills.map(s => `<span class="text-[9px] bg-white/10 rounded-full px-2 py-0.5 text-slate-400">${s}</span>`).join('')}
              </div>
            </div>
            ${idx < path.levels.length - 1 ? '<div class="w-8 flex-shrink-0 flex items-center justify-center"><span class="text-xl text-slate-600">→</span></div>' : ''}
          </div>`).join('')}
      </div>
    </div>`).join('')}

    <!-- Aktif Planlar -->
    ${data.assessments.length > 0 ? `
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">👤 Aktif Kariyer Planları</h3>
      <div class="space-y-3">
        ${data.assessments.map(a => {
          const person = personnel.find(p => p.id === a.personId);
          const path = data.paths.find(p => p.id === a.pathId);
          const currentTitle = path?.levels[a.currentLevel]?.title || '?';
          const targetTitle = path?.levels[a.targetLevel]?.title || '?';
          return `
          <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-lg font-bold text-cyan-300">${person?.name?.split(' ').map(n => n[0]).join('') || '?'}</div>
              <div class="flex-1">
                <h4 class="font-semibold text-white text-sm">${person?.name || 'Bilinmeyen'}</h4>
                <p class="text-xs text-slate-400">${path?.name || '?'} · ${currentTitle} → ${targetTitle}</p>
                ${a.notes ? `<p class="text-xs text-slate-500 mt-1">📝 ${a.notes}</p>` : ''}
                ${a.targetDate ? `<p class="text-[10px] text-slate-600 mt-1">🎯 Hedef: ${a.targetDate}</p>` : ''}
              </div>
              <div class="w-full max-w-[200px]">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-slate-400">İlerleme</span>
                  <span class="text-cyan-400 font-bold">${a.progress}%</span>
                </div>
                <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all" style="width:${a.progress}%"></div>
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>` : ''}
  `;
}
