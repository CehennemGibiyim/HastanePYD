// ===== TAKDIR & TEŞEKKÜR SİSTEMİ =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_appreciations';

function getAppreciations() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultAppreciations(); } catch { return getDefaultAppreciations(); } }
function saveAppreciations(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultAppreciations() {
  const now = new Date().toISOString();
  return [
    { id: 1, from: 'Dr. Ayşe Yılmaz', to: 'Hem. Fatma Çelik', category: 'excellent_service', message: 'Acil serviste olağanüstü performans gösterdi. Hasta yakınlarıyla mükemmel iletişim kurdu.', date: now, likes: 12 },
    { id: 2, from: 'Mehmet Kaya', to: 'Ali Yıldız', category: 'team_spirit', message: 'Gece vardiyasında herkesin işine yardım etti. Gerçek bir takım oyuncusu.', date: now, likes: 8 },
    { id: 3, from: 'Zeynep Arslan', to: 'Dr. Fatma Yılmaz', category: 'innovation', message: 'Hasta takip sürecini dijitalleştiren yeni sistemi önerdi ve uyguladı.', date: now, likes: 15 },
    { id: 4, from: 'Hem. Elif Demir', to: 'Güv. Mehmet Dağ', category: 'safety', message: 'Gece acil durumda soğukkanlı müdahalesiyle hasta güvenliğini sağladı.', date: now, likes: 20 },
  ];
}

const categories = {
  excellent_service: { label: '🌟 Mükemmel Hizmet', color: 'text-yellow-400 bg-yellow-500/10' },
  team_spirit: { label: '🤝 Ekip Ruhu', color: 'text-blue-400 bg-blue-500/10' },
  innovation: { label: '💡 İnovasyon', color: 'text-purple-400 bg-purple-500/10' },
  safety: { label: '🛡️ Güvenlik Kahramanı', color: 'text-green-400 bg-green-500/10' },
  patient_care: { label: '❤️ Hasta Bakımı', color: 'text-red-400 bg-red-500/10' },
  leadership: { label: '👑 Liderlik', color: 'text-amber-400 bg-amber-500/10' },
};

const BADGES = [
  { threshold: 1, label: '🌱 Çaylak', desc: 'İlk teşekkür' },
  { threshold: 5, label: '⭐ Yıldız', desc: '5 teşekkür' },
  { threshold: 10, label: '🏅 Altın Rozet', desc: '10 teşekkür' },
  { threshold: 20, label: '💎 Elmas', desc: '20 teşekkür' },
  { threshold: 50, label: '👑 Efsane', desc: '50 teşekkür' },
];

export function renderAppreciationPage(el) {
  const apps = getAppreciations();
  const personnel = getPersonnel({});
  // Leaderboard: count appreciations received per person
  const received = {};
  apps.forEach(a => { received[a.to] = (received[a.to] || 0) + 1; });
  const leaderboard = Object.entries(received).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const totalLikes = apps.reduce((s, a) => s + (a.likes || 0), 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🏅 Takdir & Teşekkür</h1>
          <p class="text-slate-400 text-sm mt-1">Meslektaşlarına teşekkür gönder, motivasyonu artır</p>
        </div>
        <button id="send-thanks-btn" class="btn-primary">💝 Teşekkür Gönder</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-pink-300">${apps.length}</p><p class="text-xs text-slate-400">💝 Toplam Teşekkür</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${totalLikes}</p><p class="text-xs text-slate-400">❤️ Toplam Beğeni</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${leaderboard.length}</p><p class="text-xs text-slate-400">👥 Takdir Edilen</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${Object.keys(categories).length}</p><p class="text-xs text-slate-400">🏷️ Kategori</p></div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
      <!-- Teşekkür Akışı -->
      <div class="lg:col-span-2 card">
        <h3 class="text-lg font-semibold text-white mb-4">💝 Teşekkür Akışı</h3>
        <div class="space-y-3">
          ${apps.sort((a, b) => new Date(b.date) - new Date(a.date)).map(a => `
            <div class="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-pink-500/20 transition">
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-pink-500/15 flex items-center justify-center text-lg">${categories[a.category]?.split(' ')[0] || '💝'}</div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-sm font-medium text-cyan-300">${a.from}</span>
                    <span class="text-xs text-slate-500">→</span>
                    <span class="text-sm font-medium text-white">${a.to}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full ${categories[a.category]?.color}">${categories[a.category]?.label}</span>
                  </div>
                  <p class="text-sm text-slate-300 mb-2">${a.message}</p>
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <span>${new Date(a.date).toLocaleDateString('tr-TR')}</span>
                    <button class="flex items-center gap-1 hover:text-pink-400 transition like-btn" data-id="${a.id}">❤️ ${a.likes || 0}</button>
                  </div>
                </div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Sıralama -->
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">🏆 Teşekkür Sıralaması</h3>
        <div class="space-y-2">
          ${leaderboard.map(([name, count], i) => {
            const badge = [...BADGES].reverse().find(b => count >= b.threshold);
            return `
            <div class="flex items-center gap-3 rounded-xl ${i < 3 ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-white/[0.02]'} p-3">
              <span class="text-lg font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-slate-500'}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1)}</span>
              <div class="flex-1">
                <p class="text-sm font-medium text-white">${name}</p>
                ${badge ? `<p class="text-[10px] text-amber-400">${badge.label}</p>` : ''}
              </div>
              <span class="text-sm font-bold text-pink-400">${count} 💝</span>
            </div>`;
          }).join('')}
        </div>

        <!-- Rozet Seviyeleri -->
        <div class="mt-6 pt-4 border-t border-white/10">
          <h4 class="text-sm font-semibold text-white mb-3">🎖️ Rozet Seviyeleri</h4>
          <div class="space-y-2">
            ${BADGES.map(b => `
              <div class="flex items-center gap-2 text-xs">
                <span>${b.label}</span>
                <span class="text-slate-500">${b.desc}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;

  el.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const list = getAppreciations();
      const a = list.find(x => x.id === parseInt(btn.dataset.id));
      if (a) { a.likes = (a.likes || 0) + 1; saveAppreciations(list); renderAppreciationPage(el); }
    });
  });

  el.querySelector('#send-thanks-btn')?.addEventListener('click', () => showThanksModal(el, personnel));
}

