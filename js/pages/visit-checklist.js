// ===== VİZİT CHECKLİST =====
const STORAGE_KEY = 'visit_checklists';

function getData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); }
  catch { return seed(); }
}
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function seed() {
  const d = [
    { id: 1, patientName: 'Ahmet Yılmaz', room: 'Oda 101-A', doctor: 'Dr. Arslan', date: new Date().toISOString().slice(0, 10), items: [
      { text: 'Vital bulgular kontrol', done: true }, { text: 'İlaç uyumluluğu', done: true },
      { text: 'Hasta şikayeti dinle', done: false }, { text: 'Laboratuvar sonuçları kontrol', done: false },
      { text: 'Beslenme planı gözden geçir', done: false }, { text: 'Taburculuk planı değerlendir', done: false }
    ], notes: 'Sabah viziti tamamlandı' },
    { id: 2, patientName: 'Fatma Demir', room: 'Oda 205-B', doctor: 'Dr. Kaya', date: new Date().toISOString().slice(0, 10), items: [
      { text: 'EKG kontrol', done: true }, { text: 'Kan gazı analizi', done: true },
      { text: 'İlaç dozajı ayarla', done: true }, { text: 'Konsültasyon talebi', done: false },
      { text: 'Hasta yakınını bilgilendir', done: false }
    ], notes: '' },
    { id: 3, patientName: 'Mehmet Öz', room: 'Oda 310-A', doctor: 'Dr. Çelik', date: new Date().toISOString().slice(0, 10), items: [
      { text: 'Röntgen kontrol', done: false }, { text: 'Atel durumu', done: false },
      { text: 'Ağrı yönetimi', done: false }, { text: 'Fizik tedavi planı', done: false }
    ], notes: 'Ortopedi post-op' },
  ];
  saveData(d);
  return d;
}

export function renderVisitChecklistPage(el) {
  let data = getData();
  let filterDate = new Date().toISOString().slice(0, 10);

  function render() {
    const filtered = data.filter(d => d.date === filterDate);
    const totalItems = filtered.reduce((s, d) => s + d.items.length, 0);
    const doneItems = filtered.reduce((s, d) => s + d.items.filter(i => i.done).length, 0);
    const completionRate = totalItems ? Math.round((doneItems / totalItems) * 100) : 0;

    el.innerHTML = `
      <div class="fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white">📋 Vizit Checklist</h1>
            <p class="text-slate-400 text-sm mt-1">Doktor round kontrol listesi ve hasta notları</p>
          </div>
          <div class="flex gap-2">
            <input type="date" class="input-field" id="vc-date" value="${filterDate}">
            <button id="add-vc-btn" class="btn-primary">+ Yeni Checklist</button>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${filtered.length}</p><p class="text-xs text-slate-400">📋 Toplam Vizit</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-green-300">${doneItems}</p><p class="text-xs text-slate-400">✅ Tamamlanan</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${totalItems - doneItems}</p><p class="text-xs text-slate-400">⏳ Bekleyen</p></div>
          <div class="card text-center"><p class="text-3xl font-bold ${completionRate >= 80 ? 'text-green-300' : completionRate >= 50 ? 'text-amber-300' : 'text-red-300'}">${completionRate}%</p><p class="text-xs text-slate-400">📊 Tamamlanma</p></div>
        </div>

        <div class="space-y-4">
          ${filtered.length === 0 ? '<div class="empty-state"><p class="icon">📋</p><p class="title">Bu tarihte vizit kaydı yok</p><p class="desc">Yeni bir checklist oluşturun</p></div>' :
            filtered.map(v => {
              const done = v.items.filter(i => i.done).length;
              const total = v.items.length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return `
              <div class="card">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 class="text-lg font-bold text-white">${v.patientName}</h3>
                    <p class="text-xs text-slate-400">🏥 ${v.room} · 👨‍⚕️ ${v.doctor} · 📅 ${v.date}</p>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-24 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-cyan-400 transition-all" style="width:${pct}%"></div></div>
                    <span class="text-sm font-medium text-white">${pct}%</span>
                  </div>
                </div>
                <div class="space-y-2 mb-3">
                  ${v.items.map((item, idx) => `
                    <label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition">
                      <input type="checkbox" ${item.done ? 'checked' : ''} class="w-5 h-5 rounded accent-cyan-500 vc-check" data-vid="${v.id}" data-idx="${idx}">
                      <span class="text-sm ${item.done ? 'line-through text-slate-500' : 'text-slate-200'}">${item.text}</span>
                    </label>
                  `).join('')}
                </div>
                ${v.notes ? `<p class="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">📝 ${v.notes}</p>` : ''}
                <div class="flex gap-2 mt-3">
                  <button class="btn-secondary text-xs py-1 px-3 add-item-btn" data-vid="${v.id}">+ Madde Ekle</button>
                  <button class="btn-secondary text-xs py-1 px-3 delete-vc-btn" data-vid="${v.id}">🗑️ Sil</button>
                </div>
              </div>`;
            }).join('')}
        </div>
      </div>`;

    document.getElementById('vc-date')?.addEventListener('change', e => { filterDate = e.target.value; render(); });
    document.getElementById('add-vc-btn')?.addEventListener('click', showAdd);
    document.querySelectorAll('.vc-check').forEach(cb => cb.onchange = () => {
      const v = data.find(x => x.id === +cb.dataset.vid);
      if (v) { v.items[+cb.dataset.idx].done = cb.checked; saveData(data); render(); }
    });
    document.querySelectorAll('.add-item-btn').forEach(b => b.onclick = () => {
      const v = data.find(x => x.id === +b.dataset.vid);
      if (!v) return;
      const text = prompt('Yeni madde:');
      if (text) { v.items.push({ text, done: false }); saveData(data); render(); }
    });
    document.querySelectorAll('.delete-vc-btn').forEach(b => b.onclick = () => {
      if (confirm('Silmek istediğinize emin misiniz?')) { data = data.filter(x => x.id !== +b.dataset.vid); saveData(data); render(); }
    });
  }

  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 class="text-xl font-bold text-white mb-4">📋 Yeni Vizit Checklist</h3>
        <div class="space-y-3">
          <div><label class="label">Hasta Adı</label><input id="vc-name" class="input-field w-full" placeholder="Ad Soyad"></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Oda</label><input id="vc-room" class="input-field w-full" placeholder="Oda 101-A"></div>
            <div><label class="label">Doktor</label><input id="vc-doctor" class="input-field w-full" placeholder="Dr. ..."></div>
          </div>
          <div><label class="label">Checklist Maddeleri (virgülle ayırın)</label><textarea id="vc-items" class="input-field w-full" rows="3" placeholder="Vital bulgular, İlaç kontrol, ..."></textarea></div>
          <div><label class="label">Notlar</label><input id="vc-notes" class="input-field w-full" placeholder="Opsiyonel"></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="vc-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="vc-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('vc-cancel').onclick = () => modal.remove();
    document.getElementById('vc-save').onclick = () => {
      const name = document.getElementById('vc-name').value.trim();
      if (!name) return;
      const itemsText = document.getElementById('vc-items').value;
      const items = itemsText.split(',').map(s => s.trim()).filter(Boolean).map(text => ({ text, done: false }));
      if (items.length === 0) items.push({ text: 'Genel kontrol', done: false });
      data.push({
        id: Date.now(), patientName: name, room: document.getElementById('vc-room').value || 'Belirtilmedi',
        doctor: document.getElementById('vc-doctor').value || 'Atanmadı', date: filterDate,
        items, notes: document.getElementById('vc-notes').value
      });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
