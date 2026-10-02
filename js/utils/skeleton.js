// ===== SKELETON LOADING UTILITIES =====

export function skeletonCard(lines) {
  lines = lines || 3;
  const bars = Array.from({ length: lines }, (_, i) => {
    const w = [80, 60, 90, 45, 70][i % 5];
    return `<div class="skeleton-bar" style="width:${w}%;height:14px"></div>`;
  }).join('');
  return `<div class="card skeleton-card">${bars}</div>`;
}

export function skeletonTable(rows, cols) {
  rows = rows || 5;
  cols = cols || 4;
  const header = `<tr>${'<th class="th"><div class="skeleton-bar" style="width:60px;height:12px"></div></th>'.repeat(cols)}</tr>`;
  const body = Array.from({ length: rows }, () => {
    return `<tr>${Array.from({ length: cols }, () => {
      const w = 40 + Math.floor(Math.random() * 50);
      return `<td class="td"><div class="skeleton-bar" style="width:${w}%;height:12px"></div></td>`;
    }).join('')}</tr>`;
  }).join('');
  return `<div class="overflow-x-auto"><table class="w-full">${header}${body}</table></div>`;
}

export function skeletonKPI(count) {
  count = count || 4;
  return `<div class="grid grid-cols-2 lg:grid-cols-${count} gap-4">${Array.from({ length: count }, () =>
    `<div class="card skeleton-card text-center"><div class="skeleton-bar mx-auto" style="width:60px;height:32px;margin-bottom:8px"></div><div class="skeleton-bar mx-auto" style="width:80px;height:12px"></div></div>`
  ).join('')}</div>`;
}

export function skeletonList(count) {
  count = count || 5;
  return Array.from({ length: count }, () =>
    `<div class="card skeleton-card flex items-center gap-3"><div class="skeleton-bar" style="width:40px;height:40px;border-radius:0.5rem;flex-shrink:0"></div><div class="flex-1"><div class="skeleton-bar" style="width:70%;height:14px;margin-bottom:6px"></div><div class="skeleton-bar" style="width:45%;height:10px"></div></div></div>`
  ).join('');
}
