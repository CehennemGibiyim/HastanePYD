// ===== EL HİJYENİ UYUMU =====
const STORAGE_KEY = 'hand_hygiene_data';
function getData() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); } catch { return seed(); } }
function saveData(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function seed() {
  const d = [
    { id: 1, observer: 'Hemşire Ayşe', date: new Date().toISOString().slice(0, 10), department: 'Dahiliye', entries: [
      { staff: 'Dr. Arslan', type: 'Doktor', opportunity: 'Hasta temas öncesi', performed: true, method: 'Alkol bazlı', time: '08:15' },
      { staff: 'Hemşire Fatma', type: 'Hemşire', opportunity: 'Hasta temas sonrası', performed: true, method: 'Sabun+su', time: '08:20' },
      { staff: 'Dr. Kaya', type: 'Doktor', opportunity: 'Aseptik prosedür öncesi', performed: false, method: '—', time: '08:30' },
      { staff: 'Hemşire Zeynep', type: 'Hemşire', opportunity: 'Vücut sıvısı teması', performed: true, method: 'Alkol bazlı', time: '08:45' },
      { staff: 'Dr. Çelik', type: 'Doktor', opportunity: 'Hasta temas sonrası', performed: true, method: 'Sabun+su', time: '09:00' },
      { staff: 'Temizlik Görevlisi', type: 'Destek', opportunity: 'Hasta çevresi sonrası', performed: false, method: '—', time: '09:10' },
    ]},
    { id: 2, observer: 'Hemşire Zeynep', date: new Date().toISOString().slice(0, 10), department: 'Cerrahi', entries: [
      { staff: 'Dr. Yıldız', type: 'Doktor', opportunity: 'Hasta temas öncesi', performed: true, method: 'Alkol bazlı', time: '09:30' },
      { staff: 'Hemşire Ali', type: 'Hemşire', opportunity: 'Ekipman teması sonrası', performed: true, method: 'Alkol bazlı', time: '09:45' },
    ]},
  ];
  saveData(d); return d;
}
const OPPORTUNITIES = ['Hasta temas öncesi', 'Hasta temas sonrası', 'Aseptik prosedür öncesi', 'Vücut sıvısı teması', 'Hasta çevresi sonrası', 'Ekipman teması sonrası'];
const METHODS = ['Alkol bazlı', 'Sabun+su'];

export function renderHandHygienePage(el) {
  let data = getData();
  let filterDept = '';
  function render() {
    const allEntries = data.flatMap(d => d.entries.map(e => ({ ...e, date: d.date, department: d.department })));
    const filtered = filterDept ? allEntries.filter(e => e.department === filterDept) : allEntries;
    const total = filtered.length;
    const performed = filtered.filter(e => e.performed).length;
    const rate = total ? Math.round((performed / total) * 100) : 0;
    const depts = [...new Set(data.map(d => d.department))];
    const byType = {};
    filtered.forEach(e => { if (!byType[e.type]) byType[e.type] = { total: 0, done: 0 }; byType[e.type].total++; if (e.performed) byType[e.type].done++; });

    el.innerHTML = `<div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div><h1 class="text-2xl font-bold text-white">🧼 El Hijyeni Uyumu</h1><p class="text-slate-400 text-sm mt-1">WHO 5 Moment gözlem ve uyum takibi</p></div>
        <button id="add-hh-btn" class="btn-primary">+ Yeni Gözlem</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="card text-center"><p class="text-3xl font-bold ${rate >= 80 ? 'text-green-300' : rate >= 60 ? 'text-amber-300' : 'text-red-300'}">${rate}%</p><p class="text-xs text-slate-400">📊 Uyum Oranı</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">${total}</p><p class="text-xs text-slate-400">👁️ Toplam Gözlem</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-green-300">${performed}</p><p class="text-xs text-slate-400">✅ Uygun</p></div>
        <div class="card text-center"><p class="text-3xl font-bold text-red-300">${total - performed}</p><p class="text-xs text-slate-400">❌ Uygun Olmayan</p></div>
      </div>
      <div class="card mb-4"><div class="flex flex-wrap gap-2">
        <button class="btn-secondary text-xs ${!filterDept ? 'tab-active' : ''}" data-dept="">Tümü</button>
        ${depts.map(d => `<button class="btn-secondary text-xs ${filterDept === d ? 'tab-active' : ''}" data-dept="${d}">${d}</button>`).join('')}
      </div></div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="card"><h3 class="text-sm font-semibold text-white mb-3">👷 Personel Türü Bazlı Uyum</h3>
          <div class="space-y-3">${Object.entries(byType).map(([type, vals]) => {
            const pct = vals.total ? Math.round((vals.done / vals.total) * 100) : 0;
            return `<div><div class="flex justify-between text-sm mb-1"><span class="text-slate-300">${type}</span><span class="text-white font-medium">${pct}% (${vals.done}/${vals.total})</span></div><div class="h-3 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full ${pct >= 80 ? 'bg-green-400' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}" style="width:${pct}%"></div></div></div>`;
          }).join('')}</div>
        </div>
        <div class="card"><h3 class="text-sm font-semibold text-white mb-3">📋 Fırsat Türü Bazlı Uyum</h3>
          <div class="space-y-2">${OPPORTUNITIES.map(opp => {
            const oppEntries = filtered.filter(e => e.opportunity === opp);
            const done = oppEntries.filter(e => e.performed).length;
            const pct = oppEntries.length ? Math.round((done / oppEntries.length) * 100) : 0;
            return oppEntries.length ? `<div class="flex items-center gap-3"><span class="text-xs text-slate-300 w-40 truncate">${opp}</span><div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full ${pct >= 80 ? 'bg-green-400' : 'bg-amber-400'}" style="width:${pct}%"></div></div><span class="text-xs text-white w-10 text-right">${pct}%</span></div>` : '';
          }).filter(Boolean).join('')}</div>
        </div>
      </div>
      <div class="card overflow-x-auto"><table class="w-full min-w-[600px]"><thead><tr>
        <th class="th">Personel</th><th class="th">Tür</th><th class="th">Departman</th><th class="th">Fırsat</th><th class="th">Uygulandı</th><th class="th">Yöntem</th><th class="th">Saat</th>
      </tr></thead><tbody>
        ${filtered.length === 0 ? '<tr><td colspan="7" class="td text-center py-8 text-slate-500">📭 Kayıt yok</td></tr>' :
          filtered.map(e => `<tr class="border-t border-white/5"><td class="td font-medium text-white">${e.staff}</td><td class="td">${e.type}</td><td class="td">${e.department}</td><td class="td text-sm">${e.opportunity}</td><td class="td">${e.performed ? '<span class="text-green-400">✅ Evet</span>' : '<span class="text-red-400">❌ Hayır</span>'}</td><td class="td">${e.method}</td><td class="td">${e.time}</td></tr>`).join('')}
      </tbody></table></div>
    </div>`;
    document.querySelectorAll('[data-dept]').forEach(b => b.onclick = () => { filterDept = b.dataset.dept; render(); });
    document.getElementById('add-hh-btn')?.addEventListener('click', showAdd);
  }
  function showAdd() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🧼 Yeni El Hijyeni Gözlemi</h3>
      <div class="space-y-3">
        <div><label class="label">Gözlemci</label><input id="hh-obs" class="input-field w-full" placeholder="Hemşire ..."></div>
        <div><label class="label">Departman</label><select id="hh-dept" class="input-field w-full"><option>Dahiliye</option><option>Cerrahi</option><option>Ortopedi</option><option>Kardiyoloji</option><option>Pediatri</option><option>Acil</option><option>Yoğun Bakım</option></select></div>
        <div class="border-t border-white/10 pt-3"><h4 class="text-sm font-semibold text-white mb-2">Gözlem Kayıtları</h4></div>
        <div id="hh-entries"><div class="hh-entry rounded-lg bg-white/5 p-3 mb-2">
          <div class="grid grid-cols-2 gap-2 mb-2"><input class="input-field w-full hh-staff" placeholder="Personel adı"><select class="input-field w-full hh-type"><option>Doktor</option><option>Hemşire</option><option>Destek</option></select></div>
          <div class="grid grid-cols-2 gap-2"><select class="input-field w-full hh-opp">${OPPORTUNITIES.map(o => `<option>${o}</option>`).join('')}</select><select class="input-field w-full hh-perf"><option value="true">✅ Uyguladı</option><option value="false">❌ Uygulamadı</option></select></div>
        </div></div>
        <button id="hh-add-entry" class="btn-secondary text-xs w-full">+ Gözlem Ekle</button>
      </div>
      <div class="flex gap-3 mt-5"><button id="hh-save" class="btn-primary flex-1">💾 Kaydet</button><button id="hh-cancel" class="btn-secondary flex-1">İptal</button></div>
    </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('hh-cancel').onclick = () => modal.remove();
    document.getElementById('hh-add-entry').onclick = () => {
      const div = document.createElement('div');
      div.className = 'hh-entry rounded-lg bg-white/5 p-3 mb-2';
      div.innerHTML = `<div class="grid grid-cols-2 gap-2 mb-2"><input class="input-field w-full hh-staff" placeholder="Personel adı"><select class="input-field w-full hh-type"><option>Doktor</option><option>Hemşire</option><option>Destek</option></select></div><div class="grid grid-cols-2 gap-2"><select class="input-field w-full hh-opp">${OPPORTUNITIES.map(o => `<option>${o}</option>`).join('')}</select><select class="input-field w-full hh-perf"><option value="true">✅ Uyguladı</option><option value="false">❌ Uygulamadı</option></select></div>`;
      document.getElementById('hh-entries').appendChild(div);
    };
    document.getElementById('hh-save').onclick = () => {
      const observer = document.getElementById('hh-obs').value.trim();
      if (!observer) return;
      const entries = [];
      document.querySelectorAll('.hh-entry').forEach(e => {
        const staff = e.querySelector('.hh-staff')?.value.trim();
        if (staff) entries.push({ staff, type: e.querySelector('.hh-type')?.value, opportunity: e.querySelector('.hh-opp')?.value, performed: e.querySelector('.hh-perf')?.value === 'true', method: e.querySelector('.hh-perf')?.value === 'true' ? (Math.random() > 0.5 ? 'Alkol bazlı' : 'Sabun+su') : '—', time: new Date().toTimeString().slice(0, 5) });
      });
      if (entries.length === 0) return;
      data.push({ id: Date.now(), observer, date: new Date().toISOString().slice(0, 10), department: document.getElementById('hh-dept').value, entries });
      saveData(data); modal.remove(); render();
    };
  }
  render();
}
