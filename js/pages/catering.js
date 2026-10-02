// ===== YEMEKHANE & SERVİS YÖNETİMİ =====

import { getPersonnel, getCurrentUser, hasPermission } from '../state.js';
import { showToast, addNotification } from '../notifications.js';

const CATERING_KEY = 'hospital_catering';

function loadData() {
  try { return JSON.parse(localStorage.getItem(CATERING_KEY)) || getDefaultData(); } catch { return getDefaultData(); }
}
function saveData(d) { localStorage.setItem(CATERING_KEY, JSON.stringify(d)); }

function getDefaultData() {
  return {
    menus: [
      { day: 'Pazartesi', lunch: 'Mercimek Çorba, Tavuk Sote, Pilav, Salata', dinner: 'Ezogelin Çorba, Köfte, Makarna' },
      { day: 'Salı', lunch: 'Ezogelin Çorba, Karnıyarık, Bulgur Pilavı, Salata', dinner: 'Mercimek Çorba, Tavuk Döner, Pirinç Pilavı' },
      { day: 'Çarşamba', lunch: 'Tarhana Çorba, Etli Nohut, Pilav, Yoğurt', dinner: 'Domates Çorba, Balık, Salata' },
      { day: 'Perşembe', lunch: 'Mercimek Çorba, Mantı, Cacık', dinner: 'Sebze Çorba, Izgara Tavuk, Salata' },
      { day: 'Cuma', lunch: 'İşkembe Çorba, Kuzu Tandır, Pilav, Salata', dinner: 'Mercimek Çorba, Lahmacun, Ayran' },
      { day: 'Cumartesi', lunch: 'Domates Çorba, Sebzeli Tavuk, Makarna', dinner: 'Mercimek Çorba, Pizza, Salata' },
      { day: 'Pazar', lunch: 'Tarhana Çorba, Etli Patates, Pilav', dinner: 'Mercimek Çorba, Çılbır, Salata' },
    ],
    preferences: {},
    specialMenus: [],
  };
}

