// ===== SMS ENTEGRASYONU =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const SMS_TEMPLATES = [
  { id: 1, name: 'Nöbet Hatırlatma', body: 'Sayın {name}, yarınki nöbetiniz saat {time} başlayacaktır. Geçmiş olsun.', category: 'nöbet' },
  { id: 2, name: 'İzin Onayı', body: 'Sayın {name}, {start}-{end} tarihleri arasındaki izniniz onaylanmıştır.', category: 'izin' },
  { id: 3, name: 'Eğitim Daveti', body: 'Sayın {name}, {date} tarihinde "{training}" eğitimine davetlisiniz.', category: 'eğitim' },
  { id: 4, name: 'Doğum Günü', body: 'Sevgili {name}, doğum gününüz kutlu olsun! 🎂🎈', category: 'kutlama' },
  { id: 5, name: 'Performans Görüşmesi', body: 'Sayın {name}, {date} tarihinde performans görüşmeniz planlanmıştır.', category: 'performans' },
  { id: 6, name: 'Acil Durum Kodu', body: '⚠️ ACİL DURUM: {code} kodu aktif edilmiştir. Lütfen en yakın toplanma noktasına gidin.', category: 'acil' },
];

const SMS_HISTORY = [
  { id: 1, to: 'Dr. Ahmet Yılmaz', phone: '0555 123 4567', message: 'Nöbet hatırlatma mesajı gönderildi.', status: 'delivered', date: '2025-01-10 09:30', template: 'Nöbet Hatırlatma' },
  { id: 2, to: 'Hem. Fatma Demir', phone: '0555 234 5678', message: 'İzin onay mesajı gönderildi.', status: 'delivered', date: '2025-01-10 10:15', template: 'İzin Onayı' },
  { id: 3, to: 'Tüm Personel', phone: 'Toplu SMS', message: 'Eğitim daveti gönderildi.', status: 'pending', date: '2025-01-10 11:00', template: 'Eğitim Daveti' },
];

export function renderSMSPage(el) {
  const personnel = getPersonnel({});
  let activeTab = 'compose';

  function render() {
    el.innerHTML = `
      <div class="mb-6 fade-in">
        <h1 class="text-2xl font-bold text-white">📱 SMS Entegrasyonu</h1>
        <p class="text-slate-400 text-sm mt-1">Toplu SMS gönderimi, şablon yönetimi ve gönderim geçmişi</p>
      </div>

      <div class="flex gap-2 mb-6 flex-wrap fade-in">
        <button data-tab="compose" class="sms-tab ${activeTab === 'compose' ? 'tab-active' : 'tab-inactive'}">✉️ SMS Gönder</button>
        <button data-tab="templates" class="sms-tab ${activeTab === 'templates' ? 'tab-active' : 'tab-inactive'}">📋 Şablonlar</button>
        <button data-tab="history" class="sms-tab ${activeTab === 'history' ? 'tab-active' : 'tab-inactive'}">📜 Geçmiş</button>
      </div>

      <div id="sms-content" class="fade-in"></div>`;

    document.querySelectorAll('.sms-tab').forEach(btn => {
      btn.onclick = () => { activeTab = btn.dataset.tab; render(); };
    });

    const content = document.getElementById('sms-content');
    if (activeTab === 'compose') renderCompose(content);
    else if (activeTab === 'templates') renderTemplates(content);
    else renderHistory(content);
  }

  function renderCompose(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">✉️ Yeni SMS</h3>
          <div class="space-y-3">
            <div>
              <label class="label">Alıcı</label>
              <select id="sms-recipient" class="input-field w-full">
                <option value="">Alıcı seçin...</option>
                <option value="all">📢 Tüm Personel (${personnel.length})</option>
                ${personnel.map(p => `<option value="${p.id}">${p.name} - ${p.department}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">Şablon</label>
              <select id="sms-template" class="input-field w-full">
                <option value="">Şablon seçin (isteğe bağlı)...</option>
                ${SMS_TEMPLATES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="label">Mesaj</label>
              <textarea id="sms-body" class="input-field w-full" rows="5" placeholder="SMS metni..."></textarea>
              <p class="text-[10px] text-slate-500 mt-1"><span id="sms-char-count">0</span>/160 karakter</p>
            </div>
            <button id="sms-send-btn" class="btn-primary w-full">📤 SMS Gönder</button>
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">📋 Hızlı Şablonlar</h3>
          <div class="space-y-2">
            ${SMS_TEMPLATES.map(t => `
              <button data-apply-template="${t.id}" class="w-full text-left rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 px-4 py-3 transition">
                <p class="text-sm font-medium text-white">${t.name}</p>
                <p class="text-xs text-slate-400 mt-1 line-clamp-2">${t.body.substring(0, 80)}...</p>
                <span class="badge text-[10px] mt-1">${t.category}</span>
              </button>`).join('')}
          </div>
        </div>
      </div>`;

    document.getElementById('sms-body')?.addEventListener('input', (e) => {
      document.getElementById('sms-char-count').textContent = e.target.value.length;
    });

    document.getElementById('sms-template')?.addEventListener('change', (e) => {
      const t = SMS_TEMPLATES.find(x => x.id === parseInt(e.target.value));
      if (t) document.getElementById('sms-body').value = t.body;
    });

    document.querySelectorAll('[data-apply-template]').forEach(btn => {
      btn.onclick = () => {
        const t = SMS_TEMPLATES.find(x => x.id === parseInt(btn.dataset.applyTemplate));
        if (t) document.getElementById('sms-body').value = t.body;
      };
    });

    document.getElementById('sms-send-btn')?.addEventListener('click', () => {
      const recipient = document.getElementById('sms-recipient').value;
      const body = document.getElementById('sms-body').value.trim();
      if (!recipient) { showToast('Lütfen alıcı seçin', 'error'); return; }
      if (!body) { showToast('SMS metni boş olamaz', 'error'); return; }
      showToast('SMS başarıyla gönderildi (demo)', 'success');
    });
  }

  function renderTemplates(container) {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${SMS_TEMPLATES.map(t => `
          <div class="card">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-semibold text-white">${t.name}</h4>
              <span class="badge text-[10px]">${t.category}</span>
            </div>
            <p class="text-xs text-slate-300 whitespace-pre-wrap">${t.body}</p>
          </div>`).join('')}
      </div>`;
  }

  function renderHistory(container) {
    container.innerHTML = `
      <div class="card">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead><tr>
              <th class="th">Alıcı</th><th class="th">Şablon</th><th class="th">Durum</th><th class="th">Tarih</th>
            </tr></thead>
            <tbody>
              ${SMS_HISTORY.map(s => `
                <tr class="border-t border-white/5">
                  <td class="td"><p class="text-white text-sm">${s.to}</p><p class="text-[10px] text-slate-500">${s.phone}</p></td>
                  <td class="td"><span class="badge">${s.template}</span></td>
                  <td class="td"><span class="badge ${s.status === 'delivered' ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}">${s.status === 'delivered' ? '✓ İletildi' : '⏳ Bekliyor'}</span></td>
                  <td class="td text-xs">${s.date}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  render();
}
