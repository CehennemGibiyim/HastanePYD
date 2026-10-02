// ===== LEADERBOARD & GAMIFICATION EXPANSION =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';
import { redeemReward } from './reward-catalog.js';

const save = (key, data) => localStorage.setItem('hospital_' + key, JSON.stringify(data));
const load = (key) => { try { return JSON.parse(localStorage.getItem('hospital_' + key)); } catch { return null; } };

const BADGES = [
  { id: 'punctual', name: 'Zaman Ustası', icon: '⏰', desc: '30 gün üst üste geç kalmadan', condition: (p, data) => (data.streaks?.[p.id] || 0) >= 30 },
  { id: 'duty_hero', name: 'Nöbet Şampiyonu', icon: '🏆', desc: 'Ayda 20+ nöbet', condition: (p, data) => (data.monthlyDuties?.[p.id] || 0) >= 20 },
  { id: 'zero_leave', name: 'Tam Devam', icon: '✅', desc: 'Yılda hiç izin kullanmadı', condition: (p) => (p.leaveUsed || 0) === 0 },
  { id: 'veteran', name: 'Kıdemli', icon: '🎖️', desc: '5+ yıl çalışma', condition: (p) => { const y = (Date.now() - new Date(p.startDate)) / 31557600000; return y >= 5; } },
  { id: 'mentor', name: 'Mentor', icon: '🎓', desc: '3+ sertifika', condition: (p) => (p.certificates?.length || 0) >= 3 },
  { id: 'team_player', name: 'Takım Oyuncusu', icon: '🤝', desc: '360° değerlendirme 4.5+', condition: (p, data) => (data.avgScores?.[p.id] || 0) >= 4.5 },
  { id: 'early_bird', name: 'Erken Kuş', icon: '🐦', desc: '10 kez erken giriş', condition: (p, data) => (data.earlyClockIns?.[p.id] || 0) >= 10 },
  { id: 'mood_booster', name: 'Moral Deposu', icon: '😊', desc: 'Ruh hali ortalaması 4+', condition: (p, data) => (data.moodAvgs?.[p.id] || 0) >= 4 },
];

const CHALLENGES = [
  { id: 'weekly_punctual', name: 'Bu Hafta Geç Kalma!', icon: '⏰', desc: 'Tüm hafta zamanında gel', reward: 50, active: true },
  { id: 'monthly_duty', name: 'Nöbet Maratonu', icon: '🏃', desc: 'Bu ay 15+ nöbet yap', reward: 100, active: true },
  { id: 'training_complete', name: 'Eğitim Avcısı', icon: '📚', desc: 'Bu ay 2 eğitim tamamla', reward: 75, active: true },
];

