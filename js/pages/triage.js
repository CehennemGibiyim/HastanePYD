// ===== TRİAGE SİSTEMİ =====
const STORAGE_KEY = 'triage_data';

function getData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); }
  catch { return seed(); }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function seed() {
  const d = [
    { id: 1, patientName: 'Hasan Kara', age: 65, gender: 'E', arrivalTime: '08:10', complaint: 'Göğüs ağrısı, nefes darlığı', vitalSigns: { bp: '180/110', hr: 110, spo2: 89, temp: 37.2 }, triageLevel: 'red', triageColor: 'Kırmızı', nurse: 'Hemşire Ayşe', status: 'active', notes: 'STEMI şüphesi' },
    { id: 2, patientName: 'Elif Yıldız', age: 34, gender: 'K', arrivalTime: '08:25', complaint: 'Yüksek ateş, baş ağrısı', vitalSigns: { bp: '110/70', hr: 95, spo2: 97, temp: 39.1 }, triageLevel: 'yellow', triageColor: 'Sarı', nurse: 'Hemşire Fatma', status: 'active', notes: '' },
    { id: 3, patientName: 'Murat Aydın', age: 45, gender: 'E', arrivalTime: '08:40', complaint: 'Kol kırığı şüphesi', vitalSigns: { bp: '130/85', hr: 82, spo2: 98, temp: 36.5 }, triageLevel: 'green', triageColor: 'Yeşil', nurse: 'Hemşire Zeynep', status: 'active', notes: 'Düşme sonrası' },
    { id: 4, patientName: 'Selin Tan', age: 28, gender: 'K', arrivalTime: '09:00', complaint: 'Hafif öksürük', vitalSigns: { bp: '120/75', hr: 72, spo2: 99, temp: 36.8 }, triageLevel: 'blue', triageColor: 'Mavi', nurse: 'Hemşire Ali', status: 'waiting', notes: '' },
    { id: 5, patientName: 'Osman Bey', age: 78, gender: 'E', arrivalTime: '07:55', complaint: 'Bilinç kaybı', vitalSigns: { bp: '80/50', hr: 45, spo2: 82, temp: 35.5 }, triageLevel: 'red', triageColor: 'Kırmızı', nurse: 'Hemşire Ayşe', status: 'active', notes: 'KPR başlatıldı' },
  ];
  saveData(d);
  return d;
}

const LEVELS = {
  red: { label: 'Kırmızı', desc: 'Hayati tehlike — Anında müdahale', color: 'red', icon: '🔴', waitMin: 0 },
  orange: { label: 'Turuncu', desc: 'Çok acil — 10 dk içinde', color: 'orange', icon: '🟠', waitMin: 10 },
  yellow: { label: 'Sarı', desc: 'Acil — 30 dk içinde', color: 'yellow', icon: '🟡', waitMin: 30 },
  green: { label: 'Yeşil', desc: 'Az acil — 60 dk içinde', color: 'green', icon: '🟢', waitMin: 60 },
  blue: { label: 'Mavi', desc: 'Acil değil — 120 dk içinde', color: 'blue', icon: '🔵', waitMin: 120 },
};

