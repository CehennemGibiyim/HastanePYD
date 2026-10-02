// ===== FORM BUILDER — Dynamic Form Creator =====
import { getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

const save = (key, data) => localStorage.setItem('hospital_' + key, JSON.stringify(data));
const load = (key) => { try { return JSON.parse(localStorage.getItem('hospital_' + key)); } catch { return null; } };

const FIELD_TYPES = [
  { type: 'text', label: 'Metin', icon: '📝' },
  { type: 'textarea', label: 'Uzun Metin', icon: '📄' },
  { type: 'number', label: 'Sayı', icon: '🔢' },
  { type: 'select', label: 'Seçim Listesi', icon: '📋' },
  { type: 'radio', label: 'Tek Seçim', icon: '🔘' },
  { type: 'checkbox', label: 'Çoklu Seçim', icon: '☑️' },
  { type: 'date', label: 'Tarih', icon: '📅' },
  { type: 'email', label: 'E-posta', icon: '📧' },
  { type: 'phone', label: 'Telefon', icon: '📱' },
];

const TEMPLATES = [
  { name: 'İzin Talep Formu', icon: '🏖️', fields: [
    { type: 'text', label: 'Ad Soyad', required: true },
    { type: 'select', label: 'Departman', required: true, options: 'Dahiliye,Cerrahi,Acil Servis,Hemşirelik,İdari' },
    { type: 'date', label: 'Başlangıç Tarihi', required: true },
    { type: 'date', label: 'Bitiş Tarihi', required: true },
    { type: 'select', label: 'İzin Türü', required: true, options: 'Yıllık,Hastalık,Mazeret,Ücretsiz' },
    { type: 'textarea', label: 'Açıklama', required: false },
  ]},
  { name: 'Performans Değerlendirme', icon: '⭐', fields: [
    { type: 'text', label: 'Değerlendiren', required: true },
    { type: 'text', label: 'Değerlendirilen', required: true },
    { type: 'radio', label: 'İş Kalitesi', required: true, options: '1,2,3,4,5' },
    { type: 'radio', label: 'İletişim', required: true, options: '1,2,3,4,5' },
    { type: 'radio', label: 'Takım Çalışması', required: true, options: '1,2,3,4,5' },
    { type: 'textarea', label: 'Yorumlar', required: false },
  ]},
  { name: 'Eğitim Kayıt Formu', icon: '📚', fields: [
    { type: 'text', label: 'Ad Soyad', required: true },
    { type: 'email', label: 'E-posta', required: true },
    { type: 'phone', label: 'Telefon', required: false },
    { type: 'select', label: 'Eğitim Seviyesi', required: true, options: 'Lise,MYO,Lisans,Yüksek Lisans' },
    { type: 'checkbox', label: 'İlgili Alanlar', required: false, options: 'İlk Yardım,Hijyen,Güvenlik,Yönetim' },
  ]},
];

let currentForm = null;
let editingFieldIdx = null;

export function renderFormBuilderPage(el) {
  const forms = load('customForms') || [];
  const responses = load('formResponses') || [];

  if (currentForm) {
    renderFormEditor(el);
    return;
  }

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">📋 Form Oluşturucu</h1>
          <p class="text-slate-400 text-sm mt-1">Dinamik formlar oluşturun ve yanıt toplayın</p>
        </div>
        <button id="new-form-btn" class="btn-primary text-sm">+ Yeni Form</button>
      </div>
    </div>

    <!-- Templates -->
    <div class="card mb-6 fade-in">
      <h3 class="text-base font-semibold text-white mb-3">📦 Hazır Şablonlar</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${TEMPLATES.map((t, i) => `
          <button data-template="${i}" class="rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 p-4 text-left transition">
            <span class="text-2xl">${t.icon}</span>
            <p class="text-sm font-medium text-white mt-2">${t.name}</p>
            <p class="text-xs text-slate-500 mt-1">${t.fields.length} alan</p>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Existing Forms -->
    <div class="card fade-in">
      <h3 class="text-base font-semibold text-white mb-3">📝 Oluşturulan Formlar (${forms.length})</h3>
      ${forms.length ? `<div class="space-y-3">${forms.map(f => {
        const formResponses = responses.filter(r => r.formId === f.id);
        return `<div class="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 p-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📋</span>
            <div>
              <p class="text-sm font-medium text-white">${f.name}</p>
              <p class="text-xs text-slate-500">${f.fields.length} alan · ${formResponses.length} yanıt · ${new Date(f.createdAt).toLocaleDateString('tr-TR')}</p>
            </div>
          </div>
          <div class="flex gap-2">
            <button data-share-form="${f.id}" class="btn-secondary text-xs px-3 py-1.5">🔗 Paylaş</button>
            <button data-view-responses="${f.id}" class="btn-secondary text-xs px-3 py-1.5">📊 Yanıtlar</button>
            <button data-edit-form="${f.id}" class="btn-secondary text-xs px-3 py-1.5">✏️</button>
            <button data-delete-form="${f.id}" class="btn-secondary text-xs px-3 py-1.5 text-red-400 hover:text-red-300">🗑️</button>
          </div>
        </div>`;
      }).join('')}</div>` : '<div class="empty-state"><div class="icon">📋</div><div class="title">Henüz form oluşturulmadı</div><div class="desc">Yukarıdaki şablonlardan birini seçin veya yeni form oluşturun</div></div>'}
    </div>`;

  // Handlers
  document.getElementById('new-form-btn').onclick = () => { currentForm = { name: '', fields: [] }; renderFormBuilderPage(el); };
  document.querySelectorAll('[data-template]').forEach(btn => {
    btn.onclick = () => {
      const tpl = TEMPLATES[parseInt(btn.dataset.template)];
      currentForm = { name: tpl.name, fields: tpl.fields.map(f => ({ ...f, id: Date.now() + Math.random() })) };
      renderFormBuilderPage(el);
    };
  });
  document.querySelectorAll('[data-edit-form]').forEach(btn => {
    btn.onclick = () => {
      const f = forms.find(x => x.id === parseInt(btn.dataset.editForm));
      if (f) { currentForm = { ...f }; renderFormBuilderPage(el); }
    };
  });
  document.querySelectorAll('[data-delete-form]').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Formu silmek istediğinize emin misiniz?')) {
        const id = parseInt(btn.dataset.deleteForm);
        save('customForms', forms.filter(f => f.id !== id));
        showToast('Form silindi', 'success');
        renderFormBuilderPage(el);
      }
    };
  });
  document.querySelectorAll('[data-view-responses]').forEach(btn => {
    btn.onclick = () => renderResponses(el, parseInt(btn.dataset.viewResponses));
  });
  document.querySelectorAll('[data-share-form]').forEach(btn => {
    btn.onclick = () => renderFormPreview(el, parseInt(btn.dataset.shareForm));
  });
}

