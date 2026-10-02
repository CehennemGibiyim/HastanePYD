// ===== BASI YARASI ÖNLEME (BRADEN SCALE) =====
const STORAGE_KEY = 'pressure_ulcer_data';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, patientName: 'Osman Bey', room: '101-A', age: 78, date: new Date().toISOString().slice(0, 10),
      sensory: 2, moisture: 2, activity: 1, mobility: 2, nutrition: 3, friction: 2,
      totalScore: 12, riskLevel: 'high', positionSchedule: 'Her 2 saatte bir', skinStatus: 'Kızarıklık sakral bölge', nurse: 'Hemşire Ayşe' },
    { id: 2, patientName: 'Ayşe Kaya', room: '205-B', age: 45, date: new Date().toISOString().slice(0, 10),
      sensory: 4, moisture: 4, activity: 4, mobility: 3, nutrition: 4, friction: 3,
      totalScore: 22, riskLevel: 'low', positionSchedule: 'Her 4 saatte bir', skinStatus: 'Normal', nurse: 'Hemşire Fatma' },
    { id: 3, patientName: 'Mehmet Öz', room: '310-A', age: 65, date: new Date().toISOString().slice(0, 10),
      sensory: 3, moisture: 3, activity: 2, mobility: 2, nutrition: 3, friction: 2,
      totalScore: 15, riskLevel: 'moderate', positionSchedule: 'Her 3 saatte bir', skinStatus: 'Hafif ödem', nurse: 'Hemşire Zeynep' },
  ];
  saveData(d); return d;
}
const RISK = { low: { label: 'Düşük', color: 'green', range: '19-23' }, moderate: { label: 'Orta', color: 'amber', range: '13-18' }, high: { label: 'Yüksek', color: 'red', range: '≤12' } };
const SCALE = { sensory: 'Duyusal algı', moisture: 'Nem', activity: 'Aktivite', mobility: 'Mobilite', nutrition: 'Beslenme', friction: 'Sürtünme/Kayma' };

export function renderPressureUlcerPage(el) {
  let data = getData();
  function getLevel(score) { return score >= 19 ? 'low' : score >= 13 ? 'moderate' : 'high'; }
  function render() {
    const high = data.filter(d => d.riskLevel === 'high').length;
    const moderate = data.filter(d => d.riskLevel === 'moderate').length;
    const low = data.filter(d => d.riskLevel === 'low').length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🛏️ Bası Yarası Önleme</h1><p class="text-slate-400 text-sm mt-1">Braden Scale ile basınç ülseri risk değerlendirmesi</p></div>
        <button id="add-pu-btn" class="btn-primary">+ Yeni Değerlendirme</button>
      </div>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card text-center border-l-4 border-red-500"><p class="text-3xl font-bold text-red-300">${high}</p><p class="text-xs text-slate-400">🔴 Yüksek Risk</p></div>
        <div class="card text-center border-l-4 border-amber-500"><p class="text-3xl font-bold text-amber-300">${moderate}</p><p class="text-xs text-slate-400">🟡 Orta Risk</p></div>
        <div class="card text-center border-l-4 border-green-500"><p class="text-3xl font-bold text-green-300">${low}</p><p class="text-xs text-slate-400">🟢 Düşük Risk</p></div>
      </div>
      <div class="card mb-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
        <h3 class="text-sm font-semibold text-purple-300 mb-2">📋 Braden Scale Kriterleri (1-4 arası puanlama)</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-300">
          ${Object.values(SCALE).map(v => `<div>📌 ${v}</div>`).join('')}
        </div>
      </div>
      <div class="space-y-3">${data.sort((a, b) => a.totalScore - b.totalScore).map(d => {
        const lv = RISK[d.riskLevel];
        return `<div class="card border-l-4 border-${lv.color}-500">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1"><h3 class="text-lg font-bold text-white">${d.patientName}</h3><span class="badge bg-${lv.color}-500/20 text-${lv.color}-300">${lv.label} Risk</span><span class="badge bg-white/10 text-xl font-bold">${d.totalScore}/23</span></div>
              <p class="text-xs text-slate-400 mb-2">🏥 ${d.room} · ${d.age} yaş · 👩‍⚕️ ${d.nurse}</p>
              <div class="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">
                ${Object.entries(SCALE).map(([k, v]) => `<div class="rounded bg-white/5 px-2 py-1 text-center"><p class="text-xs text-slate-500">${v}</p><p class="text-sm font-bold text-white">${d[k]}/4</p></div>`).join('')}
              </div>
              <div class="flex flex-wrap gap-2 text-xs text-slate-400">
                <span>🔄 ${d.positionSchedule}</span><span>🩹 ${d.skinStatus}</span>
              </div>
            </div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
    document.getElementById('add-pu-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">🛏️ Yeni Braden Scale Değerlendirmesi</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Hasta Adı</label><input id="pu-name" class="input-field w-full"></div><div><label class="label">Oda</label><input id="pu-room" class="input-field w-full"></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Yaş</label><input id="pu-age" type="number" class="input-field w-full"></div><div><label class="label">Hemşire</label><input id="pu-nurse" class="input-field w-full"></div></div>
        <div class="border-t border-white/10 pt-3"><h4 class="text-sm font-semibold text-white mb-2">Braden Scale (1-4)</h4></div>
        ${Object.entries(SCALE).map(([k, v]) => `<div class="flex items-center gap-3"><label class="label w-32">${v}</label><select id="pu-${k}" class="input-field flex-1"><option value="1">1 - Çok kötü</option><option value="2">2 - Kötü</option><option value="3">3 - İyi</option><option value="4" selected>4 - Çok iyi</option></select></div>`).join('')}
        <div class="rounded-lg bg-white/5 p-3 text-center"><span id="pu-preview" class="text-2xl font-bold text-white">24</span><span class="text-sm text-slate-400 ml-2">/23 (ters puan)</span></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="pu-save" class="btn-primary flex-1">💾 Kaydet</button><button id="pu-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('pu-cancel').onclick = () => modal.remove();
    const update = () => { let s = 0; Object.keys(SCALE).forEach(k => { s += +(document.getElementById('pu-' + k)?.value || 4); }); document.getElementById('pu-preview').textContent = s; };
    Object.keys(SCALE).forEach(k => document.getElementById('pu-' + k)?.addEventListener('change', update));
    document.getElementById('pu-save').onclick = () => {
      const name = document.getElementById('pu-name').value.trim();
      if (!name) return;
      const obj = { id: Date.now(), patientName: name, room: document.getElementById('pu-room').value || '', age: +document.getElementById('pu-age').value || 0, date: new Date().toISOString().slice(0, 10), nurse: document.getElementById('pu-nurse').value || '' };
      let total = 0; Object.keys(SCALE).forEach(k => { obj[k] = +(document.getElementById('pu-' + k)?.value || 4); total += obj[k]; });
      obj.totalScore = total; obj.riskLevel = getLevel(total); obj.positionSchedule = total <= 12 ? 'Her 2 saatte bir' : total <= 18 ? 'Her 3 saatte bir' : 'Her 4 saatte bir'; obj.skinStatus = 'Değerlendirme yapıldı';
      data.push(obj); saveData(data); modal.remove(); render();
    };
  }
  render();
}
