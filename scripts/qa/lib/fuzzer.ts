/**
 * Layer 1's random walker: seeded runs that play like a chaotic person.
 * It repeats what it just did, reaches for things it has never tried (so
 * it breaks sequences), leaves puzzles half done or fails them, strikes
 * fudges through at odd moments, burns whole nights waiting for 03:33, and
 * saves and reloads between moves, checking the reloaded game plays on
 * exactly as the original would. Every step is checked (checks.ts).
 */
import { Game, newGameState } from '../../../src/engine/engine.ts';
import type { Content, EndingId, GameState } from '../../../src/engine/types.ts';
import { SaveStore } from '../../../src/save/saves.ts';
import { memoryStorage } from '../../../src/save/storage.ts';
import { checkState, checkStep, type Finding } from './checks.ts';
import { analyse, type Model } from './model.ts';
import { actionLabel, actions, stateKey, step, type Action, type LogicTable } from './play.ts';

export interface FuzzOptions {
  seeds: number;
  /** First seed (runs use firstSeed … firstSeed + seeds − 1). */
  firstSeed?: number;
  maxSteps: number;
  /** Check save/load and both languages on every state (slower). Default: every 10th step. */
  checkEvery?: number;
  stateChecks?: Array<(model: Model, state: GameState) => Finding[]>;
}

export interface FuzzFinding extends Finding {
  count: number;
  seed: number;
  /** Actions from a new game to the step that showed it. */
  repro: string[];
}

export interface FuzzReport {
  runs: number;
  steps: number;
  endings: Partial<Record<EndingId | 'none', number>>;
  loops: { max: number; mean: number };
  findings: FuzzFinding[];
  millis: number;
}

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const same = (a: Action, b: Action) => actionLabel(a) === actionLabel(b);

/** One chaotic player's next move. */
function choose(random: () => number, options: Action[], last: Action | null, tried: Set<string>, mood: { wait: boolean }): Action {
  const pick = <T>(xs: T[]) => xs[Math.floor(random() * xs.length)]!;
  // Mid-puzzle: mostly solve, sometimes give up or run out the clock.
  if (options[0]?.t === 'pz') {
    const r = random();
    const by = (o: string) => options.find((a) => a.t === 'pz' && a.o === o);
    if (r < 0.55) return by('solve') ?? pick(options);
    if (r < 0.7) return by('leave') ?? pick(options);
    if (r < 0.82) return by('fiddle') ?? pick(options);
    if (r < 0.92) return by('fail') ?? pick(options);
    return by('timeout') ?? pick(options);
  }
  // Some nights it just waits for the dark.
  if (mood.wait) {
    const w = options.find((a) => a.t === 'wait' && a.n === 10) ?? options.find((a) => a.t === 'c' && a.id === 'meta:back');
    if (w) return w;
  }
  const r = random();
  // The same thing again (spam).
  if (last && r < 0.2) {
    const again = options.find((a) => same(a, last));
    if (again) return again;
  }
  // Something never tried before (sequence breaks, out of order).
  if (r < 0.55) {
    const fresh = options.filter((a) => !tried.has(actionLabel(a)));
    if (fresh.length) return pick(fresh);
  }
  // Otherwise: content choices most of the time, walks and waits some of the time.
  const content = options.filter((a) => a.t === 'c' || a.t === 'fix');
  if (content.length && random() < 0.65) return pick(content);
  return pick(options);
}

export function fuzz(content: Content, logic: LogicTable, opts: FuzzOptions): FuzzReport {
  const started = Date.now();
  const model = analyse(content);
  const found = new Map<string, FuzzFinding>();
  const endings: FuzzReport['endings'] = {};
  let steps = 0;
  let loopsTotal = 0;
  let loopsMax = 0;
  const first = opts.firstSeed ?? 1;
  const every = opts.checkEvery ?? 10;

  for (let seed = first; seed < first + opts.seeds; seed++) {
    const random = rng(seed);
    let state = newGameState(content);
    state.cards = [];
    const trail: string[] = [];
    const tried = new Set<string>();
    let last: Action | null = null;
    const mood = { wait: false };
    let nightOf = state.loop;
    const report = (list: Finding[]) => {
      for (const fi of list) {
        const prev = found.get(fi.sig);
        if (prev) prev.count++;
        else found.set(fi.sig, { ...fi, count: 1, seed, repro: [...trail] });
      }
    };
    for (let i = 0; i < opts.maxSteps && !state.ending; i++) {
      const game = new Game(content, state);
      const options = actions(game);
      if (!options.length) {
        report([{ level: 'error', check: 'softlock', sig: `softlock|fuzz|${state.scene}`, message: `nothing to do in ${state.scene} at loop ${state.loop}, minute ${state.minute}` }]);
        break;
      }
      if (state.loop !== nightOf) {
        nightOf = state.loop;
        mood.wait = random() < 0.08;
      }
      const action = choose(random, options, last, tried, mood);
      trail.push(actionLabel(action));
      tried.add(actionLabel(action));
      let next;
      try {
        next = step(model, logic, state, action);
      } catch (e) {
        report([{ level: 'error', check: 'throws', sig: `throws|fuzz|${state.scene}|${actionLabel(action)}|${(e as Error).message}`, message: `${actionLabel(action)} in ${state.scene} at loop ${state.loop}, minute ${state.minute} threw: ${(e as Error).message}` }]);
        break;
      }
      steps++;
      report(checkStep(model, state, action, next));
      if (i % every === 0 || next.cards.length) {
        report(checkState(model, next.state));
        for (const extra of opts.stateChecks ?? []) report(extra(model, next.state));
      }
      // Now and then: save, reload, and check the reloaded game plays on exactly as the original.
      if (random() < 0.05 && !next.state.ending) {
        const store = new SaveStore(memoryStorage(), { content });
        store.write('auto', next.state);
        const r = store.read('auto');
        if (!r.ok) report([{ level: 'error', check: 'save', sig: `fuzz-read|${r.reason}`, message: `a save at ${next.state.scene} wouldn't load: ${r.reason}` }]);
        else {
          const reloaded = r.envelope.state;
          const probe = actions(new Game(content, next.state))[0];
          if (probe) {
            try {
              const a = step(model, logic, next.state, probe).state;
              const b = step(model, logic, reloaded, probe).state;
              if (stateKey(model, a) !== stateKey(model, b) || JSON.stringify(a.display) !== JSON.stringify(b.display)) {
                report([{ level: 'error', check: 'save', sig: `fuzz-diverge|${next.state.scene}|${actionLabel(probe)}`, message: `after a reload at ${next.state.scene}, ${actionLabel(probe)} plays differently` }]);
              }
            } catch {
              /* reported by the main path when it gets there */
            }
          }
          next = { ...next, state: reloaded };
        }
      }
      state = next.state;
      last = action;
    }
    const e = state.ending ?? 'none';
    endings[e] = (endings[e] ?? 0) + 1;
    loopsTotal += state.loop;
    loopsMax = Math.max(loopsMax, state.loop);
  }
  return {
    runs: opts.seeds,
    steps,
    endings,
    loops: { max: loopsMax, mean: loopsTotal / Math.max(1, opts.seeds) },
    findings: [...found.values()].sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1)),
    millis: Date.now() - started,
  };
}
