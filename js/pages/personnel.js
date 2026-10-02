// ===== PERSONEL YÖNETİMİ SAYFASI =====

import { getPersonnel, addPersonnel, updatePersonnel, deletePersonnel, hasPermission, DEPARTMENTS, PERSONNEL_TYPES, WORK_PROFILES, getDefaultProfileForType, isDepartmentRestricted, getUserDepartment, canAccessDepartment } from '../state.js';
import { navigate } from '../app.js';
import { showToast, resizeImage } from '../notifications.js';

let editingId = null;
let wizardStep = 1;
let currentPhotoData = null;
let sortField = '';
let sortDir = 'asc';

const DEPT_TYPE_HINT = {
  'Acil Servis': 'doctor', 'Dahiliye': 'doctor', 'Cerrahi': 'doctor',
  'Çocuk Sağlığı': 'doctor', 'Kadın Doğum': 'doctor', 'Göz': 'doctor',
  'KBB': 'doctor', 'Ortopedi': 'doctor', 'Yoğun Bakım': 'doctor',
  'Hemşirelik': 'nurse', 'Fizik Tedavi': 'nurse',
  'Temizlik': 'worker', 'Mutfak': 'worker',
  'Güvenlik': 'security', 'Teknik Servis': 'technical',
  'İdari': 'officer', 'Laboratuvar': 'officer', 'Eczane': 'officer', 'Radyoloji': 'officer', 'Ameliyathane': 'nurse',
};

const QUICK_TITLES = [
  'Uzman Doktor', 'Pratisyen Doktor', 'Başhemşire', 'Hemşire', 'Ebe',
  'Temizlik Görevlisi', 'Temizlik Şefi', 'Güvenlik Amiri', 'Güvenlik Görevlisi',
  'Teknik Şef', 'Elektrik Teknisyeni', 'Bilgi İşlem Teknisyeni',
  'Hizmetli', 'Aşçıbaşı', 'Aşçı', 'Laborant', 'Eczacı', 'Radyoloji Teknikeri',
  'Sekreter', 'Müdür Yardımcısı', 'Fizyoterapi Teknikeri',
];

const CERT_SUGGESTIONS = {
  doctor: ['Uzmanlık Belgesi', 'Tıp Diploması', 'İlk Yardım'],
  nurse: ['Hemşirelik Lisans', 'Başhemşirelik', 'İlk Yardım', 'Acil Bakım'],
  worker: ['Hijyen Sertifikası', 'İş Güvenliği'],
  security: ['Silahlı Güvenlik', 'Silahsız Güvenlik', 'KKP'],
  technical: ['Elektrik Tesisat', 'İş Güvenliği', 'A+', 'Network+'],
  officer: ['Bilgisayar Sertifikası', 'KKP', 'Yönetim'],
};

