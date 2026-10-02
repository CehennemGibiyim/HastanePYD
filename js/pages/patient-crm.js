// ===== HASTA CRM VE TEMAS YÖNETİMİ =====
import { readPlatform, writePlatform, uid, today, esc } from '../services/platform-storage.js';
import { showToast } from '../notifications.js';

const t = (key, values) => window.miniappI18n?.t(key, values) ?? key;
const KEY = 'patient_crm_records';
const SEED = [
  { id: 'crm_1', patient: 'Ayşe Korkmaz', channel: 'phone', status: 'followup', nextAction: 'Taburculuk sonrası arama', owner: 'Hasta İletişim Birimi', due: today(), consent: true, sentiment: 'positive', lastContact: '2026-01-11', note: 'İlaç kullanımını ve kontrol randevusunu teyit et.' },
  { id: 'crm_2', patient: 'Murat Özkan', channel: 'sms', status: 'waiting', nextAction: 'Kontrol randevusu hatırlatması', owner: 'Dahiliye', due: '2026-01-15', consent: true, sentiment: 'neutral', lastContact: '2026-01-10', note: 'Randevu bağlantısı gönderilecek.' },
  { id: 'crm_3', patient: 'Zeynep Kara', channel: 'complaint', status: 'escalated', nextAction: 'Geri bildirim incelemesi', owner: 'Hasta Hakları', due: '2026-01-14', consent: false, sentiment: 'negative', lastContact: '2026-01-09', note: 'Birim yöneticisi değerlendirmesi bekleniyor.' },
  { id: 'crm_4', patient: 'Elif Şahin', channel: 'portal', status: 'done', nextAction: 'Memnuniyet anketi', owner: 'Yoğun Bakım', due: '2026-01-08', consent: true, sentiment: 'positive', lastContact: '2026-01-08', note: 'Anket yanıtı alındı.' },
];

