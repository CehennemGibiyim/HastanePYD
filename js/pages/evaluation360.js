// ===== 360 DEGERLENDIRME =====
import { get360Evaluations, add360Evaluation, get360Summary } from '../state-extensions.js';
import { getPersonnel, getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

export function renderEvaluation360Page(el) {
  const user = getCurrentUser();
  const allPersonnel = getPersonnel({ status: 'active' });

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📊 360° Değerlendirme</h1>
          <p class="text-slate-400 text-sm mt-1">Çoklu değerlendirici performans sistemi</p>
        </div>
        <button id="add-eval-btn" class="btn-primary text-sm">+ Değerlendirme Yap</button>
      </div>
    </div>
    <div class="flex flex-wrap gap-3 mb-6 fade-in">
      <select id="eval-person" class="input-field w-64"><option value="">Personel seçiniz</option>${allPersonnel.map(p => '<option value="' + p.id + '">' + p.name + ' ' + p.surname + ' - ' + p.department + '</option>').join('')}</select>
    </div>
    <div id="eval-summary" class="fade-in"></div>
    <div id="eval-details" class="fade-in"></div>
    <div id="eval-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">📊 360° Değerlendirme Yap</h3>
        <div class="space-y-3">
          <div><label class="label">Değerlendirilecek Personel</label><select id="eval-target" class="input-field w-full"><option value="">Seçiniz</option>${allPersonnel.map(p => '<option value="' + p.id + '">' + p.name + ' ' + p.surname + '</option>').join('')}</select></div>
          <div><label class="label">Değerlendirici Rolü</label><select id="eval-role" class="input-field w-full"><option value="self">Kendisi</option><option value="manager">Yönetici</option><option value="peer" selected>Arkadaş</option><option value="subordinate">Ast</option></select></div>
          <div id="eval-ratings">
            <label class="label mb-2">Kategoriler (1-5)</label>
            ${['İş Kalitesi', 'İletişim', 'Takım Çalışması', 'Girişimcilik', 'Liderlik'].map(cat => `
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm text-slate-300 w-32">${cat}</span>
                <div class="flex gap-1">${[1,2,3,4,5].map(n => `<button data-cat="${cat}" data-score="${n}" class="eval-star w-8 h-8 rounded-lg bg-white/5 hover:bg-cyan-500/20 text-sm transition">${n}</button>`).join('')}</div>
                <span class="eval-score text-xs text-cyan-300 w-8" data-cat-score="${cat}">-</span>
              </div>`).join('')}
          </div>
          <div><label class="label">Yorum</label><textarea id="eval-comment" class="input-field w-full" rows="3" placeholder="Değerlendirme yorumu..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-6"><button id="eval-save" class="btn-primary flex-1">💾 Kaydet</button><button id="eval-cancel" class="btn-secondary flex-1">İptal</button></div>
      </div>
    </div>`;

  const ratings = {};
  document.querySelectorAll('.eval-star').forEach(btn => {
    btn.onclick = () => {
      const cat = btn.dataset.cat;
      const score = parseInt(btn.dataset.score);
      ratings[cat] = score;
      document.querySelectorAll(`[data-cat="${cat}"]`).forEach(b => {
        b.className = 'eval-star w-8 h-8 rounded-lg text-sm transition ' + (parseInt(b.dataset.score) <= score ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/30' : 'bg-white/5 hover:bg-cyan-500/20');
      });
      document.querySelector(`[data-cat-score="${cat}"]`).textContent = score;
    };
  });

  function renderSummary() {
    const pid = parseInt(document.getElementById('eval-person').value);
    const summaryContainer = document.getElementById('eval-summary');
    const detailsContainer = document.getElementById('eval-details');
    if (!pid) { summaryContainer.innerHTML = '<div class="empty-state"><div class="icon">📊</div><div class="title">Personel seçiniz</div></div>'; detailsContainer.innerHTML = ''; return; }
    const summary = get360Summary(pid);
    const evals = get360Evaluations(pid);
    if (!summary) { summaryContainer.innerHTML = '<div class="empty-state"><div class="icon">📊</div><div class="title">Henüz değerlendirme yapılmamış</div></div>'; detailsContainer.innerHTML = ''; return; }
    const roleLabels = { self: '🧠 Kendisi', manager: '👔 Yönetici', peer: '🤝 Arkadaş', subordinate: '👥 Ast' };
    const maxCat = Math.max(...summary.categories.map(c => c.avg), 1);
    summaryContainer.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${summary.overall}</p><p class="text-xs text-slate-400">Genel Puan</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-white">${summary.evaluatorCount}</p><p class="text-xs text-slate-400">Değerlendirici</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${summary.categories.length}</p><p class="text-xs text-slate-400">Kategori</p></div>
        <div class="card text-center"><p class="text-3xl font-bold ${summary.overall >= 4 ? 'text-green-300' : summary.overall >= 3 ? 'text-amber-300' : 'text-red-300'}">${summary.overall >= 4 ? '⭐ Mükemmel' : summary.overall >= 3 ? '✅ İyi' : '⚠️ Geliştirilmeli'}</p><p class="text-xs text-slate-400">Durum</p></div>
      </div>
      <div class="card mb-6">
        <h3 class="text-lg font-semibold text-white mb-4">📈 Kategori Bazlı Puanlar</h3>
        <div class="space-y-3">${summary.categories.map(c => `
          <div class="flex items-center gap-3">
            <span class="text-sm text-slate-300 w-32">${c.category}</span>
            <div class="flex-1 h-7 rounded-lg bg-white/5 overflow-hidden">
              <div class="h-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-end pr-2" style="width:${Math.round(c.avg / 5 * 100)}%">
                <span class="text-xs font-bold text-white">${c.avg}/5</span>
              </div>
            </div>
            <span class="text-xs text-slate-500 w-12 text-right">${c.count} oy</span>
          </div>`).join('')}
        </div>
      </div>`;
    detailsContainer.innerHTML = `
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">💬 Değerlendirme Detayları</h3>
        <div class="space-y-3">${evals.map(e => {
          const evaluator = allPersonnel.find(p => p.id === e.evaluatorId);
          return `<div class="rounded-xl bg-white/5 border border-white/10 p-4">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <span class="text-sm">${roleLabels[e.evaluatorRole] || e.evaluatorRole}</span>
                <span class="text-sm text-white font-medium">${evaluator ? evaluator.name + ' ' + evaluator.surname : 'Bilinmiyor'}</span>
              </div>
              <span class="text-xs text-slate-500">${new Date(e.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
            <div class="flex flex-wrap gap-2 mb-2">${(e.ratings || []).map(r => `<span class="inline-block px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">${r.category}: ${r.score}/5</span>`).join('')}</div>
            ${e.comment ? '<p class="text-sm text-slate-300 italic">"' + e.comment + '"</p>' : ''}
          </div>`;
        }).join('')}</div>
      </div>`;
  }

  document.getElementById('eval-person').onchange = renderSummary;
  document.getElementById('add-eval-btn').onclick = () => document.getElementById('eval-modal').classList.remove('hidden');
  document.getElementById('eval-cancel').onclick = () => document.getElementById('eval-modal').classList.add('hidden');
  document.getElementById('eval-modal').onclick = (e) => { if (e.target.id === 'eval-modal') document.getElementById('eval-modal').classList.add('hidden'); };
  document.getElementById('eval-save').onclick = () => {
    const targetId = parseInt(document.getElementById('eval-target').value);
    if (!targetId) { showToast('Personel seçiniz', 'error'); return; }
    const cats = Object.entries(ratings).map(([category, score]) => ({ category, score }));
    if (!cats.length) { showToast('En az bir kategori puanlayınız', 'error'); return; }
    add360Evaluation({ targetId, evaluatorId: 1, evaluatorRole: document.getElementById('eval-role').value, ratings: cats, comment: document.getElementById('eval-comment').value });
    document.getElementById('eval-modal').classList.add('hidden');
    showToast('Değerlendirme kaydedildi', 'success');
    renderSummary();
  };
  renderSummary();
}
