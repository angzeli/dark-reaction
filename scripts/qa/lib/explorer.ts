/**
 * Layer 1 of the playtest QA (docs/qa/): every reachable state of a night,
 * from a new game and from the 02:47 of every night the scripted routes pass
 * through, and then the nights those nights lead to. States that play the
 * same are merged (play.ts `stateKey`); every transition and every new state
 * is checked (checks.ts).
 *
 * A night is searched minute by minute. While a minute has no more states
 * than `perMinute`, the search is exhaustive; past that, a fixed sample of
 * that minute's states goes on (seeded, so runs repeat), and the report says
 * the night was sampled. A night has millions of distinct states (fragments,
 * rests, fudges and puzzles can be taken in any order), so whole-game
 * exhaustion isn't possible; every night still gets searched to 03:33.
 *
 * Afterwards the explored graph says which states can still reach an
 * ending, and which the true ending, and what content no state ever showed.
 */
import { LOOP_LENGTH } from '../../../src/engine/clock.ts';
import { Game } from '../../../src/engine/engine.ts';
import type { Content, EndingId, GameState, TextRef } from '../../../src/engine/types.ts';
import { checkState, checkStep, type Finding } from './checks.ts';
import { analyse, type Model } from './model.ts';
import { actionLabel, actions, hash, stateKey, step, type Action, type LogicTable, type Step } from './play.ts';

export interface Root {
  /** How this state was reached, for repro steps (e.g. "dark route, 02:47 of loop 3"). */
  label: string;
  state: GameState;
  /** Later states of the same night (a scripted route's), always expanded so sampling can't lose the way forward. */
  anchors?: GameState[];
}

export interface ExploreOptions {
  /** Stop after this many distinct states in all. */
  maxStates: number;
  /** States expanded per minute of a night before the rest of that minute is sampled. */
  perMinute: number;
  /** Nights to follow beyond each root's own (0: only the roots' nights). */
  nightsAfter: number;
  /** Next nights followed from each night, at most (sampled when there are more). */
  branches: number;
  /** Check save/load on every new state (slower). Default true. */
  saves?: boolean;
  /** Extra checks on every new state (e.g. the affordance checks). */
  stateChecks?: Array<(model: Model, state: GameState) => Finding[]>;
  seed?: number;
}

export interface Reported extends Finding {
  count: number;
  /** Steps from a root to the first state that showed it. */
  repro: string[];
}

export interface Coverage {
  choicesSeen: Set<string>;
  choicesUsed: Set<string>;
  scenes: Set<string>;
  learned: Set<string>;
  events: Set<string>;
  keysShown: Set<string>;
  puzzlesOpened: Set<string>;
  puzzlesSolved: Set<string>;
}

export interface ChoiceAudit {
  id: string;
  uses: number;
  minutes: Set<number>;
  shown: Set<number>;
  gained: Set<string>;
  lost: Set<string>;
  opened: Set<string>;
  scenes: Set<string>;
  firstText: string[];
}

export interface NightSummary {
  label: string;
  act: number;
  loop: number;
  states: number;
  exhaustive: boolean;
  outcomes: number;
  endings: EndingId[];
}

export interface ExploreReport {
  states: number;
  transitions: number;
  nights: NightSummary[];
  endings: Partial<Record<EndingId, number>>;
  findings: Reported[];
  coverage: Coverage;
  unreachable: { choices: string[]; scenes: string[]; notebook: string[]; events: string[]; text: string[] };
  /** Expanded states with no path to any ending / to the true ending inside the explored graph (unexpanded states count as able to). */
  noEnding: number;
  noDark: number;
  audit: Map<string, ChoiceAudit>;
  millis: number;
  budgetHit: boolean;
}

class Growable {
  a = new Int32Array(1 << 16);
  n = 0;
  push(x: number): void {
    if (this.n === this.a.length) {
      const b = new Int32Array(this.a.length * 2);
      b.set(this.a);
      this.a = b;
    }
    this.a[this.n++] = x;
  }
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function sample<T>(items: T[], n: number, random: () => number): T[] {
  if (items.length <= n) return items;
  const copy = items.slice();
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, n);
}

export function textKeys(content: Content): Set<string> {
  const keys = new Set<string>();
  const add = (list: readonly TextRef[] | undefined) => list?.forEach((r) => keys.add(r.key));
  add(content.loopStart);
  for (const s of content.scenes) {
    add(s.text);
    for (const c of s.choices) add(c.text);
  }
  for (const e of content.events) add(e.text);
  for (const r of content.lightsOut) add(r.text);
  for (const p of content.puzzles) {
    add(p.solvedText);
    add(p.failedText);
    add(p.leftText);
  }
  return keys;
}

