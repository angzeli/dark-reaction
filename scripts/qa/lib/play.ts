/**
 * Playing the engine one action at a time, the way the UI does: a walk is
 * the travel menu then a room, a wait is the wait menu then a length, a
 * puzzle ends the way its view could end it, and transitions (lights-out,
 * act titles, endings) are taken as soon as they are queued. Pure.
 */
import { LOOP_LENGTH } from '../../../src/engine/clock.ts';
import { Game, WAIT_OPTIONS } from '../../../src/engine/engine.ts';
import type { Card, Content, GameState, LocationId, Result } from '../../../src/engine/types.ts';
import type { PuzzleLogic } from '../../../src/puzzles/types.ts';
import type { Model } from './model.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogicTable = Record<string, PuzzleLogic<any, any>>;

/** How a puzzle can end: solved with its known solution, left at once, left after fiddling for its par, failed outright, or still open at 03:33. */
export type PuzzleOutcome = 'solve' | 'leave' | 'fiddle' | 'fail' | 'timeout';

export type Action =
  | { t: 'c'; id: string }
  | { t: 'go'; to: LocationId }
  | { t: 'wait'; n: number }
  | { t: 'pz'; o: PuzzleOutcome }
  | { t: 'fix'; id: string };

export function actionLabel(a: Action): string {
  switch (a.t) {
    case 'c':
      return a.id;
    case 'go':
      return `go ${a.to}`;
    case 'wait':
      return `wait ${a.n}`;
    case 'pz':
      return `puzzle: ${a.o}`;
    case 'fix':
      return `strike through ${a.id}`;
  }
}

export interface Step {
  state: GameState;
  cards: Card[];
  /** Minutes the UI showed for this action before it was taken (content choices, walks, waits). */
  shownCost?: number;
  /** The puzzle result handed to the engine, for puzzle actions. */
  result?: Result;
}

/** The ways a puzzle that is open now could end. Some can't happen (no fail without onFail; no timeout at 03:33 itself). */
export function puzzleOutcomes(state: GameState, content: Content): PuzzleOutcome[] {
  const id = state.puzzle;
  if (!id) return [];
  const def = content.puzzles.find((p) => p.id === id);
  const out: PuzzleOutcome[] = ['solve', 'leave'];
  if (state.minute < LOOP_LENGTH) {
    out.push('fiddle', 'timeout');
    if (def?.onFail) out.push('fail');
  }
  return out;
}

/** What the open puzzle's view would report for this outcome, or null if it can't happen (its solution doesn't solve it now). */
export function puzzleResult(state: GameState, content: Content, logic: LogicTable, outcome: PuzzleOutcome): Result | null {
  const id = state.puzzle!;
  const def = content.puzzles.find((p) => p.id === id)!;
  const left = Math.max(0, LOOP_LENGTH - state.minute);
  // The frame ends the puzzle when its minutes reach 03:33, whatever the view was about to report (frame.ts setMinutes).
  const capped = (r: Result): Result => (state.minute < LOOP_LENGTH && r.minutes >= left ? { solved: false, minutes: left } : r);
  if (outcome === 'leave') return { solved: false, minutes: 0 };
  if (outcome === 'timeout') return { solved: false, minutes: left };
  if (outcome === 'fiddle') return capped({ solved: false, minutes: Math.ceil(def.par) });
  if (outcome === 'fail') return capped({ solved: false, failed: true, minutes: 2 });
  const l = logic[id];
  if (!l) return null;
  let st = l.init({ minute: state.minute, act: state.act, data: state.puzzleData[id] });
  for (let move of l.solution(st)) {
    // The Schlenk line asks the game whether you are carrying foil (PuzzleApi.has).
    if (id === 'schlenk' && (move as { type?: string }).type === 'wrap') move = { ...move, foil: state.inventory.includes('item.foil') };
    st = l.apply(st, move);
    if (l.isFailed?.(st)) return capped({ solved: false, failed: true, minutes: l.minutes(st) });
  }
  if (!l.isSolved(st)) return null;
  return capped({ solved: true, minutes: l.minutes(st) });
}

