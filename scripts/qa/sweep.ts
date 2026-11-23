/**
 * Layer 3 of the playtest QA: a screenshot of every screen (scripts/qa/lib/
 * targets.ts) in both languages at 390×844 (touch), 768×1024 and 1440×900,
 * with reduce-motion and high-contrast variants, plus the page checks in
 * lib/browser.ts and axe on each. Writes the screenshots, findings.json and
 * contact sheets (several screenshots to an image) for review.
 *
 *   npm run build && npx vite preview --port 4173 &
 *   node scripts/qa/sweep.ts --base http://localhost:4173/dark-reaction/ --out qa-sweep
 *
 * Options: --only <substring> (targets), --quick (one viewport per variant), --no-axe,
 * --serve <port> (build first; this starts `vite preview` on that port in the current
 * directory and stops it afterwards).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium, type Browser, type BrowserContext } from '@playwright/test';
import type { Locale } from '../../src/i18n/i18n.ts';
import { loadTarget, pageFindings, type PageFinding, type View } from './lib/browser.ts';
import { targets, type Target } from './lib/targets.ts';

const args = process.argv.slice(2);
const opt = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const serve = opt('serve');
const base = opt('base') ?? `http://localhost:${serve ?? 4173}/dark-reaction/`;
const out = opt('out') ?? 'qa-sweep';
const only = opt('only');
const quick = args.includes('--quick');
const axeOn = !args.includes('--no-axe');

interface Viewport {
  id: string;
  width: number;
  height: number;
  touch: boolean;
}
const VIEWPORTS: Viewport[] = [
  { id: '390', width: 390, height: 844, touch: true },
  { id: '768', width: 768, height: 1024, touch: false },
  { id: '1440', width: 1440, height: 900, touch: false },
];

interface Variant {
  id: 'default' | 'reduce-motion' | 'high-contrast' | 'largest-text';
  reduceMotion: boolean;
  highContrast: boolean;
  textSize?: 0 | 1 | 2 | 3;
  viewports: string[];
}
const VARIANTS: Variant[] = [
  { id: 'default', reduceMotion: false, highContrast: false, viewports: quick ? ['1440'] : ['390', '768', '1440'] },
  { id: 'reduce-motion', reduceMotion: true, highContrast: false, viewports: quick ? ['390'] : ['390', '1440'] },
  { id: 'high-contrast', reduceMotion: true, highContrast: true, viewports: quick ? ['1440'] : ['390', '1440'] },
  // The largest text size on a phone: Settings ran off the screen there and nothing else looked (#107).
  { id: 'largest-text', reduceMotion: true, highContrast: false, textSize: 3, viewports: ['390'] },
];
const LOCALES: Locale[] = ['en', 'zh-Hant-TW'];

export interface Shot {
  target: string;
  variant: string;
  viewport: string;
  locale: Locale;
  file: string;
  findings: PageFinding[];
  axe: Array<{ id: string; impact: string; nodes: number; help: string }>;
  errors: string[];
}

async function shoot(browser: Browser, target: Target, variant: Variant, vp: Viewport, locale: Locale): Promise<Shot> {
  const context: BrowserContext = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    hasTouch: vp.touch,
    isMobile: vp.touch,
    deviceScaleFactor: 1,
    reducedMotion: variant.reduceMotion ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  const view: View = { locale, reduceMotion: variant.reduceMotion, highContrast: variant.highContrast, ...(variant.textSize !== undefined ? { textSize: variant.textSize } : {}) };
  const dir = join(out, variant.id, vp.id, locale);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${target.name}.png`);
  let findings: PageFinding[] = [];
  let axe: Shot['axe'] = [];
  try {
    await loadTarget(page, base, target, view);
    // Checks first: a full-page screenshot leaves an emulated phone reporting a fine pointer afterwards,
    // so (pointer: coarse) layouts would be measured as the mouse ones.
    findings = await pageFindings(page, { touch: vp.touch, zh: locale === 'zh-Hant-TW' });
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
    if (axeOn && (vp.id === '1440' || vp.id === '390')) {
      // Infinite Loop's faded repeats of "Run it again" are decoration (aria-hidden; the epilogue says it in
      // words), which WCAG 1.4.3 exempts as incidental; axe can't tell, so they're left out of its check (#113).
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('.ending__again').analyze();
      axe = r.violations.map((v) => ({ id: v.id, impact: v.impact ?? 'unknown', nodes: v.nodes.length, help: v.help }));
    }
  } catch (e) {
    errors.push(`sweep: ${(e as Error).message.split('\n')[0]}`);
  }
  await context.close();
  return { target: target.name, variant: variant.id, viewport: vp.id, locale, file, findings, axe, errors };
}

/** Several screenshots to an image, labelled, for review. */
async function contactSheets(browser: Browser, shots: Shot[]): Promise<string[]> {
  const sheetsDir = join(out, 'sheets');
  mkdirSync(sheetsDir, { recursive: true });
  const groups = new Map<string, Shot[]>();
  for (const s of shots) {
    const key = `${s.variant}-${s.viewport}-${s.locale}`;
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  const files: string[] = [];
  const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
  for (const [key, list] of groups) {
    const perSheet = list[0]!.viewport === '390' ? 8 : 6;
    for (let i = 0; i < list.length; i += perSheet) {
      const chunk = list.slice(i, i + perSheet);
      const cols = list[0]!.viewport === '390' ? 4 : 3;
      const cells = chunk
        .map((s) => {
          let src = '';
          try {
            src = `data:image/png;base64,${readFileSync(s.file).toString('base64')}`;
          } catch {
            /* the shot failed */
          }
          return `<figure><figcaption>${s.target}</figcaption>${src ? `<img src="${src}">` : '<p>(no screenshot)</p>'}</figure>`;
        })
        .join('');
      await page.setContent(
        `<style>body{margin:0;background:#222;color:#eee;font:14px sans-serif}main{display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;padding:8px}figure{margin:0}figcaption{padding:2px 0}img{width:100%;max-height:${cols === 4 ? 1500 : 1100}px;object-fit:cover;object-position:top;display:block}</style><main>${cells}</main>`,
      );
      await page.waitForTimeout(100);
      const file = join(sheetsDir, `${key}-${String(i / perSheet + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: file, fullPage: true });
      files.push(file);
    }
  }
  await page.close();
  return files;
}

/** Start `vite preview` here and wait until it answers. */
async function startPreview(port: string): Promise<() => void> {
  const child = spawn('npx', ['vite', 'preview', '--port', port, '--strictPort'], { stdio: 'ignore', detached: true });
  const stop = () => {
    try {
      process.kill(-child.pid!);
    } catch {
      /* already gone */
    }
  };
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(base);
      if (r.ok) return stop;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  stop();
  throw new Error(`vite preview didn't answer on ${base}`);
}

async function main(): Promise<void> {
  const stopPreview = serve ? await startPreview(serve) : () => undefined;
  const list = targets().filter((t) => !only || t.name.includes(only));
  const browser = await chromium.launch();
  const jobs: Array<() => Promise<Shot>> = [];
  for (const variant of VARIANTS) {
    for (const vp of VIEWPORTS.filter((v) => variant.viewports.includes(v.id))) {
      for (const locale of LOCALES) for (const t of list) jobs.push(() => shoot(browser, t, variant, vp, locale));
    }
  }
  const shots: Shot[] = [];
  let next = 0;
  const started = Date.now();
  await Promise.all(
    Array.from({ length: 6 }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++]!;
        shots.push(await job());
        if (shots.length % 50 === 0) console.log(`  ${shots.length}/${jobs.length} screenshots (${((Date.now() - started) / 1000).toFixed(0)} s)`);
      }
    }),
  );
  shots.sort((a, b) => `${a.variant}${a.viewport}${a.locale}${a.target}`.localeCompare(`${b.variant}${b.viewport}${b.locale}${b.target}`));
  const sheets = await contactSheets(browser, shots);
  await browser.close();
  stopPreview();
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'findings.json'), JSON.stringify(shots, null, 2));
  const flagged = shots.filter((s) => s.findings.length || s.axe.length || s.errors.length);
  console.log(`\n${shots.length} screenshots, ${sheets.length} contact sheets in ${out}; ${flagged.length} with findings`);
  const tally = new Map<string, number>();
  for (const s of shots) {
    for (const f of s.findings) tally.set(f.check, (tally.get(f.check) ?? 0) + 1);
    for (const a of s.axe) tally.set(`axe:${a.id}`, (tally.get(`axe:${a.id}`) ?? 0) + 1);
    for (const e of s.errors) tally.set(`error:${e.slice(0, 60)}`, (tally.get(`error:${e.slice(0, 60)}`) ?? 0) + 1);
  }
  for (const [k, v] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
}

void main();