export function explore(content: Content, logic: LogicTable, roots: Root[], opts: ExploreOptions): ExploreReport {
  const started = Date.now();
  const model: Model = analyse(content);
  const random = rng(opts.seed ?? 1);
  const ids = new Map<number, number>();
  const parent: number[] = [];
  const via: string[] = [];
  const rootLabel = new Map<number, string>();
  const expanded: boolean[] = [];
  const endingOf = new Map<number, EndingId>();
  const from = new Growable();
  const to = new Growable();
  const found = new Map<string, Reported>();
  const audit = new Map<string, ChoiceAudit>();
  const nights: NightSummary[] = [];
  const coverage: Coverage = {
    choicesSeen: new Set(),
    choicesUsed: new Set(),
    scenes: new Set(),
    learned: new Set(),
    events: new Set(),
    keysShown: new Set(),
    puzzlesOpened: new Set(),
    puzzlesSolved: new Set(),
  };
  let transitions = 0;
  let budgetHit = false;
  const saves = opts.saves ?? true;

  const path = (id: number): string[] => {
    const out: string[] = [];
    let cur = id;
    while (parent[cur]! >= 0) {
      out.push(via[cur]!);
      cur = parent[cur]!;
    }
    out.push(`[${rootLabel.get(cur) ?? 'start'}]`);
    return out.reverse();
  };
  const report = (list: Finding[], at: number, extra?: string) => {
    for (const fi of list) {
      const prev = found.get(fi.sig);
      if (prev) prev.count += 1;
      else found.set(fi.sig, { ...fi, count: 1, repro: extra ? [...path(at), extra] : path(at) });
    }
  };
  /** What a state shows, counted on every transition (a look that repeats a page leads to a state already seen). */
  const observeShown = (s: GameState, cards: Step['cards'] = []) => {
    coverage.scenes.add(s.scene);
    for (const k of s.known) coverage.learned.add(k.id);
    for (const e of s.firedEvents) coverage.events.add(e);
    for (const p of s.display) coverage.keysShown.add(p.key);
    for (const c of cards) if (c.kind === 'lightsout') for (const p of c.before) coverage.keysShown.add(p.key);
    if (s.puzzle) coverage.puzzlesOpened.add(s.puzzle);
    for (const p of s.solved) coverage.puzzlesSolved.add(p);
  };
  const observe = (s: GameState) => {
    observeShown(s);
    if (!s.ending && !s.puzzle) for (const c of new Game(content, s).choices()) if (c.kind === 'normal') coverage.choicesSeen.add(c.id);
  };
  const checkNew = (id: number, s: GameState) => {
    report(checkState(model, s, { saves }), id);
    for (const extra of opts.stateChecks ?? []) report(extra(model, s), id);
  };
  const add = (state: GameState, parentId: number, label: string): { id: number; fresh: boolean } => {
    const h = hash(stateKey(model, state));
    const existing = ids.get(h);
    if (existing !== undefined) return { id: existing, fresh: false };
    const id = parent.length;
    ids.set(h, id);
    parent.push(parentId);
    via.push(label);
    expanded.push(false);
    if (state.ending) endingOf.set(id, state.ending);
    observe(state);
    return { id, fresh: true };
  };

  /** Search one night from its 02:47 (or wherever `start` is). Returns the 02:47s it leads to. */
  const night = (start: { id: number; state: GameState }, label: string, anchors: GameState[] = []): Array<{ id: number; state: GameState }> => {
    // Each minute keeps at most `perMinute` states to expand: a uniform (reservoir) sample once more arrive.
    const buckets: Array<Array<{ id: number; state: GameState }>> = Array.from({ length: LOOP_LENGTH + 1 }, () => []);
    const arrived = new Array<number>(LOOP_LENGTH + 1).fill(0);
    let exhaustive = true;
    const enqueue = (item: { id: number; state: GameState }, pos: number) => {
      const m = Math.min(LOOP_LENGTH, item.state.minute);
      const bucket = buckets[m]!;
      arrived[m]!++;
      // A state arriving in the minute being worked through joins it unless that minute is full.
      if (bucket.length - (m === current ? pos : 0) < opts.perMinute) {
        bucket.push(item);
        return;
      }
      exhaustive = false;
      const j = Math.floor(random() * arrived[m]!);
      const lo = m === current ? pos + 1 : 0;
      if (j < opts.perMinute && bucket.length > lo) bucket[lo + Math.floor(random() * (bucket.length - lo))] = item;
    };
    let current = start.state.minute;
    buckets[current]!.push(start);
    const loop = start.state.loop;
    const nexts = new Map<number, { id: number; state: GameState }>();
    const ends = new Set<EndingId>();
    let states = 0;
    // Anchors join their minute first, chained to the root so their repro starts from it.
    const anchored = new Map<number, Array<{ id: number; state: GameState }>>();
    let prev = start.id;
    for (const a of anchors) {
      if (a.loop !== start.state.loop || a.ending) continue;
      const { id } = add(a, prev, '(scripted route)');
      prev = id;
      const list = anchored.get(a.minute) ?? [];
      list.push({ id, state: a });
      anchored.set(a.minute, list);
    }
    for (let m = start.state.minute; m <= LOOP_LENGTH; m++) {
      current = m;
      const bucket = buckets[m]!;
      bucket.unshift(...(anchored.get(m) ?? []));
      // Puzzles open and close in the same minute, so a bucket can grow while it is worked through.
      for (let i = 0; i < bucket.length; i++) {
        if (parent.length >= opts.maxStates) {
          budgetHit = true;
          exhaustive = false;
          break;
        }
        const { id, state } = bucket[i]!;
        if (expanded[id]) continue;
        expanded[id] = true;
        states++;
        if (id !== start.id) checkNew(id, state);
        for (const action of actions(new Game(content, state))) {
          let next: Step;
          try {
            next = step(model, logic, state, action);
          } catch (e) {
            const msg = (e as Error).message;
            report([{ level: 'error', check: 'throws', sig: `throws|${state.scene}|${actionLabel(action)}|${msg}`, message: `${actionLabel(action)} in ${state.scene} at loop ${state.loop}, minute ${state.minute} threw: ${msg}` }], id, actionLabel(action));
            continue;
          }
          transitions++;
          report(checkStep(model, state, action, next), id, actionLabel(action));
          observeShown(next.state, next.cards);
          if (action.t === 'c') auditChoice(audit, action, state, next);
          const { id: nid, fresh } = add(next.state, id, actionLabel(action));
          from.push(id);
          to.push(nid);
          if (!fresh) continue;
          const s = next.state;
          if (s.ending) {
            ends.add(s.ending);
            checkNew(nid, s);
          } else if (s.loop !== loop) {
            nexts.set(nid, { id: nid, state: s });
            checkNew(nid, s);
          } else enqueue({ id: nid, state: s }, i);
        }
      }
      buckets[m] = [];
    }
    nights.push({ label, act: start.state.act, loop, states, exhaustive, outcomes: nexts.size, endings: [...ends] });
    return [...nexts.values()];
  };

  let frontier: Array<{ id: number; state: GameState; label: string; depth: number; anchors?: GameState[] }> = [];
  for (const root of roots) {
    const { id, fresh } = add(root.state, -1, '');
    if (!fresh) {
      // The same 02:47 reached by another route: keep this route's way through the night too.
      const same = frontier.find((x) => x.id === id);
      if (same && root.anchors) same.anchors = [...(same.anchors ?? []), ...root.anchors];
      continue;
    }
    rootLabel.set(id, root.label);
    checkNew(id, root.state);
    frontier.push({ id, state: root.state, label: root.label, depth: 0, ...(root.anchors ? { anchors: root.anchors } : {}) });
  }
  while (frontier.length && !budgetHit) {
    const next: typeof frontier = [];
    for (const item of frontier) {
      if (budgetHit) break;
      const outcomes = night(item, item.label, item.anchors);
      if (item.depth < opts.nightsAfter) {
        for (const o of sample(outcomes, opts.branches, random)) {
          next.push({ ...o, label: `${item.label} → loop ${o.state.loop}`, depth: item.depth + 1 });
        }
      }
    }
    frontier = next;
  }

  // ── What can still end, and what can still end well ──
  const n = parent.length;
  const rev: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < from.n; i++) rev[to.a[i]!]!.push(from.a[i]!);
  const reach = (goal: (id: number) => boolean): Uint8Array => {
    const ok = new Uint8Array(n);
    const stack: number[] = [];
    for (let i = 0; i < n; i++) {
      // Goals, and every state never expanded (unknown, so assumed able).
      if (goal(i) || (!expanded[i] && !endingOf.has(i))) {
        ok[i] = 1;
        stack.push(i);
      }
    }
    while (stack.length) {
      const cur = stack.pop()!;
      for (const p of rev[cur]!) {
        if (!ok[p]) {
          ok[p] = 1;
          stack.push(p);
        }
      }
    }
    return ok;
  };
  const anyEnding = reach((i) => endingOf.has(i));
  const toDark = reach((i) => endingOf.get(i) === 'dark');
  let noEnding = 0;
  let noDark = 0;
  for (let i = 0; i < n; i++) {
    if (!expanded[i]) continue;
    if (!anyEnding[i]) {
      noEnding++;
      if (noEnding <= 3) report([{ level: 'error', check: 'softlock', sig: `noending|${i}`, message: `no ending can be reached from here (state ${i})` }], i);
    }
    if (!toDark[i]) {
      noDark++;
      if (noDark <= 3) report([{ level: 'info', check: 'no-return', sig: `nodark|${i}`, message: `the true ending can't be reached from here within the explored graph (state ${i})` }], i);
    }
  }

  const endings: Partial<Record<EndingId, number>> = {};
  for (const e of endingOf.values()) endings[e] = (endings[e] ?? 0) + 1;
  for (const [id, a] of audit) if (a.uses) coverage.choicesUsed.add(id);

  return {
    states: n,
    transitions,
    nights,
    endings,
    findings: [...found.values()].sort((a, b) => order(a) - order(b) || a.check.localeCompare(b.check)),
    coverage,
    unreachable: {
      choices: [...model.choices.keys()].filter((c) => !coverage.choicesSeen.has(c)),
      scenes: content.scenes.map((s) => s.id).filter((s) => !coverage.scenes.has(s)),
      notebook: content.notebook.map((x) => x.id).filter((x) => !coverage.learned.has(x)),
      events: content.events.map((e) => e.id).filter((e) => !coverage.events.has(e)),
      text: [...textKeys(content)].filter((k) => !coverage.keysShown.has(k)),
    },
    noEnding,
    noDark,
    audit,
    millis: Date.now() - started,
    budgetHit,
  };
}

