// ===== YEMEKHANE & YÖNETİMİ =====
import { showToast } from '../notifications.js';

const STORAGE_KEY = 'hospital_menus';

function getMenus() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || getDefaultMenus(); } catch { return getDefaultMenus(); } }
function saveMenus(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

function getDefaultMenus() {
  const today = new Date();
  const menus = [];
  const mealOptions = [
    { soup: 'Mercimek Çorbası', main: 'Tavuk Sote + Pilav', salad: 'Mevsim Salatası', dessert: 'Sütlaç', cal: 680 },
    { soup: 'Ezogelin Çorbası', main: 'Kuru Fasulye + Pilav', salad: 'Çoban Salatası', dessert: 'Baklava', cal: 750 },
    { soup: 'Tarhana Çorbası', main: 'Balık Izgara + Makarna', salad: 'Yeşil Salata', dessert: 'Meyve', cal: 620 },
    { soup: 'Domates Çorbası', main: 'Köfte + Patates Püresi', salad: 'Turşu', dessert: 'Kazandibi', cal: 720 },
    { soup: 'İşkembe Çorbası', main: 'Tantuni + Bulgur', salad: 'Piyaz', dessert: 'Revani', cal: 780 },
    { soup: 'Yayla Çorbası', main: 'Mantı', salad: 'Sumaklı Soğan', dessert: 'Keşkül', cal: 700 },
    { soup: 'Tavuk Suyu Çorba', main: 'İskender', salad: 'Mevsim Salatası', dessert: 'Tulumba', cal: 800 },
  ];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const opt = mealOptions[i % mealOptions.length];
    menus.push({ date: d.toISOString().split('T')[0], ...opt, vegetarian: 'Sebze Güveç + Salata', rating: (3.5 + Math.random() * 1.5).toFixed(1), votes: Math.floor(50 + Math.random() * 100) });
  }
  return menus;
}

const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