export function renderCateringPage(el) {
  const data = loadData();
  const today = new Date();
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const todayDay = dayNames[today.getDay()];
  const todayMenu = data.menus.find(m => m.day === todayDay) || data.menus[0];

  // Nöbetçi personel sayısı (yemek planlaması için)
  const personnel = getPersonnel().filter(p => p.status === 'active');
  const workers = personnel.filter(p => p.type === 'worker' && p.department === 'Mutfak');

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🍽️ Yemekhane & Servis Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Haftalık menü, servis saatleri ve planlama</p>
        </div>
        <button id="edit-menu-btn" class="btn-secondary text-xs">✏️ Menü Düzenle</button>
      </div>
    </div>

    <!-- Bugünkü Menü -->
    <div class="card mb-6 fade-in border-cyan-500/20">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">🍽️</span>
        <div>
          <h3 class="text-lg font-semibold text-white">Bugünün Menüsü</h3>
          <p class="text-xs text-cyan-400">${todayDay}</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
          <p class="text-sm font-medium text-amber-300 mb-2">☀️ Öğle Yemeği</p>
          <p class="text-sm text-white">${todayMenu.lunch}</p>
          <p class="text-xs text-slate-500 mt-2">🕐 12:00 - 13:30</p>
        </div>
        <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
          <p class="text-sm font-medium text-purple-300 mb-2">🌙 Akşam Yemeği</p>
          <p class="text-sm text-white">${todayMenu.dinner}</p>
          <p class="text-xs text-slate-500 mt-2">🕐 18:00 - 19:30</p>
        </div>
      </div>
    </div>

    <!-- Servis Bilgileri -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 fade-in">
      <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-green-300">${workers.length}</p>
        <p class="text-xs text-green-400">Mutfak Personeli</p>
      </div>
      <div class="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-blue-300">${personnel.length}</p>
        <p class="text-xs text-blue-400">Toplam Personel</p>
      </div>
      <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-amber-300">2</p>
        <p class="text-xs text-amber-400">Öğün / Gün</p>
      </div>
      <div class="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4 text-center">
        <p class="text-2xl font-bold text-purple-300">7</p>
        <p class="text-xs text-purple-400">Günlük Menü</p>
      </div>
    </div>

    <!-- Haftalık Menü -->
    <div class="card mb-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Haftalık Menü</h3>
      <div class="space-y-2">
        ${data.menus.map(m => `
          <div class="rounded-xl bg-white/5 border border-white/5 p-4 ${m.day === todayDay ? 'border-cyan-500/30 bg-cyan-500/5' : ''}">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-lg">${m.day === todayDay ? '📍' : '📅'}</span>
              <span class="text-sm font-medium ${m.day === todayDay ? 'text-cyan-400' : 'text-white'}">${m.day} ${m.day === todayDay ? '(Bugün)' : ''}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 ml-8">
              <div>
                <p class="text-[10px] text-amber-400 uppercase tracking-wider">Öğle</p>
                <p class="text-xs text-slate-300">${m.lunch}</p>
              </div>
              <div>
                <p class="text-[10px] text-purple-400 uppercase tracking-wider">Akşam</p>
                <p class="text-xs text-slate-300">${m.dinner}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Servis Saatleri -->
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">🕐 Servis Saatleri</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-xl bg-white/5 p-4">
          <p class="text-sm font-medium text-white mb-2">Öğle Yemeği</p>
          <div class="space-y-1.5 text-xs text-slate-400">
            <div class="flex justify-between"><span>Nöbetçi Personel</span><span class="text-white">11:30 - 12:00</span></div>
            <div class="flex justify-between"><span>Doktor & Hemşire</span><span class="text-white">12:00 - 12:45</span></div>
            <div class="flex justify-between"><span>İdari Personel</span><span class="text-white">12:45 - 13:30</span></div>
          </div>
        </div>
        <div class="rounded-xl bg-white/5 p-4">
          <p class="text-sm font-medium text-white mb-2">Akşam Yemeği</p>
          <div class="space-y-1.5 text-xs text-slate-400">
            <div class="flex justify-between"><span>Gece Vardiyası</span><span class="text-white">17:30 - 18:00</span></div>
            <div class="flex justify-between"><span>Tüm Personel</span><span class="text-white">18:00 - 19:30</span></div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('edit-menu-btn')?.addEventListener('click', () => openMenuForm(el, data));
}

function openMenuForm(el, data) {
  const dialog = document.createElement('dialog');
  dialog.className = 'fixed inset-0 z-50 m-auto w-[min(92vw,520px)] rounded-2xl border border-white/10 bg-slate-900 p-0 text-slate-100 shadow-2xl';
  dialog.innerHTML = `<form method="dialog" class="p-6"><h2 class="text-lg font-bold text-white">Haftalık Menü Düzenle</h2><div class="space-y-3 mt-4"><label class="label">Gün<select id="menu-day" class="input-field w-full">${data.menus.map(m => `<option value="${m.day}">${m.day}</option>`).join('')}</select></label><label class="label">Öğle yemeği<textarea id="menu-lunch" class="input-field w-full" rows="2"></textarea></label><label class="label">Akşam yemeği<textarea id="menu-dinner" class="input-field w-full" rows="2"></textarea></label></div><div class="flex gap-2 mt-5"><button value="cancel" class="btn-secondary flex-1">İptal</button><button id="menu-save" class="btn-primary flex-1">Menüyü Kaydet</button></div></form>`;
  document.body.append(dialog); dialog.showModal();
  const fill = () => { const item = data.menus.find(m => m.day === dialog.querySelector('#menu-day').value); dialog.querySelector('#menu-lunch').value = item?.lunch || ''; dialog.querySelector('#menu-dinner').value = item?.dinner || ''; };
  dialog.querySelector('#menu-day').addEventListener('change', fill); fill();
  dialog.querySelector('#menu-save').addEventListener('click', event => {
    const item = data.menus.find(m => m.day === dialog.querySelector('#menu-day').value); if (!item) return;
    item.lunch = dialog.querySelector('#menu-lunch').value.trim(); item.dinner = dialog.querySelector('#menu-dinner').value.trim(); saveData(data);
    event.preventDefault(); dialog.close(); dialog.remove(); showToast('Menü kaydedildi', 'success'); renderCateringPage(el);
  });
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
}
