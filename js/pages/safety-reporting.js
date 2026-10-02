// ===== HASTA GÜVENLİĞİ RAPORLAMA =====
const STORAGE_KEY = 'safety_reports';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, date: '2026-07-12', type: 'sentinel', title: 'Ameliyathada yanlış taraf cerrahisi (nearly miss)', reporter: 'Hemşire Ayşe', department: 'Genel Cerrahi', severity: 'critical', status: 'investigating', description: 'Ameliyat öncesi checklist sırasında yanlış taraf tespit edildi. Cerrahi durduruldu.', rootCause: 'Hasta kimlik doğrulama prosedürü uygulanmamış', correctiveAction: 'Zorlu cerrahi güvenlik checklist uygulaması başlatıldı', assignedTo: 'Dr. Çelik' },
    { id: 2, date: '2026-07-11', type: 'near-miss', title: 'İlaç dozaj hatası (fark edildi)', reporter: 'Hemşire Fatma', department: 'Dahiliye', severity: 'high', status: 'resolved', description: 'Heparin dozajı 10 kat fazla yazıldı, hemşire uygulama öncesi fark etti.', rootCause: 'Reçete yazım sisteminde dozaj kontrolü yok', correctiveAction: 'Elektronik reçete sisteminde dozaj uyarıları aktifleştirildi', assignedTo: 'Dr. Arslan' },
    { id: 3, date: '2026-07-10', type: 'adverse', title: 'Hasta düşmesi', reporter: 'Hemşire Zeynep', department: 'Ortopedi', severity: 'moderate', status: 'closed', description: 'Post-op hasta gece tuvalet giderken düştü. Hafif morarma.', rootCause: 'Yatak kenarlığı kaldırılmamış, kaymaz terlik verilmemiş', correctiveAction: 'Düşme riski protokolü güçlendirildi', assignedTo: 'Hemşire Ayşe' },
    { id: 4, date: '2026-07-09', type: 'infection', title: 'Hastane kaynaklı enfeksiyon', reporter: 'Dr. Kaya', department: 'Cerrahi', severity: 'high', status: 'investigating', description: 'Cerrahi saha enfeksiyonu gelişti. Kültür MRSA pozitif.', rootCause: 'Sterilizasyon prosedürü kontrol edilmeli', correctiveAction: 'Sterilizasyon audit planlandı', assignedTo: 'Enfeksiyon Komitesi' },
  ];
  saveData(d); return d;
}
const TYPES = { sentinel: { label: 'Sentinel Olay', icon: '🔴', color: 'red' }, 'near-miss': { label: 'Near-Miss', icon: '🟡', color: 'amber' }, adverse: { label: 'Advers Olay', icon: '🟠', color: 'orange' }, infection: { label: 'Enfeksiyon', icon: '🦠', color: 'purple' }, medication: { label: 'İlaç Hatası', icon: '💊', color: 'blue' }, fall: { label: 'Düşme', icon: '⬇️', color: 'cyan' } };
const SEVERITIES = { critical: { label: 'Kritik', color: 'red' }, high: { label: 'Yüksek', color: 'orange' }, moderate: { label: 'Orta', color: 'amber' }, low: { label: 'Düşük', color: 'green' } };
const STATUSES = { open: { label: 'Açık', color: 'blue' }, investigating: { label: 'İnceleniyor', color: 'amber' }, resolved: { label: 'Çözüldü', color: 'green' }, closed: { label: 'Kapatıldı', color: 'slate' } };