export function renderLeaderboardPage(el) {
  const personnel = getPersonnel({ status: 'active' });
  const leaderboard = load('leaderboard') || {};
  const userBadges = load('userBadges') || {};
  const activeTab = 'leaderboard';

  // Calculate points
  personnel.forEach(p => {
    if (!leaderboard[p.id]) {
      leaderboard[p.id] = { points: Math.floor(Math.random() * 500) + 100, level: 1, streak: Math.floor(Math.random() * 30) };
    }
  });

  const sorted = personnel
    .map(p => ({ ...p, points: leaderboard[p.id]?.points || 0, level: leaderboard[p.id]?.level || 1, streak: leaderboard[p.id]?.streak || 0 }))
    .sort((a, b) => b.points - a.points);

  const levelNames = ['Yeni Başlayan', 'Acemi', 'Deneyimli', 'Uzman', 'Usta', 'Efsane'];
  const levelColors = ['text-slate-400', 'text-green-400', 'text-blue-400', 'text-purple-400', 'text-amber-400', 'text-cyan-400'];

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏆 Sıralama & Rozetler</h1>
      <p class="text-slate-400 text-sm mt-1">Gamification lider tablosu, rozetler ve meydan okumalar</p>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2 mb-6 fade-in">
      <button data-tab="leaderboard" class="tab-active">🏆 Sıralama</button>
      <button data-tab="badges" class="tab-inactive">🎖️ Rozetler</button>
      <button data-tab="challenges" class="tab-inactive">🎯 Meydan Okumalar</button>
      <button data-tab="rewards" class="tab-inactive">🎁 Ödül Kataloğu</button>
    </div>

    <div id="lb-content"></div>`;

  function renderTab(tab) {
    document.querySelectorAll('[data-tab]').forEach(b => {
      b.className = b.dataset.tab === tab ? 'tab-active' : 'tab-inactive';
    });
    const content = document.getElementById('lb-content');

    if (tab === 'leaderboard') renderLeaderboard(content, sorted, levelNames, levelColors);
    else if (tab === 'badges') renderBadges(content, personnel, userBadges);
    else if (tab === 'challenges') renderChallenges(content);
    else if (tab === 'rewards') renderRewards(content, leaderboard);
  }

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => renderTab(btn.dataset.tab);
  });

  renderTab('leaderboard');
}

function renderLeaderboard(el, sorted, levelNames, levelColors) {
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = `
    <div class="fade-in">
      <!-- Top 3 Podium -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        ${sorted.slice(0, 3).map((p, i) => `
          <div class="card text-center ${i === 0 ? 'ring-2 ring-amber-400/50' : ''}">
            <div class="text-4xl mb-2">${medals[i]}</div>
            <p class="text-lg font-bold text-white">${p.name} ${p.surname}</p>
            <p class="text-sm text-slate-400">${p.department}</p>
            <p class="text-2xl font-bold text-cyan-300 mt-2">${p.points}</p>
            <p class="text-xs text-slate-500">puan</p>
            <span class="badge mt-2 ${levelColors[Math.min(p.level, 5)]}">${levelNames[Math.min(p.level, 5)]}</span>
          </div>
        `).join('')}
      </div>

      <!-- Full List -->
      <div class="card">
        <div class="space-y-1">
          ${sorted.map((p, i) => `
            <div class="flex items-center gap-3 rounded-lg px-3 py-2 ${i < 3 ? 'bg-amber-500/5' : 'hover:bg-white/5'} transition">
              <span class="text-sm font-bold w-8 text-center ${i < 3 ? 'text-amber-400' : 'text-slate-500'}">#${i + 1}</span>
              <div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-300 overflow-hidden">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : `${p.name[0]}${p.surname[0]}`}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white truncate">${p.name} ${p.surname}</p>
                <p class="text-xs text-slate-500">${p.department} · ${levelNames[Math.min(p.level, 5)]}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-cyan-300">${p.points}</p>
                <p class="text-[10px] text-slate-500">🔥 ${p.streak} gün</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
}

function renderBadges(el, personnel, userBadges) {
  el.innerHTML = `
    <div class="fade-in">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${BADGES.map(b => {
          const holders = personnel.filter(p => {
            const data = load('badgeData_' + p.id) || {};
            return b.condition(p, data);
          });
          return `<div class="card">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">${b.icon}</span>
              <div>
                <p class="text-base font-semibold text-white">${b.name}</p>
                <p class="text-xs text-slate-400">${b.desc}</p>
              </div>
            </div>
            <div class="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span class="text-xs text-slate-500">${holders.length} kişi kazandı</span>
              <div class="flex -space-x-2">
                ${holders.slice(0, 5).map(p => `<div class="w-6 h-6 rounded-full bg-cyan-500/30 border-2 border-slate-900 flex items-center justify-center text-[8px] font-bold text-cyan-300 overflow-hidden">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : p.name[0]}</div>`).join('')}
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
}

function renderChallenges(el) {
  el.innerHTML = `
    <div class="fade-in">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${CHALLENGES.map(c => `
          <div class="card border border-cyan-500/20">
            <span class="text-3xl">${c.icon}</span>
            <h3 class="text-base font-semibold text-white mt-2">${c.name}</h3>
            <p class="text-sm text-slate-400 mt-1">${c.desc}</p>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span class="badge bg-amber-500/20 text-amber-300">+${c.reward} puan</span>
              <span class="text-xs text-green-400">🟢 Aktif</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

function renderRewards(el, leaderboard) {
  const rewards = [
    { name: 'Yemek Kuponu', icon: '🍽️', cost: 200, desc: '1 ücretsiz öğle yemeği' },
    { name: 'Ekstra İzin Günü', icon: '🏖️', cost: 500, desc: '1 gün ekstra izin' },
    { name: 'Otopark Önceliği', icon: '🅿️', cost: 300, desc: '1 ay otopark önceliği' },
    { name: 'Eğitim Desteği', icon: '📚', cost: 800, desc: 'Dış eğitim katılım desteği' },
    { name: 'Hediye Çeki', icon: '🎁', cost: 1000, desc: '500₺ hediye çeki' },
  ];
  el.innerHTML = `
    <div class="fade-in">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${rewards.map(r => `
          <div class="card text-center">
            <span class="text-4xl">${r.icon}</span>
            <h3 class="text-base font-semibold text-white mt-2">${r.name}</h3>
            <p class="text-sm text-slate-400 mt-1">${r.desc}</p>
            <p class="text-xl font-bold text-amber-300 mt-3">${r.cost} puan</p>
            <button class="btn-primary text-sm mt-3 w-full reward-buy" data-name="${r.name}" data-cost="${r.cost}">🎁 Satın Al</button>
          </div>
        `).join('')}
      </div>
    </div>`;
  el.querySelectorAll('.reward-buy').forEach(button => button.addEventListener('click', () => {
    const balance = Number(load('rewardBalance') ?? 1000);
    const result = redeemReward({ name: button.dataset.name, cost: button.dataset.cost }, balance);
    if (!result.ok) { showToast('Yeterli puanınız bulunmuyor.', 'error'); return; }
    save('rewardBalance', result.remaining);
    save('rewardOrders', [{ id: result.orderId, reward: button.dataset.name, cost: Number(button.dataset.cost), date: new Date().toISOString() }, ...(load('rewardOrders') || [])]);
    showToast(`${button.dataset.name} talebiniz oluşturuldu. Kalan puan: ${result.remaining}`, 'success');
    button.disabled = true; button.textContent = 'Talep alındı';
  }));
}
