// ===== İMZA ZİNCİRİ (SIGNATURE CHAIN) =====
import { getPersonnel } from '../state.js';
import { showToast } from '../notifications.js';

const TEMPLATES = [
  { id: 'leave', name: 'İzin Talep Formu', icon: '🏖️', steps: ['Personel', 'Müdür', 'Başhekim'] },
  { id: 'contract', name: 'Sözleşme Onayı', icon: '📋', steps: ['İK', 'Müdür', 'Hukuk', 'Başhekim'] },
  { id: 'expense', name: 'Harcama Talebi', icon: '💰', steps: ['Talep Eden', 'Müdür', 'Mali İşler'] },
  { id: 'overtime', name: 'Fazla Mesai Onayı', icon: '⏱️', steps: ['Personel', 'Müdür'] },
];

export function renderSignatureChainPage(container) {
  const chains = getChains();
  container.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-white">✍️ İmza Zinciri</h1>
          <p class="text-slate-400 text-sm mt-1">Sıralı onay akışı ve dijital imza</p>
        </div>
        <div class="flex gap-2">
          <select id="sc-template" class="input-field">
            <option value="">Şablon Seçin</option>
            ${TEMPLATES.map(t => `<option value="${t.id}">${t.icon} ${t.name}</option>`).join('')}
          </select>
          <button id="sc-create-btn" class="btn-primary">+ Oluştur</button>
        </div>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${scStat('📝', 'Aktif Zincir', chains.filter(c=>c.status==='pending').length, 'cyan')}
        ${scStat('✅', 'Tamamlanan', chains.filter(c=>c.status==='completed').length, 'green')}
        ${scStat('⏳', 'Bekleyen İmza', chains.reduce((s,c)=>s+c.steps.filter(st=>st.status==='pending').length,0), 'amber')}
        ${scStat('⏱️', 'Ort. Süre', calcAvgTime(chains), 'purple')}
      </div>
      <div id="sc-chains" class="space-y-4"></div>
    </div>`;
  renderChains(chains);
  document.getElementById('sc-create-btn').onclick = () => {
    const tid = document.getElementById('sc-template').value;
    if (!tid) { showToast('Şablon seçin', 'error'); return; }
    const template = TEMPLATES.find(t => t.id === tid);
    createChain(template);
  };
}

function renderChains(chains) {
  const el = document.getElementById('sc-chains');
  if (chains.length === 0) {
    el.innerHTML = '<div class="empty-state card"><div class="icon">✍️</div><div class="title">İmza zinciri yok</div><div class="desc">Yukarıdan bir şablon seçerek başlayın</div></div>';
    return;
  }
  el.innerHTML = chains.map(c => {
    const completedSteps = c.steps.filter(s => s.status === 'done').length;
    const pct = Math.round(completedSteps / c.steps.length * 100);
    return `
      <div class="card ${c.status==='completed'?'border-green-500/20':''}">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">${c.icon}</span>
            <div>
              <p class="font-semibold text-white">${c.name}</p>
              <p class="text-xs text-slate-500">${new Date(c.createdAt).toLocaleDateString('tr-TR')} · ${c.documentTitle || ''}</p>
            </div>
          </div>
          <span class="badge ${c.status==='completed'?'bg-green-500/20 text-green-400':'bg-amber-500/20 text-amber-400'}">${c.status==='completed'?'✅ Tamamlandı':'⏳ Devam Ediyor'}</span>
        </div>
        <div class="flex items-center gap-2 mb-4">
          ${c.steps.map((step, idx) => `
            <div class="flex items-center gap-2 flex-1">
              <div class="flex-1 rounded-lg p-2 text-center text-xs transition-all ${step.status==='done'?'bg-green-500/15 border border-green-500/30 text-green-400':step.status==='current'?'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400':'bg-white/5 border border-white/10 text-slate-500'}">
                <p class="font-medium">${step.label}</p>
                ${step.status==='done' ? '<p class="text-[10px] mt-0.5">✓ İmzalandı</p>' : step.status==='current' ? '<p class="text-[10px] mt-0.5">⏳ Bekliyor</p>' : ''}
              </div>
              ${idx < c.steps.length-1 ? '<span class="text-slate-600">→</span>' : ''}
            </div>`).join('')}
        </div>
        <div class="flex items-center justify-between">
          <div class="flex-1 h-2 rounded-full bg-white/10 overflow-hidden mr-4">
            <div class="h-full rounded-full bg-green-500 transition-all" style="width:${pct}%"></div>
          </div>
          <span class="text-xs text-slate-400">${pct}%</span>
        </div>
        ${c.status === 'pending' ? `
          <div class="flex gap-2 mt-3 pt-3 border-t border-white/5">
            <button class="sc-sign-btn btn-primary text-xs px-3 py-1" data-id="${c.id}">✍️ İmzala</button>
            <button class="sc-reject-btn btn-secondary text-xs px-3 py-1 text-red-400" data-id="${c.id}">❌ Reddet</button>
          </div>` : ''}
      </div>`;
  }).join('');

  el.querySelectorAll('.sc-sign-btn').forEach(b => {
    b.onclick = () => signChain(parseInt(b.dataset.id));
  });
  el.querySelectorAll('.sc-reject-btn').forEach(b => {
    b.onclick = () => rejectChain(parseInt(b.dataset.id));
  });
}

function createChain(template) {
  const m = document.createElement('div');
  m.className = 'fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4';
  const personnel = getPersonnel({ status: 'active' });
  m.innerHTML = `<div class="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl fade-in">
    <h3 class="text-xl font-bold text-white mb-4">${template.icon} ${template.name}</h3>
    <div class="space-y-3">
      <div><label class="label">Belge Başlığı</label><input id="sc-title" class="input-field w-full" placeholder="Belge açıklaması"></div>
      ${template.steps.map((step, idx) => `<div><label class="label">${step} (Adım ${idx+1})</label><select id="sc-step-${idx}" class="input-field w-full">${personnel.map(p=>`<option value="${p.id}">${p.name} ${p.surname} (${p.department})</option>`).join('')}</select></div>`).join('')}
    </div>
    <div class="flex gap-3 mt-6"><button id="sc-save" class="btn-primary flex-1">📝 Oluştur</button><button onclick="this.closest('.fixed').remove()" class="btn-secondary flex-1">İptal</button></div></div>`;
  document.body.appendChild(m);
  document.getElementById('sc-save').onclick = () => {
    const chains = getChains();
    const steps = template.steps.map((label, idx) => ({
      label, personnelId: parseInt(document.getElementById(`sc-step-${idx}`).value),
      status: idx === 0 ? 'current' : 'pending',
      signedAt: null,
    }));
    chains.push({ id: Date.now(), templateId: template.id, name: template.name, icon: template.icon,
      documentTitle: document.getElementById('sc-title').value.trim(), steps, status: 'pending', createdAt: new Date().toISOString() });
    saveChains(chains);
    m.remove(); showToast('İmza zinciri oluşturuldu!', 'success');
    renderSignatureChainPage(document.getElementById('content'));
  };
}

function signChain(chainId) {
  const chains = getChains();
  const chain = chains.find(c => c.id === chainId);
  if (!chain) return;
  const currentIdx = chain.steps.findIndex(s => s.status === 'current');
  if (currentIdx < 0) return;
  chain.steps[currentIdx].status = 'done';
  chain.steps[currentIdx].signedAt = new Date().toISOString();
  if (currentIdx + 1 < chain.steps.length) {
    chain.steps[currentIdx + 1].status = 'current';
  } else {
    chain.status = 'completed';
  }
  saveChains(chains);
  showToast('İmza atıldı! ✍️', 'success');
  renderSignatureChainPage(document.getElementById('content'));
}

function rejectChain(chainId) {
  const chains = getChains();
  const chain = chains.find(c => c.id === chainId);
  if (!chain) return;
  chain.status = 'rejected';
  saveChains(chains);
  showToast('İmza reddedildi ❌', 'error');
  renderSignatureChainPage(document.getElementById('content'));
}

function getChains() { try { return JSON.parse(localStorage.getItem('hospital_sig_chains') || '[]'); } catch { return []; } }
function saveChains(c) { localStorage.setItem('hospital_sig_chains', JSON.stringify(c)); }
function calcAvgTime(chains) {
  const completed = chains.filter(c => c.status === 'completed');
  if (!completed.length) return '-';
  const avgMs = completed.reduce((s,c) => s + (new Date(c.steps[c.steps.length-1].signedAt) - new Date(c.createdAt)), 0) / completed.length;
  return avgMs > 86400000 ? Math.round(avgMs/86400000) + ' gün' : Math.round(avgMs/3600000) + ' saat';
}
function scStat(icon, label, value, color) {
  return `<div class="rounded-2xl bg-gradient-to-br from-${color}-500/20 to-${color}-600/5 border border-${color}-500/20 p-5"><p class="text-sm text-${color}-300">${icon} ${label}</p><p class="text-2xl font-bold text-white mt-1">${value}</p></div>`;
}
