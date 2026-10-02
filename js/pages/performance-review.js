// ===== 360° PERFORMANS DEGERLENDIRME =====
import { getPersonnel } from '../state.js';

function getStorage() {
  try { return JSON.parse(localStorage.getItem('hospital_perf360') || '{"reviews":[],"templates":[]}'); } catch { return { reviews: [], templates: [] }; }
}
function setStorage(d) { localStorage.setItem('hospital_perf360', JSON.stringify(d)); }

const CATEGORIES = [
  { id: 'leadership', label: 'Liderlik', icon: '👑' },
  { id: 'communication', label: 'İletişim', icon: '💬' },
  { id: 'teamwork', label: 'Takım Çalışması', icon: '🤝' },
  { id: 'technical', label: 'Teknik Yeterlilik', icon: '⚙️' },
  { id: 'problem_solving', label: 'Problem Çözme', icon: '🧩' },
  { id: 'adaptability', label: 'Uyum Yeteneği', icon: '🔄' },
  { id: 'work_ethic', label: 'İş Ahlakı', icon: '⭐' },
  { id: 'patient_care', label: 'Hasta Bakımı', icon: '🏥' },
];

const DEFAULT_QUESTIONS = {
  leadership: ['Ekibe yön verebiliyor mu?', 'Karar alma süreçlerinde etkin mi?', 'Geri bildirim veriyor mu?'],
  communication: ['Açık ve net iletişim kuruyor mu?', 'Aktif dinleme yapıyor mu?', 'Yazılı iletişimi yeterli mi?'],
  teamwork: ['Ekiple uyumlu çalışıyor mu?', 'Bilgi paylaşımı yapıyor mu?', 'Çatışma çözümü yapıcı mı?'],
  technical: ['İşinde uzman mı?', 'Güncel bilgiye sahip mi?', 'Araçları etkin kullanıyor mu?'],
  problem_solving: ['Yaratıcı çözümler üretiyor mu?', 'Analitik düşünüyor mu?', 'Stres altında karar alabiliyor mu?'],
  adaptability: ['Değişime açık mı?', 'Yeni teknolojilere uyum sağlıyor mu?', 'Esnek çalışma yeteneği var mı?'],
  work_ethic: ['Zamanında geliyor mu?', 'Sorumluluk sahibi mi?', 'Etik ilkelere uyuyor mu?'],
  patient_care: ['Hasta memnuniyeti yüksek mi?', 'Empati gösteriyor mu?', 'Güvenlik protokollerine uyuyor mu?'],
};

