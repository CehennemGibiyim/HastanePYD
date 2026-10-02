// ===== PDF ÜRETİM YARDIMCILARI (jsPDF) =====
// jsPDF + jsPDF-AutoTable ile Türkçe PDF raporları

const { jsPDF } = window.jspdf || {};

// Türkçe karakter düzeltme (Helvetica font için)
const TR_MAP = {
  'İ': 'I', 'ı': 'i', 'ğ': 'g', 'Ğ': 'G',
  'ş': 's', 'Ş': 'S', 'ç': 'c', 'Ç': 'C',
  'ö': 'o', 'Ö': 'O', 'ü': 'u', 'Ü': 'U',
};

function tr(text) {
  if (!text) return '';
  return String(text).replace(/[İıĞğŞşÇçÖöÜü]/g, c => TR_MAP[c] || c);
}

function trArr(arr) {
  return arr.map(item => Array.isArray(item) ? trArr(item) : tr(item));
}

export function createPDF(orientation = 'portrait') {
  if (!jsPDF) {
    console.error('jsPDF yuklenemedi');
    return null;
  }
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  doc.setFontSize(10);
  return doc;
}

export function addPDFHeader(doc, title, subtitle) {
  const pageW = doc.internal.pageSize.getWidth();
  // Hospital branding
  doc.setFillColor(8, 145, 178); // cyan-600
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(tr('Devlet Hastanesi'), 14, 12);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(tr(title), 14, 20);
  if (subtitle) {
    doc.setFontSize(9);
    doc.text(tr(subtitle), 14, 26);
  }
  // Date on right
  const today = new Date().toLocaleDateString('tr-TR');
  doc.setFontSize(9);
  doc.text(today, pageW - 14, 12, { align: 'right' });
  doc.text(tr('Personel Yonetim Sistemi'), pageW - 14, 18, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  return 34; // startY after header
}

export function addPDFFooter(doc) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(tr('Devlet Hastanesi - Personel Yonetim Sistemi'), 14, pageH - 9);
    doc.text(`Sayfa ${i}/${pages}`, pageW - 14, pageH - 9, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  }
}

export function addPDFTable(doc, headers, rows, startY, options = {}) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableW = pageW - margin * 2;

  // Use jsPDF-AutoTable if available
  if (doc.autoTable) {
    doc.autoTable({
      startY,
      head: [trArr(headers)],
      body: trArr(rows),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [8, 145, 178],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: margin, right: margin },
      tableWidth: tableW,
      ...options,
    });
    return doc.lastAutoTable.finalY + 6;
  }

  // Fallback: manual table
  const colW = tableW / headers.length;
  let y = startY;
  const rowH = 7;

  // Header
  doc.setFillColor(8, 145, 178);
  doc.rect(margin, y, tableW, rowH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => {
    doc.text(tr(h), margin + i * colW + 3, y + 5);
  });
  y += rowH;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Rows
  rows.forEach((row, ri) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    if (ri % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y, tableW, rowH, 'F');
    }
    row.forEach((cell, ci) => {
      doc.text(tr(String(cell).substring(0, 30)), margin + ci * colW + 3, y + 5);
    });
    y += rowH;
  });

  return y + 4;
}

export function addPDFSummaryCards(doc, cards, startY) {
  const margin = 14;
  const cardW = (doc.internal.pageSize.getWidth() - margin * 2 - (cards.length - 1) * 4) / cards.length;
  const cardH = 18;

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(240, 249, 255);
    doc.setDrawColor(186, 230, 253);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, 'FD');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(8, 145, 178);
    doc.text(tr(String(card.value)), x + cardW / 2, startY + 8, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(tr(card.label), x + cardW / 2, startY + 14, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  });

  return startY + cardH + 6;
}

export function downloadPDF(doc, filename) {
  const safeName = tr(filename).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`${safeName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function isPDFAvailable() {
  return !!jsPDF;
}