export function renderMenuManagementPage(el) {
  const menus = getMenus();
  const today = new Date().toISOString().split('T')[0];
  const todayMenu = menus.find(m => m.date === today);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold text-white">🍽️ Yemekhane & Menü Yönetimi</h1>
          <p class="text-slate-400 text-sm mt-1">Haftalık menü planlama ve tüketim takibi</p>
        </div>
        <button id="edit-menu-btn" class="btn-secondary">✏️ Menü Düzenle</button>
      </div>
    </div>

    ${todayMenu ? `
    <div class="card mb-6 fade-in border-l-4 border-l-cyan-500">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-2xl">🍽️</span>
        <h3 class="text-lg font-semibold text-white">Bugünün Menüsü</h3>
        <span class="badge">${new Date(today).getDate()} ${monthNames[new Date(today).getMonth()]} ${dayNames[new Date(today).getDay()]}</span>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="rounded-xl bg-orange-500/10 border border-orange-500/20 p-3 text-center">
          <p class="text-2xl mb-1">🥣</p><p class="text-xs text-orange-300 font-medium">Çorba</p>
          <p class="text-sm text-white mt-1">${todayMenu.soup}</p>
        </div>
        <div class="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
          <p class="text-2xl mb-1">🍖</p><p class="text-xs text-red-300 font-medium">Ana Yemek</p>
          <p class="text-sm text-white mt-1">${todayMenu.main}</p>
        </div>
        <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
          <p class="text-2xl mb-1">🥗</p><p class="text-xs text-green-300 font-medium">Salata</p>
          <p class="text-sm text-white mt-1">${todayMenu.salad}</p>
        </div>
        <div class="rounded-xl bg-pink-500/10 border border-pink-500/20 p-3 text-center">
          <p class="text-2xl mb-1">🍮</p><p class="text-xs text-pink-300 font-medium">Tatlı</p>
          <p class="text-sm text-white mt-1">${todayMenu.dessert}</p>
        </div>
        <div class="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p class="text-2xl mb-1">🌿</p><p class="text-xs text-emerald-300 font-medium">Vejetaryen</p>
          <p class="text-sm text-white mt-1">${todayMenu.vegetarian}</p>
        </div>
      </div>
      <div class="flex items-center gap-4 mt-3 text-xs text-slate-400">
        <span>🔥 ~${todayMenu.cal} kcal</span>
        <span>⭐ ${todayMenu.rating}/5 (${todayMenu.votes} oy)</span>
      </div>
    </div>` : ''}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 fade-in">
      <div class="card text-center"><p class="text-3xl font-bold text-cyan-300">7</p><p class="text-xs text-slate-400">📅 Haftalık Menü</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-green-300">${(menus.reduce((s, m) => s + parseFloat(m.rating || 0), 0) / menus.length).toFixed(1)}</p><p class="text-xs text-slate-400">⭐ Ort. Puan</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-amber-300">${menus.reduce((s, m) => s + (m.votes || 0), 0)}</p><p class="text-xs text-slate-400">🗳️ Toplam Oy</p></div>
      <div class="card text-center"><p class="text-3xl font-bold text-purple-300">~${Math.round(menus.reduce((s, m) => s + (m.cal || 0), 0) / menus.length)}</p><p class="text-xs text-slate-400">🔥 Ort. Kalori</p></div>
    </div>

    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-4">📅 Haftalık Menü</h3>
      <div class="space-y-3">
        ${menus.map(m => {
          const d = new Date(m.date);
          const isToday = m.date === today;
          return `
          <div class="rounded-xl ${isToday ? 'border-cyan-500/30 bg-cyan-500/5 border' : 'border border-white/10 bg-white/[0.02]'} p-4">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="min-w-[80px] text-center">
                <p class="text-sm font-bold ${isToday ? 'text-cyan-300' : 'text-white'}">${d.getDate()} ${monthNames[d.getMonth()]}</p>
                <p class="text-[10px] text-slate-500">${dayNames[d.getDay()]}</p>
                ${isToday ? '<span class="badge text-[10px]">BUGÜN</span>' : ''}
              </div>
              <div class="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div><span class="text-slate-500">🥣 Çorba</span><p class="text-slate-200">${m.soup}</p></div>
                <div><span class="text-slate-500">🍖 Ana</span><p class="text-slate-200">${m.main}</p></div>
                <div><span class="text-slate-500">🥗 Salata</span><p class="text-slate-200">${m.salad}</p></div>
                <div><span class="text-slate-500">🍮 Tatlı</span><p class="text-slate-200">${m.dessert}</p></div>
                <div><span class="text-slate-500">🌿 Vej.</span><p class="text-slate-200">${m.vegetarian}</p></div>
              </div>
              <div class="text-right">
                <span class="text-amber-400 text-xs">⭐ ${m.rating}</span>
                <span class="text-slate-500 text-[10px] ml-1">(${m.votes} oy)</span>
                <p class="text-[10px] text-slate-600">~${m.cal} kcal</p>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card mt-6 fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">🗳️ Bugünkü Yemek Değerlendir</h3>
      <div class="flex items-center gap-4">
        <div class="flex gap-1" id="menu-rating">
          ${[1,2,3,4,5].map(i => `<button class="text-3xl hover:scale-125 transition menu-star" data-val="${i}">☆</button>`).join('')}
        </div>
        <span id="rating-label" class="text-sm text-slate-400">Puan verin</span>
      </div>
    </div>`;

  el.querySelectorAll('.menu-star').forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      el.querySelectorAll('.menu-star').forEach((s, i) => { s.textContent = i < val ? '⭐' : '☆'; });
      document.getElementById('rating-label').textContent = val >= 4 ? 'Teşekkürler! 😊' : val >= 3 ? 'İyiymiş 👍' : 'Not aldık 📝';
      showToast(`${val} yıldız verdiniz, teşekkürler!`, 'success');
    });
  });
}
