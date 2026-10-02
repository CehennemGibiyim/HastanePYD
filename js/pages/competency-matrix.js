// ===== YETKİNLİK MATRİSİ =====
const STORAGE_KEY = 'competency_matrix';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const skills = ['IV Erişim', 'EKG Yorumlama', 'İlk Yardım', 'Sterilizasyon', 'Ventilatör Yönetimi', 'Kan Gazı Analizi', 'CPR', 'İlaç Hesaplama', 'Hasta Taşıma', 'Enfeksiyon Kontrolü'];
  const d = [
    { id: 1, name: 'Hemşire Ayşe', department: 'Dahiliye', title: 'Başhemşire', skills: { 'IV Erişim': 4, 'EKG Yorumlama': 3, 'İlk Yardım': 5, 'Sterilizasyon': 4, 'İlaç Hesaplama': 5, 'CPR': 5, 'Enfeksiyon Kontrolü': 4 }, lastAssessment: '2026-07-01', assessor: 'Dr. Arslan', certExpiry: { 'CPR': '2027-01-15', 'İlk Yardım': '2026-12-01' } },
    { id: 2, name: 'Hemşire Fatma', department: 'Kardiyoloji', title: 'Hemşire', skills: { 'IV Erişim': 3, 'EKG Yorumlama': 5, 'İlk Yardım': 4, 'Kan Gazı Analizi': 4, 'İlaç Hesaplama': 3, 'CPR': 4 }, lastAssessment: '2026-06-15', assessor: 'Dr. Kaya', certExpiry: { 'CPR': '2026-09-01' } },
    { id: 3, name: 'Dr. Arslan', department: 'Dahiliye', title: 'Uzman Doktor', skills: { 'EKG Yorumlama': 5, 'Kan Gazı Analizi': 5, 'Ventilatör Yönetimi': 4, 'CPR': 5, 'İlaç Hesaplama': 5 }, lastAssessment: '2026-07-05', assessor: 'Başhekim', certExpiry: {} },
    { id: 4, name: 'Hemşire Zeynep', department: 'Cerrahi', title: 'Hemşire', skills: { 'IV Erişim': 4, 'Sterilizasyon': 5, 'Hasta Taşıma': 4, 'CPR': 3, 'İlaç Hesaplama': 3, 'Enfeksiyon Kontrolü': 5 }, lastAssessment: '2026-06-20', assessor: 'Dr. Çelik', certExpiry: { 'CPR': '2026-08-15' } },
  ];
  saveData(d); return d;
}
const SKILL_LEVELS = { 1: 'Başlangıç', 2: 'Temel', 3: 'Orta', 4: 'İleri', 5: 'Uzman' };

