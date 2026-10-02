// ===== ÇIKIŞ & OFFBOARDING =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_offboarding';

function getOffboardings() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function saveOffboardings(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

const CHECKLIST = {
  resignation_letter: { label: '📝 İstifa/Çıkış Yazısı', category: 'İK' },
  notice_period: { label: '⏰ İhbar Süresi Tamamlandı', category: 'İK' },
  exit_interview: { label: '🗣️ Çıkış Mülakatı', category: 'İK' },
  equipment_return: { label: '📦 Zimmet İadesi', category: 'Envanter' },
  uniform_return: { label: '👔 Üniforma İadesi', category: 'Envanter' },
  badge_return: { label: '🪪 Kart İadesi', category: 'Envanter' },
  system_access_close: { label: '💻 Sistem Erişimi Kapatıldı', category: 'BT' },
  email_archive: { label: '📧 E-posta Arşivleme', category: 'BT' },
  key_return: { label: '🔑 Anahtar İadesi', category: 'Güvenlik' },
  parking_cancel: { label: '🚗 Otopark İptali', category: 'Güvenlik' },
  knowledge_transfer: { label: '📚 Bilgi Devri', category: 'İş' },
  handover_docs: { label: '📄 Devir Dokümanı', category: 'İş' },
  final_paycheck: { label: '💰 Son Maaş Hesabı', category: 'Muhasebe' },
  severance_calc: { label: '💰 Kıdem/İhbar Hesabı', category: 'Muhasebe' },
};

const reasonLabels = { resignation: 'İstifa', retirement: 'Emeklilik', termination: 'İşten Çıkarma', contract_end: 'Sözleşme Bitimi', transfer: 'Transfer', other: 'Diğer' };

export function renderOffboardingPage(el) {
  const list = getOffboardings();
  const personnel = getPersonnel({});
  const active = list.filter(x => x.status !== 'completed');
  const completed = list.filter(x => x.status === 'completed');

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🚪 Çıkış & Offboarding</h1>
          <p class="text-slate-400 text-sm mt-1">Personel çıkış süreçleri ve devir takibi</p>
        </div>
        <button id="add-offboard-btn" class="btn-primary">➕ Çıkış Başlat</button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-red-300">${active.length}</p><p class="text-xs text-slate-400">🔴 Aktif Süreç</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${completed.length}</p><p class="text-xs text-slate-400">✅ Tamamlanan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${list.filter(x => x.reason === 'resignation').length}</p><p class="text-xs text-slate-400">📝 İstifa</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">${list.filter(x => x.reason === 'retirement').length}</p><p class="text-xs text-slate-400">🏖️ Emeklilik</p></div>
    </div>

    ${list.length === 0 ? `
    <div class="empty-state fade-in">
      <div class="icon">🚪</div>
      <div class="title">Aktif çıkış süreci yok</div>
      <div class="desc">Personel çıkış işlemi başlatmak için yukarıdaki butonu kullanın</div>
    </div>` : `
    <div class="space-y-4 fade-in">
      ${list.map(item => {
        const doneCount = Object.values(item.checklist).filter(Boolean).length;
        const total = Object.keys(CHECKLIST).length;
        const pct = Math.round((doneCount / total) * 100);
        return `
        <div class="card">
          <div class="flex items-center gap-4 mb-4 flex-wrap">
            <div class="w-12 h-12 rounded-xl ${pct === 100 ? 'bg-green-500/15' : 'bg-red-500/15'} flex items-center justify-center text-xl">${pct === 100 ? '✅' : '🚪'}</div>
            <div class="flex-1">
              <h4 class="font-semibold text-white">${item.name}</h4>
              <p class="text-xs text-slate-400">${item.position} · ${item.department} · ${reasonLabels[item.reason] || item.reason}</p>
              <p class="text-xs text-slate-500">Son gün: ${item.lastDay} · ${doneCount}/${total} tamamlandı</p>
            </div>
            <div class="w-full max-w-[200px]">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="text-slate-400">İlerleme</span>
                <span class="${pct === 100 ? 'text-green-400' : 'text-cyan-400'} font-bold">${pct}%</span>
              </div>
              <div class="h-2 rounded-full bg-white/10 overflow-hidden">
                <div class="h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-cyan-500'} transition-all" style="width:${pct}%"></div>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            ${Object.entries(CHECKLIST).map(([key, ci]) => {
              const done = item.checklist[key];
              return `<div class="flex items-center gap-1 rounded-lg ${done ? 'bg-green-500/10' : 'bg-white/5'} p-1.5 cursor-pointer offcheck-toggle" data-id="${item.id}" data-key="${key}">
                <span class="text-xs">${done ? '✅' : '⬜'}</span>
                <span class="text-[9px] ${done ? 'text-green-300' : 'text-slate-400'} truncate">${ci.label}</span>
              </div>`;
            }).join('')}
          </div>
          ${item.feedback ? `<div class="mt-3 rounded-lg bg-white/5 p-3 text-xs text-slate-400">💬 "${item.feedback}"</div>` : ''}
        </div>`;
      }).join('')}
    </div>`}`;

  el.querySelectorAll('.offcheck-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const list = getOffboardings();
      const item = list.find(x => x.id === parseInt(toggle.dataset.id));
      if (item) {
        item.checklist[toggle.dataset.key] = !item.checklist[toggle.dataset.key];
        const doneCount = Object.values(item.checklist).filter(Boolean).length;
        item.status = doneCount === Object.keys(CHECKLIST).length ? 'completed' : 'in_progress';
        saveOffboardings(list);
        showToast(item.checklist[toggle.dataset.key] ? 'Tamamlandı ✅' : 'Geri alındı', 'success');
        renderOffboardingPage(el);
      }
    });
  });

  el.querySelector('#add-offboard-btn')?.addEventListener('click', () => showOffboardModal(el, personnel));
}

function showOffboardModal(el, personnel) {
  const existing = document.getElementById('offboard-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'offboard-modal';
  modal.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-xl font-bold text-white mb-4">🚪 Çıkış Başlat</h3>
      <div class="space-y-3">
        <div><label class="label">Personel</label><select id="ob-person" class="input-field w-full">${personnel.filter(p => p.status === 'active').map(p => `<option value="${p.id}">${p.name} - ${p.department}</option>`).join('')}</select></div>
        <div><label class="label">Çıkış Nedeni</label><select id="ob-reason" class="input-field w-full">${Object.entries(reasonLabels).map(([k,v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div><label class="label">Son Çalışma Günü</label><input id="ob-lastday" type="date" class="input-field w-full"></div>
        <div><label class="label">Çıkış Mülakatı Notu</label><textarea id="ob-feedback" class="input-field w-full" rows="2" placeholder="Ayrılma nedeni, öneriler..."></textarea></div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="ob-save" class="btn-primary flex-1">💾 Başlat</button>
        <button id="ob-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#ob-cancel').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  modal.querySelector('#ob-save').onclick = () => {
    const personId = parseInt(modal.querySelector('#ob-person').value);
    const person = personnel.find(p => p.id === personId);
    if (!person) { showToast('Personel seçin', 'error'); return; }
    const list = getOffboardings();
    list.push({
      id: Date.now(), personId, name: person.name, position: person.type, department: person.department,
      reason: modal.querySelector('#ob-reason').value,
      lastDay: modal.querySelector('#ob-lastday').value || '',
      feedback: modal.querySelector('#ob-feedback').value.trim(),
      status: 'in_progress',
      checklist: Object.fromEntries(Object.keys(CHECKLIST).map(k => [k, false]))
    });
    saveOffboardings(list);
    modal.remove();
    showToast('Çıkış süreci başlatıldı', 'success');
    renderOffboardingPage(el);
  };
}
