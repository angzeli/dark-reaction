/**
 * The characters a WOFF2 font can draw, read from the built file itself:
 * the table directory, then the one Brotli stream all tables share (Node's
 * zlib decompresses it), then the cmap table, which WOFF2 never transforms.
 * See https://www.w3.org/TR/WOFF2/ §4–§5.
 */
import { brotliDecompressSync } from 'node:zlib';
import { readCmapTable } from './cmap.ts';

/** Known table tags, by their WOFF2 flag index (WOFF2 §4.1, table of known tags). */
const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm', 'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT',
  'EBLC', 'gasp', 'hdmx', 'kern', 'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC', 'JSTF', 'MATH',
  'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar', 'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar',
  'gvar', 'hsty', 'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat', 'Gloc', 'Feat', 'Sill',
];

function base128(bytes: Uint8Array, pos: { at: number }): number {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const b = bytes[pos.at++]!;
    value = value * 128 + (b & 0x7f);
    if ((b & 0x80) === 0) return value;
  }
  throw new Error('woff2: bad UIntBase128');
}

export function woff2Codepoints(file: Uint8Array): Set<number> {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  if (view.getUint32(0) !== 0x774f4632) throw new Error('not a WOFF2 file');
  const numTables = view.getUint16(12);
  const compressedLength = view.getUint32(20);
  const pos = { at: 48 };
  const tables: Array<{ tag: string; length: number }> = [];
  for (let i = 0; i < numTables; i++) {
    const flags = file[pos.at++]!;
    const index = flags & 0x3f;
    let tag: string;
    if (index === 63) {
      tag = String.fromCharCode(file[pos.at]!, file[pos.at + 1]!, file[pos.at + 2]!, file[pos.at + 3]!);
      pos.at += 4;
    } else tag = KNOWN_TAGS[index]!;
    const origLength = base128(file, pos);
    const version = (flags >> 6) & 3;
    // glyf and loca are transformed unless their version is 3; every other table is transformed only when its version isn't 0.
    const transformed = tag === 'glyf' || tag === 'loca' ? version !== 3 : version !== 0;
    const length = transformed ? base128(file, pos) : origLength;
    tables.push({ tag, length });
  }
  // A font collection header would come next; the game ships single fonts.
  const data = brotliDecompressSync(file.subarray(pos.at, pos.at + compressedLength));
  let offset = 0;
  for (const t of tables) {
    if (t.tag === 'cmap') return readCmapTable(data.subarray(offset, offset + t.length));
    offset += t.length;
  }
  throw new Error('woff2: no cmap table');
}
