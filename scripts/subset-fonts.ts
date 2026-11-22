/**
 * Build-time font pipeline. Collects every character the game can show,
 * subsets the self-hosted fonts to exactly those glyphs and writes WOFF2
 * files into src/assets/fonts/generated/, which Vite then fingerprints and
 * bundles. Fails if a player-visible character is missing from every font,
 * or if the total payload grows past the budget.
 *
 *   node scripts/subset-fonts.ts
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { readCodepoints } from './lib/cmap.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/assets/fonts/generated');
const require = createRequire(import.meta.url);
const BUDGET_BYTES = 1.5 * 1024 * 1024;

type Role = 'latin' | 'mono' | 'cjk';
interface FontSpec {
  file: string;
  source: string;
  role: Role;
}

const FONTS: FontSpec[] = [
  { file: 'source-serif-4-400.woff2', source: '@expo-google-fonts/source-serif-4/400Regular/SourceSerif4_400Regular.ttf', role: 'latin' },
  { file: 'source-serif-4-400-italic.woff2', source: '@expo-google-fonts/source-serif-4/400Regular_Italic/SourceSerif4_400Regular_Italic.ttf', role: 'latin' },
  { file: 'source-serif-4-600.woff2', source: '@expo-google-fonts/source-serif-4/600SemiBold/SourceSerif4_600SemiBold.ttf', role: 'latin' },
  { file: 'ibm-plex-mono-400.woff2', source: '@expo-google-fonts/ibm-plex-mono/400Regular/IBMPlexMono_400Regular.ttf', role: 'mono' },
  { file: 'ibm-plex-mono-500.woff2', source: '@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf', role: 'mono' },
  { file: 'noto-serif-tc-400.woff2', source: '@expo-google-fonts/noto-serif-tc/400Regular/NotoSerifTC_400Regular.ttf', role: 'cjk' },
];

/** Everything a player can type or that terminals print: printable ASCII. */
const ASCII = Array.from({ length: 0x7f - 0x20 }, (_, i) => 0x20 + i);
/** Typographic characters used across both locales, kept even if a scan misses them. */
const TYPOGRAPHY = [...'‘’“”–—…·•°×−±→←↑↓²³₂₃¹⁰ÅéèàçöüñØø€£']
  .map((c) => c.codePointAt(0)!);
/** CJK punctuation and full-width forms commonly needed in 繁中 text. */
const CJK_PUNCTUATION = [...'「」『』《》〈〉（）〔〕【】、，。；：？！…—～·　％＋－＝／０１２３４５６７８９']
  .map((c) => c.codePointAt(0)!);

const TEXT_EXTENSIONS = new Set(['.ts', '.css', '.html', '.json', '.svg', '.md']);

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (path.startsWith(outDir)) return [];
    if (statSync(path).isDirectory()) return walk(path);
    return TEXT_EXTENSIONS.has(extname(name)) ? [path] : [];
  });
}

function codepointsOf(text: string): Set<number> {
  const set = new Set<number>();
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0x20 && cp !== 0x7f && !(cp >= 0xfe00 && cp <= 0xfe0f)) set.add(cp);
  }
  return set;
}

function isCjk(cp: number): boolean {
  return (
    (cp >= 0x2e80 && cp <= 0x9fff) || // CJK radicals, symbols, kana, unified ideographs
    (cp >= 0xf900 && cp <= 0xfaff) || // compatibility ideographs
    (cp >= 0xfe30 && cp <= 0xfe4f) || // CJK compatibility forms
    (cp >= 0xff00 && cp <= 0xffef) || // half/full-width forms
    (cp >= 0x20000 && cp <= 0x2fa1f)
  );
}

const describe = (cp: number) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${String.fromCodePoint(cp)}`;

async function main(): Promise<void> {
  // 1. What can the player see? Locale tables are authoritative; everything
  //    else under src/ (UI chrome, SVG labels) is scanned generously.
  const files = [join(root, 'index.html'), ...walk(join(root, 'src'))];
  const localeFiles = files.filter((f) => f.includes(join('src', 'i18n')));
  const all = new Set<number>();
  const visible = new Set<number>();
  for (const file of files) {
    const cps = codepointsOf(readFileSync(file, 'utf8'));
    for (const cp of cps) all.add(cp);
    if (localeFiles.includes(file) || file.endsWith('index.html')) for (const cp of cps) visible.add(cp);
  }
  for (const cp of [...ASCII, ...TYPOGRAPHY]) all.add(cp);

  // 2. Load sources and their coverage.
  const loaded = FONTS.map((spec) => {
    const path = require.resolve(spec.source);
    const data = new Uint8Array(readFileSync(path));
    return { spec, data, coverage: readCodepoints(data) };
  });
  const latinRegular = loaded.find((f) => f.spec.file === 'source-serif-4-400.woff2')!;

  // 3. Every player-visible character must be drawable by some font.
  const covered = (cp: number) => loaded.some((f) => f.coverage.has(cp));
  const missing = [...visible].filter((cp) => !covered(cp) && cp !== 0x20);
  if (missing.length > 0) {
    console.error(`fonts: ${missing.length} player-visible character(s) have no glyph in any font:`);
    for (const cp of missing.slice(0, 40)) console.error(`  ${describe(cp)}`);
    process.exit(1);
  }
  const unseen = [...all].filter((cp) => !covered(cp) && !visible.has(cp));
  if (unseen.length > 0) {
    console.warn(`fonts: ignoring ${unseen.length} character(s) found only in code/comments with no glyph: ${unseen.slice(0, 12).map(describe).join(', ')}`);
  }

  // 4. Decide each font's glyph set.
  //    Latin and mono: everything they can draw that the game uses.
  //    CJK (Noto Serif TC): all CJK and full-width characters, plus ASCII and
  //    typography so Chinese text set in Noto keeps consistent Latin glyphs.
  const cjkChars = new Set<number>([...ASCII, ...TYPOGRAPHY, ...CJK_PUNCTUATION]);
  for (const cp of all) if (isCjk(cp) || !latinRegular.coverage.has(cp)) cjkChars.add(cp);

  mkdirSync(outDir, { recursive: true });
  let total = 0;
  const rows: string[] = [];
  for (const { spec, data, coverage } of loaded) {
    const wanted = spec.role === 'cjk' ? cjkChars : all;
    const glyphs = [...wanted].filter((cp) => coverage.has(cp));
    const text = String.fromCodePoint(...glyphs);
    const woff2 = await subsetFont(Buffer.from(data), text, { targetFormat: 'woff2' });
    writeFileSync(join(outDir, spec.file), woff2);
    total += woff2.length;
    rows.push(`  ${spec.file.padEnd(34)} ${String(glyphs.length).padStart(5)} glyphs  ${(woff2.length / 1024).toFixed(1).padStart(7)} KiB`);
  }
  const manifest = {
    generatedFrom: relative(root, join(root, 'src')),
    characters: all.size,
    cjkCharacters: [...cjkChars].filter(isCjk).length,
    totalBytes: total,
  };
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  console.log(`fonts: ${all.size} characters in use (${manifest.cjkCharacters} CJK)`);
  console.log(rows.join('\n'));
  console.log(`  ${'total'.padEnd(34)} ${''.padStart(12)}  ${(total / 1024).toFixed(1).padStart(7)} KiB (budget ${(BUDGET_BYTES / 1024).toFixed(0)} KiB)`);
  if (total > BUDGET_BYTES) {
    console.error('fonts: total payload is over budget.');
    process.exit(1);
  }
}

await main();