/** Every action available in this state, menus expanded. */
export function actions(game: Game): Action[] {
  const s = game.state;
  if (s.ending) return [];
  if (s.puzzle) return puzzleOutcomes(s, game.content).map((o) => ({ t: 'pz', o }));
  const out: Action[] = [];
  for (const c of game.choices()) {
    if (c.id === 'meta:travel') {
      for (const loc of game.content.locations) if (loc.id !== s.location) out.push({ t: 'go', to: loc.id });
    } else if (c.id === 'meta:wait') {
      for (const n of WAIT_OPTIONS) out.push({ t: 'wait', n });
    } else out.push({ t: 'c', id: c.id });
  }
  for (const f of s.fudges) if (!f.corrected) out.push({ t: 'fix', id: f.id });
  return out;
}

/** Take one action on a copy of `state`. Throws whatever the engine throws. */
export function step(model: Model, logic: LogicTable, state: GameState, action: Action): Step {
  const game = new Game(model.content, structuredClone(state));
  let shownCost: number | undefined;
  let result: Result | undefined;
  const pick = (id: string) => {
    const view = game.choices().find((c) => c.id === id);
    if (!view) throw new Error(`"${id}" is not on offer`);
    game.choose(id);
    return view;
  };
  switch (action.t) {
    case 'c':
      shownCost = pick(action.id).cost;
      break;
    case 'go':
      pick('meta:travel');
      shownCost = pick(`go:${action.to}`).cost;
      break;
    case 'wait':
      pick('meta:wait');
      shownCost = pick(`wait:${action.n}`).cost;
      break;
    case 'pz': {
      const r = puzzleResult(game.state, model.content, logic, action.o);
      if (!r) throw new Error(`puzzle ${game.state.puzzle} can't end with "${action.o}" here`);
      result = r;
      game.completePuzzle(r);
      break;
    }
    case 'fix':
      if (!game.correctFudge(action.id)) throw new Error(`could not strike ${action.id} through`);
      break;
  }
  const cards: Card[] = [];
  for (let card = game.takeCard(); card; card = game.takeCard()) cards.push(card);
  const out: Step = { state: game.state, cards };
  if (shownCost !== undefined) out.shownCost = shownCost;
  if (result) out.result = result;
  return out;
}

// ── Keys ───────────────────────────────────────────────────────────────────

const sorted = (xs: readonly string[]) => [...xs].sort();

/**
 * Everything about a state that can change what happens next. What only the
 * notebook shows (entries nothing asks about, when they were learned), the
 * text on screen, hints and the loop history are left out, so states that
 * play the same are one state.
 */
export function stateKey(model: Model, s: GameState): string {
  const fragments = s.fragments.filter((f) => model.fragmentRefs.has(f));
  const known = new Set(s.known.map((k) => k.id));
  // A look whose pages and traces are all in hand only hides itself once used: the same as waiting a minute.
  const spent = (id: string): boolean => {
    if (model.inert.has(id)) return true;
    const effects = model.knowledgeOnly.get(id);
    if (!effects) return false;
    return effects.every((e) =>
      'learn' in e ? !model.playKnow.has(e.learn) || known.has(e.learn) : 'fragment' in e ? s.fragments.includes(e.fragment) : 'flag' in e ? s.flags.includes(e.flag) : false,
    );
  };
  return JSON.stringify([
    Math.min(s.loop, model.loopCap + 1),
    Math.min(s.loop - s.actLoop, model.loopsInActCap + 1),
    s.minute,
    s.act,
    s.location,
    s.scene,
    s.menu,
    sorted(s.inventory),
    sorted(s.flags),
    sorted(s.lflags),
    sorted([...known].filter((id) => model.playKnow.has(id))),
    sorted(s.solved),
    sorted(s.usedLoop.filter((id) => !spent(id))),
    sorted(s.usedEver.filter((id) => model.usedRefs.has(id))),
    sorted(s.firedEvents.filter((id) => model.eventsWithEffects.has(id))),
    sorted(s.fudges.map((f) => `${f.id}:${f.corrected ? 1 : 0}`)),
    s.fudgesEver > 0 ? 1 : 0,
    sorted(fragments),
    s.fragments.length,
    s.obsession,
    s.chasedThisLoop,
    s.restedThisLoop,
    sorted(s.chaseUsed),
    sorted(s.restUsed),
    s.puzzle,
    s.darkRun,
    s.ending,
  ]);
}

/** A 53-bit string hash (cyrb53): keys are long, and there are millions of them. */
export function hash(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
