/**
 * Content validator (npm run validate). Fails on any error:
 *   - content loads (engine shape and reference checks)
 *   - graph: every scene reachable, no dead ends, every choice says or does something
 *   - locales: identical keys, no empty strings, matching placeholders, every used key present
 *   - routes: one per ending, each played through the engine and rendered in both locales
 *   - playtime: the critical path to the true ending is at least 30 minutes in each locale
 *   - fuzz: random walks never throw and never leave the player with nothing to do
 * and reports content size (English words, Chinese characters).
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CONTENT } from '../src/content/index.ts';
import { ROUTES, type Route } from '../src/content/routes.ts';
import { TABLES } from '../src/i18n/i18n.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';
import {
  checkCoverage,
  checkGraph,
  checkLoad,
  checkLocales,
  checkRoutes,
  codeKeys,
  contentSize,
  CPM_ZH,
  fuzz,
  MIN_CRITICAL_PATH,
  referencedKeys,
  WPM_EN,
  type Problem,
} from './lib/validator.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems: Problem[] = [];
const section = (title: string) => console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
const report = (list: Problem[], ok: string) => {
  problems.push(...list);
  const errors = list.filter((p) => p.level === 'error');
  const warnings = list.filter((p) => p.level === 'warning');
  for (const p of errors) console.log(`  ✗ ${p.message}`);
  for (const p of warnings.slice(0, 12)) console.log(`  ! ${p.message}`);
  if (warnings.length > 12) console.log(`  ! …and ${warnings.length - 12} more warnings`);
  if (errors.length === 0) console.log(`  ✓ ${ok}`);
};

section('Content');
report(checkLoad(CONTENT), `${CONTENT.scenes.length} scenes, ${CONTENT.scenes.reduce((n, s) => n + s.choices.length, 0)} choices, ${CONTENT.notebook.length} notebook entries, ${CONTENT.puzzles.length} puzzles, ${CONTENT.endings.length} endings load cleanly`);

section('Graph');
report(checkGraph(CONTENT), 'every scene is reachable, nothing is a dead end, every choice says or does something');

section('Locales');
const used = new Map([...referencedKeys(CONTENT), ...codeKeys(join(root, 'src'))]);
report(checkLocales(TABLES, used), `${Object.keys(TABLES.en).length} keys in both locales with matching placeholders; ${used.size} keys used by content and code all present`);

section('Routes');
const routes = Object.values(ROUTES).filter((r): r is Route => !!r);
const { problems: routeProblems, reports } = checkRoutes(CONTENT, PUZZLE_LOGIC, routes);
report(routeProblems, routes.length ? `${routes.length} route(s) reach their endings and render in both locales` : 'no routes yet (endings arrive in M5)');
for (const r of reports.filter((x) => x.ok)) {
  console.log(`    ${r.ending.padEnd(9)} ${String(r.steps).padStart(4)} steps, ${r.loops} loop(s), ${r.minutes.en.toFixed(1)} min EN / ${r.minutes.zh.toFixed(1)} min 繁中`);
}

section('Endings and playtime');
report(checkCoverage(CONTENT, routes, reports), CONTENT.endings.length ? 'every ending has a route' : 'no endings defined yet');
const dark = reports.find((r) => r.ending === 'dark' && r.ok);
if (dark) {
  console.log(`  Critical path to the true ending (${WPM_EN} wpm EN, ${CPM_ZH} cpm 繁中, plus puzzle par times):`);
  for (const [act, w] of Object.entries(dark.byAct)) {
    console.log(`    Act ${act}: ${w.en} words, ${w.zh} characters`);
  }
  console.log(`    puzzles: ${dark.parMinutes.toFixed(1)} min par`);
  console.log(`    total: ${dark.minutes.en.toFixed(1)} min EN, ${dark.minutes.zh.toFixed(1)} min 繁中 (minimum ${MIN_CRITICAL_PATH})`);
} else {
  console.log('  Critical path: pending until the true ending and its route exist (M5).');
}

section('Fuzz');
const f = fuzz(CONTENT, PUZZLE_LOGIC, 40, 400);
const reached = Object.entries(f.endings).map(([k, v]) => `${k} ×${v}`).join(', ') || 'none';
report(f.problems, `40 random walks of up to 400 steps: no crashes, never stuck (endings reached by chance: ${reached})`);

section('Size');
const size = contentSize(TABLES);
console.log(`  English: ${size.en.toLocaleString('en-GB')} words · 繁中: ${size.zh.toLocaleString('en-GB')} characters`);

const errors = problems.filter((p) => p.level === 'error').length;
const warnings = problems.filter((p) => p.level === 'warning').length;
console.log(`\n${errors ? '✗' : '✓'} validate: ${errors} error(s), ${warnings} warning(s)`);
process.exit(errors ? 1 : 0);