export async function renderPatientCRMPage(container) {
  container.innerHTML = `<div class="card loading-pulse text-slate-400">${t('crm.loading')}</div>`;
  const stored = await readPlatform(KEY, SEED);
  let records = Array.isArray(stored) ? stored : SEED.map(item => ({ ...item }));
  let filter = 'all';

  const render = () => {
    const todayItems = records.filter(item => item.due <= today() && item.status !== 'done');
    const openComplaints = records.filter(item => item.channel === 'complaint' && item.status !== 'done').length;
    const visible = filter === 'all' ? records : records.filter(item => item.status === filter);
    container.innerHTML = `<div class="fade-in space-y-5 crm-page">
      <header class="flex flex-wrap items-start justify-between gap-4"><div><p class="section-kicker">${t('crm.eyebrow')}</p><h1 class="text-2xl font-bold text-white">${t('crm.title')}</h1><p class="text-slate-400 text-sm mt-1 max-w-3xl">${t('crm.subtitle')}</p></div><button id="crm-new" class="btn-primary">${t('crm.new_contact')}</button></header>
      <section class="grid grid-cols-2 lg:grid-cols-4 gap-3"><div class="card market-stat"><span class="market-stat-label">${t('crm.active_cases')}</span><strong>${records.filter(item => item.status !== 'done').length}</strong><span>${t('crm.active_cases_note')}</span></div><div class="card market-stat"><span class="market-stat-label">${t('crm.due_today')}</span><strong class="text-amber-300">${todayItems.length}</strong><span>${t('crm.due_today_note')}</span></div><div class="card market-stat"><span class="market-stat-label">${t('crm.open_complaints')}</span><strong class="text-red-300">${openComplaints}</strong><span>${t('crm.open_complaints_note')}</span></div><div class="card market-stat"><span class="market-stat-label">${t('crm.consent_coverage')}</span><strong class="text-cyan-300">${records.length ? Math.round(records.filter(item => item.consent).length / records.length * 100) : 0}%</strong><span>${t('crm.consent_note')}</span></div></section>
      <section class="card crm-callout"><div><p class="section-kicker">${t('crm.next_best_action')}</p><h2 class="text-lg font-semibold text-white">${todayItems[0] ? esc(todayItems[0].nextAction) : t('crm.no_urgent')}</h2><p class="text-xs text-slate-400 mt-1">${todayItems[0] ? `${esc(todayItems[0].patient)} · ${esc(todayItems[0].owner)}` : t('crm.no_urgent_desc')}</p></div><span class="status-pill status-watch">${todayItems.length} ${t('crm.queue')}</span></section>
      <section><div class="flex flex-wrap gap-2 mb-3" role="tablist" aria-label="${t('crm.filter_label')}">${['all','followup','waiting','escalated','done'].map(key => `<button class="market-filter ${filter === key ? 'active' : ''}" data-filter="${key}" role="tab" aria-selected="${filter === key}">${t(`crm.filter_${key}`)} <span>${key === 'all' ? records.length : records.filter(item => item.status === key).length}</span></button>`).join('')}</div><div class="grid lg:grid-cols-2 gap-3">${visible.length ? visible.map(card).join('') : `<div class="card empty-state lg:col-span-2"><div class="icon">+</div><div class="title">${t('crm.empty_title')}</div><p>${t('crm.empty_desc')}</p></div>`}</div></section>
      <p class="text-xs text-slate-500">${t('crm.privacy_note')}</p>
    </div>`;
    wire();
  };

  const persist = async () => { try { await writePlatform(KEY, records); } catch { showToast(t('crm.save_error'), 'error'); } };
  const advance = async (id) => { const item = records.find(record => record.id === id); if (!item) return; item.status = item.status === 'done' ? 'followup' : 'done'; item.lastContact = today(); await persist(); showToast(t(item.status === 'done' ? 'crm.marked_done' : 'crm.reopened'), 'success'); render(); };
  const wire = () => {
    container.querySelectorAll('[data-filter]').forEach(button => button.onclick = () => { filter = button.dataset.filter; render(); });
    container.querySelectorAll('[data-complete]').forEach(button => button.onclick = () => advance(button.dataset.complete));
    container.querySelector('#crm-new').onclick = () => openContactModal();
  };
  const openContactModal = () => {
    const modal = document.createElement('div'); modal.className = 'fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
    modal.innerHTML = `<form class="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in"><h2 class="text-xl font-bold text-white">${t('crm.modal_title')}</h2><p class="text-sm text-slate-400 mt-1">${t('crm.modal_desc')}</p><div class="grid sm:grid-cols-2 gap-3 mt-5"><label class="label">${t('crm.patient_name')}<input name="patient" class="input-field w-full mt-1" required></label><label class="label">${t('crm.owner')}<input name="owner" class="input-field w-full mt-1" required></label><label class="label">${t('crm.next_action')}<input name="nextAction" class="input-field w-full mt-1" required></label><label class="label">${t('crm.due_date')}<input name="due" type="date" class="input-field w-full mt-1" value="${today()}" required></label><label class="label">${t('crm.channel')}<select name="channel" class="input-field w-full mt-1"><option value="phone">${t('crm.channel_phone')}</option><option value="sms">${t('crm.channel_sms')}</option><option value="portal">${t('crm.channel_portal')}</option><option value="complaint">${t('crm.channel_complaint')}</option></select></label><label class="label">${t('crm.consent')}<select name="consent" class="input-field w-full mt-1"><option value="yes">${t('crm.consent_yes')}</option><option value="no">${t('crm.consent_no')}</option></select></label></div><label class="label block mt-3">${t('crm.note')}<textarea name="note" class="input-field w-full mt-1" rows="3"></textarea></label><div class="flex gap-3 mt-5"><button class="btn-primary flex-1" type="submit">${t('crm.save')}</button><button class="btn-secondary flex-1" type="button">${t('crm.cancel')}</button></div></form>`;
    document.body.appendChild(modal); modal.querySelector('button[type="button"]').onclick = () => modal.remove(); modal.onclick = event => { if (event.target === modal) modal.remove(); };
    modal.querySelector('form').onsubmit = async event => { event.preventDefault(); const form = new FormData(event.currentTarget); records.unshift({ id: uid('crm'), patient: String(form.get('patient')).trim(), owner: String(form.get('owner')).trim(), nextAction: String(form.get('nextAction')).trim(), due: String(form.get('due')), channel: String(form.get('channel')), consent: form.get('consent') === 'yes', sentiment: 'neutral', lastContact: today(), note: String(form.get('note') || '').trim(), status: 'waiting' }); await persist(); modal.remove(); showToast(t('crm.saved'), 'success'); render(); };
  };
  render();
}

function card(item) {
  const due = item.due <= today() && item.status !== 'done';
  return `<article class="card crm-card ${due ? 'border-amber-400/30' : ''}"><div class="flex items-start justify-between gap-3"><div><p class="text-base font-semibold text-white">${esc(item.patient)}</p><p class="text-xs text-slate-400 mt-1">${esc(item.owner)} · ${t(`crm.channel_${item.channel}`)}</p></div><span class="market-status status-${item.status === 'done' ? 'ready' : item.status === 'escalated' ? 'missing' : 'partial'}">${t(`crm.status_${item.status}`)}</span></div><p class="text-sm text-slate-200 mt-4">${esc(item.nextAction)}</p><p class="text-xs text-slate-400 mt-2">${t('crm.due_date')}: <strong class="${due ? 'text-amber-300' : 'text-slate-300'}">${esc(item.due)}</strong> · ${t('crm.last_contact')}: ${esc(item.lastContact)}</p><p class="text-xs text-slate-500 mt-3">${esc(item.note || t('crm.no_note'))}</p><div class="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-white/5"><span class="text-xs ${item.consent ? 'text-emerald-300' : 'text-red-300'}">${item.consent ? t('crm.consent_yes') : t('crm.consent_no')}</span><button class="btn-secondary text-xs" data-complete="${esc(item.id)}">${item.status === 'done' ? t('crm.reopen') : t('crm.complete')}</button></div></article>`;
}