function showThanksModal(el, personnel) {
  const existing = document.getElementById('thanks-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'thanks-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">💝 Teşekkür Gönder</h3>
      <div class="space-y-3">
        <div><label class="label">Kime *</label><select id="th-to" class="input-field w-full"><option value="">Personel seçin</option>${personnel.map(p => `<option value="${p.name}">${p.name} - ${p.department}</option>`).join('')}</select></div>
        <div><label class="label">Kategori</label><div class="grid grid-cols-2 gap-2">${Object.entries(categories).map(([k,v]) => `<label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white rounded-lg bg-white/5 p-2"><input type="radio" name="th-cat" value="${k}" ${k === 'excellent_service' ? 'checked' : ''}> ${v.label}</label>`).join('')}</div></div>
        <div><label class="label">Mesajınız *</label><textarea id="th-msg" class="input-field w-full" rows="3" placeholder="Neden teşekkür ediyorsunuz?"></textarea></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="th-save" class="btn-primary flex-1">💝 Gönder</button>
        <button id="th-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#th-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#th-save').onclick = () => {
    const to = modal.querySelector('#th-to').value;
    const msg = modal.querySelector('#th-msg').value.trim();
    if (!to || !msg) { showToast('Alıcı ve mesaj zorunludur', 'error'); return; }
    const cat = modal.querySelector('input[name="th-cat"]:checked')?.value || 'excellent_service';
    const list = getAppreciations();
    list.push({ id: Date.now(), from: 'Siz', to, category: cat, message: msg, date: new Date().toISOString(), likes: 0 });
    saveAppreciations(list);
    modal.remove();
    showToast(`💝 ${to} kişisine teşekkür gönderildi!`, 'success');
    renderAppreciationPage(el);
  };
}
