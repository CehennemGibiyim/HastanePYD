// ===== DÜŞME RİSKİ DEĞERLENDİRMESİ (MORSE FALL SCALE) =====
const STORAGE_KEY = 'fall_risk_data';

function getData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); }
  catch { return seed(); }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function seed() {
  const d = [
    { id: 1, patientName: 'Osman Bey', room: '101-A', age: 78, date: new Date().toISOString().slice(0, 10),
      history: true, secondaryDiagnosis: true, ambulatoryAid: true, ivHeparin: false, gait: true, mentalStatus: false,
      totalScore: 55, riskLevel: 'high', interventions: ['Yatağın kenarlıklarını kaldır', 'Kaymaz terlik ver', 'Çağrı zili erişilebilir'], nurse: 'Hemşire Ayşe' },
    { id: 2, patientName: 'Ayşe Kaya', room: '205-B', age: 45, date: new Date().toISOString().slice(0, 10),
      history: false, secondaryDiagnosis: false, ambulatoryAid: false, ivHeparin: true, gait: false, mentalStatus: false,
      totalScore: 20, riskLevel: 'low', interventions: [], nurse: 'Hemşire Fatma' },
    { id: 3, patientName: 'Mehmet Öz', room: '310-A', age: 65, date: new Date().toISOString().slice(0, 10),
      history: true, secondaryDiagnosis: true, ambulatoryAid: false, ivHeparin: true, gait: true, mentalStatus: false,
      totalScore: 45, riskLevel: 'moderate', interventions: ['Gece lambası açık bırak', 'Yatağı en düşük seviyeye getir'], nurse: 'Hemşire Zeynep' },
  ];
  saveData(d);
  return d;
}

const RISK_LEVELS = {
  low: { label: 'Düşük Risk', range: '0-24', color: 'green', icon: '🟢', measures: ['Standart bakım', 'Çağrı zili ver'] },
  moderate: { label: 'Orta Risk', range: '25-50', color: 'amber', icon: '🟡', measures: ['Yatak kenarlığı kaldır', 'Gece lambası', 'Kaymaz terlik', 'Düzenli ziyaret'] },
  high: { label: 'Yüksek Risk', range: '51+', color: 'red', icon: '🔴', measures: ['1:1 gözlem', 'Yatağı en düşük', 'Kaymaz terlik zorunlu', 'Çağrı zili erişim', 'Düşme protokolü aktif'] },
};