export function renderPerformanceReviewPage(el) {
  const data = getStorage();
  const personnel = getPersonnel({}).filter(p => p.status === 'active');
  const tab = data._tab || 'create';
  const selectedEmp = data._selectedEmp || null;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">📊 360° Performans Değerlendirme</h1>
      <p class="text-slate-400 text-sm mt-1">Çoklu değerlendirici sistemi ile kapsamlı performans analizi</p>
    </div>

    <div class="flex gap-2 mb-6 overflow-x-auto pb-2 fade-in">
      <button class="${tab === 'create' ? 'tab-active' : 'tab-inactive'}" data-tab="create">📝 Yeni Değerlendirme</button>
      <button class="${tab === 'history' ? 'tab-active' : 'tab-inactive'}" data-tab="history">📋 Geçmiş</button>
      <button class="${tab === 'matrix' ? 'tab-active' : 'tab-inactive'}" data-tab="matrix">📊 Yetenek Matrisi</button>
      <button class="${tab === 'compare' ? 'tab-active' : 'tab-inactive'}" data-tab="compare">⚖️ Karşılaştırma</button>
    </div>

    <div id="perf360-content" class="fade-in"></div>`;

  renderTabContent(tab, data, personnel);

  el.querySelectorAll('[data-tab]').forEach(btn => {
    btn.onclick = () => {
      const d = getStorage();
      d._tab = btn.dataset.tab;
      setStorage(d);
      renderPerformanceReviewPage(el);
    };
  });
}

function renderTabContent(tab, data, personnel) {
  const container = document.getElementById('perf360-content');
  if (!container) return;

  if (tab === 'create') renderCreateTab(container, data, personnel);
  else if (tab === 'history') renderHistoryTab(container, data, personnel);
  else if (tab === 'matrix') renderMatrixTab(container, data, personnel);
  else if (tab === 'compare') renderCompareTab(container, data, personnel);
}

function renderCreateTab(container, data, personnel) {
  const selectedEmp = data._selectedEmp || '';
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="card lg:col-span-1">
        <h3 class="text-lg font-semibold text-white mb-4">👤 Değerlendirme Bilgileri</h3>
        <div class="space-y-4">
          <div>
            <label class="label">Değerlendirilecek Personel</label>
            <select id="p360-emp" class="input-field w-full">
              <option value="">Seçiniz...</option>
              ${personnel.map(p => `<option value="${p.id}" ${p.id == selectedEmp ? 'selected' : ''}>${p.name} ${p.surname} — ${p.department}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="label">Değerlendirici Türü</label>
            <select id="p360-type" class="input-field w-full">
              <option value="self">Kişisel (Öz Değerlendirme)</option>
              <option value="manager">Yönetici</option>
              <option value="peer">Meslektaş</option>
              <option value="subordinate">Ast</option>
              <option value="patient">Hasta/Müşteri</option>
            </select>
          </div>
          <div>
            <label class="label">Değerlendirici Adı</label>
            <input id="p360-evaluator" class="input-field w-full" placeholder="Değerlendirici adı">
          </div>
          <div>
            <label class="label">Dönem</label>
            <select id="p360-period" class="input-field w-full">
              <option value="2025-Q1">2025 Q1</option>
              <option value="2025-Q2" selected>2025 Q2</option>
              <option value="2025-Q3">2025 Q3</option>
              <option value="2025-Q4">2025 Q4</option>
            </select>
          </div>
        </div>
      </div>
      <div class="card lg:col-span-2">
        <h3 class="text-lg font-semibold text-white mb-4">📊 Değerlendirme Formu</h3>
        <div id="p360-form" class="space-y-4">
          ${CATEGORIES.map(cat => `
            <div class="rounded-xl bg-white/5 border border-white/10 p-4">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-xl">${cat.icon}</span>
                <span class="text-sm font-semibold text-white">${cat.label}</span>
              </div>
              ${(DEFAULT_QUESTIONS[cat.id] || []).map((q, qi) => `
                <div class="flex items-center gap-3 mb-2">
                  <span class="text-xs text-slate-400 flex-1">${q}</span>
                  <div class="flex gap-1" data-cat="${cat.id}" data-qi="${qi}">
                    ${[1,2,3,4,5].map(v => `<button class="p360-score w-8 h-8 rounded-lg text-xs font-bold transition ${v <= 2 ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : v === 3 ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'}" data-val="${v}">${v}</button>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        <div class="mt-4">
          <label class="label">Yorumlar / Ek Notlar</label>
          <textarea id="p360-comment" class="input-field w-full" rows="3" placeholder="Değerlendirme hakkında ek notlar..."></textarea>
        </div>
        <div class="flex gap-3 mt-4">
          <button id="p360-submit" class="btn-primary flex-1">📤 Değerlendirmeyi Gönder</button>
          <button id="p360-reset" class="btn-secondary">🔄 Sıfırla</button>
        </div>
      </div>
    </div>`;

  // Score buttons
  let scores = {};
  container.querySelectorAll('.p360-score').forEach(btn => {
    btn.onclick = () => {
      const cat = btn.parentElement.dataset.cat;
      const qi = btn.parentElement.dataset.qi;
      scores[`${cat}_${qi}`] = parseInt(btn.dataset.val);
      btn.parentElement.querySelectorAll('.p360-score').forEach(b => {
        b.classList.remove('ring-2', 'ring-cyan-400');
        b.style.transform = '';
      });
      btn.classList.add('ring-2', 'ring-cyan-400');
      btn.style.transform = 'scale(1.15)';
    };
  });

  document.getElementById('p360-submit')?.addEventListener('click', () => {
    const empId = document.getElementById('p360-emp').value;
    if (!empId) { alert('Lütfen personel seçin'); return; }
    const answered = Object.keys(scores).length;
    const totalQuestions = CATEGORIES.reduce((s, c) => s + (DEFAULT_QUESTIONS[c.id]?.length || 0), 0);
    if (answered < totalQuestions) { alert(`Lütfen tüm soruları yanıtlayın (${answered}/${totalQuestions})`); return; }
    const catScores = {};
    CATEGORIES.forEach(cat => {
      const qs = DEFAULT_QUESTIONS[cat.id] || [];
      let sum = 0, count = 0;
      qs.forEach((_, qi) => {
        const val = scores[`${cat.id}_${qi}`];
        if (val) { sum += val; count++; }
      });
      catScores[cat.id] = count > 0 ? (sum / count).toFixed(1) : 0;
    });
    const d = getStorage();
    d.reviews.push({
      id: Date.now(),
      employeeId: parseInt(empId),
      evaluatorType: document.getElementById('p360-type').value,
      evaluatorName: document.getElementById('p360-evaluator').value || 'Anonim',
      period: document.getElementById('p360-period').value,
      scores: catScores,
      overall: (Object.values(catScores).reduce((s, v) => s + parseFloat(v), 0) / CATEGORIES.length).toFixed(1),
      comment: document.getElementById('p360-comment').value,
      createdAt: new Date().toISOString(),
    });
    setStorage(d);
    alert('Değerlendirme başarıyla kaydedildi!');
    scores = {};
    renderPerformanceReviewPage(document.getElementById('content'));
  });
}

function renderHistoryTab(container, data, personnel) {
  const reviews = data.reviews || [];
  if (reviews.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="icon">📋</div><div class="title">Henüz değerlendirme yok</div><div class="desc">İlk 360° değerlendirmeyi oluşturun</div></div>`;
    return;
  }
  const byEmployee = {};
  reviews.forEach(r => {
    if (!byEmployee[r.employeeId]) byEmployee[r.employeeId] = [];
    byEmployee[r.employeeId].push(r);
  });
  container.innerHTML = `
    <div class="space-y-4">
      ${Object.entries(byEmployee).map(([empId, revs]) => {
        const emp = personnel.find(p => p.id === parseInt(empId));
        if (!emp) return '';
        const avgOverall = (revs.reduce((s, r) => s + parseFloat(r.overall), 0) / revs.length).toFixed(1);
        const catAvg = {};
        CATEGORIES.forEach(cat => {
          const vals = revs.map(r => parseFloat(r.scores[cat.id]) || 0).filter(v => v > 0);
          catAvg[cat.id] = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '-';
        });
        return `<div class="card">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center text-lg font-bold text-cyan-300 overflow-hidden">${emp.photo ? `<img src="${emp.photo}" alt="${emp.name} ${emp.surname}" class="w-full h-full object-cover">` : `${emp.name[0]}${emp.surname[0]}`}</div>
              <div>
                <h3 class="text-lg font-semibold text-white">${emp.name} ${emp.surname}</h3>
                <p class="text-xs text-slate-400">${emp.department} · ${revs.length} değerlendirme</p>
              </div>
            </div>
            <div class="text-center">
              <p class="text-3xl font-bold ${parseFloat(avgOverall) >= 4 ? 'text-emerald-400' : parseFloat(avgOverall) >= 3 ? 'text-amber-400' : 'text-red-400'}">${avgOverall}</p>
              <p class="text-xs text-slate-400">Genel Ortalama</p>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            ${CATEGORIES.map(cat => `
              <div class="rounded-lg bg-white/5 p-3 text-center">
                <span class="text-lg">${cat.icon}</span>
                <p class="text-lg font-bold text-white mt-1">${catAvg[cat.id]}</p>
                <p class="text-[10px] text-slate-400">${cat.label}</p>
              </div>
            `).join('')}
          </div>
          <div class="mt-4 space-y-2">
            ${revs.slice(-3).reverse().map(r => `
              <div class="flex items-center gap-3 rounded-lg bg-white/5 p-3">
                <span class="badge text-xs">${r.evaluatorType === 'self' ? 'Öz' : r.evaluatorType === 'manager' ? 'Yönetici' : r.evaluatorType === 'peer' ? 'Meslektaş' : r.evaluatorType === 'subordinate' ? 'Ast' : 'Hasta'}</span>
                <span class="text-sm text-slate-300 flex-1">${r.evaluatorName}</span>
                <span class="text-xs text-slate-400">${r.period}</span>
                <span class="text-sm font-bold ${parseFloat(r.overall) >= 4 ? 'text-emerald-300' : 'text-amber-300'}">${r.overall}</span>
              </div>
            `).join('')}
          </div>
        </div>`;
      }).join('')}
    </div>`;
}

function renderMatrixTab(container, data, personnel) {
  const reviews = data.reviews || [];
  const matrix = {};
  personnel.forEach(emp => {
    const empReviews = reviews.filter(r => r.employeeId === emp.id);
    if (empReviews.length > 0) {
      const avg = (empReviews.reduce((s, r) => s + parseFloat(r.overall), 0) / empReviews.length).toFixed(1);
      matrix[emp.id] = { avg, count: empReviews.length };
    }
  });
  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">🎯 Yetenek Matrisi</h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead><tr>
            <th class="th">Personel</th>
            <th class="th">Departman</th>
            ${CATEGORIES.map(c => `<th class="th text-center">${c.icon}</th>`).join('')}
            <th class="th text-center">Ortalama</th>
            <th class="th text-center">Değerlendirme</th>
          </tr></thead>
          <tbody>
            ${personnel.map(emp => {
              const empReviews = reviews.filter(r => r.employeeId === emp.id);
              if (empReviews.length === 0) return '';
              const catAvgs = CATEGORIES.map(cat => {
                const vals = empReviews.map(r => parseFloat(r.scores[cat.id]) || 0).filter(v => v > 0);
                return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : '-';
              });
              const overall = (empReviews.reduce((s, r) => s + parseFloat(r.overall), 0) / empReviews.length).toFixed(1);
              return `<tr class="border-t border-white/5">
                <td class="td font-medium text-white">${emp.name} ${emp.surname}</td>
                <td class="td">${emp.department}</td>
                ${catAvgs.map(v => `<td class="td text-center">${v !== '-' ? `<span class="badge">${v}</span>` : '-'}</td>`).join('')}
                <td class="td text-center"><span class="text-lg font-bold ${parseFloat(overall) >= 4 ? 'text-emerald-300' : 'text-amber-300'}">${overall}</span></td>
                <td class="td text-center">${empReviews.length}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderCompareTab(container, data, personnel) {
  const reviews = data.reviews || [];
  const depts = [...new Set(personnel.map(p => p.department))];
  const deptScores = depts.map(dept => {
    const deptEmps = personnel.filter(p => p.department === dept);
    const deptReviews = reviews.filter(r => deptEmps.some(e => e.id === r.employeeId));
    if (deptReviews.length === 0) return { dept, avg: 0, count: 0 };
    const avg = (deptReviews.reduce((s, r) => s + parseFloat(r.overall), 0) / deptReviews.length).toFixed(1);
    return { dept, avg: parseFloat(avg), count: deptReviews.length };
  }).filter(d => d.count > 0).sort((a, b) => b.avg - a.avg);

  container.innerHTML = `
    <div class="card">
      <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Karşılaştırması</h3>
      ${deptScores.length === 0 ? '<p class="text-slate-500 text-sm">Henüz yeterli veri yok</p>' : `
      <div class="space-y-3">
        ${deptScores.map((d, i) => `
          <div class="flex items-center gap-4">
            <span class="text-lg font-bold ${i === 0 ? 'text-amber-400' : 'text-slate-400'} w-8">${i + 1}.</span>
            <span class="text-sm text-white w-40">${d.dept}</span>
            <div class="flex-1 h-8 rounded-lg bg-white/5 overflow-hidden">
              <div class="h-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-end pr-3" style="width:${(d.avg / 5 * 100).toFixed(0)}%">
                <span class="text-xs font-bold text-white">${d.avg}</span>
              </div>
            </div>
            <span class="text-xs text-slate-400 w-16 text-right">${d.count} değerlendirme</span>
          </div>
        `).join('')}
      </div>`}
    </div>`;
}
