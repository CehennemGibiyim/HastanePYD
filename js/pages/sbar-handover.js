// ===== SBAR DEVİR TESLİM =====
const STORAGE_KEY = 'sbar_handovers';

function getData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); }
  catch { return seed(); }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function seed() {
  const d = [
    { id: 1, date: new Date().toISOString().slice(0, 10), time: '07:30', fromNurse: 'Hemşire Ayşe', toNurse: 'Hemşire Fatma', shift: 'Sabah → Öğle', patients: [
      { name: 'Ahmet Yılmaz', room: '101-A',
        situation: 'Post-op 1. gün, stabil vital bulgular',
        background: 'Appendektomi ameliyatı, antibiyotik tedavisi devam ediyor',
        assessment: 'Ağrı kontrolü yeterli, oral beslenme başladı',
        recommendation: 'Saatlik vital kontrol, ağrı skoru >5 ise revize' },
      { name: 'Fatma Demir', room: '205-B',
        situation: 'STEMI şüphesi, kardiyoloji konsültasyonunda',
        background: '65Y, HT, DM öyküsü, göğüs ağrısı şikayetiyle başvurdu',
        assessment: 'EKG ST elevasyonu gösteriyor, troponin yüksek',
        recommendation: 'Anjiyo laboratuvarı hazır, aspirin + heparin devam' },
    ]},
    { id: 2, date: new Date().toISOString().slice(0, 10), time: '19:30', fromNurse: 'Hemşire Zeynep', toNurse: 'Hemşire Ali', shift: 'Akşam → Gece', patients: [
      { name: 'Mehmet Öz', room: '310-A',
        situation: 'Ortopedi post-op, alçı uygulanmış',
        background: 'Sol radius kırığı, redüksiyon yapıldı',
        assessment: 'Nörovasküler muayene normal, parmak hareketleri serbest',
        recommendation: 'Elevasyon, buz uygulaması, 4 saatte bir ağrı değerlendirmesi' },
    ]},
  ];
  saveData(d);
  return d;
}