const order = (f: Finding) => (f.level === 'error' ? 0 : f.level === 'warning' ? 1 : 2);

function auditChoice(audit: Map<string, ChoiceAudit>, action: Action & { t: 'c' }, before: GameState, next: Step): void {
  if (action.id.startsWith('meta:')) return;
  const a =
    audit.get(action.id) ??
    ({ id: action.id, uses: 0, minutes: new Set(), shown: new Set(), gained: new Set(), lost: new Set(), opened: new Set(), scenes: new Set(), firstText: [] } satisfies ChoiceAudit);
  audit.set(action.id, a);
  const after = next.state;
  a.uses++;
  if (next.shownCost !== undefined) a.shown.add(next.shownCost);
  // What the choice itself does: a choice that runs into 03:33 also gets the night's reset, which isn't its doing.
  if (after.loop !== before.loop || next.cards.some((c) => c.kind === 'lightsout')) {
    a.opened.add('(can run into 03:33)');
    return;
  }
  a.minutes.add(after.minute - before.minute);
  const d = (x: readonly string[], y: readonly string[]) => y.filter((v) => !x.includes(v));
  for (const k of d(before.known.map((k) => k.id), after.known.map((k) => k.id))) a.gained.add(`learn ${k}`);
  for (const k of d(before.inventory, after.inventory)) a.gained.add(`give ${k}`);
  for (const k of d(after.inventory, before.inventory)) a.lost.add(`take ${k}`);
  for (const k of d(before.fragments, after.fragments)) a.gained.add(`fragment ${k}`);
  for (const k of d(before.lflags, after.lflags)) a.gained.add(`lflag ${k}`);
  for (const k of d(before.flags, after.flags)) a.gained.add(`flag ${k}`);
  if (after.obsession !== before.obsession) a.gained.add(`obsession ${after.obsession > before.obsession ? '+' : '−'}`);
  if (!before.puzzle && after.puzzle) a.opened.add(after.puzzle);
  if (after.ending) a.opened.add(`ending ${after.ending}`);
  if (after.scene !== before.scene) a.scenes.add(after.scene);
  if (!a.firstText.length) a.firstText = after.display.map((p) => p.key);
}