export function renderTriagePage(el) {
  let data = getData();
  let filterLevel = '';

  function render() {
    const filtered = data.filter(d => !filterLevel || d.triageLevel === filterLevel);
    const counts = {};
    Object.keys(LEVELS).forEach(k => counts[k] = data.filter(d => d.triageLevel === k && d.status === 'active').length);

    el.innerHTML = `
      <div class="fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white">🚑 Triage Sistemi</h1>
            <p class="text-slate-400 text-sm mt-1">Renk kodlu acil servis önceliklendirme</p>
          </div>
          <button id="add-triage-btn" class="btn-primary">+ Yeni Hasta</button>
        </div>

        <div class="grid grid-cols-5 gap-3 mb-6">
          ${Object.entries(LEVELS).map(([k, v]) => `
            <button class="triage-card card text-center cursor-pointer transition hover:scale-105 ${filterLevel === k ? 'ring-2 ring-' + v.color + '-400' : ''}" data-level="${k}">
              <p class="text-2xl">${v.icon}</p>
              <p class="text-xl font-bold text-${v.color}-300">${counts[k]}</p>
              <p class="text-xs text-slate-400">${v.label}</p>
            </button>
          `).join('')}
        </div>

        <div class="card mb-4">
          <div class="flex flex-wrap gap-2">
            <button class="btn-secondary text-xs ${!filterLevel ? 'tab-active' : ''}" data-filter="">Tümü (${data.filter(d => d.status === 'active').length})</button>
            ${Object.entries(LEVELS).map(([k, v]) => `<button class="btn-secondary text-xs ${filterLevel === k ? 'tab-active' : ''}" data-filter="${k}">${v.icon} ${v.label} (${counts[k]})</button>`).join('')}
          </div>
        </div>

        <div class="space-y-3">
          ${filtered.sort((a, b) => { const o = { red: 0, orange: 1, yellow: 2, green: 3, blue: 4 }; return o[a.triageLevel] - o[b.triageLevel]; }).map(t => {
            const lv = LEVELS[t.triageLevel];
            return `
            <div class="card border-l-4 border-${lv.color}-500 hover:bg-white/5 transition">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg">${lv.icon}</span>
                    <h3 class="text-lg font-bold text-white">${t.patientName}</h3>
                    <span class="badge bg-${lv.color}-500/20 text-${lv.color}-300">${lv.label}</span>
                    <span class="badge bg-white/10">${t.age} ${t.gender === 'E' ? '👨' : '👩'}</span>
                  </div>
                  <p class="text-sm text-slate-300 mb-2">📋 ${t.complaint}</p>
                  <div class="flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>💉 BP: ${t.vitalSigns.bp}</span>
                    <span>💓 HR: ${t.vitalSigns.hr}</span>
                    <span>🫁 SpO2: ${t.vitalSigns.spo2}%</span>
                    <span>🌡️ ${t.vitalSigns.temp}°C</span>
                    <span>👩‍⚕️ ${t.nurse}</span>
                    <span>⏰ ${t.arrivalTime}</span>
                  </div>
                  ${t.notes ? `<p class="text-xs text-amber-400 mt-1">⚠️ ${t.notes}</p>` : ''}
                </div>
                <div class="flex gap-2">
                  ${t.status === 'active' ? `<button class="btn-primary text-xs py-1 px-3 complete-btn" data-id="${t.id}">✅ Tedavi</button>` : `<span class="badge bg-green-500/20 text-green-300">Tamamlandı</span>`}
                </div>
              </div>
            </div>`;
          }).join('')}
          ${filtered.length === 0 ? '<div class="empty-state"><p class="icon">🚑</p><p class="title">Kayıt yok</p><p class="desc">Bu triage seviyesinde hasta bulunamadı</p></div>' : ''}
        </div>

        <div class="card mt-6">
          <h3 class="text-sm font-semibold text-white mb-3">📋 Triage Renk Kodları</h3>
          <div class="space-y-2">
            ${Object.entries(LEVELS).map(([k, v]) => `
              <div class="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                <span class="text-lg">${v.icon}</span>
                <span class="text-sm font-medium text-white w-20">${v.label}</span>
                <span class="text-xs text-slate-400 flex-1">${v.desc}</span>
                <span class="badge bg-white/10">${v.waitMin === 0 ? 'Anında' : v.waitMin + ' dk'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;

    document.querySelectorAll('.triage-card').forEach(c => c.onclick = () => { filterLevel = c.dataset.level === filterLevel ? '' : c.dataset.level; render(); });
    document.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => { filterLevel = b.dataset.filter; render(); });
    document.querySelectorAll('.complete-btn').forEach(b => b.onclick = () => { const t = data.find(x => x.id === +b.dataset.id); if (t) { t.status = 'completed'; saveData(data); render(); } });
    document.getElementById('add-triage-btn')?.addEventListener('click', showAdd);
  }

  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">🚑 Yeni Triage Kaydı</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Hasta Adı</label><input id="ta-name" class="input-field w-full" placeholder="Ad Soyad"></div>
            <div class="grid grid-cols-2 gap-2">
              <div><label class="label">Yaş</label><input id="ta-age" type="number" class="input-field w-full" placeholder="0"></div>
              <div><label class="label">Cinsiyet</label><select id="ta-gender" class="input-field w-full"><option value="E">Erkek</option><option value="K">Kadın</option></select></div>
            </div>
          </div>
          <div><label class="label">Şikayet</label><input id="ta-complaint" class="input-field w-full" placeholder="Hasta şikayeti"></div>
          <div class="grid grid-cols-4 gap-2">
            <div><label class="label">BP</label><input id="ta-bp" class="input-field w-full" placeholder="120/80"></div>
            <div><label class="label">HR</label><input id="ta-hr" type="number" class="input-field w-full" placeholder="80"></div>
            <div><label class="label">SpO2</label><input id="ta-spo2" type="number" class="input-field w-full" placeholder="98"></div>
            <div><label class="label">Sıcaklık</label><input id="ta-temp" type="number" step="0.1" class="input-field w-full" placeholder="36.5"></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Triage Seviyesi</label><select id="ta-level" class="input-field w-full">${Object.entries(LEVELS).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label} — ${v.desc}</option>`).join('')}</select></div>
            <div><label class="label">Sorumlu Hemşire</label><input id="ta-nurse" class="input-field w-full" placeholder="Hemşire ..."></div>
          </div>
          <div><label class="label">Notlar</label><input id="ta-notes" class="input-field w-full" placeholder="Opsiyonel"></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="ta-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="ta-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('ta-cancel').onclick = () => modal.remove();
    document.getElementById('ta-save').onclick = () => {
      const name = document.getElementById('ta-name').value.trim();
      if (!name) return;
      const level = document.getElementById('ta-level').value;
      data.push({
        id: Date.now(), patientName: name, age: +document.getElementById('ta-age').value || 0,
        gender: document.getElementById('ta-gender').value, arrivalTime: new Date().toTimeString().slice(0, 5),
        complaint: document.getElementById('ta-complaint').value,
        vitalSigns: { bp: document.getElementById('ta-bp').value, hr: +document.getElementById('ta-hr').value || 0, spo2: +document.getElementById('ta-spo2').value || 0, temp: +document.getElementById('ta-temp').value || 36.5 },
        triageLevel: level, triageColor: LEVELS[level].label,
        nurse: document.getElementById('ta-nurse').value || 'Atanmadı', status: 'active',
        notes: document.getElementById('ta-notes').value
      });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