export function renderSBARPage(el) {
  let data = getData();
  let filterDate = new Date().toISOString().slice(0, 10);

  function render() {
    const filtered = data.filter(d => d.date === filterDate);
    const totalPatients = filtered.reduce((s, d) => s + d.patients.length, 0);

    el.innerHTML = `
      <div class="fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white">🔄 SBAR Devir Teslim</h1>
            <p class="text-slate-400 text-sm mt-1">Situation-Background-Assessment-Recommendation standardı</p>
          </div>
          <div class="flex gap-2">
            <input type="date" class="input-field" id="sbar-date" value="${filterDate}">
            <button id="add-sbar-btn" class="btn-primary">+ Yeni Devir Teslim</button>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${filtered.length}</p><p class="text-xs text-slate-400">🔄 Devir Sayısı</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${totalPatients}</p><p class="text-xs text-slate-400">👥 Devir Hasta</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-green-300">${filtered.length > 0 ? '✅' : '⚠️'}</p><p class="text-xs text-slate-400">Durum</p></div>
        </div>

        <div class="card mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h3 class="text-sm font-semibold text-blue-300 mb-2">📋 SBAR Nedir?</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div class="rounded-lg bg-white/5 p-2"><span class="font-bold text-amber-300">S</span> — Situation (Durum)</div>
            <div class="rounded-lg bg-white/5 p-2"><span class="font-bold text-blue-300">B</span> — Background (Geçmiş)</div>
            <div class="rounded-lg bg-white/5 p-2"><span class="font-bold text-purple-300">A</span> — Assessment (Değerlendirme)</div>
            <div class="rounded-lg bg-white/5 p-2"><span class="font-bold text-green-300">R</span> — Recommendation (Öneri)</div>
          </div>
        </div>

        <div class="space-y-4">
          ${filtered.length === 0 ? '<div class="empty-state"><p class="icon">🔄</p><p class="title">Bu tarihte devir teslim yok</p><p class="desc">Yeni bir SBAR devir teslim oluşturun</p></div>' :
            filtered.map(s => `
            <div class="card">
              <div class="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
                <div>
                  <h3 class="text-lg font-bold text-white">👩‍⚕️ ${s.fromNurse} → ${s.toNurse}</h3>
                  <p class="text-xs text-slate-400">⏰ ${s.time} · ${s.shift} · 📅 ${s.date}</p>
                </div>
                <span class="badge">${s.patients.length} hasta</span>
              </div>
              <div class="space-y-4">
                ${s.patients.map(p => `
                  <div class="rounded-xl bg-white/5 p-4 border border-white/5">
                    <h4 class="text-base font-bold text-white mb-3">🏥 ${p.name} — ${p.room}</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div class="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                        <p class="text-xs font-bold text-amber-300 mb-1">🟡 S — Situation</p>
                        <p class="text-sm text-slate-200">${p.situation}</p>
                      </div>
                      <div class="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
                        <p class="text-xs font-bold text-blue-300 mb-1">🔵 B — Background</p>
                        <p class="text-sm text-slate-200">${p.background}</p>
                      </div>
                      <div class="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3">
                        <p class="text-xs font-bold text-purple-300 mb-1">🟣 A — Assessment</p>
                        <p class="text-sm text-slate-200">${p.assessment}</p>
                      </div>
                      <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                        <p class="text-xs font-bold text-green-300 mb-1">🟢 R — Recommendation</p>
                        <p class="text-sm text-slate-200">${p.recommendation}</p>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="flex gap-2 mt-3">
                <button class="btn-secondary text-xs py-1 px-3 delete-sbar" data-id="${s.id}">🗑️ Sil</button>
              </div>
            </div>`).join('')}
        </div>
      </div>`;

    document.getElementById('sbar-date')?.addEventListener('change', e => { filterDate = e.target.value; render(); });
    document.getElementById('add-sbar-btn')?.addEventListener('click', showAdd);
    document.querySelectorAll('.delete-sbar').forEach(b => b.onclick = () => {
      if (confirm('Silmek istediğinize emin misiniz?')) { data = data.filter(x => x.id !== +b.dataset.id); saveData(data); render(); }
    });
  }

  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold text-white mb-4">🔄 Yeni SBAR Devir Teslim</h3>
        <div class="space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Devreden</label><input id="sb-from" class="input-field w-full" placeholder="Hemşire ..."></div>
            <div><label class="label">Devralan</label><input id="sb-to" class="input-field w-full" placeholder="Hemşire ..."></div>
          </div>
          <div><label class="label">Vardiya</label><select id="sb-shift" class="input-field w-full"><option>Sabah → Öğle</option><option>Öğle → Akşam</option><option>Akşam → Gece</option><option>Gece → Sabah</option></select></div>
          <div class="border-t border-white/10 pt-3"><h4 class="text-sm font-semibold text-white mb-2">Hasta Bilgileri</h4></div>
          <div><label class="label">Hasta Adı</label><input id="sb-pname" class="input-field w-full" placeholder="Ad Soyad"></div>
          <div><label class="label">Oda</label><input id="sb-room" class="input-field w-full" placeholder="Oda 101-A"></div>
          <div><label class="label">S — Situation (Durum)</label><textarea id="sb-s" class="input-field w-full" rows="2" placeholder="Mevcut durum..."></textarea></div>
          <div><label class="label">B — Background (Geçmiş)</label><textarea id="sb-b" class="input-field w-full" rows="2" placeholder="Tıbbi geçmiş..."></textarea></div>
          <div><label class="label">A — Assessment (Değerlendirme)</label><textarea id="sb-a" class="input-field w-full" rows="2" placeholder="Değerlendirme..."></textarea></div>
          <div><label class="label">R — Recommendation (Öneri)</label><textarea id="sb-r" class="input-field w-full" rows="2" placeholder="Öneriler..."></textarea></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="sb-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="sb-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('sb-cancel').onclick = () => modal.remove();
    document.getElementById('sb-save').onclick = () => {
      const from = document.getElementById('sb-from').value.trim();
      const to = document.getElementById('sb-to').value.trim();
      if (!from || !to) return;
      data.push({
        id: Date.now(), date: filterDate, time: new Date().toTimeString().slice(0, 5),
        fromNurse: from, toNurse: to, shift: document.getElementById('sb-shift').value,
        patients: [{
          name: document.getElementById('sb-pname').value || 'Belirtilmedi',
          room: document.getElementById('sb-room').value || 'Belirtilmedi',
          situation: document.getElementById('sb-s').value,
          background: document.getElementById('sb-b').value,
          assessment: document.getElementById('sb-a').value,
          recommendation: document.getElementById('sb-r').value
        }]
      });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
