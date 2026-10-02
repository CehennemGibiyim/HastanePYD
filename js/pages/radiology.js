// ===== TIBBİ GÖRÜNTÜLEME (RADIOLOGY) =====
const STORAGE_KEY = 'radiology_data';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, patientName: 'Ahmet Yılmaz', tcNo: '12345678901', modality: 'BT', bodyPart: 'Toraks', requestDate: '2026-07-12', requestDoctor: 'Dr. Arslan', radiologist: 'Dr. Aydın', status: 'reported', priority: 'urgent', report: 'Pnömoni bulguları mevcut. Sol alt lobda konsolidasyon.', findings: 'Sol alt lobda havalanma kaybı, plevral efüzyon yok', impression: 'Sol alt lob pnömoni', requestNote: 'Öksürük, ateş, nefes darlığı' },
    { id: 2, patientName: 'Fatma Demir', tcNo: '98765432109', modality: 'MR', bodyPart: 'Beyin', requestDate: '2026-07-12', requestDoctor: 'Dr. Kaya', radiologist: 'Dr. Aydın', status: 'in-progress', priority: 'urgent', report: '', findings: '', impression: '', requestNote: 'Baş ağrısı, bilateral papilödem' },
    { id: 3, patientName: 'Mehmet Öz', tcNo: '56789012345', modality: 'Röntgen', bodyPart: 'Sol Kol AP-Lateral', requestDate: '2026-07-12', requestDoctor: 'Dr. Çelik', radiologist: '', status: 'pending', priority: 'routine', report: '', findings: '', impression: '', requestNote: 'Travma sonrası ağrı' },
    { id: 4, patientName: 'Ayşe Kaya', tcNo: '34567890123', modality: 'USG', bodyPart: 'Abdomen', requestDate: '2026-07-11', requestDoctor: 'Dr. Arslan', radiologist: 'Dr. Aydın', status: 'reported', priority: 'routine', report: 'Safra kesesinde multiple kalkül. Karaciğer normal.', findings: 'Safra kesesinde 3 adet kalkül, en büyüğü 12mm', impression: 'Kolelitiazis', requestNote: 'Karın ağrısı, bulantı' },
  ];
  saveData(d); return d;
}
const MODALITIES = ['Röntgen', 'BT', 'MR', 'USG', 'Mamografi', 'Anjiyo', 'Doppler', 'Kemik Dansitometri'];
const STATUSES = { pending: { label: 'Bekliyor', color: 'amber', icon: '⏳' }, 'in-progress': { label: 'İnceleniyor', color: 'blue', icon: '🔍' }, reported: { label: 'Raporlandı', color: 'green', icon: '✅' } };

