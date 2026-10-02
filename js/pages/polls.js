// ===== ANKET & OYLAMA SİSTEMİ (HIZLI) =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_polls';

function getPolls() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultPolls(); } catch { return getDefaultPolls(); }
}
function savePolls(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultPolls() {
  return [
    { id: 1, question: 'Yemekhane memnuniyetiniz nasıl?', type: 'rating', options: [], votes: {}, anonymous: true, active: true, createdAt: new Date().toISOString(), totalVotes: 45, avgRating: 3.8 },
    { id: 2, question: 'Haftalık eğitim saatleri yeterli mi?', type: 'choice', options: ['Evet, yeterli', 'Daha fazla olmalı', 'Azaltılmalı', 'Fikrim yok'], votes: { 0: 22, 1: 15, 2: 3, 3: 5 }, anonymous: false, active: true, createdAt: new Date().toISOString(), totalVotes: 45 },
    { id: 3, question: 'Yeni kıyafet kodu önerisi: Formal mı, Casual mı?', type: 'choice', options: ['Formal (Takım elbise)', 'Smart Casual', 'Serbest', 'Mevcut uniforma kalsın'], votes: { 0: 8, 1: 25, 2: 10, 3: 30 }, anonymous: true, active: true, createdAt: new Date().toISOString(), totalVotes: 73 },
    { id: 4, question: 'Hastane içi iletişim memnuniyeti (1-5)', type: 'rating', options: [], votes: {}, anonymous: true, active: false, createdAt: new Date().toISOString(), totalVotes: 62, avgRating: 4.1 },
  ];
}

export function renderPollsPage(el) {
  const polls = getPolls();
  const activePolls = polls.filter(p => p.active);
  const closedPolls = polls.filter(p => !p.active);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🗳️ Anket & Oylama</h1>
          <p class="text-slate-400 text-sm mt-1">Hızlı anket oluştur, oy kullan ve sonuçları gör</p>
        </div>
        <button id="add-poll-btn" class="btn-primary">➕ Anket Oluştur</button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${polls.length}</p><p class="text-xs text-slate-400">📊 Toplam Anket</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${activePolls.length}</p><p class="text-xs text-slate-400">🟢 Aktif</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${polls.reduce((s, p) => s + (p.totalVotes || 0), 0)}</p><p class="text-xs text-slate-400">🗳️ Toplam Oy</p></div>
    </div>

    ${activePolls.length > 0 ? `
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🟢 Aktif Anketler</h3>
      <div class="space-y-4">
        ${activePolls.map(p => pollCardHTML(p)).join('')}
      </div>
    </div>` : ''}

    ${closedPolls.length > 0 ? `
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📋 Kapanan Anketler</h3>
      <div class="space-y-4">
        ${closedPolls.map(p => pollCardHTML(p, true)).join('')}
      </div>
    </div>` : ''}`;

  el.querySelector('#add-poll-btn')?.addEventListener('click', () => showPollModal(el));

  // Vote handlers
  el.querySelectorAll('.poll-vote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pollId = parseInt(btn.dataset.poll);
      const optIdx = parseInt(btn.dataset.option);
      const polls = getPolls();
      const poll = polls.find(p => p.id === pollId);
      if (!poll || poll.voted) return;
      poll.votes[optIdx] = (poll.votes[optIdx] || 0) + 1;
      poll.totalVotes = (poll.totalVotes || 0) + 1;
      poll.voted = true;
      savePolls(polls);
      showToast('Oyunuz kaydedildi! 🗳️', 'success');
      renderPollsPage(el);
    });
  });

  // Rating handlers
  el.querySelectorAll('.poll-star').forEach(star => {
    star.addEventListener('click', () => {
      const pollId = parseInt(star.dataset.poll);
      const val = parseInt(star.dataset.val);
      const polls = getPolls();
      const poll = polls.find(p => p.id === pollId);
      if (!poll || poll.voted) return;
      poll.avgRating = ((poll.avgRating || 0) * (poll.totalVotes || 0) + val) / ((poll.totalVotes || 0) + 1);
      poll.totalVotes = (poll.totalVotes || 0) + 1;
      poll.voted = true;
      savePolls(polls);
      showToast(`${val} yıldız verdiniz! ⭐`, 'success');
      renderPollsPage(el);
    });
  });

  // Close poll
  el.querySelectorAll('.poll-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const polls = getPolls();
      const poll = polls.find(p => p.id === parseInt(btn.dataset.id));
      if (poll) { poll.active = false; savePolls(polls); showToast('Anket kapatıldı', 'success'); renderPollsPage(el); }
    });
  });
}

function pollCardHTML(p, isClosed = false) {
  const totalVotes = p.totalVotes || 0;
  if (p.type === 'rating') {
    const stars = Math.round(p.avgRating || 0);
    return `
    <div class="rounded-xl border ${isClosed ? 'border-white/5' : 'border-cyan-500/20'} p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-white text-sm">${p.question}</h4>
        <div class="flex items-center gap-2">
          ${p.anonymous ? '<span class="text-[10px] text-slate-500">🕶️ Anonim</span>' : ''}
          ${!isClosed ? `<button class="poll-close-btn text-[10px] text-red-400 hover:text-red-300" data-id="${p.id}">✕ Kapat</button>` : ''}
        </div>
      </div>
      <div class="flex items-center gap-4">
        <div class="flex gap-1">
          ${[1,2,3,4,5].map(i => `<button class="text-2xl poll-star" data-poll="${p.id}" data-val="${i}">${i <= stars ? '⭐' : '☆'}</button>`).join('')}
        </div>
        <div>
          <p class="text-lg font-bold text-amber-400">${(p.avgRating || 0).toFixed(1)}/5</p>
          <p class="text-[10px] text-slate-500">${totalVotes} oy</p>
        </div>
      </div>
    </div>`;
  }

  const maxVotes = Math.max(...Object.values(p.votes || {}), 1);
  return `
    <div class="rounded-xl border ${isClosed ? 'border-white/5' : 'border-cyan-500/20'} p-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-medium text-white text-sm">${p.question}</h4>
        <div class="flex items-center gap-2">
          ${p.anonymous ? '<span class="text-[10px] text-slate-500">🕶️ Anonim</span>' : ''}
          ${!isClosed ? `<button class="poll-close-btn text-[10px] text-red-400 hover:text-red-300" data-id="${p.id}">✕ Kapat</button>` : ''}
        </div>
      </div>
      <div class="space-y-2">
        ${p.options.map((opt, i) => {
          const votes = p.votes?.[i] || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return `
          <div class="rounded-lg bg-white/5 p-2 cursor-pointer hover:bg-white/10 transition poll-vote-btn ${p.voted ? '' : ''}" data-poll="${p.id}" data-option="${i}">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-slate-300">${opt}</span>
              <span class="text-xs font-bold text-white">${pct}% <span class="text-slate-500">(${votes})</span></span>
            </div>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all" style="width:${pct}%"></div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <p class="text-[10px] text-slate-500 mt-2 text-right">🗳️ ${totalVotes} toplam oy</p>
    </div>`;
}

function showPollModal(el) {
  const existing = document.getElementById('poll-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'poll-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🗳️ Anket Oluştur</h3>
      <div class="space-y-3">
        <div><label class="label">Soru *</label><input id="p-question" class="input-field w-full" placeholder="Sorunuzu yazın..."></div>
        <div><label class="label">Tür</label><select id="p-type" class="input-field w-full"><option value="choice">Çoktan Seçmeli</option><option value="rating">Puanlama (1-5)</option></select></div>
        <div id="p-options-area">
          <label class="label">Seçenekler (her satıra bir tane)</label>
          <textarea id="p-options" class="input-field w-full" rows="4" placeholder="Seçenek 1&#10;Seçenek 2&#10;Seçenek 3"></textarea>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" id="p-anon" checked> 🕶️ Anonim oylama
        </label>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="p-save" class="btn-primary flex-1">🗳️ Oluştur</button>
        <button id="p-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#p-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

  modal.querySelector('#p-type').addEventListener('change', (e) => {
    modal.querySelector('#p-options-area').style.display = e.target.value === 'rating' ? 'none' : '';
  });

  modal.querySelector('#p-save').onclick = () => {
    const question = modal.querySelector('#p-question').value.trim();
    if (!question) { showToast('Soru zorunludur', 'error'); return; }
    const type = modal.querySelector('#p-type').value;
    const options = type === 'choice' ? modal.querySelector('#p-options').value.trim().split('\n').filter(Boolean) : [];
    if (type === 'choice' && options.length < 2) { showToast('En az 2 seçenek girin', 'error'); return; }
    const polls = getPolls();
    polls.unshift({
      id: Date.now(), question, type, options,
      votes: type === 'choice' ? Object.fromEntries(options.map((_, i) => [i, 0])) : {},
      anonymous: modal.querySelector('#p-anon').checked,
      active: true, createdAt: new Date().toISOString(), totalVotes: 0, avgRating: 0
    });
    savePolls(polls);
    modal.remove();
    showToast('Anket oluşturuldu! 🗳️', 'success');
    renderPollsPage(el);
  };
}
