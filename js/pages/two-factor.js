// ===== IKI FAKTORLU DOGRULAMA (2FA) =====
import { getCurrentUser } from '../state.js';
import { showToast } from '../notifications.js';

const save = (k, d) => localStorage.setItem('hospital_' + k, JSON.stringify(d));
const load = (k) => { try { return JSON.parse(localStorage.getItem('hospital_' + k)); } catch { return null; } };

function get2FAStatus(userId) {
  const all = load('twoFactor') || {};
  return all[userId] || { enabled: false, secret: null, backupCodes: [] };
}
function set2FAStatus(userId, data) {
  const all = load('twoFactor') || {};
  all[userId] = data;
  save('twoFactor', all);
}

function generateSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 16; i++) secret += chars[Math.floor(Math.random() * chars.length)];
  return secret;
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 8; i++) codes.push(Math.random().toString(36).substring(2, 8).toUpperCase());
  return codes;
}

function verifyTOTP(secret, code) {
  // Simplified TOTP verification - in production use proper crypto
  const timeStep = Math.floor(Date.now() / 30000);
  const hash = (timeStep % 1000000).toString().padStart(6, '0');
  return code === hash || code === '000000'; // 000000 is demo bypass
}

export function renderTwoFactorPage(el) {
  const user = getCurrentUser();
  if (!user) { el.innerHTML = '<div class="empty-state"><div class="icon">🔐</div><div class="title">Giriş yapmalısınız</div></div>'; return; }
  
  const status = get2FAStatus(user.username);

  el.innerHTML = `
    <div class="mb-6 fade-in">
      <h1 class="text-2xl font-bold text-white">🔐 İki Faktörlü Doğrulama</h1>
      <p class="text-slate-400 text-sm mt-1">Hesabınıza ek güvenlik katmanı ekleyin</p>
    </div>
    <div class="card fade-in mb-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-lg font-semibold text-white">2FA Durumu</h3>
          <p class="text-sm text-slate-400">İki faktörlü doğrulama ${status.enabled ? 'aktif ✅' : 'pasif ❌'}</p>
        </div>
        <span class="badge ${status.enabled ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}">${status.enabled ? 'AKTİF' : 'PASİF'}</span>
      </div>
      ${status.enabled ? `
        <div class="rounded-xl bg-green-500/10 border border-green-500/20 p-4 mb-4">
          <p class="text-sm text-green-300">✅ İki faktörlü doğrulama hesabınızda aktif.</p>
          <p class="text-xs text-slate-400 mt-1">Her giriş ekranında doğrulama kodu istenecektir.</p>
        </div>
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-white mb-2">🔑 Yedek Kodlar</h4>
          <p class="text-xs text-slate-400 mb-2">Eğer doğrulama cihazınıza erişemezseniz bu kodları kullanabilirsiniz:</p>
          <div class="grid grid-cols-4 gap-2">
            ${status.backupCodes.map(c => `<code class="text-xs bg-white/5 rounded-lg px-2 py-1 text-center text-cyan-300">${c}</code>`).join('')}
          </div>
        </div>
        <button id="tfa-disable" class="btn-secondary text-red-400">🚫 2FA'yı Devre Dışı Bırak</button>
      ` : `
        <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-4">
          <p class="text-sm text-amber-300">⚠️ İki faktörlü doğrulama aktif değil.</p>
          <p class="text-xs text-slate-400 mt-1">Hesabınızı korumak için 2FA'yı etkinleştirmenizi öneririz.</p>
        </div>
        <div id="tfa-setup">
          <h4 class="text-sm font-semibold text-white mb-3">Kurulum Adımları:</h4>
          <ol class="space-y-2 text-sm text-slate-300 mb-4">
            <li>1️⃣ Google Authenticator veya Authy uygulamasını indirin</li>
            <li>2️⃣ Aşağıdaki QR kodu veya gizli anahtarı girin</li>
            <li>3️⃣ Uygulamadaki 6 haneli kodu girin</li>
          </ol>
          <div id="tfa-qr-area" class="text-center mb-4"></div>
          <div class="mb-4">
            <label class="label">Gizli Anahtar (manuel giriş için)</label>
            <code id="tfa-secret-display" class="text-sm bg-white/5 rounded-lg px-3 py-2 block text-center text-cyan-300 tracking-widest"></code>
          </div>
          <div class="mb-4">
            <label class="label">Doğrulama Kodu</label>
            <input id="tfa-code" class="input-field w-full text-center text-xl tracking-[0.5em]" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="off">
          </div>
          <button id="tfa-enable" class="btn-primary w-full">✅ 2FA'yı Etkinleştir</button>
        </div>
      `}
    </div>
    <div class="card fade-in">
      <h3 class="text-lg font-semibold text-white mb-3">ℹ️ 2FA Hakkında</h3>
      <div class="space-y-2 text-sm text-slate-400">
        <p>🔒 <strong class="text-white">Ek Güvenlik:</strong> Şifreniz çalınsa bile hesabınıza erişilemez</p>
        <p>📱 <strong class="text-white">Authenticator:</strong> Google Authenticator, Microsoft Authenticator veya Authy kullanabilirsiniz</p>
        <p>🔑 <strong class="text-white">Yedek Kodlar:</strong> Cihazınıza erişemediğinizde kullanabileceğiniz tek kullanımlık kodlardır</p>
        <p>⚡ <strong class="text-white">Demo:</strong> Doğrulama kodu olarak "000000" girerek test edebilirsiniz</p>
      </div>
    </div>`;

  if (!status.enabled) {
    const secret = generateSecret();
    const qrArea = document.getElementById('tfa-qr-area');
    if (typeof qrcode !== 'undefined') {
      try {
        const qr = qrcode(0, 'M');
        qr.addData('otpauth://totp/HastanePYS:' + user.username + '?secret=' + secret + '&issuer=HastanePYS');
        qr.make();
        qrArea.innerHTML = '<div class="inline-block p-4 bg-white rounded-xl">' + qr.createSvgTag(4, 0) + '</div>';
      } catch { qrArea.innerHTML = '<p class="text-xs text-slate-500">QR kod oluşturulamadı</p>'; }
    }
    document.getElementById('tfa-secret-display').textContent = secret;

    document.getElementById('tfa-enable').onclick = () => {
      const code = document.getElementById('tfa-code').value.trim();
      if (code.length !== 6) { showToast('6 haneli kod giriniz', 'error'); return; }
      if (verifyTOTP(secret, code)) {
        const backupCodes = generateBackupCodes();
        set2FAStatus(user.username, { enabled: true, secret, backupCodes, enabledAt: new Date().toISOString() });
        showToast('2FA başarıyla etkinleştirildi!', 'success');
        renderTwoFactorPage(el);
      } else {
        showToast('Geçersiz kod, tekrar deneyin', 'error');
      }
    };
  } else {
    document.getElementById('tfa-disable').onclick = () => {
      if (confirm('2FA devre dışı bırakılacak. Emin misiniz?')) {
        set2FAStatus(user.username, { enabled: false, secret: null, backupCodes: [] });
        showToast('2FA devre dışı bırakıldı', 'success');
        renderTwoFactorPage(el);
      }
    };
  }
}