function renderFormEditor(el) {
  const user = getCurrentUser();
  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex items-center gap-3 mb-4">
        <button id="back-forms" class="btn-secondary text-sm">← Geri</button>
        <h1 class="text-xl font-bold text-white">✏️ Form Düzenle</h1>
      </div>
      <div class="card mb-4">
        <label class="label">Form Adı</label>
        <input id="form-name" class="input-field w-full" value="${currentForm.name || ''}" placeholder="Form adını girin">
      </div>
      <div class="card mb-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-base font-semibold text-white">📝 Form Alanları (${currentForm.fields.length})</h3>
          <button id="add-field-btn" class="btn-primary text-xs">+ Alan Ekle</button>
        </div>
        <div id="fields-list" class="space-y-2">
          ${currentForm.fields.map((f, i) => renderFieldCard(f, i)).join('')}
          ${!currentForm.fields.length ? '<p class="text-sm text-slate-500 text-center py-4">Henüz alan eklenmedi</p>' : ''}
        </div>
      </div>
      <div class="flex gap-3">
        <button id="save-form" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="preview-form" class="btn-secondary flex-1">👁️ Önizle</button>
      </div>
    </div>`;

  document.getElementById('back-forms').onclick = () => { currentForm = null; renderFormBuilderPage(el); };
  document.getElementById('form-name').oninput = (e) => { currentForm.name = e.target.value; };
  document.getElementById('add-field-btn').onclick = () => showAddFieldModal(el);
  document.getElementById('save-form').onclick = () => {
    if (!currentForm.name.trim()) { showToast('Form adı gereklidir', 'error'); return; }
    const forms = load('customForms') || [];
    if (currentForm.id) {
      const idx = forms.findIndex(f => f.id === currentForm.id);
      if (idx >= 0) forms[idx] = { ...currentForm, updatedAt: new Date().toISOString() };
    } else {
      currentForm.id = Date.now();
      currentForm.createdAt = new Date().toISOString();
      currentForm.createdBy = user?.name || 'Sistem';
      forms.push(currentForm);
    }
    save('customForms', forms);
    showToast('Form kaydedildi', 'success');
    currentForm = null;
    renderFormBuilderPage(el);
  };
  document.getElementById('preview-form').onclick = () => renderFormPreview(el, currentForm.id || 'preview');

  // Field edit/delete handlers
  document.querySelectorAll('[data-edit-field]').forEach(btn => {
    btn.onclick = () => { editingFieldIdx = parseInt(btn.dataset.editField); showAddFieldModal(el); };
  });
  document.querySelectorAll('[data-delete-field]').forEach(btn => {
    btn.onclick = () => {
      currentForm.fields.splice(parseInt(btn.dataset.deleteField), 1);
      renderFormEditor(el);
    };
  });
  document.querySelectorAll('[data-move-up]').forEach(btn => {
    btn.onclick = () => {
      const i = parseInt(btn.dataset.moveUp);
      if (i > 0) { [currentForm.fields[i], currentForm.fields[i-1]] = [currentForm.fields[i-1], currentForm.fields[i]]; renderFormEditor(el); }
    };
  });
  document.querySelectorAll('[data-move-down]').forEach(btn => {
    btn.onclick = () => {
      const i = parseInt(btn.dataset.moveDown);
      if (i < currentForm.fields.length - 1) { [currentForm.fields[i], currentForm.fields[i+1]] = [currentForm.fields[i+1], currentForm.fields[i]]; renderFormEditor(el); }
    };
  });
}

function renderFieldCard(f, i) {
  const typeInfo = FIELD_TYPES.find(t => t.type === f.type) || { icon: '📝', label: 'Metin' };
  return `<div class="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3">
    <span class="text-lg">${typeInfo.icon}</span>
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-white">${f.label} ${f.required ? '<span class="text-red-400">*</span>' : ''}</p>
      <p class="text-xs text-slate-500">${typeInfo.label}${f.options ? ' · ' + f.options.split(',').length + ' seçenek' : ''}</p>
    </div>
    <div class="flex gap-1">
      <button data-move-up="${i}" class="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 text-xs" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button data-move-down="${i}" class="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-slate-500 text-xs">↓</button>
      <button data-edit-field="${i}" class="w-7 h-7 rounded hover:bg-white/10 flex items-center justify-center text-slate-400 text-xs">✏️</button>
      <button data-delete-field="${i}" class="w-7 h-7 rounded hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400 text-xs">🗑️</button>
    </div>
  </div>`;
}

function showAddFieldModal(el) {
  const existing = editingFieldIdx !== null ? currentForm.fields[editingFieldIdx] : null;
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  modal.innerHTML = `
    <div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
      <h3 class="text-lg font-bold text-white mb-4">${existing ? '✏️ Alan Düzenle' : '+ Yeni Alan'}</h3>
      <div class="space-y-3">
        <div><label class="label">Alan Tipi</label>
          <select id="field-type" class="input-field w-full">
            ${FIELD_TYPES.map(t => `<option value="${t.type}" ${existing?.type === t.type ? 'selected' : ''}>${t.icon} ${t.label}</option>`).join('')}
          </select>
        </div>
        <div><label class="label">Etiket</label>
          <input id="field-label" class="input-field w-full" value="${existing?.label || ''}" placeholder="Alan etiketi">
        </div>
        <div><label class="label">Seçenekler (virgülle ayırın)</label>
          <input id="field-options" class="input-field w-full" value="${existing?.options || ''}" placeholder="Seçenek1,Seçenek2,Seçenek3">
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="field-required" class="w-4 h-4" ${existing?.required ? 'checked' : ''}>
          <label for="field-required" class="text-sm text-slate-300">Zorunlu alan</label>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button id="field-save" class="btn-primary flex-1">💾 Kaydet</button>
        <button id="field-cancel" class="btn-secondary flex-1">İptal</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById('field-cancel').onclick = () => { modal.remove(); editingFieldIdx = null; };
  modal.onclick = (e) => { if (e.target === modal) { modal.remove(); editingFieldIdx = null; } };
  document.getElementById('field-save').onclick = () => {
    const field = {
      type: document.getElementById('field-type').value,
      label: document.getElementById('field-label').value.trim(),
      options: document.getElementById('field-options').value.trim(),
      required: document.getElementById('field-required').checked,
    };
    if (!field.label) { showToast('Etiket gereklidir', 'error'); return; }
    if (editingFieldIdx !== null) {
      currentForm.fields[editingFieldIdx] = { ...currentForm.fields[editingFieldIdx], ...field };
    } else {
      field.id = Date.now();
      currentForm.fields.push(field);
    }
    modal.remove(); editingFieldIdx = null;
    renderFormEditor(el);
  };
}