export function renderFallRiskPage(el) {
  let data = getData();

  function calcScore(item) {
    return (item.history ? 25 : 0) + (item.secondaryDiagnosis ? 15 : 0) + (item.ambulatoryAid ? 15 : 0) +
           (item.ivHeparin ? 20 : 0) + (item.gait ? 10 : 0) + (item.mentalStatus ? 15 : 0);
  }
  function getLevel(score) { return score >= 51 ? 'high' : score >= 25 ? 'moderate' : 'low'; }

  function render() {
    const high = data.filter(d => d.riskLevel === 'high').length;
    const moderate = data.filter(d => d.riskLevel === 'moderate').length;
    const low = data.filter(d => d.riskLevel === 'low').length;

    el.innerHTML = `
      <div class="fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white">⚠️ Düşme Riski Değerlendirmesi</h1>
            <p class="text-slate-400 text-sm mt-1">Morse Fall Scale ile hasta düşme riski skorlaması</p>
          </div>
          <button id="add-fr-btn" class="btn-primary">+ Yeni Değerlendirme</button>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="card text-center border-l-4 border-red-500"><p class="text-3xl font-bold text-red-300">${high}</p><p class="text-xs text-slate-400">🔴 Yüksek Risk</p></div>
          <div class="card text-center border-l-4 border-amber-500"><p class="text-3xl font-bold text-amber-300">${moderate}</p><p class="text-xs text-slate-400">🟡 Orta Risk</p></div>
          <div class="card text-center border-l-4 border-green-500"><p class="text-3xl font-bold text-green-300">${low}</p><p class="text-xs text-slate-400">🟢 Düşük Risk</p></div>
        </div>

        <div class="card mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <h3 class="text-sm font-semibold text-amber-300 mb-2">📋 Morse Fall Scale Kriterleri</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300">
            <div>📌 Düşme öyküsü (+25)</div>
            <div>📌 İkincil tanı (+15)</div>
            <div>📌 Yürüme yardımcısı (+15)</div>
            <div>📌 IV/Heparin (+20)</div>
            <div>📌 Yürüme bozukluğu (+10)</div>
            <div>📌 Mental durum bozukluğu (+15)</div>
          </div>
        </div>

        <div class="space-y-3">
          ${data.sort((a, b) => { const o = { high: 0, moderate: 1, low: 2 }; return o[a.riskLevel] - o[b.riskLevel]; }).map(d => {
            const lv = RISK_LEVELS[d.riskLevel];
            return `
            <div class="card border-l-4 border-${lv.color}-500">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="text-lg font-bold text-white">${d.patientName}</h3>
                    <span class="badge bg-${lv.color}-500/20 text-${lv.color}-300">${lv.icon} ${lv.label}</span>
                    <span class="badge bg-white/10 text-xl font-bold">${d.totalScore}</span>
                  </div>
                  <p class="text-xs text-slate-400 mb-2">🏥 ${d.room} · ${d.age} yaş · 👩‍⚕️ ${d.nurse} · 📅 ${d.date}</p>
                  <div class="flex flex-wrap gap-2 mb-2">
                    ${d.history ? '<span class="badge bg-red-500/20 text-red-300 text-xs">Düşme öyküsü</span>' : ''}
                    ${d.secondaryDiagnosis ? '<span class="badge bg-amber-500/20 text-amber-300 text-xs">İkincil tanı</span>' : ''}
                    ${d.ambulatoryAid ? '<span class="badge bg-blue-500/20 text-blue-300 text-xs">Yürüme yardımcısı</span>' : ''}
                    ${d.ivHeparin ? '<span class="badge bg-purple-500/20 text-purple-300 text-xs">IV/Heparin</span>' : ''}
                    ${d.gait ? '<span class="badge bg-orange-500/20 text-orange-300 text-xs">Yürüme bozukluğu</span>' : ''}
                    ${d.mentalStatus ? '<span class="badge bg-pink-500/20 text-pink-300 text-xs">Mental durum</span>' : ''}
                  </div>
                  ${d.interventions.length > 0 ? `
                  <div class="rounded-lg bg-white/5 p-2 mt-2">
                    <p class="text-xs font-semibold text-slate-300 mb-1">🛡️ Önlemler:</p>
                    <div class="flex flex-wrap gap-1">${d.interventions.map(i => `<span class="text-xs bg-green-500/10 text-green-300 rounded px-2 py-0.5">✓ ${i}</span>`).join('')}</div>
                  </div>` : ''}
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;

    document.getElementById('add-fr-btn')?.addEventListener('click', showAdd);
  }

  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">⚠️ Yeni Düşme Riski Değerlendirmesi</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Hasta Adı</label><input id="fr-name" class="input-field w-full" placeholder="Ad Soyad"></div>
            <div><label class="label">Oda</label><input id="fr-room" class="input-field w-full" placeholder="Oda 101-A"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Yaş</label><input id="fr-age" type="number" class="input-field w-full" placeholder="0"></div>
            <div><label class="label">Sorumlu Hemşire</label><input id="fr-nurse" class="input-field w-full" placeholder="Hemşire ..."></div>
          </div>
          <div class="border-t border-white/10 pt-3"><h4 class="text-sm font-semibold text-white mb-2">📋 Morse Fall Scale Kriterleri</h4></div>
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"><input type="checkbox" id="fr-h" class="w-5 h-5 accent-cyan-500"><span class="text-sm text-slate-200">Düşme öyküsü var (+25)</span></label>
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"><input type="checkbox" id="fr-sd" class="w-5 h-5 accent-cyan-500"><span class="text-sm text-slate-200">İkincil tanı var (+15)</span></label>
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"><input type="checkbox" id="fr-aa" class="w-5 h-5 accent-cyan-500"><span class="text-sm text-slate-200">Yürüme yardımcısı kullanıyor (+15)</span></label>
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"><input type="checkbox" id="fr-iv" class="w-5 h-5 accent-cyan-500"><span class="text-sm text-slate-200">IV tedavi / Heparin (+20)</span></label>
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"><input type="checkbox" id="fr-g" class="w-5 h-5 accent-cyan-500"><span class="text-sm text-slate-200">Yürüme bozukluğu (+10)</span></label>
          <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer"><input type="checkbox" id="fr-ms" class="w-5 h-5 accent-cyan-500"><span class="text-sm text-slate-200">Mental durum bozukluğu (+15)</span></label>
          <div class="rounded-lg bg-white/5 p-3 text-center"><span id="fr-preview" class="text-2xl font-bold text-white">0</span><span class="text-sm text-slate-400 ml-2">puan</span></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="fr-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="fr-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('fr-cancel').onclick = () => modal.remove();
    const updatePreview = () => {
      const score = (document.getElementById('fr-h').checked ? 25 : 0) + (document.getElementById('fr-sd').checked ? 15 : 0) +
        (document.getElementById('fr-aa').checked ? 15 : 0) + (document.getElementById('fr-iv').checked ? 20 : 0) +
        (document.getElementById('fr-g').checked ? 10 : 0) + (document.getElementById('fr-ms').checked ? 15 : 0);
      document.getElementById('fr-preview').textContent = score;
    };
    ['fr-h', 'fr-sd', 'fr-aa', 'fr-iv', 'fr-g', 'fr-ms'].forEach(id => document.getElementById(id)?.addEventListener('change', updatePreview));
    document.getElementById('fr-save').onclick = () => {
      const name = document.getElementById('fr-name').value.trim();
      if (!name) return;
      const score = +(document.getElementById('fr-preview').textContent);
      const level = getLevel(score);
      data.push({
        id: Date.now(), patientName: name, room: document.getElementById('fr-room').value || 'Belirtilmedi',
        age: +document.getElementById('fr-age').value || 0, date: new Date().toISOString().slice(0, 10),
        history: document.getElementById('fr-h').checked, secondaryDiagnosis: document.getElementById('fr-sd').checked,
        ambulatoryAid: document.getElementById('fr-aa').checked, ivHeparin: document.getElementById('fr-iv').checked,
        gait: document.getElementById('fr-g').checked, mentalStatus: document.getElementById('fr-ms').checked,
        totalScore: score, riskLevel: level, interventions: RISK_LEVELS[level].measures,
        nurse: document.getElementById('fr-nurse').value || 'Atanmadı'
      });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