export function renderRadiologyPage(el) {
  let data = getData();
  let filterStatus = '', filterModality = '';
  function render() {
    const filtered = data.filter(d => (!filterStatus || d.status === filterStatus) && (!filterModality || d.modality === filterModality));
    const pending = data.filter(d => d.status === 'pending').length;
    const inProgress = data.filter(d => d.status === 'in-progress').length;
    const reported = data.filter(d => d.status === 'reported').length;
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">📡 Tıbbi Görüntüleme</h1><p class="text-slate-400 text-sm mt-1">Radyoloji sipariş takibi ve raporlama</p></div>
        <button id="add-rad-btn" class="btn-primary">+ Yeni İstek</button>
      </div>
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${pending}</p><p class="text-xs text-slate-400">⏳ Bekleyen</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inProgress}</p><p class="text-xs text-slate-400">🔍 İncelenen</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${reported}</p><p class="text-xs text-slate-400">✅ Raporlanan</p></div>
      </div>
      <div class="card mb-4"><div class="flex flex-wrap gap-2">
        <button class="btn-secondary text-xs ${!filterModality ? 'tab-active' : ''}" data-m="">Tüm Modaliteler</button>
        ${MODALITIES.map(m => `<button class="btn-secondary text-xs ${filterModality === m ? 'tab-active' : ''}" data-m="${m}">${m}</button>`).join('')}
      </div></div>
      <div class="space-y-3">${filtered.sort((a, b) => { const o = { pending: 0, 'in-progress': 1, reported: 2 }; return o[a.status] - o[b.status]; }).map(d => {
        const st = STATUSES[d.status];
        return `<div class="card border-l-4 border-${st.color}-500">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1"><h3 class="text-lg font-bold text-white">${d.patientName}</h3><span class="badge bg-${st.color}-500/20 text-${st.color}-300">${st.icon} ${st.label}</span><span class="badge bg-white/10">${d.modality}</span><span class="badge ${d.priority === 'urgent' ? 'bg-red-500/20 text-red-300' : 'bg-white/5'}">${d.priority === 'urgent' ? '🔴 Acil' : 'Rutin'}</span></div>
              <p class="text-xs text-slate-400 mb-2">📋 ${d.bodyPart} · 🩺 ${d.requestDoctor} · 📅 ${d.requestDate}</p>
              ${d.requestNote ? `<p class="text-xs text-amber-400 mb-2">📝 İstek Notu: ${d.requestNote}</p>` : ''}
              ${d.status === 'reported' ? `
                <div class="rounded-lg bg-white/5 p-3 mt-2 space-y-2">
                  <div><p class="text-xs font-bold text-blue-300">🔍 Bulgular</p><p class="text-sm text-slate-200">${d.findings}</p></div>
                  <div><p class="text-xs font-bold text-purple-300">📋 Rapor</p><p class="text-sm text-slate-200">${d.report}</p></div>
                  <div><p class="text-xs font-bold text-green-300">📌 Sonuç</p><p class="text-sm text-white font-medium">${d.impression}</p></div>
                  <p class="text-xs text-slate-500">👨‍⚕️ Radyolog: ${d.radiologist}</p>
                </div>` : ''}
            </div>
            <div class="flex flex-col gap-2">
              ${d.status === 'pending' ? `<button class="btn-primary text-xs py-1 px-3 start-rad" data-id="${d.id}">🔍 İncele</button>` : ''}
              ${d.status === 'in-progress' ? `<button class="btn-primary text-xs py-1 px-3 report-rad" data-id="${d.id}">📝 Rapor Yaz</button>` : ''}
            </div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
    document.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { filterModality = b.dataset.m; render(); });
    document.querySelectorAll('.start-rad').forEach(b => b.onclick = () => { const d = data.find(x => x.id === +b.dataset.id); if (d) { d.status = 'in-progress'; d.radiologist = 'Dr. Aydın'; saveData(data); render(); } });
    document.querySelectorAll('.report-rad').forEach(b => b.onclick = () => { const d = data.find(x => x.id === +b.dataset.id); if (d) showReportModal(d); });
    document.getElementById('add-rad-btn')?.addEventListener('click', showAdd);
  }
  function showReportModal(d) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">📝 Radyoloji Raporu — ${d.patientName}</h3>
      <div class="space-y-3">
        <div><label class="label">Bulgular</label><textarea id="rep-findings" class="input-field w-full" rows="3"></textarea></div>
        <div><label class="label">Rapor</label><textarea id="rep-report" class="input-field w-full" rows="3"></textarea></div>
        <div><label class="label">Sonuç/İmpresyon</label><input id="rep-impression" class="input-field w-full"></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="rep-save" class="btn-primary flex-1">💾 Kaydet</button><button id="rep-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('rep-cancel').onclick = () => modal.remove();
    document.getElementById('rep-save').onclick = () => { d.findings = document.getElementById('rep-findings').value; d.report = document.getElementById('rep-report').value; d.impression = document.getElementById('rep-impression').value; d.status = 'reported'; saveData(data); modal.remove(); render(); };
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">📡 Yeni Görüntüleme İsteği</h3>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Hasta</label><input id="rad-name" class="input-field w-full"></div><div><label class="label">TC No</label><input id="rad-tc" class="input-field w-full"></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Modalite</label><select id="rad-mod" class="input-field w-full">${MODALITIES.map(m => `<option>${m}</option>`).join('')}</select></div><div><label class="label">Bölge</label><input id="rad-part" class="input-field w-full"></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">İstek Doktoru</label><input id="rad-doctor" class="input-field w-full"></div><div><label class="label">Öncelik</label><select id="rad-priority" class="input-field w-full"><option value="routine">Rutin</option><option value="urgent">Acil</option></select></div></div>
        <div><label class="label">İstek Notu</label><input id="rad-note" class="input-field w-full"></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="rad-save" class="btn-primary flex-1">💾 Kaydet</button><button id="rad-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('rad-cancel').onclick = () => modal.remove();
    document.getElementById('rad-save').onclick = () => {
      const name = document.getElementById('rad-name').value.trim();
      if (!name) return;
      data.push({ id: Date.now(), patientName: name, tcNo: document.getElementById('rad-tc').value, modality: document.getElementById('rad-mod').value, bodyPart: document.getElementById('rad-part').value, requestDate: new Date().toISOString().slice(0, 10), requestDoctor: document.getElementById('rad-doctor').value, radiologist: '', status: 'pending', priority: document.getElementById('rad-priority').value, report: '', findings: '', impression: '', requestNote: document.getElementById('rad-note').value });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
