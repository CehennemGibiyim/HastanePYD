// ===== HASTA GERİ BİLDİRİM SİSTEMİ =====
import { showToast } from '../notifications.js';

export function renderPatientFeedbackPage(container) {
  const feedbacks = getFeedbacks();
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">📊 Hasta Memnuniyet Anketi</h1>
          <p class="text-slate-400 text-sm mt-1">QR kod ile hasta geri bildirimi toplayın</p>
        </div>
        <button id="pf-qr-btn" class="btn-primary">📱 QR Kod Oluştur</button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${pfStat('⭐', 'Ortalama Puan', calcAvg(feedbacks), '/ 5.0', 'amber')}
        ${pfStat('📝', 'Toplam Yanıt', feedbacks.length, 'yanıt', 'cyan')}
        ${pfStat('😊', 'Memnun Oran', pctSatisfied(feedbacks), '%', 'green')}
        ${pfStat('📈', 'Bu Ay', feedbacksThisMonth(feedbacks), 'yanıt', 'purple')}
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">⭐ Puan Dağılımı</h3>
          <div class="space-y-2">
            ${[5,4,3,2,1].map(s => {
              const count = feedbacks.filter(f => f.rating === s).length;
              const total = feedbacks.length || 1;
              return `<div class="flex items-center gap-3">
                <span class="text-sm w-8">${'⭐'.repeat(s)}</span>
                <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
                  <div class="h-full rounded-lg bg-amber-500/40 transition-all" style="width:${Math.round(count/total*100)}%"></div>
                </div>
                <span class="text-xs text-slate-400 w-8 text-right">${count}</span>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="card">
          <h3 class="text-lg font-semibold text-white mb-4">🏢 Departman Bazlı Memnuniyet</h3>
          <div id="pf-dept-chart" class="space-y-2"></div>
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-white mb-4">📝 Son Yorumlar</h3>
        <div class="space-y-3" id="pf-comments"></div>
      </div>
    </div>`;
  renderDeptChart(feedbacks);
  renderComments(feedbacks);
  document.getElementById('pf-qr-btn').onclick = () => showFeedbackQR();
}

function renderDeptChart(feedbacks) {
  const el = document.getElementById('pf-dept-chart');
  const deptScores = {};
  feedbacks.forEach(f => {
    if (!deptScores[f.department]) deptScores[f.department] = [];
    deptScores[f.department].push(f.rating);
  });
  const entries = Object.entries(deptScores).map(([d, scores]) => ({ dept: d, avg: scores.reduce((a,b)=>a+b,0)/scores.length, count: scores.length })).sort((a,b) => b.avg - a.avg);
  el.innerHTML = entries.length ? entries.map(d => `
    <div class="flex items-center gap-3">
      <span class="text-sm text-slate-300 w-28 truncate">${d.dept}</span>
      <div class="flex-1 h-6 rounded-lg bg-white/5 overflow-hidden">
        <div class="h-full rounded-lg transition-all" style="width:${Math.round(d.avg/5*100)}%; background:${d.avg>=4?'rgba(34,197,94,0.4)':d.avg>=3?'rgba(245,158,11,0.4)':'rgba(239,68,68,0.4)'}"></div>
      </div>
      <span class="text-xs font-bold w-8 text-right">${d.avg.toFixed(1)}</span>
    </div>`).join('') : '<p class="text-slate-500 text-sm text-center py-4">Veri yok</p>';
}

function renderComments(feedbacks) {
  const el = document.getElementById('pf-comments');
  const withComments = feedbacks.filter(f => f.comment).slice(-10).reverse();
  el.innerHTML = withComments.length ? withComments.map(f => `
    <div class="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
      <span class="text-xl">${f.rating >= 4 ? '😊' : f.rating >= 3 ? '😐' : '😞'}</span>
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-amber-400">${'⭐'.repeat(f.rating)}</span>
          <span class="badge text-xs">${f.department}</span>
        </div>
        <p class="text-sm text-slate-300">${f.comment}</p>
        <p class="text-xs text-slate-500 mt-1">${new Date(f.date).toLocaleDateString('tr-TR')}</p>
      </div>
    </div>`).join('') : '<p class="text-slate-500 text-sm text-center py-4">Henüz yorum yok</p>';
}

function showFeedbackQR() {
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in text-center">
    <h3 class="text-xl font-bold text-white mb-4">📱 Hasta Memnuniyet QR</h3>
    <div id="pf-qr-code" class="mb-4 flex justify-center"></div>
    <p class="text-sm text-slate-300 mb-2">QR kodu okutarak anket doldurabilirsiniz</p>
    <button id="pf-demo-btn" class="btn-primary w-full mb-2">📝 Demo Anket Doldur</button>
    <button onclick="this.closest('.fixed').remove()" class="btn-secondary w-full">Kapat</button>
  </div>`;
  document.body.appendChild(m);
  if (typeof qrcode !== 'undefined') {
    try {
      const qr = qrcode(0, 'M');
      qr.addData(window.location.href + '#patient-feedback');
      qr.make();
      document.getElementById('pf-qr-code').innerHTML = qr.createSvgTag(4, 0);
    } catch {}
  }
  document.getElementById('pf-demo-btn').onclick = () => { m.remove(); showFeedbackForm(); };
}

function showFeedbackForm() {
  const departments = ['Acil Servis','Dahiliye','Cerrahi','Çocuk Sağlığı','Kadın Doğum','Göz','KBB','Ortopedi','Hemşirelik','Temizlik','Mutfak'];
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
    <h3 class="text-xl font-bold text-white mb-4">📝 Hasta Memnuniyet Anketi</h3>
    <div class="space-y-4">
      <div><label class="label">Departman</label><select id="fb-dept" class="input-field w-full">${departments.map(d=>`<option>${d}</option>`).join('')}</select></div>
      <div><label class="label">Genel Memnuniyet</label>
        <div class="flex gap-2" id="fb-stars">${[1,2,3,4,5].map(s=>`<button class="fb-star text-2xl opacity-30 hover:opacity-100 transition" data-star="${s}">⭐</button>`).join('')}</div>
      </div>
      <div><label class="label">Yorumunuz (opsiyonel)</label><textarea id="fb-comment" class="input-field w-full" rows="3" placeholder="Deneyiminizi paylaşın..."></textarea></div>
    </div>
    <div class="flex gap-3 mt-6"><button id="fb-save" class="btn-primary flex-1">📤 Gönder</button><button onclick="this.closest('.fixed').remove()" class="btn-secondary flex-1">İptal</button></div></div>`;
  document.body.appendChild(m);
  let rating = 0;
  m.querySelectorAll('.fb-star').forEach(b => {
    b.onclick = () => {
      rating = parseInt(b.dataset.star);
      m.querySelectorAll('.fb-star').forEach(s => { s.classList.toggle('opacity-100', parseInt(s.dataset.star) <= rating); s.classList.toggle('opacity-30', parseInt(s.dataset.star) > rating); });
    };
  });
  document.getElementById('fb-save').onclick = () => {
    if (!rating) { showToast('Puan verin', 'error'); return; }
    const feedbacks = getFeedbacks();
    feedbacks.push({ id: Date.now(), department: document.getElementById('fb-dept').value, rating, comment: document.getElementById('fb-comment').value.trim(), date: new Date().toISOString() });
    saveFeedbacks(feedbacks);
    m.remove(); showToast('Teşekkürler! Geri bildiriminiz kaydedildi.', 'success');
    renderPatientFeedbackPage(document.getElementById('content'));
  };
}

function getFeedbacks() { try { return JSON.parse(localStorage.getItem('hospital_patient_feedback') || '[]'); } catch { return []; } }
function saveFeedbacks(f) { localStorage.setItem('hospital_patient_feedback', JSON.stringify(f)); }
function calcAvg(f) { return f.length ? (f.reduce((s,x)=>s+x.rating,0)/f.length).toFixed(1) : '0.0'; }
function pctSatisfied(f) { return f.length ? Math.round(f.filter(x=>x.rating>=4).length/f.length*100) : 0; }
function feedbacksThisMonth(f) { const m = new Date().toISOString().slice(0,7); return f.filter(x=>x.date?.startsWith(m)).length; }
function pfStat(icon,label,value,sub,color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-2xl font-bold text-white mt-1">${value}</p><p class="text-xs text-${color}-400/60 mt-1">${sub}</p></div>`;
}
