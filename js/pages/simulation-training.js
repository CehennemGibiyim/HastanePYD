// ===== SİMÜLASYON EĞİTİM =====
const STORAGE_KEY = 'simulation_training';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, title: 'KPR Simülasyonu - Senaryo 1', scenario: 'Ani kardiyak arrest, hastane koridoru', date: '2026-07-15', time: '10:00', duration: 60, location: 'Simülasyon Merkezi A', trainer: 'Dr. Arslan', participants: ['Hemşire Ayşe', 'Hemşire Fatma', 'Dr. Kaya'], maxParticipants: 8, status: 'planned', difficulty: 'advanced', category: 'Acil Müdahale', equipment: ['CPR mankeni', 'Defibrilatör', 'Ambu'], evaluationCriteria: ['Tepki süresi', 'Teknik kalite', 'Takım iletişimi', 'Protokol uyumu'], scores: {} },
    { id: 2, title: 'Entübasyon Tekniği', scenario: 'Zor entübasyon senaryosu', date: '2026-07-18', time: '14:00', duration: 45, location: 'Simülasyon Merkezi B', trainer: 'Dr. Yıldız', participants: ['Dr. Kaya', 'Dr. Çelik'], maxParticipants: 6, status: 'planned', difficulty: 'intermediate', category: 'Anestezi', equipment: ['Entübasyon mankeni', 'Laringoskop', 'ET tüp'], evaluationCriteria: ['Hazırlık', 'Teknik', 'Komplikasyon yönetimi'], scores: {} },
    { id: 3, title: 'Yangın Tahliye Tatbikatı', scenario: 'Hastane yangın alarmı, hasta tahliyesi', date: '2026-07-05', time: '09:00', duration: 90, location: '3. Kat Cerrahi Servis', trainer: 'Güvenlik Amiri', participants: ['Tüm vardiya personeli'], maxParticipants: 30, status: 'completed', difficulty: 'basic', category: 'Güvenlik', equipment: ['Yangın söndürücü', 'Tahliye sedye', 'Duman makinesi'], evaluationCriteria: ['Tahliye süresi', 'Hasta güvenliği', 'İletişim', 'Toplanma noktası'], scores: { 'Tahliye süresi': 85, 'Hasta güvenliği': 90, 'İletişim': 75, 'Toplanma noktası': 95 } },
  ];
  saveData(d); return d;
}
const CATEGORIES = ['Acil Müdahale', 'Anestezi', 'Cerrahi', 'Güvenlik', 'Enfeksiyon Kontrol', 'İlaç Güvenliği', 'Hasta Transferi'];
const DIFFICULTIES = { basic: { label: 'Başlangıç', color: 'green' }, intermediate: { label: 'Orta', color: 'amber' }, advanced: { label: 'İleri', color: 'red' } };

