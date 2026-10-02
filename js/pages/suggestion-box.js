// ===== ÖNERI KUTUSU (ANONIM) =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_suggestions';

function getSuggestions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultSuggestions(); } catch { return getDefaultSuggestions(); } }
function saveSuggestions(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultSuggestions() {
  const now = new Date().toISOString();
  return [
    { id: 1, title: 'Yemekhane saatleri uzatılsın', description: 'Gece vardiyası personeli için yemekhane 02:00\'ye kadar açık kalmalı', category: 'efficiency', votes: 28, voters: [], status: 'under_review', response: 'Yönetim kurulunda değerlendirilecek', createdAt: now },
    { id: 2, title: 'Otopark alanı genişletilsin', description: 'Personel otoparkı yetersiz, yan alan otoparka dahil edilmeli', category: 'facility', votes: 45, voters: [], status: 'approved', response: 'Belediye ile görüşmeler başladı', createdAt: now },
    { id: 3, title: 'Dijital hasta takip sistemi', description: 'Hasta bilgileri tablet üzerinden anlık güncellenebilmeli', category: 'efficiency', votes: 35, voters: [], status: 'implemented', response: 'BT departmanı pilot uygulamaya başladı', createdAt: now },
    { id: 4, title: 'Personel dinlenme odası', description: 'Gece nöbeti sonrası personel için uyku kabini/odası ayrılmalı', category: 'welfare', votes: 52, voters: [], status: 'under_review', response: '', createdAt: now },
  ];
}

const categories = {
  safety: { label: '🛡️ İş Güvenliği', color: 'text-green-400 bg-green-500/10' },
  efficiency: { label: '⚡ Verimlilik', color: 'text-cyan-400 bg-cyan-500/10' },
  welfare: { label: '💆 Personel Refahı', color: 'text-pink-400 bg-pink-500/10' },
  facility: { label: '🏢 Tesis/Altyapı', color: 'text-amber-400 bg-amber-500/10' },
  technology: { label: '💻 Teknoloji', color: 'text-purple-400 bg-purple-500/10' },
  other: { label: '📋 Diğer', color: 'text-slate-400 bg-slate-500/10' },
};

const statusLabels = { pending: { label: 'Beklemede', color: 'text-slate-400' }, under_review: { label: 'İnceleniyor', color: 'text-blue-400' }, approved: { label: 'Onaylandı', color: 'text-green-400' }, implemented: { label: 'Uygulandı', color: 'text-emerald-400' }, rejected: { label: 'Reddedildi', color: 'text-red-400' } };

export function renderSuggestionBoxPage(el) {
  const suggestions = getSuggestions();
  const totalVotes = suggestions.reduce((s, g) => s + g.votes, 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">💡 Öneri Kutusu</h1>
          <p class="text-slate-400 text-sm mt-1">Anonim fikir gönder, oy ver ve önerileri takip et</p>
        </div>
        <button id="add-suggestion-btn" class="btn-primary">💡 Öneri Gönder</button>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${suggestions.length}</p><p class="text-xs text-slate-400">💡 Toplam Öneri</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${suggestions.filter(s => s.status === 'implemented').length}</p><p class="text-xs text-slate-400">✅ Uygulanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-pink-300">${totalVotes}</p><p class="text-xs text-slate-400">🗳️ Toplam Oy</p></div>
    </div>

    <div class="card fade-in">
      <div class="flex items-center gap-3 mb-4 flex-wrap">
        <h3 class="text-lg font-semibold text-white">Öneriler</h3>
        <select id="sg-filter" class="input-field text-xs"><option value="">Tümü</option><option value="popular">🔥 Popüler</option><option value="new">🆕 Yeni</option><option value="implemented">✅ Uygulanan</option></select>
        <select id="sg-cat" class="input-field text-xs"><option value="">Tüm Kategoriler</option>${Object.entries(categories).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}</select>
      </div>
      <div class="space-y-3" id="suggestion-list">${suggestionListHTML(suggestions)}</div>
    </div>`;

  const render = (filtered) => { el.querySelector('#suggestion-list').innerHTML = suggestionListHTML(filtered); attachVoteHandlers(el); };

  el.querySelector('#sg-filter').addEventListener('change', () => {
    let filtered = [...suggestions];
    const f = el.querySelector('#sg-filter').value;
    const c = el.querySelector('#sg-cat').value;
    if (c) filtered = filtered.filter(s => s.category === c);
    if (f === 'popular') filtered.sort((a, b) => b.votes - a.votes);
    else if (f === 'new') filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (f === 'implemented') filtered = filtered.filter(s => s.status === 'implemented');
    else filtered.sort((a, b) => b.votes - a.votes);
    render(filtered);
  });

  el.querySelector('#add-suggestion-btn')?.addEventListener('click', () => showSuggestionModal(el));
  attachVoteHandlers(el);
}

function attachVoteHandlers(el) {
  el.querySelectorAll('.sg-vote-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const list = getSuggestions();
      const s = list.find(x => x.id === id);
      if (!s) return;
      const userId = 'user_' + (localStorage.getItem('hospital_user_id') || 'anon');
      if (s.voters?.includes(userId)) { showToast('Bu öneriye zaten oy verdiniz', 'error'); return; }
      s.votes = (s.votes || 0) + 1;
      if (!s.voters) s.voters = [];
      s.voters.push(userId);
      saveSuggestions(list);
      showToast('Oyunuz kaydedildi! 🗳️', 'success');
      renderSuggestionBoxPage(el);
    });
  });
}

function suggestionListHTML(suggestions) {
  if (suggestions.length === 0) return '<p class="text-slate-500 text-sm text-center py-8">Henüz öneri yok</p>';
  return suggestions.sort((a, b) => b.votes - a.votes).map(s => `
    <div class="rounded-xl border ${s.status === 'implemented' ? 'border-green-500/20 bg-green-500/5' : 'border-white/10 bg-white/[0.02]'} p-4 hover:border-cyan-500/20 transition">
      <div class="flex items-start gap-3">
        <button class="sg-vote-btn flex flex-col items-center gap-1 min-w-[50px] py-2 rounded-lg hover:bg-cyan-500/10 transition" data-id="${s.id}">
          <span class="text-2xl">🔺</span>
          <span class="text-sm font-bold text-cyan-300">${s.votes}</span>
          <span class="text-[10px] text-slate-500">oy</span>
        </button>
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h4 class="font-semibold text-white text-sm">${s.title}</h4>
            <span class="text-[10px] px-2 py-0.5 rounded-full ${categories[s.category]?.color}">${categories[s.category]?.label}</span>
            <span class="text-[10px] ${statusLabels[s.status]?.color}">${statusLabels[s.status]?.label}</span>
          </div>
          <p class="text-xs text-slate-400 mb-2">${s.description}</p>
          ${s.response ? `<div class="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2 mt-2"><p class="text-xs text-cyan-300">💬 Yönetim: ${s.response}</p></div>` : ''}
          <p class="text-[10px] text-slate-600 mt-2">🕶️ Anonim · ${new Date(s.createdAt).toLocaleDateString('tr-TR')}</p>
        </div>
      </div>
    </div>`).join('');
}

function showSuggestionModal(el) {
  const existing = document.getElementById('sg-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'sg-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">💡 Anonim Öneri</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık *</label><input id="sg-title" class="input-field w-full" placeholder="Kısa ve net başlık"></div>
        <div><label class="label">Açıklama *</label><textarea id="sg-desc" class="input-field w-full" rows="3" placeholder="Önerinizi detaylandırın..."></textarea></div>
        <div><label class="label">Kategori</label><select id="sg-cat" class="input-field w-full">${Object.entries(categories).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
        <p class="text-xs text-slate-500">🕶️ Kimliğiniz gizli kalacak, anonim olarak gönderilecek</p>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="sg-save" class="btn-primary flex-1">💡 Gönder</button>
        <button id="sg-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#sg-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#sg-save').onclick = () => {
    const title = modal.querySelector('#sg-title').value.trim();
    const desc = modal.querySelector('#sg-desc').value.trim();
    if (!title || !desc) { showToast('Başlık ve açıklama zorunludur', 'error'); return; }
    const list = getSuggestions();
    list.push({ id: Date.now(), title, description: desc, category: modal.querySelector('#sg-cat').value, votes: 0, voters: [], status: 'pending', response: '', createdAt: new Date().toISOString() });
    saveSuggestions(list);
    modal.remove();
    showToast('Öneriniz anonim olarak gönderildi! 💡', 'success');
    renderSuggestionBoxPage(el);
  };
}
