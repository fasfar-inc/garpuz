/** Page numbers to show around the current page, with `null` marking a gap. */
export function pageWindow(current: number, total: number, radius = 2): (number | null)[] {
  if (total <= 1) return [];
  const pages = new Set([1, total]);
  for (let page = current - radius; page <= current + radius; page++) if (page >= 1 && page <= total) pages.add(page);
  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? [null, page] : [page]));
}