export function renderPersonnelPage(el) {
  const canWrite = hasPermission('write');
  const deptRestricted = isDepartmentRestricted();
  const myDept = getUserDepartment();
  let list = getPersonnel();
  if (deptRestricted) list = list.filter(p => p.department === myDept);
  const active = list.filter(p => p.status === 'active');
  const workerCount = active.filter(p => PERSONNEL_TYPES[p.type]?.category === 'worker').length;
  const officerCount = active.filter(p => PERSONNEL_TYPES[p.type]?.category === 'officer').length;

  el.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6 fade-in">
      <div>
        <h1 class="text-2xl font-bold text-white">👥 Personel Yönetimi</h1>
        <p class="text-slate-400 text-sm mt-1">${active.length} aktif personel · ${workerCount} işçi · ${officerCount} memur</p>
      </div>
      ${canWrite ? `
        <button id="add-p-btn" class="btn-primary text-base px-6 py-3 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
          ➕ Personel Ekle
        </button>` : '<div class="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-amber-300 text-xs">👁️ Okuyucu modundasınız</div>'}
    </div>

    <!-- İstatistikler -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-cyan-300">${active.length}</p>
        <p class="text-[10px] text-cyan-400">Toplam Aktif</p>
      </div>
      <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-blue-300">${workerCount}</p>
        <p class="text-[10px] text-blue-400">İşçi (45s/hafta)</p>
      </div>
      <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-emerald-300">${officerCount}</p>
        <p class="text-[10px] text-emerald-400">Memur (40s/hafta)</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-3 text-center">
        <p class="text-2xl font-bold text-purple-300">${active.filter(p => p.type === 'doctor').length + active.filter(p => p.type === 'nurse').length}</p>
        <p class="text-[10px] text-purple-400">Doktor + Hemşire</p>
      </div>
    </div>

    <!-- Filtreler -->
    <div class="flex flex-wrap gap-3 mb-4 fade-in">
      <input type="text" id="p-search" class="input-field w-64" placeholder="🔍 İsim, TC, telefon, unvan...">
      <select id="p-dept" class="input-field w-48" ${deptRestricted ? 'disabled style="opacity:0.5"' : ''}>
        <option value="">Tüm Departmanlar</option>
        ${DEPARTMENTS.map(d => `<option ${deptRestricted && d === myDept ? 'selected' : ''}>${d}</option>`).join('')}
      </select>
      <select id="p-type" class="input-field w-48">
        <option value="">Tüm Türler</option>
        ${Object.entries(PERSONNEL_TYPES).map(([k, v]) => `<option value="${k}">${v.label} (${v.weeklyHours}s)</option>`).join('')}
      </select>
      <select id="p-cat" class="input-field w-36">
        <option value="">Tümü</option>
        <option value="worker">İşçi Sınıfı</option>
        <option value="officer">Memur Sınıfı</option>
      </select>
      <div class="flex items-center gap-2 text-xs text-slate-400">
        <span id="p-count">${list.length}</span> kayıt
      </div>
    </div>

    <!-- Personel Tablosu -->
    <div class="card overflow-hidden fade-in">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="border-b border-white/10 bg-white/5">
            <th class="th">#</th>
            ${sortTh('name', 'Ad Soyad')}
            ${sortTh('department', 'Departman')}
            ${sortTh('title', 'Görev')}
            ${sortTh('type', 'Tür')}
            ${sortTh('category', 'Sınıf')}
            ${sortTh('phone', 'Telefon')}
            <th class="th">Haftalık</th>
            ${canWrite ? '<th class="th">İşlem</th>' : ''}
          </tr></thead>
          <tbody id="p-body">${rows(list, canWrite)}</tbody>
        </table>
      </div>
    </div>

    ${canWrite ? `
    <button id="fab-add" class="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-cyan-500 text-slate-900 text-2xl font-bold shadow-lg shadow-cyan-500/40 flex items-center justify-center hover:bg-cyan-400 active:scale-95 transition-all lg:hidden" aria-label="Personel Ekle">+</button>` : ''}

    ${buildModal(canWrite)}
    ${buildDeleteModal()}`;

  // Filtreler
  const applyFilter = () => {
    const s = document.getElementById('p-search').value;
    const d = document.getElementById('p-dept').value;
    const t = document.getElementById('p-type').value;
    const c = document.getElementById('p-cat').value;
    let filtered = getPersonnel({ search: s, department: d, type: t });
    if (c) filtered = filtered.filter(p => PERSONNEL_TYPES[p.type]?.category === c);
    document.getElementById('p-body').innerHTML = rows(filtered, canWrite);
    document.getElementById('p-count').textContent = filtered.length;
    bindRowButtons();
  };

  document.getElementById('p-search').oninput = applyFilter;
  document.getElementById('p-dept').onchange = applyFilter;
  document.getElementById('p-type').onchange = applyFilter;
  document.getElementById('p-cat').onchange = applyFilter;
  bindSortHeaders(applyFilter, canWrite);

  // Ekleme butonları
  const openAdd = () => openModal();
  document.getElementById('add-p-btn')?.addEventListener('click', openAdd);
  document.getElementById('fab-add')?.addEventListener('click', openAdd);

  // Departman → tür önerisi
  document.getElementById('f-dept')?.addEventListener('change', () => {
    const dept = document.getElementById('f-dept').value;
    const hint = DEPT_TYPE_HINT[dept];
    if (hint) { document.getElementById('f-type').value = hint; updateTypeInfo(); updateCertSuggestions(); }
  });

  document.getElementById('f-type').onchange = () => { updateTypeInfo(); updateCertSuggestions(); };
  document.getElementById('f-profile')?.addEventListener('change', updateProfileInfo);

  // Başlık ipuçları
  document.querySelectorAll('.title-hint').forEach(btn => {
    btn.onclick = () => { document.getElementById('f-title').value = btn.dataset.title; };
  });

  document.getElementById('f-cancel').onclick = closeModal;
  document.getElementById('p-close-x').onclick = closeModal;

  // Prevent Escape key from closing modal
  document.addEventListener('keydown', function preventModalEscape(e) {
    if (e.key === 'Escape') {
      const modal = document.getElementById('p-modal');
      if (modal && !modal.classList.contains('hidden')) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  });

  // Wizard
  document.getElementById('w-next').onclick = () => goToStep(2);
  document.getElementById('w-back').onclick = () => goToStep(1);
  document.getElementById('w-save').onclick = savePerson;

  // Sertifika ekleme
  document.getElementById('cert-add-btn')?.addEventListener('click', () => {
    const input = document.getElementById('f-cert-input');
    const val = input.value.trim();
    if (!val) return;
    addCertTag(val);
    input.value = '';
  });
  document.getElementById('f-cert-input')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('cert-add-btn').click(); }
  });

  // Fotoğraf yükleme
  const photoArea = document.getElementById('photo-area');
  const photoInput = document.getElementById('f-photo');
  const photoPreview = document.getElementById('photo-preview');
  const photoInitials = document.getElementById('photo-initials');

  function updatePhotoPreview() {
    const nameVal = document.getElementById('f-name').value.trim();
    if (currentPhotoData) {
      photoPreview.innerHTML = `<img src="${currentPhotoData}" alt="Fotoğraf">`;
    } else if (nameVal) {
      const parts = nameVal.split(/\s+/);
      const initials = (parts[0]?.charAt(0) || '') + (parts[parts.length - 1]?.charAt(0) || '');
      photoPreview.innerHTML = `<span class="initials">${initials.toUpperCase()}</span><span class="upload-hint">Fotoğraf Ekle</span>`;
    } else {
      photoPreview.innerHTML = `<span class="initials">📷</span><span class="upload-hint">Fotoğraf Ekle</span>`;
    }
  }

  photoArea?.addEventListener('click', () => photoInput?.click());
  photoInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      currentPhotoData = await resizeImage(file, 150);
      updatePhotoPreview();
      showToast('Fotoğraf yüklendi', 'success');
    } catch { showToast('Fotoğraf yüklenemedi', 'error'); }
  });
  document.getElementById('f-name')?.addEventListener('input', () => {
    if (!currentPhotoData) updatePhotoPreview();
  });
  updatePhotoPreview();

  // Silme modalı
  document.getElementById('del-cancel').onclick = () => document.getElementById('del-modal').classList.add('hidden');

  function bindRowButtons() {
    document.querySelectorAll('[data-edit-id]').forEach(btn => {
      btn.onclick = () => { const p = getPersonnel().find(x => x.id === parseInt(btn.dataset.editId)); if (p) openModal(p); };
    });
    document.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.onclick = () => {
        const id = parseInt(btn.dataset.delId);
        const p = getPersonnel().find(x => x.id === id);
        if (!p) return;
        if (isDepartmentRestricted() && !canAccessDepartment(p.department)) {
          showToast('Bu personeli silme yetkiniz yok', 'error');
          return;
        }
        document.getElementById('del-name').textContent = `${p.name} ${p.surname} (${p.department})`;
        document.getElementById('del-confirm').onclick = () => {
          deletePersonnel(id);
          document.getElementById('del-modal').classList.add('hidden');
          showToast(`${p.name} ${p.surname} silindi`, 'success');
          navigate('personnel');
        };
        document.getElementById('del-modal').classList.remove('hidden');
      };
    });
    document.querySelectorAll('[data-view-id]').forEach(btn => {
      btn.onclick = () => { location.hash = `personnel/${btn.dataset.viewId}`; };
    });
  }
  bindRowButtons();
}

function sortTh(field, label) {
  const isActive = sortField === field;
  const arrow = isActive ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';
  const cls = isActive
    ? 'th cursor-pointer select-none text-cyan-400'
    : 'th cursor-pointer select-none hover:text-slate-200';
  return `<th class="${cls}" data-sort-field="${field}">${label}${arrow}</th>`;
}

function sortPersonnel(list) {
  const sorted = [...list];
  const dir = sortDir === 'asc' ? 1 : -1;
  sorted.sort((a, b) => {
    let va, vb;
    switch (sortField) {
      case 'name':
        va = `${a.name} ${a.surname}`.toLocaleLowerCase('tr');
        vb = `${b.name} ${b.surname}`.toLocaleLowerCase('tr');
        return va.localeCompare(vb, 'tr') * dir;
      case 'department':
        va = (a.department || '').toLocaleLowerCase('tr');
        vb = (b.department || '').toLocaleLowerCase('tr');
        return va.localeCompare(vb, 'tr') * dir;
      case 'title':
        va = (a.title || '').toLocaleLowerCase('tr');
        vb = (b.title || '').toLocaleLowerCase('tr');
        return va.localeCompare(vb, 'tr') * dir;
      case 'type':
        va = (PERSONNEL_TYPES[a.type]?.label || a.type).toLocaleLowerCase('tr');
        vb = (PERSONNEL_TYPES[b.type]?.label || b.type).toLocaleLowerCase('tr');
        return va.localeCompare(vb, 'tr') * dir;
      case 'category':
        va = PERSONNEL_TYPES[a.type]?.category || '';
        vb = PERSONNEL_TYPES[b.type]?.category || '';
        return va.localeCompare(vb, 'tr') * dir;
      case 'phone':
        va = (a.phone || '');
        vb = (b.phone || '');
        return va.localeCompare(vb) * dir;
      default: return 0;
    }
  });
  return sorted;
}

function bindSortHeaders(applyFilter, canWrite) {
  document.querySelectorAll('[data-sort-field]').forEach(th => {
    th.onclick = () => {
      const field = th.dataset.sortField;
      if (sortField === field) {
        sortDir = sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDir = 'asc';
      }
      // Re-render header arrows
      const theadRow = th.closest('thead')?.querySelector('tr');
      if (theadRow) {
        theadRow.innerHTML = `
          <th class="th">#</th>
          ${sortTh('name', 'Ad Soyad')}
          ${sortTh('department', 'Departman')}
          ${sortTh('title', 'Görev')}
          ${sortTh('type', 'Tür')}
          ${sortTh('category', 'Sınıf')}
          ${sortTh('phone', 'Telefon')}
          <th class="th">Haftalık</th>
          ${canWrite ? '<th class="th">İşlem</th>' : ''}
        `;
        bindSortHeaders(applyFilter, canWrite);
      }
      applyFilter();
    };
  });
}

function updateTypeInfo() {
  const type = document.getElementById('f-type').value;
  const info = PERSONNEL_TYPES[type];
  document.getElementById('type-info').innerHTML = info
    ? `ℹ️ ${info.label}: ${info.category === 'worker' ? 'İşçi Sınıfı' : 'Memur Sınıfı'} · Haftada ${info.weeklyHours} saat`
    : '';
  updateProfileOptions(type);
}

function updateProfileOptions(type) {
  const sel = document.getElementById('f-profile');
  if (!sel) return;
  const defaultId = getDefaultProfileForType(type);
  const profiles = Object.entries(WORK_PROFILES);
  sel.innerHTML = profiles.map(([id, p]) =>
    `<option value="${id}" ${id === defaultId ? 'selected' : ''}>${p.icon} ${p.name} — ${p.desc} (${p.weeklyHours}s/hafta)</option>`
  ).join('');
  updateProfileInfo();
}

function updateProfileInfo() {
  const profileId = document.getElementById('f-profile')?.value;
  const profile = WORK_PROFILES[profileId];
  const infoEl = document.getElementById('profile-info');
  if (!profile || !infoEl) return;
  const rules = Object.entries(profile.shifts).map(([dur, rule]) => {
    const breakText = rule.breakMin > 0 ? ` − ${rule.breakMin}dk mola` : '';
    return `<span class="inline-block px-2 py-0.5 rounded bg-white/5 text-slate-300 mr-1 mb-1">${dur}s${breakText} → <strong>${rule.record}s</strong> puantaj</span>`;
  }).join('');
  infoEl.innerHTML = `
    <div class="flex items-center gap-2 mb-2">
      <span class="text-base">${profile.icon}</span>
      <span class="font-medium text-white">${profile.name}</span>
      <span class="px-1.5 py-0.5 rounded bg-white/10 text-[10px]">${profile.weeklyHours}s/hafta</span>
    </div>
    <div class="flex flex-wrap">${rules}</div>`;
}

function updateCertSuggestions() {
  const type = document.getElementById('f-type').value;
  const container = document.getElementById('cert-suggestions');
  if (!container) return;
  const certs = CERT_SUGGESTIONS[type] || [];
  container.innerHTML = certs.map(c =>
    `<button type="button" class="cert-suggest text-[10px] px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition cursor-pointer" data-cert="${c}">${c}</button>`
  ).join('');
  container.querySelectorAll('.cert-suggest').forEach(btn => {
    btn.onclick = () => { addCertTag(btn.dataset.cert); };
  });
}

function addCertTag(value) {
  const tags = document.getElementById('cert-tags');
  if (!tags) return;
  // Avoid duplicates
  if (tags.querySelector(`[data-val="${value}"]`)) return;
  const tag = document.createElement('span');
  tag.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs';
  tag.dataset.val = value;
  tag.innerHTML = `${value} <button type="button" class="text-emerald-400/60 hover:text-red-400 ml-0.5" onclick="this.parentElement.remove()">✕</button>`;
  tags.appendChild(tag);
}

function getCollectedCerts() {
  const tags = document.getElementById('cert-tags');
  if (!tags) return [];
  return [...tags.querySelectorAll('[data-val]')].map(t => t.dataset.val);
}

function goToStep(step) {
  wizardStep = step;
  const step1 = document.getElementById('wizard-step-1');
  const step2 = document.getElementById('wizard-step-2');
  const ind1 = document.getElementById('step-ind-1');
  const ind2 = document.getElementById('step-ind-2');
  const back = document.getElementById('w-back');
  const next = document.getElementById('w-next');
  const save = document.getElementById('w-save');

  if (step === 1) {
    step1.classList.remove('hidden');
    step2.classList.add('hidden');
    ind1.querySelector('div').className = 'w-8 h-8 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center text-sm font-bold';
    ind1.querySelector('span').className = 'text-sm font-medium text-cyan-400';
    ind2.querySelector('div').className = 'w-8 h-8 rounded-full bg-white/10 text-slate-500 flex items-center justify-center text-sm font-bold';
    ind2.querySelector('span').className = 'text-sm text-slate-500';
    back.classList.add('hidden');
    next.classList.remove('hidden');
    save.classList.add('hidden');
  } else {
    // Validasyon
    const nameVal = document.getElementById('f-name').value.trim();
    const titleVal = document.getElementById('f-title').value.trim();
    const phoneVal = document.getElementById('f-phone').value.trim();
    if (!nameVal) { document.getElementById('f-name').focus(); document.getElementById('f-name').style.borderColor = 'rgba(239,68,68,0.5)'; return; }
    if (!titleVal) { document.getElementById('f-title').focus(); document.getElementById('f-title').style.borderColor = 'rgba(239,68,68,0.5)'; return; }
    if (!phoneVal) { document.getElementById('f-phone').focus(); document.getElementById('f-phone').style.borderColor = 'rgba(239,68,68,0.5)'; return; }
    document.getElementById('f-name').style.borderColor = '';
    document.getElementById('f-title').style.borderColor = '';
    document.getElementById('f-phone').style.borderColor = '';

    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    ind1.querySelector('div').className = 'w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold';
    ind1.querySelector('span').className = 'text-sm font-medium text-green-400';
    ind2.querySelector('div').className = 'w-8 h-8 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center text-sm font-bold';
    ind2.querySelector('span').className = 'text-sm font-medium text-cyan-400';
    back.classList.remove('hidden');
    next.classList.add('hidden');
    save.classList.remove('hidden');
    updateCertSuggestions();
  }
}

function rows(list, canWrite) {
  if (!list.length) return `<tr><td colspan="${canWrite ? 9 : 8}" class="px-4 py-12 text-center">
    <p class="text-4xl mb-2">🔍</p>
    <p class="text-slate-400">Personel bulunamadı</p>
    <p class="text-slate-600 text-xs mt-1">Arama kriterlerinizi değiştirmeyi deneyin</p>
  </td></tr>`;
  const sorted = sortField ? sortPersonnel(list) : list;
  return sorted.map((p, i) => {
    const typeInfo = PERSONNEL_TYPES[p.type] || {};
    const isWorker = typeInfo.category === 'worker';
    const initials = (p.name?.charAt(0) || '') + (p.surname?.charAt(0) || '');
    const avatarHtml = p.photo
      ? `<div class="table-avatar"><img src="${p.photo}" alt="${p.name}"></div>`
      : `<div class="table-avatar">${initials.toUpperCase()}</div>`;
    return `<tr class="border-b border-white/5 hover:bg-white/5 transition">
      <td class="td text-slate-600 text-xs">${i + 1}</td>
      <td class="td font-medium">
        <div class="flex items-center gap-2">
          ${avatarHtml}
          <button data-view-id="${p.id}" class="text-white hover:text-cyan-300 transition text-left">${p.name} ${p.surname}</button>
        </div>
      </td>
      <td class="td">${p.department}</td>
      <td class="td text-slate-300">${p.title}</td>
      <td class="td"><span class="badge">${typeInfo.label || p.type}</span></td>
      <td class="td"><span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${isWorker ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/15 text-emerald-300'}">${isWorker ? 'İşçi' : 'Memur'}</span></td>
      <td class="td text-slate-300"><a href="tel:${p.phone}" class="hover:text-cyan-300 transition">${p.phone}</a></td>
      <td class="td text-center">${typeInfo.weeklyHours || '-'}s</td>
      ${canWrite ? `<td class="td">
        <button data-view-id="${p.id}" class="text-cyan-400 hover:text-cyan-300 text-xs mr-1 px-2 py-1 rounded hover:bg-cyan-500/10 transition" title="Detay">👁️</button>
        <button data-edit-id="${p.id}" class="text-cyan-400 hover:text-cyan-300 text-xs mr-1 px-2 py-1 rounded hover:bg-cyan-500/10 transition" title="Düzenle">✏️</button>
        <button data-del-id="${p.id}" class="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition" title="Sil">🗑️</button>
      </td>` : `<td class="td"><button data-view-id="${p.id}" class="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded hover:bg-cyan-500/10 transition" title="Detay">👁️</button></td>`}
    </tr>`;
  }).join('');
}

function buildModal(canWrite) {
  return `
    <div id="p-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 id="p-modal-title" class="text-xl font-bold text-white">👤 Yeni Personel Ekle</h3>
          <button id="p-close-x" class="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">✕</button>
        </div>

        <!-- Wizard İlerleme -->
        <div id="wizard-indicator" class="flex items-center gap-2 mb-6">
          <div id="step-ind-1" class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-cyan-500 text-slate-900 flex items-center justify-center text-sm font-bold">1</div>
            <span class="text-sm font-medium text-cyan-400">Temel Bilgiler</span>
          </div>
          <div class="flex-1 h-px bg-white/10 mx-2"></div>
          <div id="step-ind-2" class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-white/10 text-slate-500 flex items-center justify-center text-sm font-bold">2</div>
            <span class="text-sm text-slate-500">Detay Bilgiler</span>
          </div>
        </div>

        <!-- ADIM 1: Temel -->
        <div id="wizard-step-1" class="space-y-4">
          <div class="rounded-xl bg-cyan-500/5 border border-cyan-500/10 p-4 mb-2">
            <p class="text-xs text-cyan-300">📝 Zorunlu alanlar: Ad Soyad, Görev, Telefon. Fotoğraf ve diğer bilgiler opsiyoneldir.</p>
          </div>

          <!-- Fotoğraf Yükleme -->
          <div class="flex justify-center">
            <div class="photo-upload-area" id="photo-area">
              <div class="avatar-circle" id="photo-preview">
                <span class="initials" id="photo-initials">📷</span>
                <span class="upload-hint">Fotoğraf Ekle</span>
              </div>
              <div class="photo-overlay">📷 Değiştir</div>
            </div>
            <input type="file" id="f-photo" accept="image/*" class="hidden">
          </div>

          <div>
            <label class="label">Ad Soyad <span class="text-red-400">*</span></label>
            <input id="f-name" class="input-field w-full text-lg" placeholder="Örn: Ahmet Yılmaz" autocomplete="name">
          </div>
          <div>
            <label class="label">Görev / Unvan <span class="text-red-400">*</span></label>
            <input id="f-title" class="input-field w-full" placeholder="Örn: Temizlik Görevlisi">
            <div class="flex flex-wrap gap-1.5 mt-2">
              ${QUICK_TITLES.map(t =>
                `<button type="button" class="title-hint text-[10px] px-2 py-1 rounded-lg bg-white/5 text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition cursor-pointer" data-title="${t}">${t}</button>`
              ).join('')}
            </div>
          </div>
          <div>
            <label class="label">İletişim Numarası <span class="text-red-400">*</span></label>
            <input id="f-phone" class="input-field w-full text-lg" placeholder="05XX XXX XX XX" type="tel" autocomplete="tel">
          </div>
          <div>
            <label class="label">E-posta</label>
            <input id="f-email" class="input-field w-full" placeholder="ornek@hastane.gov.tr" type="email">
          </div>
        </div>

        <!-- ADIM 2: Detay -->
        <div id="wizard-step-2" class="space-y-4 hidden">
          <div class="rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 mb-2">
            <p class="text-xs text-blue-300">📋 Opsiyonel bilgiler. Daha sonra düzenleyebilirsiniz.</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Departman</label>
              <select id="f-dept" class="input-field w-full">
                ${DEPARTMENTS.map(d => `<option>${d}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">Personel Türü</label>
              <select id="f-type" class="input-field w-full">
                ${Object.entries(PERSONNEL_TYPES).map(([k, v]) => `<option value="${k}">${v.label} (${v.weeklyHours}s/hafta)</option>`).join('')}
              </select>
            </div>
          </div>

          <div id="type-info" class="rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 text-xs text-cyan-300">
            ℹ️ İşçi: 45s/hafta · Memur: 40s/hafta
          </div>

          <!-- Mesai Profili Seçimi -->
          <div>
            <label class="label">Mesai Profili</label>
            <select id="f-profile" class="input-field w-full">
            </select>
            <div id="profile-info" class="mt-2 rounded-lg bg-white/5 border border-white/10 p-3 text-xs text-slate-400"></div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">TC Kimlik No</label>
              <input id="f-tc" class="input-field w-full" maxlength="11" placeholder="11 haneli TC no">
            </div>
            <div>
              <label class="label">İşe Başlama</label>
              <input id="f-start" type="date" class="input-field w-full">
            </div>
          </div>

          <div>
            <label class="label">Adres</label>
            <textarea id="f-address" class="input-field w-full h-20 resize-none" placeholder="Tam adres bilgisi"></textarea>
          </div>

          <div>
            <label class="label">Eğitim Durumu</label>
            <select id="f-education" class="input-field w-full">
              <option value="">Seçiniz</option>
              <option>İlkokul</option>
              <option>Lise</option>
              <option>MYO</option>
              <option>Lisans</option>
              <option>Yüksek Lisans</option>
              <option>Doktora</option>
              <option>Tıp Fakültesi</option>
              <option>Hemşirelik MYO</option>
              <option>Hemşirelik Fakültesi</option>
              <option>Eczacılık Fakültesi</option>
              <option>Ebelik MYO</option>
              <option>Fizik Tedavi MYO</option>
              <option>MYO Elektrik</option>
              <option>MYO Bilgisayar</option>
              <option>MYO Makine</option>
              <option>MYO Güvenlik</option>
              <option>MYO Radyoloji</option>
              <option>MYO Aşçılık</option>
              <option>MYO Laborant</option>
              <option>İktisat Fakültesi</option>
              <option>Büro Yönetimi MYO</option>
            </select>
          </div>

          <div>
            <label class="label">Sertifikalar</label>
            <div class="flex gap-2 mb-2">
              <input id="f-cert-input" class="input-field flex-1" placeholder="Sertifika adı yazın...">
              <button id="cert-add-btn" type="button" class="btn-secondary px-3">+ Ekle</button>
            </div>
            <div id="cert-suggestions" class="flex flex-wrap gap-1.5 mb-2"></div>
            <div id="cert-tags" class="flex flex-wrap gap-1.5"></div>
          </div>
        </div>

        <!-- Butonlar -->
        <div class="flex gap-3 mt-6 pt-4 border-t border-white/10">
          <button id="w-back" class="btn-secondary flex-1 hidden">← Geri</button>
          <button id="w-next" class="btn-primary flex-1">Devam Et →</button>
          <button id="w-save" class="btn-primary flex-1 hidden">💾 Kaydet</button>
          <button id="f-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;
}

function buildDeleteModal() {
  return `
    <div id="del-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in text-center">
        <p class="text-4xl mb-3">⚠️</p>
        <h3 class="text-lg font-bold text-white mb-2">Personeli Sil</h3>
        <p id="del-name" class="text-slate-400 text-sm mb-6"></p>
        <div class="flex gap-3">
          <button id="del-confirm" class="btn-primary flex-1 bg-red-500 hover:bg-red-400">🗑️ Sil</button>
          <button id="del-cancel" class="btn-secondary flex-1">İptal</button>
        </div>
      </div>
    </div>`;
}

function openModal(p = null) {
  editingId = p?.id || null;
  wizardStep = 1;
  currentPhotoData = p?.photo || null;

  document.getElementById('p-modal-title').textContent = p ? '✏️ Personel Düzenle' : '👤 Yeni Personel Ekle';
  document.getElementById('f-name').value = p ? `${p.name} ${p.surname}` : '';
  document.getElementById('f-title').value = p?.title || '';
  document.getElementById('f-phone').value = p?.phone || '';
  document.getElementById('f-email').value = p?.email || '';
  document.getElementById('f-tc').value = p?.tc || '';
  document.getElementById('f-dept').value = p?.department || DEPARTMENTS[0];
  document.getElementById('f-type').value = p?.type || 'worker';
  document.getElementById('f-start').value = p?.startDate || '';
  document.getElementById('f-address').value = p?.address || '';
  document.getElementById('f-education').value = p?.education || '';

  // Departman sorumlusu sadece kendi departmanını seçebilir
  const deptSel = document.getElementById('f-dept');
  if (isDepartmentRestricted()) {
    const myDept = getUserDepartment();
    deptSel.value = myDept;
    deptSel.disabled = true;
    deptSel.style.opacity = '0.5';
  } else {
    deptSel.disabled = false;
    deptSel.style.opacity = '1';
  }

  // Mesai profilini ayarla
  const profileId = p?.workProfile || getDefaultProfileForType(p?.type || 'worker');
  const profileSel = document.getElementById('f-profile');
  if (profileSel) {
    profileSel.value = profileId;
    updateProfileInfo();
  }

  // Sertifikaları doldur
  const tags = document.getElementById('cert-tags');
  if (tags) {
    tags.innerHTML = '';
    (p?.certificates || []).forEach(c => addCertTag(c));
  }

  updateTypeInfo();
  goToStep(1);
  document.getElementById('p-modal').classList.remove('hidden');
  setTimeout(() => document.getElementById('f-name').focus(), 100);
}

function closeModal() {
  document.getElementById('p-modal').classList.add('hidden');
  editingId = null;
  wizardStep = 1;
}

function savePerson() {
  const nameRaw = document.getElementById('f-name').value.trim();
  const title = document.getElementById('f-title').value.trim();
  const phone = document.getElementById('f-phone').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const tc = document.getElementById('f-tc').value.trim();
  const department = document.getElementById('f-dept').value;
  const type = document.getElementById('f-type').value;
  const startDate = document.getElementById('f-start').value;
  const address = document.getElementById('f-address').value.trim();
  const education = document.getElementById('f-education').value;
  const certificates = getCollectedCerts();
  const workProfile = document.getElementById('f-profile')?.value || getDefaultProfileForType(type);

  // Departman sorumlusu sadece kendi departmanına personel ekleyebilir
  if (isDepartmentRestricted()) {
    const myDept = getUserDepartment();
    if (editingId) {
      const existing = getPersonnel().find(x => x.id === editingId);
      if (existing && !canAccessDepartment(existing.department)) { showToast('Bu departmana erişim yetkiniz yok', 'error'); return; }
    }
    if (department !== myDept) { showToast(`Sadece ${myDept} departmanına personel ekleyebilirsiniz`, 'error'); return; }
  }

  if (!nameRaw) { showToast('Ad Soyad zorunludur', 'error'); return; }
  if (!title) { showToast('Görev/Unvan zorunludur', 'error'); return; }
  if (!phone) { showToast('İletişim numarası zorunludur', 'error'); return; }
  if (tc && tc.length !== 11) { showToast('TC Kimlik No 11 haneli olmalıdır', 'error'); return; }

  const parts = nameRaw.split(/\s+/);
  const name = parts[0];
  const surname = parts.length > 1 ? parts.slice(1).join(' ') : '';

  const data = { name, surname, title, phone, email, tc, department, type, startDate, address, education, certificates, workProfile };
  if (currentPhotoData) data.photo = currentPhotoData;

  if (editingId) {
    updatePersonnel(editingId, data);
    showToast(`${name} ${surname} güncellendi`, 'success');
  } else {
    addPersonnel(data);
    showToast(`${name} ${surname} eklendi`, 'success');
  }

  closeModal();
  navigate('personnel');
}