function renderFormPreview(el, formId) {
  const forms = load('customForms') || [];
  const form = formId === 'preview' ? currentForm : forms.find(f => f.id === formId);
  if (!form) return;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex items-center gap-3 mb-4">
        <button id="back-forms" class="btn-secondary text-sm">← Geri</button>
        <h1 class="text-xl font-bold text-white">📋 ${form.name}</h1>
      </div>
      <div class="card max-w-xl mx-auto">
        <form id="form-fill" class="space-y-4">
          ${form.fields.map(f => {
            const req = f.required ? 'required' : '';
            let input = '';
            if (f.type === 'textarea') input = `<textarea id="ff-${f.id}" class="input-field w-full" rows="3" placeholder="${f.label}" ${req}></textarea>`;
            else if (f.type === 'select') input = `<select id="ff-${f.id}" class="input-field w-full" ${req}><option value="">Seçiniz...</option>${(f.options || '').split(',').map(o => `<option>${o.trim()}</option>`).join('')}</select>`;
            else if (f.type === 'radio') input = `<div class="flex flex-wrap gap-2">${(f.options || '').split(',').map(o => `<label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="ff-${f.id}" value="${o.trim()}" class="w-4 h-4"><span class="text-sm text-slate-300">${o.trim()}</span></label>`).join('')}</div>`;
            else if (f.type === 'checkbox') input = `<div class="flex flex-wrap gap-2">${(f.options || '').split(',').map(o => `<label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="ff-${f.id}" value="${o.trim()}" class="w-4 h-4"><span class="text-sm text-slate-300">${o.trim()}</span></label>`).join('')}</div>`;
            else input = `<input type="${f.type === 'phone' ? 'tel' : f.type}" id="ff-${f.id}" class="input-field w-full" placeholder="${f.label}" ${req}>`;
            return `<div><label class="label">${f.label} ${f.required ? '<span class="text-red-400">*</span>' : ''}</label>${input}</div>`;
          }).join('')}
          <button type="submit" class="btn-primary w-full">📤 Gönder</button>
        </form>
      </div>
    </div>`;

  document.getElementById('back-forms').onclick = () => { currentForm = null; renderFormBuilderPage(el); };
  document.getElementById('form-fill').onsubmit = (e) => {
    e.preventDefault();
    const responses = load('formResponses') || [];
    const response = { formId: form.id, id: Date.now(), createdAt: new Date().toISOString(), answers: {} };
    form.fields.forEach(f => {
      const input = document.getElementById('ff-' + f.id);
      if (f.type === 'radio') {
        const checked = document.querySelector(`input[name="ff-${f.id}"]:checked`);
        response.answers[f.label] = checked ? checked.value : '';
      } else if (f.type === 'checkbox') {
        const checked = document.querySelectorAll(`input[name="ff-${f.id}"]:checked`);
        response.answers[f.label] = Array.from(checked).map(c => c.value).join(', ');
      } else {
        response.answers[f.label] = input ? input.value : '';
      }
    });
    responses.push(response);
    save('formResponses', responses);
    showToast('Yanıt kaydedildi!', 'success');
    currentForm = null;
    renderFormBuilderPage(el);
  };
}

function renderResponses(el, formId) {
  const forms = load('customForms') || [];
  const form = forms.find(f => f.id === formId);
  const responses = (load('formResponses') || []).filter(r => r.formId === formId);
  if (!form) return;

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex items-center gap-3 mb-4">
        <button id="back-forms" class="btn-secondary text-sm">← Geri</button>
        <h1 class="text-xl font-bold text-white">📊 ${form.name} — Yanıtlar (${responses.length})</h1>
      </div>
      ${responses.length ? `<div class="card overflow-x-auto">
        <table class="w-full">
          <thead><tr>
            <th class="th">#</th>
            <th class="th">Tarih</th>
            ${form.fields.map(f => `<th class="th">${f.label}</th>`).join('')}
          </tr></thead>
          <tbody>
            ${responses.map((r, i) => `<tr>
              <td class="td">${i + 1}</td>
              <td class="td text-xs">${new Date(r.createdAt).toLocaleDateString('tr-TR')}</td>
              ${form.fields.map(f => `<td class="td text-sm">${r.answers[f.label] || '-'}</td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div class="empty-state"><div class="icon">📊</div><div class="title">Henüz yanıt yok</div></div>'}
    </div>`;

  document.getElementById('back-forms').onclick = () => { currentForm = null; renderFormBuilderPage(el); };
}
