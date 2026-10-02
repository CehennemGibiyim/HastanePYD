// ===== EXCEL/CSV/PDF EXPORT UTILITIES =====

/**
 * Export data as CSV file
 */
export function exportCSV(data, filename, columns) {
  if (!data || !data.length) return;
  const cols = columns || Object.keys(data[0]);
  const header = cols.map(c => '"' + (c.label || c.key || c) + '"').join(',');
  const rows = data.map(row =>
    cols.map(c => {
      const key = c.key || c;
      const val = row[key] ?? '';
      return '"' + String(val).replace(/"/g, '""') + '"';
    }).join(',')
  );
  const csv = '\uFEFF' + header + '\n' + rows.join('\n');
  downloadBlob(csv, filename + '.csv', 'text/csv;charset=utf-8');
}

/**
 * Export data as Excel-compatible HTML table
 */
export function exportExcel(data, filename, columns) {
  if (!data || !data.length) return;
  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `<th style="background:#0891b2;color:white;padding:8px 12px;font-weight:600;">${c.label || c.key || c}</th>`).join('');
  const rows = data.map(row =>
    '<tr>' + cols.map(c => {
      const key = c.key || c;
      const val = row[key] ?? '';
      return `<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHTML(String(val))}</td>`;
    }).join('') + '</tr>'
  ).join('');
  const html = `<html><head><meta charset="utf-8"></head><body>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px;width:100%;">
    <thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></body></html>`;
  downloadBlob(html, filename + '.xls', 'application/vnd.ms-excel');
}

/**
 * Export data as JSON
 */
export function exportJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, filename + '.json', 'application/json');
}

/**
 * Print-friendly HTML export
 */
export function exportPrintHTML(data, title, columns) {
  if (!data || !data.length) return;
  const cols = columns || Object.keys(data[0]).map(k => ({ key: k, label: k }));
  const header = cols.map(c => `<th style="background:#f1f5f9;padding:8px 12px;text-align:left;font-weight:600;border-bottom:2px solid #e2e8f0;">${c.label || c.key || c}</th>`).join('');
  const rows = data.map(row =>
    '<tr>' + cols.map(c => {
      const key = c.key || c;
      const val = row[key] ?? '';
      return `<td style="padding:6px 12px;border-bottom:1px solid #e2e8f0;">${escapeHTML(String(val))}</td>`;
    }).join('') + '</tr>'
  ).join('');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b;}
    h1{font-size:20px;margin-bottom:4px;}p{color:#64748b;font-size:13px;margin-bottom:16px;}
    table{border-collapse:collapse;width:100%;font-size:13px;}
    @media print{body{padding:12px;}}</style></head><body>
    <h1>${title}</h1><p>Tarih: ${new Date().toLocaleDateString('tr-TR')}</p>
    <table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>
    <script>setTimeout(()=>window.print(),500)<\/script></body></html>`);
  win.document.close();
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
}

function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Render export toolbar buttons
 */
export function renderExportButtons(id, data, filename, columns) {
  return `<div class="flex flex-wrap gap-2" id="${id}">
    <button data-export="csv" class="btn-secondary text-xs">📄 CSV</button>
    <button data-export="excel" class="btn-secondary text-xs">📊 Excel</button>
    <button data-export="json" class="btn-secondary text-xs">🔧 JSON</button>
    <button data-export="print" class="btn-secondary text-xs">🖨️ Yazdır</button>
  </div>`;
}

/**
 * Initialize export button handlers
 */
export function initExportHandlers(containerId, getData, filename, columns) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('[data-export]').forEach(btn => {
    btn.onclick = () => {
      const data = getData();
      if (!data || !data.length) return;
      const type = btn.dataset.export;
      if (type === 'csv') exportCSV(data, filename, columns);
      else if (type === 'excel') exportExcel(data, filename, columns);
      else if (type === 'json') exportJSON(data, filename);
      else if (type === 'print') exportPrintHTML(data, filename, columns);
    };
  });
}
