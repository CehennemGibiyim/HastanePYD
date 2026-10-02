// ===== HASTA SIRA YÖNETİMİ =====
const STORAGE_KEY = 'patient_queue';

function getQueues() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || seedQueues(); }
  catch { return seedQueues(); }
}
function saveQueues(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function seedQueues() {
  const today = new Date().toISOString().slice(0, 10);
  const q = [
    { id: 1, ticketNo: 'P001', patientName: 'Ahmet Yılmaz', clinic: 'Dahiliye', doctor: 'Dr. Arslan', priority: 'normal', status: 'waiting', arrivalTime: '08:15', callTime: null, notes: '' },
    { id: 2, ticketNo: 'P002', patientName: 'Fatma Demir', clinic: 'Kardiyoloji', doctor: 'Dr. Kaya', priority: 'urgent', status: 'waiting', arrivalTime: '08:30', callTime: null, notes: 'Göğüs ağrısı' },
    { id: 3, ticketNo: 'P003', patientName: 'Mehmet Öz', clinic: 'Ortopedi', doctor: 'Dr. Çelik', priority: 'normal', status: 'in-exam', arrivalTime: '08:45', callTime: '09:10', notes: '' },
    { id: 4, ticketNo: 'P004', patientName: 'Ayşe Kaya', clinic: 'Göz', doctor: 'Dr. Aydın', priority: 'low', status: 'waiting', arrivalTime: '09:00', callTime: null, notes: '' },
    { id: 5, ticketNo: 'P005', patientName: 'Ali Vural', clinic: 'Dahiliye', doctor: 'Dr. Arslan', priority: 'emergency', status: 'completed', arrivalTime: '07:50', callTime: '08:00', notes: 'Tansiyon yüksek' },
    { id: 6, ticketNo: 'P006', patientName: 'Zeynep Şahin', clinic: 'KBB', doctor: 'Dr. Yıldız', priority: 'normal', status: 'waiting', arrivalTime: '09:15', callTime: null, notes: '' },
  ];
  saveQueues(q);
  return q;
}

const CLINICS = ['Dahiliye', 'Kardiyoloji', 'Ortopedi', 'Göz', 'KBB', 'Cildiye', 'Nöroloji', 'Üroloji', 'Genel Cerrahi', 'Kadın Doğum', 'Pediatri', 'Göğüs Hastalıkları'];
const PRIORITIES = { emergency: { label: 'Acil', color: 'red', icon: '🚨' }, urgent: { label: 'Öncelikli', color: 'amber', icon: '⚠️' }, normal: { label: 'Normal', color: 'cyan', icon: '🔵' }, low: { label: 'Düşük', color: 'slate', icon: '⚪' } };
const STATUSES = { waiting: { label: 'Bekliyor', color: 'amber', icon: '⏳' }, 'in-exam': { label: 'Muayenede', color: 'blue', icon: '🩺' }, completed: { label: 'Tamamlandı', color: 'green', icon: '✅' }, 'no-show': { label: 'Gelmedi', color: 'red', icon: '❌' } };

export function renderPatientQueuePage(el) {
  let queues = getQueues();
  let filterClinic = '', filterStatus = '', search = '';

  function render() {
    const filtered = queues.filter(q =>
      (!filterClinic || q.clinic === filterClinic) &&
      (!filterStatus || q.status === filterStatus) &&
      (!search || q.patientName.toLowerCase().includes(search.toLowerCase()) || q.ticketNo.toLowerCase().includes(search.toLowerCase()))
    );
    const waiting = queues.filter(q => q.status === 'waiting').length;
    const inExam = queues.filter(q => q.status === 'in-exam').length;
    const completed = queues.filter(q => q.status === 'completed').length;
    const urgent = queues.filter(q => q.priority === 'emergency' && q.status === 'waiting').length;

    el.innerHTML = `
      <div class="fade-in">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-2xl font-bold text-white">🎫 Hasta Sıra Yönetimi</h1>
            <p class="text-slate-400 text-sm mt-1">Poliklinik hasta sırası ve bekleme yönetimi</p>
          </div>
          <button id="add-queue-btn" class="btn-primary">+ Yeni Hasta</button>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${waiting}</p><p class="text-xs text-slate-400">⏳ Bekleyen</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-blue-300">${inExam}</p><p class="text-xs text-slate-400">🩺 Muayenede</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed}</p><p class="text-xs text-slate-400">✅ Tamamlanan</p></div>
          <div class="card text-center"><p class="text-3xl font-bold text-red-300">${urgent}</p><p class="text-xs text-slate-400">🚨 Acil Bekleyen</p></div>
        </div>

        <div class="card mb-4">
          <div class="flex flex-wrap gap-3">
            <input type="text" class="input-field flex-1 min-w-[200px]" placeholder="🔍 Hasta adı veya bilet no..." id="q-search" value="${search}">
            <select class="input-field" id="q-clinic-filter">
              <option value="">Tüm Klinikler</option>
              ${CLINICS.map(c => `<option value="${c}" ${filterClinic === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <select class="input-field" id="q-status-filter">
              <option value="">Tüm Durumlar</option>
              ${Object.entries(STATUSES).map(([k, v]) => `<option value="${k}" ${filterStatus === k ? 'selected' : ''}>${v.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="card overflow-x-auto">
          <table class="w-full min-w-[700px]">
            <thead><tr>
              <th class="th">Bilet</th><th class="th">Hasta</th><th class="th">Klinik</th>
              <th class="th">Doktor</th><th class="th">Öncelik</th><th class="th">Durum</th>
              <th class="th">Giriş</th><th class="th">Çağrı</th><th class="th">İşlem</th>
            </tr></thead>
            <tbody>
              ${filtered.length === 0 ? `<tr><td colspan="9" class="td text-center py-8 text-slate-500">📭 Kayıt bulunamadı</td></tr>` :
                filtered.sort((a, b) => {
                  const po = { emergency: 0, urgent: 1, normal: 2, low: 3 };
                  const so = { waiting: 0, 'in-exam': 1, completed: 2, 'no-show': 3 };
                  if (so[a.status] !== so[b.status]) return so[a.status] - so[b.status];
                  return po[a.priority] - po[b.priority];
                }).map(q => {
                  const p = PRIORITIES[q.priority];
                  const s = STATUSES[q.status];
                  return `<tr class="border-t border-white/5 hover:bg-white/5">
                    <td class="td font-mono font-bold">${q.ticketNo}</td>
                    <td class="td font-medium text-white">${q.patientName}</td>
                    <td class="td">${q.clinic}</td>
                    <td class="td text-sm">${q.doctor}</td>
                    <td class="td"><span class="badge bg-${p.color}-500/20 text-${p.color}-300">${p.icon} ${p.label}</span></td>
                    <td class="td"><span class="badge bg-${s.color}-500/20 text-${s.color}-300">${s.icon} ${s.label}</span></td>
                    <td class="td text-sm">${q.arrivalTime}</td>
                    <td class="td text-sm">${q.callTime || '—'}</td>
                    <td class="td">
                      <div class="flex gap-1">
                        ${q.status === 'waiting' ? `<button class="btn-secondary text-xs py-1 px-2 call-btn" data-id="${q.id}">📞 Çağır</button>` : ''}
                        ${q.status === 'in-exam' ? `<button class="btn-primary text-xs py-1 px-2 complete-btn" data-id="${q.id}">✅ Bitir</button>` : ''}
                        <button class="btn-secondary text-xs py-1 px-2 no-show-btn" data-id="${q.id}" ${q.status !== 'waiting' ? 'style="display:none"' : ''}>❌ Gelmedi</button>
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
            </tbody>
          </table>
        </div>

        <div class="card mt-4">
          <h3 class="text-sm font-semibold text-white mb-3">📊 Klinik Bazlı Dağılım</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${CLINICS.map(c => {
              const cnt = queues.filter(q => q.clinic === c && q.status !== 'completed').length;
              return cnt > 0 ? `<div class="rounded-lg bg-white/5 px-3 py-2 flex justify-between items-center"><span class="text-xs text-slate-300">${c}</span><span class="badge">${cnt}</span></div>` : '';
            }).filter(Boolean).join('')}
          </div>
        </div>
      </div>`;

    // Events
    document.getElementById('q-search')?.addEventListener('input', e => { search = e.target.value; render(); });
    document.getElementById('q-clinic-filter')?.addEventListener('change', e => { filterClinic = e.target.value; render(); });
    document.getElementById('q-status-filter')?.addEventListener('change', e => { filterStatus = e.target.value; render(); });
    document.getElementById('add-queue-btn')?.addEventListener('click', () => showAddModal());
    document.querySelectorAll('.call-btn').forEach(b => b.onclick = () => { const q = queues.find(x => x.id === +b.dataset.id); if (q) { q.status = 'in-exam'; q.callTime = new Date().toTimeString().slice(0, 5); saveQueues(queues); render(); } });
    document.querySelectorAll('.complete-btn').forEach(b => b.onclick = () => { const q = queues.find(x => x.id === +b.dataset.id); if (q) { q.status = 'completed'; saveQueues(queues); render(); } });
    document.querySelectorAll('.no-show-btn').forEach(b => b.onclick = () => { const q = queues.find(x => x.id === +b.dataset.id); if (q) { q.status = 'no-show'; saveQueues(queues); render(); } });
  }

  function showAddModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
        <h3 class="text-xl font-bold text-white mb-4">🎫 Yeni Hasta Ekle</h3>
        <div class="space-y-3">
          <div><label class="label">Hasta Adı</label><input id="mq-name" class="input-field w-full" placeholder="Ad Soyad"></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="label">Klinik</label><select id="mq-clinic" class="input-field w-full">${CLINICS.map(c => `<option>${c}</option>`).join('')}</select></div>
            <div><label class="label">Öncelik</label><select id="mq-priority" class="input-field w-full">${Object.entries(PRIORITIES).map(([k, v]) => `<option value="${k}">${v.icon} ${v.label}</option>`).join('')}</select></div>
          </div>
          <div><label class="label">Doktor</label><input id="mq-doctor" class="input-field w-full" placeholder="Dr. ..."></div>
          <div><label class="label">Notlar</label><input id="mq-notes" class="input-field w-full" placeholder="Opsiyonel"></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button id="mq-save" class="btn-primary flex-1">💾 Kaydet</button>
          <button id="mq-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.onclick = e => { if (e.target === modal) modal.remove(); };
    document.getElementById('mq-cancel').onclick = () => modal.remove();
    document.getElementById('mq-save').onclick = () => {
      const name = document.getElementById('mq-name').value.trim();
      if (!name) return;
      const maxId = Math.max(0, ...queues.map(q => q.id));
      const ticketNo = 'P' + String(queues.length + 1).padStart(3, '0');
      queues.push({
        id: maxId + 1, ticketNo, patientName: name,
        clinic: document.getElementById('mq-clinic').value,
        doctor: document.getElementById('mq-doctor').value || 'Atanmadı',
        priority: document.getElementById('mq-priority').value,
        status: 'waiting', arrivalTime: new Date().toTimeString().slice(0, 5),
        callTime: null, notes: document.getElementById('mq-notes').value
      });
      saveQueues(queues);
      modal.remove();
      render();
    };
    setTimeout(() => document.getElementById('mq-name')?.focus(), 100);
  }

  render();
}