export function renderSafetyReportingPage(el) {
  let data = getData();
  let filterType = '', filterStatus = '';
  function render() {
    const filtered = data.filter(d => (!filterType || d.type === filterType) && (!filterStatus || d.status === filterStatus));
    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🛡️ Hasta Güvenliği Raporlama</h1><p class="text-slate-400 text-sm mt-1">Sentinel olay, near-miss ve kök neden analizi (RCA)</p></div>
        <button id="add-sr-btn" class="btn-primary">+ Yeni Rapor</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold text-red-300">${data.filter(d => d.severity === 'critical').length}</p><p class="text-xs text-slate-400">🔴 Kritik</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${data.filter(d => d.status === 'investigating').length}</p><p class="text-xs text-slate-400">🔍 İnceleniyor</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${data.filter(d => d.status === 'resolved' || d.status === 'closed').length}</p><p class="text-xs text-slate-400">✅ Çözülen</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${data.length}</p><p class="text-xs text-slate-400">📊 Toplam Rapor</p></div>
      </div>
      <div class="card mb-4"><div class="flex flex-wrap gap-2">
        <button class="btn-secondary text-xs ${!filterType ? 'tab-active' : ''}" data-t="">Tüm Türler</button>
        ${Object.entries(TYPES).map(([k, v]) => `<button class="btn-secondary text-xs ${filterType === k ? 'tab-active' : ''}" data-t="${k}">${v.icon} ${v.label}</button>`).join('')}
      </div></div>
      <div class="space-y-3">${filtered.sort((a, b) => { const o = { critical: 0, high: 1, moderate: 2, low: 3 }; return o[a.severity] - o[b.severity]; }).map(d => {
        const t = TYPES[d.type] || { icon: '📋', label: d.type, color: 'slate' };
        const sev = SEVERITIES[d.severity] || { label: d.severity, color: 'slate' };
        const st = STATUSES[d.status] || { label: d.status, color: 'slate' };
        return `<div class="card border-l-4 border-${sev.color}-500">
          <div class="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1"><span class="text-lg">${t.icon}</span><h3 class="text-lg font-bold text-white">${d.title}</h3></div>
              <p class="text-xs text-slate-400">📅 ${d.date} · 👤 ${d.reporter} · 🏥 ${d.department} · 📋 ${d.assignedTo}</p>
            </div>
            <div class="flex gap-2"><span class="badge bg-${sev.color}-500/20 text-${sev.color}-300">${sev.label}</span><span class="badge bg-${st.color}-500/20 text-${st.color}-300">${st.label}</span></div>
          </div>
          <p class="text-sm text-slate-300 mb-3">${d.description}</p>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div class="rounded-lg bg-red-500/10 border border-red-500/20 p-3"><p class="text-xs font-bold text-red-300 mb-1">🔍 Kök Neden</p><p class="text-sm text-slate-200">${d.rootCause}</p></div>
            <div class="rounded-lg bg-green-500/10 border border-green-500/20 p-3"><p class="text-xs font-bold text-green-300 mb-1">✅ Düzeltici Aksiyon</p><p class="text-sm text-slate-200">${d.correctiveAction}</p></div>
          </div>
          <div class="flex gap-2 mt-3">
            ${d.status === 'open' || d.status === 'investigating' ? `<button class="btn-primary text-xs py-1 px-3 resolve-sr" data-id="${d.id}">✅ Çözüldü İşaretle</button>` : ''}
            <button class="btn-secondary text-xs py-1 px-3 delete-sr" data-id="${d.id}">🗑️ Sil</button>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
    document.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { filterType = b.dataset.t; render(); });
    document.querySelectorAll('.resolve-sr').forEach(b => b.onclick = () => { const d = data.find(x => x.id === +b.dataset.id); if (d) { d.status = 'resolved'; saveData(data); render(); } });
    document.querySelectorAll('.delete-sr').forEach(b => b.onclick = () => { if (confirm('Silmek istediğinize emin misiniz?')) { data = data.filter(x => x.id !== +b.dataset.id); saveData(data); render(); } });
    document.getElementById('add-sr-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
      <h3 class="text-xl font-bold text-white mb-4">🛡️ Yeni Güvenlik Raporu</h3>
      <div class="space-y-3">
        <div><label class="label">Başlık</label><input id="sr-title" class="input-field w-full" placeholder="Olay başlığı"></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Tür</label><select id="sr-type" class="input-field w-full">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div><div><label class="label">Önem</label><select id="sr-sev" class="input-field w-full">${Object.entries(SEVERITIES).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div></div>
        <div class="grid grid-cols-2 gap-3"><div><label class="label">Raporlayan</label><input id="sr-reporter" class="input-field w-full"></div><div><label class="label">Departman</label><input id="sr-dept" class="input-field w-full"></div></div>
        <div><label class="label">Açıklama</label><textarea id="sr-desc" class="input-field w-full" rows="3"></textarea></div>
        <div><label class="label">Kök Neden</label><textarea id="sr-rca" class="input-field w-full" rows="2"></textarea></div>
        <div><label class="label">Düzeltici Aksiyon</label><input id="sr-action" class="input-field w-full"></div>
        <div><label class="label">Sorumlu</label><input id="sr-assigned" class="input-field w-full"></div>
      </div>
      <div class="flex gap-3 mt-5"><button id="sr-save" class="btn-primary flex-1">💾 Kaydet</button><button id="sr-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('sr-cancel').onclick = () => modal.remove();
    document.getElementById('sr-save').onclick = () => {
      const title = document.getElementById('sr-title').value.trim();
      if (!title) return;
      data.push({ id: Date.now(), date: new Date().toISOString().slice(0, 10), type: document.getElementById('sr-type').value, title, reporter: document.getElementById('sr-reporter').value, department: document.getElementById('sr-dept').value, severity: document.getElementById('sr-sev').value, status: 'open', description: document.getElementById('sr-desc').value, rootCause: document.getElementById('sr-rca').value, correctiveAction: document.getElementById('sr-action').value, assignedTo: document.getElementById('sr-assigned').value });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