export function renderSimulationTrainingPage(el) {
  let data = getData();
  let filterCat = '';
  function render() {
    const filtered = data.filter(d => !filterCat || d.category === filterCat);
    const planned = data.filter(d => d.status === 'planned').length;
    const completed = data.filter(d => d.status === 'completed').length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🎭 Simülasyon Eğitim</h1><p class="text-slate-400 text-sm mt-1">Simülasyon merkezi randevu, senaryo ve performans değerlendirme</p></div>
        <button id="add-sim-btn" class="btn-primary">+ Yeni Senaryo</button>
      </div>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.length}</p><p class="text-xs text-slate-400">🎭 Toplam Senaryo</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${planned}</p><p class="text-xs text-slate-400">📅 Planlanan</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">✅ Tamamlanan</p></div>
      </div>
      <div class="card mb-4"><div class="flex flex-wrap gap-2">
        <button class="btn-secondary text-xs ${!filterCat ? 'tab-active' : ''}" data-cat="">Tümü</button>
        ${CATEGORIES.map(c => `<button class="btn-secondary text-xs ${filterCat === c ? 'tab-active' : ''}" data-cat="${c}">${c}</button>`).join('')}
      </div></div>
      <div class="space-y-4">${filtered.map(d => {
        const diff = DIFFICULTIES[d.difficulty] || { label: d.difficulty, color: 'slate' };
        const avgScore = Object.values(d.scores).length ? Math.round(Object.values(d.scores).reduce((a, b) => a + b, 0) / Object.values(d.scores).length) : 0;
        return `<div class="card">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1"><h3 class="text-lg font-bold text-white">${d.title}</h3><span class="badge bg-${diff.color}-500/20 text-${diff.color}-300">${diff.label}</span><span class="badge ${d.status === 'completed' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}">${d.status === 'completed' ? 'Tamamlandı' : 'Planlandı'}</span></div>
              <p class="text-xs text-slate-400">📋 ${d.scenario} · 🏢 ${d.location} · 👨‍🏫 ${d.trainer}</p>
              <p class="text-xs text-slate-400">📅 ${d.date} ${d.time} · ⏱️ ${d.duration} dk · 👥 ${d.participants.length}/${d.maxParticipants}</p>
            </div>
            ${avgScore > 0 ? `<div class="text-center"><p class="text-3xl font-bold text-cyan-300">${avgScore}</p><p class="text-xs text-slate-400">Ort. Puan</p></div>` : ''}
          </div>
          <div class="flex flex-wrap gap-2 mb-3"><span class="badge bg-white/10">${d.category}</span>${d.equipment.map(e => `<span class="badge bg-white/5">${e}</span>`).join('')}</div>
          <div class="flex flex-wrap gap-2 mb-2"><span class="text-xs text-slate-400">👥 Katılımcılar:</span>${d.participants.map(p => `<span class="badge bg-cyan-500/10 text-cyan-300">${p}</span>`).join('')}</div>
          ${Object.keys(d.scores).length > 0 ? `<div class="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">${d.evaluationCriteria.map(c => `<div class="rounded-lg bg-white/5 p-2 text-center"><p class="text-xs text-slate-400">${c}</p><p class="text-lg font-bold ${d.scores[c] >= 80 ? 'text-green-300' : d.scores[c] >= 60 ? 'text-amber-300' : 'text-red-300'}">${d.scores[c] || '—'}</p></div>`).join('')}</div>` : ''}
        </div>`;
      }).join('')}</div>
    </div>`;
    document.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { filterCat = b.dataset.cat; render(); });
    document.getElementById('add-sim-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">🎭 Yeni Simülasyon Senaryosu</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık</label><input id="sim-title" class="input-field w-full"></div>
        <div><label class="label">Senaryo</label><textarea id="sim-scenario" class="input-field w-full" rows="2"></textarea></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Tarih</label><input id="sim-date" type="date" class="input-field w-full"></div><div><label class="label">Saat</label><input id="sim-time" type="time" class="input-field w-full"></div></div>
        <div class="grid grid-cols-3 gap-3"><div><label class="label">Süre (dk)</label><input id="sim-dur" type="number" class="input-field w-full" value="60"></div><div><label class="label">Zorluk</label><select id="sim-diff" class="input-field w-full"><option value="basic">Başlangıç</option><option value="intermediate">Orta</option><option value="advanced">İleri</option></select></div><div><label class="label">Max Katılımcı</label><input id="sim-max" type="number" class="input-field w-full" value="8"></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Yer</label><input id="sim-loc" class="input-field w-full"></div><div><label class="label">Eğitmen</label><input id="sim-trainer" class="input-field w-full"></div></div>
        <div><label class="label">Kategori</label><select id="sim-cat" class="input-field w-full">${CATEGORIES.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div><label class="label">Ekipman (virgülle)</label><input id="sim-equip" class="input-field w-full"></div>
        <div><label class="label">Katılımcılar (virgülle)</label><input id="sim-parts" class="input-field w-full"></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="sim-save" class="btn-primary flex-1">💾 Kaydet</button><button id="sim-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('sim-cancel').onclick = () => modal.remove();
    document.getElementById('sim-save').onclick = () => {
      const title = document.getElementById('sim-title').value.trim();
      if (!title) return;
      data.push({ id: Date.now(), title, scenario: document.getElementById('sim-scenario').value, date: document.getElementById('sim-date').value, time: document.getElementById('sim-time').value, duration: +document.getElementById('sim-dur').value || 60, location: document.getElementById('sim-loc').value, trainer: document.getElementById('sim-trainer').value, participants: document.getElementById('sim-parts').value.split(',').map(s => s.trim()).filter(Boolean), maxParticipants: +document.getElementById('sim-max').value || 8, status: 'planned', difficulty: document.getElementById('sim-diff').value, category: document.getElementById('sim-cat').value, equipment: document.getElementById('sim-equip').value.split(',').map(s => s.trim()).filter(Boolean), evaluationCriteria: [], scores: {} });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