export function renderCompetencyMatrixPage(el) {
  let data = getData();
  let selectedDept = '';
  function getAllSkills() {
    const s = new Set();
    data.forEach(d => Object.keys(d.skills).forEach(k => s.add(k)));
    return [...s].sort();
  }
  function render() {
    const filtered = selectedDept ? data.filter(d => d.department === selectedDept) : data;
    const skills = getAllSkills();
    const depts = [...new Set(data.map(d => d.department))];
    const avgBySkill = {};
    skills.forEach(s => { const vals = filtered.map(d => d.skills[s]).filter(Boolean); avgBySkill[s] = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0; });
    const expiring = data.flatMap(d => Object.entries(d.certExpiry || {}).filter(([, v]) => new Date(v) < new Date(Date.now() + 90 * 86400000)).map(([cert, exp]) => ({ name: d.name, cert, exp })));

    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">📈 Yetkinlik Matrisi</h1><p class="text-slate-400 text-sm mt-1">Departman bazlı beceri ve yetkinlik takibi</p></div>
        <button id="add-comp-btn" class="btn-primary">+ Personel Ekle</button>
      </div>
      <div class="card mb-4"><div class="flex flex-wrap gap-2">
        <button class="btn-secondary text-xs ${!selectedDept ? 'tab-active' : ''}" data-dept="">Tüm Departmanlar</button>
        ${depts.map(d => `<button class="btn-secondary text-xs ${selectedDept === d ? 'tab-active' : ''}" data-dept="${d}">${d}</button>`).join('')}
      </div></div>
      ${expiring.length > 0 ? `<div class="card mb-4 border-l-4 border-amber-500"><h3 class="text-sm font-semibold text-amber-300 mb-2">⚠️ Süresi Dolacak Sertifikalar (90 gün)</h3><div class="flex flex-wrap gap-2">${expiring.map(e => `<span class="badge bg-amber-500/20 text-amber-300">${e.name} — ${e.cert} (${e.exp})</span>`).join('')}</div></div>` : ''}
      <div class="card overflow-x-auto mb-6"><table class="w-full min-w-[700px]"><thead><tr>
        <th class="th">Personel</th><th class="th">Departman</th><th class="th">Unvan</th>
        ${skills.map(s => `<th class="th text-center">${s}</th>`).join('')}
        <th class="th text-center">Ortalama</th>
      </tr></thead><tbody>
        ${filtered.map(d => {
          const vals = Object.values(d.skills);
          const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
          return `<tr class="border-t border-white/5 hover:bg-white/5">
            <td class="td font-medium text-white">${d.name}</td><td class="td">${d.department}</td><td class="td text-sm">${d.title}</td>
            ${skills.map(s => { const v = d.skills[s] || 0; return `<td class="td text-center"><span class="inline-block w-8 h-8 rounded-lg text-sm font-bold leading-8 ${v >= 4 ? 'bg-green-500/20 text-green-300' : v >= 3 ? 'bg-blue-500/20 text-blue-300' : v >= 2 ? 'bg-amber-500/20 text-amber-300' : v >= 1 ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-slate-500'}">${v || '—'}</span></td>`; }).join('')}
            <td class="td text-center font-bold text-white">${avg}</td>
          </tr>`;
        }).join('')}
      </tbody></table></div>
      <div class="card"><h3 class="text-sm font-semibold text-white mb-3">📊 Beceri Bazlı Ortalama</h3><div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        ${skills.map(s => `<div class="rounded-lg bg-white/5 p-3 text-center"><p class="text-xs text-slate-400">${s}</p><p class="text-xl font-bold ${avgBySkill[s] >= 4 ? 'text-green-300' : avgBySkill[s] >= 3 ? 'text-blue-300' : 'text-amber-300'}">${avgBySkill[s]}</p></div>`).join('')}
      </div></div>
      <div class="card mt-4"><h3 class="text-sm font-semibold text-white mb-2">📋 Puanlama Skalası</h3><div class="flex flex-wrap gap-3">${Object.entries(SKILL_LEVELS).map(([k, v]) => `<span class="badge">${k} — ${v}</span>`).join('')}</div></div>
    </div>`;
    document.querySelectorAll('[data-dept]').forEach(b => b.onclick = () => { selectedDept = b.dataset.dept; render(); });
    document.getElementById('add-comp-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const skills = getAllSkills();
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">📈 Yeni Yetkinlik Kaydı</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Ad Soyad</label><input id="cm-name" class="input-field w-full"></div><div><label class="label">Departman</label><input id="cm-dept" class="input-field w-full"></div></div>
        <div><label class="label">Unvan</label><input id="cm-title" class="input-field w-full"></div>
        <div class="border-t border-white/10 pt-3"><h4 class="text-sm font-semibold text-white mb-2">Beceri Puanları (1-5)</h4></div>
        ${skills.map(s => `<div class="flex items-center gap-3"><label class="label w-40">${s}</label><select id="cm-${s.replace(/\s/g, '_')}" class="input-field flex-1"><option value="0">— Yok</option><option value="1">1 Başlangıç</option><option value="2">2 Temel</option><option value="3">3 Orta</option><option value="4">4 İleri</option><option value="5">5 Uzman</option></select></div>`).join('')}
      </div>
      <div class="flex gap-3 mt-5"><button id="cm-save" class="btn-primary flex-1">💾 Kaydet</button><button id="cm-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('cm-cancel').onclick = () => modal.remove();
    document.getElementById('cm-save').onclick = () => {
      const name = document.getElementById('cm-name').value.trim();
      if (!name) return;
      const sk = {};
      skills.forEach(s => { const v = +(document.getElementById('cm-' + s.replace(/\s/g, '_'))?.value || 0); if (v > 0) sk[s] = v; });
      data.push({ id: Date.now(), name, department: document.getElementById('cm-dept').value, title: document.getElementById('cm-title').value, skills: sk, lastAssessment: new Date().toISOString().slice(0, 10), assessor: 'Admin', certExpiry: {} });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
