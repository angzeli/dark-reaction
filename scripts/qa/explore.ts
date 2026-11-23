/**
 * Layer 1 of the playtest QA, from the command line (docs/qa/README.md):
 *
 *   node scripts/qa/explore.ts                 # the CI-sized run
 *   node scripts/qa/explore.ts --long          # the nightly run
 *   node scripts/qa/explore.ts --out qa-out    # also write report.md and report.json there
 *
 * Options: --per-minute N, --nights-after N, --branches N, --max-states N,
 * --fuzz-seeds N, --fuzz-steps N, --first-seed N.
 * Exits 1 if anything at level "error" was found.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT } from '../../src/content/index.ts';
import { ROUTES, type Route } from '../../src/content/routes.ts';
import { t } from '../../src/i18n/i18n.ts';
import { PUZZLE_LOGIC } from '../../src/puzzles/logic.ts';
import { explore, type ExploreReport } from './lib/explorer.ts';
import { fuzz, type FuzzReport } from './lib/fuzzer.ts';
import { defaultRoots } from './lib/roots.ts';
import { DESIGN_STATE_CHECKS } from './lib/design.ts';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(`--${name}`);
const num = (name: string, fallback: number) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const str = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const long = flag('long');
const opts = {
  perMinute: num('per-minute', long ? 400 : 40),
  nightsAfter: num('nights-after', long ? 2 : 1),
  branches: num('branches', long ? 4 : 2),
  maxStates: num('max-states', long ? 8_000_000 : 600_000),
  fuzzSeeds: num('fuzz-seeds', long ? 5000 : 300),
  fuzzSteps: num('fuzz-steps', long ? 1500 : 600),
  firstSeed: num('first-seed', 1),
};
const stateChecks = [...DESIGN_STATE_CHECKS];

const routes = Object.values(ROUTES) as Route[];
const roots = defaultRoots(CONTENT, PUZZLE_LOGIC, routes);
const ex = explore(CONTENT, PUZZLE_LOGIC, roots, { ...opts, seed: opts.firstSeed, stateChecks });
const fz = fuzz(CONTENT, PUZZLE_LOGIC, { seeds: opts.fuzzSeeds, maxSteps: opts.fuzzSteps, firstSeed: opts.firstSeed, stateChecks });

const errors = [...ex.findings, ...fz.findings].filter((f) => f.level === 'error');
console.log(summary(ex, fz));
const out = str('out');
if (out) {
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'report.md'), markdown(ex, fz));
  writeFileSync(
    join(out, 'report.json'),
    JSON.stringify(
      {
        options: opts,
        explore: { ...ex, coverage: undefined, audit: undefined, findings: ex.findings },
        fuzz: fz,
      },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${join(out, 'report.md')} and report.json`);
}
process.exit(errors.length ? 1 : 0);

// ── Reports ────────────────────────────────────────────────────────────────

function summary(e: ExploreReport, f: FuzzReport): string {
  const lines = [
    `── Explorer ──  ${e.states.toLocaleString()} states, ${e.transitions.toLocaleString()} transitions, ${e.nights.length} nights (${e.nights.filter((n) => n.exhaustive).length} exhaustive), ${(e.millis / 1000).toFixed(1)} s${e.budgetHit ? ' (state budget hit)' : ''}`,
    `   endings reached: ${Object.entries(e.endings).map(([k, v]) => `${k} ×${v}`).join(', ') || 'none'}`,
    `   unreachable: ${e.unreachable.choices.length} choices, ${e.unreachable.scenes.length} scenes, ${e.unreachable.notebook.length} notebook entries, ${e.unreachable.events.length} events, ${e.unreachable.text.length} text keys`,
    `── Fuzzer ──  ${f.runs} runs, ${f.steps.toLocaleString()} steps, ${(f.millis / 1000).toFixed(1)} s; endings ${Object.entries(f.endings).map(([k, v]) => `${k} ×${v}`).join(', ')}`,
    '',
  ];
  for (const x of [...e.findings, ...f.findings]) lines.push(`${x.level.toUpperCase()} [${x.check}] ×${x.count}: ${x.message}`);
  if (!e.findings.length && !f.findings.length) lines.push('No findings.');
  return lines.join('\n');
}

function markdown(e: ExploreReport, f: FuzzReport): string {
  const L: string[] = [];
  L.push('# Layer 1: state exploration report', '');
  L.push(`Options: \`${JSON.stringify(opts)}\``, '');
  L.push('## Summary', '');
  L.push('| | |', '|---|---|');
  L.push(`| States | ${e.states.toLocaleString()} |`);
  L.push(`| Transitions | ${e.transitions.toLocaleString()} |`);
  L.push(`| Nights searched | ${e.nights.length} (${e.nights.filter((n) => n.exhaustive).length} exhaustive, the rest sampled at ${opts.perMinute} states a minute) |`);
  L.push(`| Endings reached | ${Object.entries(e.endings).map(([k, v]) => `${k} ×${v}`).join(', ')} |`);
  L.push(`| Expanded states with no ending reachable | ${e.noEnding} |`);
  L.push(`| Expanded states with the true ending unreachable (explored graph) | ${e.noDark} |`);
  L.push(`| Fuzz runs / steps | ${f.runs} / ${f.steps.toLocaleString()} |`);
  L.push(`| Fuzz endings | ${Object.entries(f.endings).map(([k, v]) => `${k} ×${v}`).join(', ')} |`);
  L.push('');
  L.push('## Findings', '');
  const all = [...e.findings.map((x) => ({ ...x, from: 'explorer' })), ...f.findings.map((x) => ({ ...x, from: `fuzz seed ${x.seed}` }))];
  if (!all.length) L.push('None.', '');
  for (const x of all) {
    L.push(`### ${x.level} · ${x.check} · ×${x.count}`, '', x.message, '', `Found by the ${x.from}. Steps:`, '', '```', ...x.repro.slice(-40), '```', '');
  }
  L.push('## Never shown', '');
  L.push(`- **Choices:** ${e.unreachable.choices.join(', ') || 'none'}`);
  L.push(`- **Scenes:** ${e.unreachable.scenes.join(', ') || 'none'}`);
  L.push(`- **Notebook entries:** ${e.unreachable.notebook.join(', ') || 'none'}`);
  L.push(`- **Events:** ${e.unreachable.events.join(', ') || 'none'}`);
  L.push(`- **Text keys:** ${e.unreachable.text.join(', ') || 'none'}`, '');
  L.push('## Nights', '', '| Night | Act | States expanded | Exhaustive | Next nights | Endings |', '|---|---|---|---|---|---|');
  for (const n of e.nights) L.push(`| ${n.label} | ${n.act} | ${n.states.toLocaleString()} | ${n.exhaustive ? 'yes' : 'sampled'} | ${n.outcomes} | ${n.endings.join(', ')} |`);
  L.push('', '## What each choice says and does', '');
  L.push('For reviewing promises against effects: the label, the minutes shown and taken, and what it changed every time it was taken.', '');
  L.push('| Choice | Label (en) | Shown | Took | Gains | Losses | Opens / goes | First result (en) |', '|---|---|---|---|---|---|---|---|');
  const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  for (const [id, a] of [...e.audit].sort(([x], [y]) => x.localeCompare(y))) {
    const def = CONTENT.scenes.flatMap((s) => s.choices).find((c) => c.id === id);
    const label = def ? t(def.label, undefined, 'en') : id;
    const first = a.firstText.map((k) => t(k, undefined, 'en')).join(' ').slice(0, 140);
    L.push(
      `| \`${id}\` | ${cell(label)} | ${[...a.shown].join('/')} | ${[...a.minutes].sort((x, y) => x - y).join('/')} | ${[...a.gained].join(', ')} | ${[...a.lost].join(', ')} | ${[...a.opened, ...a.scenes].join(', ')} | ${cell(first)} |`,
    );
  }
  return L.join('\n') + '\n';
}
