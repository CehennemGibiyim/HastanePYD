// ===== ANKET MODÜLÜ SAYFASI =====

import {
  getPersonnel, getCurrentUser, isDepartmentRestricted, getUserDepartment,
  getSurveys, saveSurveys,
} from '../state.js';
import { showToast } from '../notifications.js';

export function renderSurveysPage(el) {
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  let surveys = getSurveys();

  const active = surveys.filter(s => s.active).length;
  const totalVotes = surveys.reduce((sum, s) => sum + (s.responses?.length || 0), 0);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📝 Anket Modülü</h1>
          <p class="text-slate-400 text-sm mt-1">Personel memnuniyet anketleri ve oylama</p>
        </div>
        ${isAdmin ? '<button id="add-survey-btn" class="btn-primary text-sm">+ Yeni Anket</button>' : ''}
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6 fade-in">
      <div class="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 border border-cyan-500/20 p-5">
        <p class="text-sm text-cyan-300">📊 Toplam Anket</p>
        <p class="text-3xl font-bold text-white mt-1">${surveys.length}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/5 border border-green-500/20 p-5">
        <p class="text-sm text-green-300">✅ Aktif Anket</p>
        <p class="text-3xl font-bold text-white mt-1">${active}</p>
      </div>
      <div class="rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 p-5">
        <p class="text-sm text-purple-300">🗳️ Toplam Oy</p>
        <p class="text-3xl font-bold text-white mt-1">${totalVotes}</p>
      </div>
    </div>

    <div id="surveys-list" class="space-y-3 fade-in"></div>
    <div id="survey-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"></div>`;

  renderSurveysList(surveys);
  if (isAdmin) document.getElementById('add-survey-btn').onclick = () => openSurveyModal();

  function renderSurveysList(allSurveys) {
    const container = document.getElementById('surveys-list');
    if (!allSurveys.length) {
      container.innerHTML = '<div class="text-center py-12 text-slate-500"><p class="text-4xl mb-2">📝</p><p>Henüz anket oluşturulmamış</p></div>';
      return;
    }

    container.innerHTML = allSurveys.map(s => {
      const hasVoted = s.responses?.some(r => r.username === user?.username);
      const totalResponses = s.responses?.length || 0;
      const results = calcResults(s);

      return `<div class="card">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-semibold text-white">${s.title}</h3>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-medium ${s.active ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-400'}">${s.active ? 'Aktif' : 'Kapalı'}</span>
            </div>
            ${s.description ? `<p class="text-xs text-slate-400 mt-1">${s.description}</p>` : ''}
            <p class="text-[10px] text-slate-500 mt-1">Oluşturan: ${s.createdBy} · ${totalResponses} oy</p>
          </div>
          ${isAdmin ? `<div class="flex gap-1">
            <button data-toggle-survey="${s.id}" class="text-xs px-2 py-1 rounded ${s.active ? 'text-amber-400 hover:bg-amber-500/10' : 'text-green-400 hover:bg-green-500/10'}">${s.active ? '⏸️ Kapat' : '▶️ Aç'}</button>
            <button data-del-survey="${s.id}" class="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-500/10">🗑️</button>
          </div>` : ''}
        </div>
        <div class="space-y-2">
          ${s.options.map((opt, idx) => {
            const votes = results[idx] || 0;
            const pct = totalResponses ? Math.round((votes / totalResponses) * 100) : 0;
            const userVoted = s.responses?.some(r => r.username === user?.username && r.optionIndex === idx);
            return `<div class="relative">
              ${!hasVoted && s.active ? `<button data-vote="${s.id}:${idx}" class="w-full text-left rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-white">${opt}</span>
                  <span class="text-xs text-slate-500">${votes} oy</span>
                </div>
                <div class="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div class="h-full rounded-full bg-cyan-500 transition-all" style="width:${pct}%"></div>
                </div>
              </button>` : `<div class="rounded-xl ${userVoted ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/10'} border p-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm ${userVoted ? 'text-cyan-300 font-medium' : 'text-white'}">${userVoted ? '✓ ' : ''}${opt}</span>
                  <span class="text-sm font-medium ${userVoted ? 'text-cyan-400' : 'text-slate-400'}">${votes} oy (${pct}%)</span>
                </div>
                <div class="h-2 rounded-full bg-white/10 mt-2 overflow-hidden">
                  <div class="h-full rounded-full ${userVoted ? 'bg-cyan-400' : 'bg-slate-500'} transition-all" style="width:${pct}%"></div>
                </div>
              </div>`}
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('[data-vote]').forEach(btn => {
      btn.onclick = () => {
        const [surveyId, optIdx] = btn.dataset.vote.split(':').map(Number);
        const allSurveys = getSurveys();
        const survey = allSurveys.find(s => s.id === surveyId);
        if (survey && survey.active) {
          if (!survey.responses) survey.responses = [];
          survey.responses.push({ username: user?.username, optionIndex: optIdx, date: new Date().toISOString() });
          saveSurveys(allSurveys);
          showToast('Oyunuz kaydedildi', 'success');
          // Konfeti efekti
          if (typeof confetti === 'function') {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 }, colors: ['#22d3ee', '#67e8f9', '#a5f3fc', '#0891b2'] });
          }
          renderSurveysList(allSurveys);
        }
      };
    });

    container.querySelectorAll('[data-toggle-survey]').forEach(btn => {
      btn.onclick = () => {
        const allSurveys = getSurveys();
        const survey = allSurveys.find(s => s.id === parseInt(btn.dataset.toggleSurvey));
        if (survey) {
          survey.active = !survey.active;
          saveSurveys(allSurveys);
          showToast(survey.active ? 'Anket açıldı' : 'Anket kapatıldı', 'info');
          renderSurveysList(allSurveys);
        }
      };
    });

    container.querySelectorAll('[data-del-survey]').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Bu anketi silmek istediğinize emin misiniz?')) {
          const remaining = getSurveys().filter(s => s.id !== parseInt(btn.dataset.delSurvey));
          saveSurveys(remaining);
          showToast('Anket silindi', 'success');
          renderSurveysList(remaining);
        }
      };
    });
  }

  function calcResults(survey) {
    const results = {};
    (survey.responses || []).forEach(r => {
      results[r.optionIndex] = (results[r.optionIndex] || 0) + 1;
    });
    return results;
  }

  function openSurveyModal() {
    const modal = document.getElementById('survey-modal');
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-white">📝 Yeni Anket</h3>
          <button id="survey-close" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400">✕</button>
        </div>
        <div class="space-y-3">
          <div><label class="label">Anket Başlığı *</label><input id="survey-title" class="input-field w-full" placeholder="Anket konusu"></div>
          <div><label class="label">Açıklama</label><textarea id="survey-desc" class="input-field w-full" rows="2" placeholder="Ek bilgi..."></textarea></div>
          <div>
            <label class="label">Seçenekler * (en az 2)</label>
            <div id="survey-options" class="space-y-2">
              <input class="input-field w-full survey-opt" placeholder="Seçenek 1">
              <input class="input-field w-full survey-opt" placeholder="Seçenek 2">
            </div>
            <button id="add-opt-btn" class="text-xs text-cyan-400 hover:text-cyan-300 mt-2">+ Seçenek Ekle</button>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button id="survey-save" class="btn-primary flex-1">🗳️ Oylamayı Başlat</button>
          <button id="survey-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;

    modal.classList.remove('hidden');
    modal.onclick = (e) => { if (e.target.id === 'survey-modal') modal.classList.add('hidden'); };
    document.getElementById('survey-close').onclick = () => modal.classList.add('hidden');
    document.getElementById('survey-cancel').onclick = () => modal.classList.add('hidden');

    document.getElementById('add-opt-btn').onclick = () => {
      const container = document.getElementById('survey-options');
      const count = container.querySelectorAll('.survey-opt').length + 1;
      const input = document.createElement('input');
      input.className = 'input-field w-full survey-opt';
      input.placeholder = `Seçenek ${count}`;
      container.appendChild(input);
    };

    document.getElementById('survey-save').onclick = () => {
      const title = document.getElementById('survey-title').value.trim();
      const options = [...document.querySelectorAll('.survey-opt')].map(i => i.value.trim()).filter(Boolean);
      if (!title) { showToast('Anket başlığı gereklidir', 'error'); return; }
      if (options.length < 2) { showToast('En az 2 seçenek gereklidir', 'error'); return; }

      const allSurveys = getSurveys();
      allSurveys.push({
        id: Date.now(),
        title,
        description: document.getElementById('survey-desc').value,
        options,
        responses: [],
        active: true,
        createdBy: getCurrentUser()?.name || 'Sistem',
        createdAt: new Date().toISOString(),
      });
      saveSurveys(allSurveys);
      modal.classList.add('hidden');
      showToast('Anket oluşturuldu', 'success');
      renderSurveysPage(el);
    };
  }
}
