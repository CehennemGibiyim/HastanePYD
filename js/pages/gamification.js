// ===== GAMIFIKASYON =====
import { getPersonnel } from '../state.js';

const save = (k, d) => localStorage.setItem('hospital_' + k, JSON.stringify(d));
const load = (k) => { try { return JSON.parse(localStorage.getItem('hospital_' + k)); } catch { return null; } };

const BADGES = [
  { id: 'first_login', name: 'İlk Adım', icon: '🌟', desc: 'Sisteme ilk giriş', points: 10 },
  { id: 'duty_7', name: 'Nöbet Kahramanı', icon: '🦸', desc: '7 gün nöbet tut', points: 50 },
  { id: 'no_late', name: 'Zaman Ustası', icon: '⏰', desc: '30 gün gecikme yok', points: 30 },
  { id: 'survey_voter', name: 'Sesini Duyur', icon: '🗳️', desc: 'Ankete katıl', points: 15 },
  { id: 'education_done', name: 'Öğrenmeye Devam', icon: '📚', desc: 'Eğitim tamamla', points: 25 },
  { id: 'team_player', name: 'Takım Oyuncusu', icon: '🤝', desc: 'Vardiya değiş yardımı', points: 20 },
  { id: 'zero_leave', name: 'Tam Devam', icon: '🏆', desc: 'Çeyrek dönem eksiksiz', points: 40 },
  { id: 'incident_reporter', name: 'Gözlemci', icon: '👁️', desc: 'Olay bildir', points: 10 },
  { id: 'mood_positive', name: 'Pozitif Enerji', icon: '☀️', desc: '5 gün üst üste iyi+ ruh hali', points: 15 },
  { id: 'knowledge_writer', name: 'Bilgi Paylaşan', icon: '✍️', desc: 'Bilgi bankasına katkı', points: 20 },
];

function getPoints(pid) {
  const pts = load('gamification_points') || {};
  return pts[pid] || 0;
}
function addPoints(pid, amount) {
  const pts = load('gamification_points') || {};
  pts[pid] = (pts[pid] || 0) + amount;
  save('gamification_points', pts);
}
function getEarnedBadges(pid) {
  const all = load('gamification_badges') || {};
  return all[pid] || [];
}
function earnBadge(pid, badgeId) {
  const all = load('gamification_badges') || {};
  if (!all[pid]) all[pid] = [];
  if (all[pid].includes(badgeId)) return false;
  all[pid].push(badgeId);
  save('gamification_badges', all);
  const badge = BADGES.find(b => b.id === badgeId);
  if (badge) addPoints(pid, badge.points);
  return true;
}

function seedGamification() {
  if (load('gamification_points')) return;
  const personnel = getPersonnel({ status: 'active' });
  const pts = {};
  const badges = {};
  personnel.forEach(p => {
    pts[p.id] = Math.floor(Math.random() * 150) + 10;
    const earned = [];
    BADGES.forEach(b => { if (Math.random() > 0.6) earned.push(b.id); });
    badges[p.id] = earned;
  });
  save('gamification_points', pts);
  save('gamification_badges', badges);
}

function getLevel(points) {
  if (points >= 200) return { level: 5, name: 'Efsane', color: 'text-yellow-300', icon: '👑' };
  if (points >= 150) return { level: 4, name: 'Uzman', color: 'text-purple-300', icon: '💎' };
  if (points >= 100) return { level: 3, name: 'Deneyimli', color: 'text-blue-300', icon: '🏆' };
  if (points >= 50) return { level: 2, name: 'Gelişen', color: 'text-green-300', icon: '🌱' };
  return { level: 1, name: 'Yeni Başlayan', color: 'text-slate-300', icon: '🌱' };
}

export function renderGamificationPage(el) {
  seedGamification();
  const personnel = getPersonnel({ status: 'active' });
  const leaderboard = personnel.map(p => {
    const pts = getPoints(p.id);
    const earned = getEarnedBadges(p.id);
    return { ...p, points: pts, badgeCount: earned.length, level: getLevel(pts) };
  }).sort((a, b) => b.points - a.points);

  const top3 = leaderboard.slice(0, 3);
  const totalPoints = leaderboard.reduce((s, p) => s + p.points, 0);
  const totalBadges = leaderboard.reduce((s, p) => s + p.badgeCount, 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🏆 Gamification</h1>
      <p class="text-slate-400 text-sm mt-1">Rozetler, liderlik tablosu ve motivasyon sistemi</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-2xl font-bold text-white">${totalPoints}</p><p class="text-xs text-slate-400">Toplam Puan</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-cyan-300">${totalBadges}</p><p class="text-xs text-slate-400">Kazanılan Rozet</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-amber-300">${BADGES.length}</p><p class="text-xs text-slate-400">Toplam Rozet</p></div>
      <div class="card text-center"><p class="text-2xl font-bold text-green-300">${leaderboard.filter(l => l.points > 0).length}</p><p class="text-xs text-slate-400">Aktif Katılımcı</p></div>
    </div>
    
    <!-- Top 3 Podium -->
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">🥇 Liderlik Tablosu - Top 3</h3>
      <div class="grid grid-cols-3 gap-4">
        ${[1, 0, 2].map(i => {
          const p = top3[i];
          if (!p) return '<div></div>';
          const medals = ['🥈', '🥇', '🥉'];
          const sizes = ['text-4xl', 'text-5xl', 'text-3xl'];
          return `<div class="text-center ${i === 1 ? 'order-first md:order-none' : ''}">
            <p class="${sizes[i]} mb-2">${medals[i]}</p>
            <div class="profile-avatar mx-auto mb-2 overflow-hidden" style="width:64px;height:64px;font-size:1.5rem">${p.photo ? `<img src="${p.photo}" alt="${p.name} ${p.surname}" class="w-full h-full object-cover">` : `${p.name[0]}${p.surname[0]}`}</div>
            <p class="text-sm font-semibold text-white">${p.name} ${p.surname}</p>
            <p class="text-xs text-slate-400">${p.department}</p>
            <p class="text-lg font-bold ${p.level.color} mt-1">${p.points} puan</p>
            <p class="text-xs ${p.level.color}">${p.level.icon} ${p.level.name}</p>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Badges Gallery -->
    <div class="card fade-in mb-6">
      <h3 class="text-lg font-semibold text-white mb-4">🎖️ Rozet Galerisi</h3>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        ${BADGES.map(b => `<div class="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <p class="text-2xl mb-1">${b.icon}</p>
          <p class="text-xs font-medium text-white">${b.name}</p>
          <p class="text-[10px] text-slate-500">${b.desc}</p>
          <p class="text-xs text-amber-400 mt-1">+${b.points} puan</p>
        </div>`).join('')}
      </div>
    </div>

    <!-- Full Leaderboard -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Tam Sıralama</h3>
      <div class="overflow-x-auto"><table class="w-full">
        <thead><tr><th class="th">#</th><th class="th">Personel</th><th class="th">Departman</th><th class="th">Seviye</th><th class="th">Rozet</th><th class="th">Puan</th></tr></thead>
        <tbody>${leaderboard.map((p, i) => `<tr>
          <td class="td font-bold ${i < 3 ? 'text-amber-300' : ''}">${i + 1}</td>
          <td class="td">${p.name} ${p.surname}</td>
          <td class="td text-sm">${p.department}</td>
          <td class="td"><span class="${p.level.color}">${p.level.icon} ${p.level.name}</span></td>
          <td class="td">${p.badgeCount}/${BADGES.length}</td>
          <td class="td font-bold">${p.points}</td>
        </tr>`).join('')}</tbody>
      </table></div>
    </div>`;
}
