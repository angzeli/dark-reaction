/**
 * Minimal reader for a TrueType/OpenType font's character map (cmap), used
 * to check glyph coverage before and after subsetting. Supports the two
 * subtable formats every modern font ships: 4 (BMP) and 12 (full Unicode).
 */
export function readCodepoints(font: Uint8Array): Set<number> {
  const view = new DataView(font.buffer, font.byteOffset, font.byteLength);
  const numTables = view.getUint16(4);
  let cmapOffset = -1;
  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = String.fromCharCode(font[rec]!, font[rec + 1]!, font[rec + 2]!, font[rec + 3]!);
    if (tag === 'cmap') cmapOffset = view.getUint32(rec + 8);
  }
  if (cmapOffset < 0) throw new Error('Font has no cmap table');

  const subtables = view.getUint16(cmapOffset + 2);
  let best = -1;
  let bestFormat = 0;
  for (let i = 0; i < subtables; i++) {
    const rec = cmapOffset + 4 + i * 8;
    const platform = view.getUint16(rec);
    const encoding = view.getUint16(rec + 2);
    const offset = cmapOffset + view.getUint32(rec + 4);
    const format = view.getUint16(offset);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;
    if (format === 12 && bestFormat !== 12) {
      best = offset;
      bestFormat = 12;
    } else if (format === 4 && bestFormat === 0) {
      best = offset;
      bestFormat = 4;
    }
  }
  if (best < 0) throw new Error('Font has no Unicode cmap subtable (format 4 or 12)');

  const out = new Set<number>();
  if (bestFormat === 12) {
    const groups = view.getUint32(best + 12);
    for (let g = 0; g < groups; g++) {
      const rec = best + 16 + g * 12;
      const start = view.getUint32(rec);
      const end = view.getUint32(rec + 4);
      for (let c = start; c <= end; c++) out.add(c);
    }
    return out;
  }

  const segX2 = view.getUint16(best + 6);
  const ends = best + 14;
  const starts = ends + segX2 + 2;
  const deltas = starts + segX2;
  const rangeOffsets = deltas + segX2;
  for (let s = 0; s < segX2 / 2; s++) {
    const end = view.getUint16(ends + s * 2);
    const start = view.getUint16(starts + s * 2);
    const delta = view.getInt16(deltas + s * 2);
    const rangeOffsetPos = rangeOffsets + s * 2;
    const rangeOffset = view.getUint16(rangeOffsetPos);
    for (let c = start; c <= end && c !== 0xffff; c++) {
      let glyph: number;
      if (rangeOffset === 0) {
        glyph = (c + delta) & 0xffff;
      } else {
        const glyphPos = rangeOffsetPos + rangeOffset + (c - start) * 2;
        glyph = view.getUint16(glyphPos);
        if (glyph !== 0) glyph = (glyph + delta) & 0xffff;
      }
      if (glyph !== 0) out.add(c);
    }
  }
  return out;
}
