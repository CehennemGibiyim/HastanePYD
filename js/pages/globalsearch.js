// ===== GLOBAL ARAMA =====

import { getPersonnel, getSchedules, getAttendance, getMessages, getTasks, getSurveys, PERSONNEL_TYPES } from '../state.js';

export function renderGlobalSearch(el, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">🔍 Global Arama</h1>
        <p class="text-slate-400 text-sm mt-1">Personel, nöbet, görev, mesaj ve daha fazlası</p>
      </div>
      <div class="card fade-in">
        <div class="text-center py-16">
          <p class="text-5xl mb-3">🔍</p>
          <p class="text-slate-400 text-sm">Arama yapmak için yukarıdaki kutuyu kullanın</p>
        </div>
      </div>`;
    return;
  }

  // Search across all data
  const personnelResults = getPersonnel().filter(p =>
    `${p.name} ${p.surname} ${p.department} ${p.title} ${p.tc} ${p.phone} ${p.email}`.toLowerCase().includes(q)
  );

  const scheduleResults = getSchedules().filter(s => {
    const person = getPersonnel().find(p => p.id === s.personnelId);
    return person && `${person.name} ${person.surname} ${s.department} ${s.shift} ${s.date}`.toLowerCase().includes(q);
  }).slice(0, 10);

  const taskResults = getTasks().filter(t =>
    `${t.title} ${t.description} ${t.assignedTo}`.toLowerCase().includes(q)
  ).slice(0, 10);

  const surveyResults = getSurveys().filter(s =>
    `${s.title} ${s.question}`.toLowerCase().includes(q)
  ).slice(0, 10);

  const msgResults = getMessages().filter(m =>
    `${m.subject} ${m.content} ${m.from} ${m.to}`.toLowerCase().includes(q)
  ).slice(0, 10);

  const total = personnelResults.length + scheduleResults.length + taskResults.length + surveyResults.length + msgResults.length;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔍 "${query}"</h1>
      <p class="text-slate-400 text-sm mt-1">${total} sonuç bulundu</p>
    </div>

    ${total === 0 ? `
      <div class="card fade-in">
        <div class="empty-state">
          <div class="icon">🔍</div>
          <div class="title">Sonuç bulunamadı</div>
          <div class="desc">"${query}" için eşleşen kayıt yok</div>
        </div>
      </div>
    ` : ''}

    ${personnelResults.length > 0 ? `
    <div class="card mb-4 fade-in">
      <h3 class="text-base font-semibold text-white mb-3">👥 Personel (${personnelResults.length})</h3>
      <div class="space-y-2">
        ${personnelResults.slice(0, 10).map(p => `
          <a href="#personnel/${p.id}" class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
            <div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm shrink-0">
              ${p.photo ? `<img src="${p.photo}" class="w-full h-full object-cover rounded-lg">` : (p.name[0] + p.surname[0])}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">${p.name} ${p.surname}</p>
              <p class="text-xs text-slate-400">${p.department} · ${p.title} · ${PERSONNEL_TYPES[p.type]?.label || p.type}</p>
            </div>
            <span class="text-xs text-cyan-400">Detay →</span>
          </a>
        `).join('')}
      </div>
    </div>` : ''}

    ${taskResults.length > 0 ? `
    <div class="card mb-4 fade-in">
      <h3 class="text-base font-semibold text-white mb-3">📋 Görevler (${taskResults.length})</h3>
      <div class="space-y-2">
        ${taskResults.map(t => `
          <a href="#tasks" class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
            <span class="text-lg">📋</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">${t.title}</p>
              <p class="text-xs text-slate-400">${t.status} · ${t.priority}</p>
            </div>
          </a>
        `).join('')}
      </div>
    </div>` : ''}

    ${surveyResults.length > 0 ? `
    <div class="card mb-4 fade-in">
      <h3 class="text-base font-semibold text-white mb-3">📝 Anketler (${surveyResults.length})</h3>
      <div class="space-y-2">
        ${surveyResults.map(s => `
          <a href="#surveys" class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
            <span class="text-lg">📝</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">${s.title}</p>
              <p class="text-xs text-slate-400">${s.options?.length || 0} seçenek</p>
            </div>
          </a>
        `).join('')}
      </div>
    </div>` : ''}

    ${msgResults.length > 0 ? `
    <div class="card mb-4 fade-in">
      <h3 class="text-base font-semibold text-white mb-3">💬 Mesajlar (${msgResults.length})</h3>
      <div class="space-y-2">
        ${msgResults.map(m => `
          <a href="#messages" class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 transition cursor-pointer">
            <span class="text-lg">💬</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm text-white">${m.subject || 'Konu yok'}</p>
              <p class="text-xs text-slate-400">${m.from} → ${m.to}</p>
            </div>
          </a>
        `).join('')}
      </div>
    </div>` : ''}`;
}
