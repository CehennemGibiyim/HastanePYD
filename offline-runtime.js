/* Offline-safe browser shims for optional third-party helpers. */
(function () {
  const charts = new WeakMap();
  function color(value, fallback) { return typeof value === 'string' ? value : fallback; }
  function drawChart(target, config) {
    const canvas = target?.canvas || target;
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const width = canvas.clientWidth || 420, height = canvas.clientHeight || 220;
    if (!canvas.width) canvas.width = width * (window.devicePixelRatio || 1);
    if (!canvas.height) canvas.height = height * (window.devicePixelRatio || 1);
    const scale = window.devicePixelRatio || 1;
    ctx.save(); ctx.scale(scale, scale); ctx.clearRect(0, 0, width, height);
    const datasets = config?.data?.datasets || [], values = datasets[0]?.data || [];
    const max = Math.max(1, ...values.map(Number).filter(Number.isFinite));
    const pad = { l: 24, r: 12, t: 16, b: 22 }, w = width - pad.l - pad.r, h = height - pad.t - pad.b;
    ctx.strokeStyle = 'rgba(148,163,184,.18)'; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { const y = pad.t + h * i / 3; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(width - pad.r, y); ctx.stroke(); }
    const type = config?.type || 'bar';
    if (type === 'doughnut' || type === 'pie') {
      const total = values.reduce((sum, n) => sum + Math.max(0, Number(n) || 0), 0) || 1;
      let start = -Math.PI / 2; const cx = width * .42, cy = height * .5, radius = Math.min(w, h) * .36;
      values.forEach((value, index) => { const part = Math.max(0, Number(value) || 0) / total; const end = start + part * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, start, end); ctx.closePath(); ctx.fillStyle = (datasets[0]?.backgroundColor instanceof Array ? datasets[0].backgroundColor[index] : datasets[0]?.backgroundColor) || ['#22d3ee','#3b82f6','#a78bfa','#4ade80','#f59e0b'][index % 5]; ctx.fill(); start = end; });
      if (type === 'doughnut') { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(cx, cy, radius * .52, 0, Math.PI * 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
    } else if (type === 'line') {
      const step = values.length > 1 ? w / (values.length - 1) : w; ctx.beginPath();
      values.forEach((value, index) => { const x = pad.l + step * index, y = pad.t + h - (Number(value) || 0) / max * h; index ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = color(datasets[0]?.borderColor, '#22d3ee'); ctx.lineWidth = 2; ctx.stroke();
    } else {
      const step = w / Math.max(1, values.length), barW = Math.max(4, step * .62);
      values.forEach((value, index) => { const n = Math.max(0, Number(value) || 0), bh = n / max * h, x = pad.l + index * step + (step - barW) / 2; ctx.fillStyle = color(datasets[0]?.backgroundColor instanceof Array ? datasets[0].backgroundColor[index] : datasets[0]?.backgroundColor, '#22d3ee'); ctx.fillRect(x, pad.t + h - bh, barW, bh); });
    }
    ctx.restore();
  }
  class OfflineChart { constructor(target, config) { this.canvas = target?.canvas || target; this.config = config || {}; charts.set(this.canvas, this); drawChart(this.canvas, this.config); } destroy() { charts.delete(this.canvas); const ctx = this.canvas?.getContext?.('2d'); if (ctx) ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); } static getChart(target) { return charts.get(target?.canvas || target) || null; } }
  window.Chart = window.Chart || OfflineChart;

  function esc(value) { return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch])); }
  window.qrcode = window.qrcode || function () { let data = ''; return { addData(value) { data = String(value ?? ''); }, make() {}, createSvgTag(size = 4) { let hash = 0; for (const ch of data) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0; const cells = 21, unit = size, rects = []; for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) if (((hash + x * 17 + y * 31 + x * y) % 7) < 3) rects.push(`<rect x="${x * unit}" y="${y * unit}" width="${unit}" height="${unit}"/>`); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cells * unit} ${cells * unit}" role="img" aria-label="QR kod"><rect width="100%" height="100%" fill="white"/><g fill="black">${rects.join('')}</g></svg>`; } }; };

  class OfflineClipboard { constructor(selector) { this.buttons = [...document.querySelectorAll(selector)]; this.events = {}; this.buttons.forEach(button => button.addEventListener('click', () => this.copy(button))); } on(name, fn) { this.events[name] = fn; return this; } async copy(button) { try { await navigator.clipboard?.writeText(button.dataset.clipboardText || button.getAttribute('data-phone') || button.textContent || ''); this.events.success?.({ trigger: button, clearSelection() {} }); } catch { this.events.error?.({ trigger: button }); } } }
  window.ClipboardJS = window.ClipboardJS || OfflineClipboard;
  window.Sortable = window.Sortable || { create(element, options = {}) { if (options.onEnd) element.addEventListener('change', options.onEnd); return { destroy() {} }; } };
  window.confetti = window.confetti || function () {};
  window.CountUp = window.CountUp || function (element, endVal) { this.start = () => { const node = typeof element === 'string' ? document.getElementById(element) : element; if (node) node.textContent = String(endVal); }; };
  window.JsBarcode = window.JsBarcode || function (target, value) { const node = typeof target === 'string' ? document.querySelector(target) : target; if (!node) return; const text = esc(value); node.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 48" role="img" aria-label="Barkod"><rect width="240" height="48" fill="white"/><path d="M8 5v28M13 5v28M20 5v28M24 5v28M31 5v28M38 5v28M44 5v28M52 5v28M60 5v28M66 5v28M74 5v28M81 5v28M90 5v28M98 5v28M106 5v28M114 5v28M122 5v28M130 5v28M138 5v28M146 5v28M154 5v28M162 5v28M170 5v28M178 5v28M186 5v28M194 5v28M202 5v28M210 5v28M218 5v28M226 5v28" stroke="black" stroke-width="2"/><text x="120" y="44" text-anchor="middle" font-size="8" fill="black">${text}</text></svg>`; };
  class OfflinePdf { constructor(options = {}) { this.options = options; this.internal = { pageSize: { getWidth: () => options.format?.[0] || (options.orientation === 'landscape' ? 297 : 210), getHeight: () => options.format?.[1] || (options.orientation === 'landscape' ? 210 : 297) } }; this.lastAutoTable = { finalY: 40 }; } setFont() { return this; } setFontSize() { return this; } setFillColor() { return this; } setTextColor() { return this; } setDrawColor() { return this; } rect() { return this; } roundedRect() { return this; } line() { return this; } text() { return this; } addImage() { return this; } addPage() { return this; } setPage() { return this; } getNumberOfPages() { return 1; } autoTable(options = {}) { this.lastAutoTable = { finalY: (options.startY || 35) + Math.max(8, (options.body?.length || 0) * 6) }; return this; } save(filename) { const blob = new Blob(['Hastane PYS PDF yedeği\n'], { type: 'application/pdf' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename || 'rapor.pdf'; a.click(); URL.revokeObjectURL(url); } }
  window.jspdf = window.jspdf || { jsPDF: OfflinePdf }; window.jspdf.jsPDF = window.jspdf.jsPDF || OfflinePdf;
})();
