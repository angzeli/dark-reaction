/**
 * Save slots: an autosave plus three manual slots in localStorage, each a
 * versioned envelope around the engine's GameState. Older envelopes are
 * migrated forward one version at a time; anything corrupt, foreign or
 * from a newer game version is refused with a reason, never loaded half
 * way and never allowed to crash the game.
 */
import { STATE_VERSION } from '../engine/engine.ts';
import type { Content, EndingId, GameState, LocationId } from '../engine/types.ts';
import { isLocale } from '../i18n/i18n.ts';
import type { KV } from './storage.ts';

export const SAVE_SCHEMA = STATE_VERSION;
export const GAME_ID = 'dark-reaction';
export const SLOTS = ['auto', '1', '2', '3'] as const;
export type SlotId = (typeof SLOTS)[number];

export interface SaveSummary {
  loop: number;
  act: number;
  minute: number;
  location: LocationId;
  ending: EndingId | null;
  /** Notebook entries known, a rough measure of progress. */
  known: number;
}

export interface SaveEnvelope {
  game: typeof GAME_ID;
  schema: number;
  savedAt: string;
  locale?: string;
  summary: SaveSummary;
  state: GameState;
}

export type ReadFailure = 'empty' | 'corrupt' | 'future' | 'invalid' | 'incompatible';
export type ReadResult =
  | { ok: true; envelope: SaveEnvelope; migrated: boolean }
  | { ok: false; reason: ReadFailure; detail?: string };

/** Saves nest a little (cards hold paragraphs); anything deeper is corrupt or hostile. */
const MAX_DEPTH = 24;

export function summarise(state: GameState): SaveSummary {
  return { loop: state.loop, act: state.act, minute: state.minute, location: state.location, ending: state.ending, known: state.known.length };
}

// ── Migrations ─────────────────────────────────────────────────────────────

type Raw = Record<string, unknown>;

/**
 * Migrations from schema n to n + 1, applied in order.
 *
 * v0 is the pre-release prototype format: a bare GameState with no
 * envelope and no `actLoop` (the engine before #30's review). It was never
 * shipped, but it is the first migration and the fixture that keeps the
 * migration path tested.
 */
export const MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
  0: (raw) => {
    const state = { ...(raw['state'] as Raw) };
    if (typeof state['actLoop'] !== 'number') state['actLoop'] = state['act'] === 1 ? 1 : (state['loop'] as number);
    state['v'] = 1;
    return { ...raw, schema: 1, state };
  },
};

/**
 * Recognise a bare GameState (the v0 prototype format, or a raw state
 * someone saved by hand) and wrap it so the normal path can migrate or
 * refuse it. Its own `v` says which schema it is.
 */
function normalise(raw: unknown): Raw | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Raw;
  if (r['game'] === undefined && typeof r['loop'] === 'number' && typeof r['minute'] === 'number' && 'known' in r) {
    const v = typeof r['v'] === 'number' && Number.isInteger(r['v']) && r['v'] >= 0 ? (r['v'] as number) : 0;
    return { game: GAME_ID, schema: v, savedAt: new Date(0).toISOString(), state: r };
  }
  return r;
}

/** How deeply nested a parsed JSON value is (iterative, so it cannot overflow). */
export function jsonDepth(value: unknown): number {
  let max = 0;
  const stack: Array<[unknown, number]> = [[value, 1]];
  while (stack.length) {
    const [v, d] = stack.pop()!;
    if (!v || typeof v !== 'object') continue;
    if (d > max) max = d;
    if (max > MAX_DEPTH) return max;
    for (const child of Object.values(v as Record<string, unknown>)) stack.push([child, d + 1]);
  }
  return max;
}

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);
const STYLES = ['text', 'result', 'event', 'phantom', 'system'];

function paragraphOk(p: unknown): boolean {
  if (!isObj(p) || !isStr(p['key']) || !STYLES.includes(p['style'] as string)) return false;
  if (p['params'] === undefined) return true;
  return isObj(p['params']) && Object.values(p['params']).every((v) => isStr(v) || isNum(v));
}

function cardOk(c: unknown): boolean {
  if (!isObj(c)) return false;
  if (c['kind'] === 'lightsout') return isNum(c['loop']) && Array.isArray(c['before']) && c['before'].every(paragraphOk) && (c['hold'] === undefined || typeof c['hold'] === 'boolean');
  if (c['kind'] === 'act') return [1, 2, 3].includes(c['act'] as number);
  if (c['kind'] === 'ending') return isStr(c['ending']);
  return false;
}

/**
 * The first problem with a state's shape, or null if it looks like a
 * GameState the engine can run: types, ranges, and the shape of every
 * element the engine or the UI dereferences.
 */
export function stateProblem(s: unknown): string | null {
  if (!isObj(s)) return 'state is not an object';
  const st = s;
  for (const k of ['v', 'loop', 'minute', 'act', 'actLoop', 'obsession', 'fudgesEver', 'turns']) if (!isNum(st[k])) return `${k} is not a number`;
  if (![1, 2, 3].includes(st['act'] as number)) return 'act is out of range';
  if ((st['minute'] as number) < 0 || (st['minute'] as number) > 46) return 'minute is out of range';
  if ((st['loop'] as number) < 1) return 'loop is out of range';
  if (!isStr(st['location'])) return 'location is not a string';
  if (!isStr(st['scene'])) return 'scene is not a string';
  if (!['none', 'travel', 'wait'].includes(st['menu'] as string)) return 'menu is invalid';
  for (const k of ['chasedThisLoop', 'restedThisLoop', 'darkRun']) if (typeof st[k] !== 'boolean') return `${k} is not a boolean`;
  for (const k of ['inventory', 'flags', 'lflags', 'solved', 'usedLoop', 'usedEver', 'firedEvents', 'fragments', 'chaseUsed', 'restUsed', 'margins']) {
    const list = st[k];
    if (!Array.isArray(list) || !list.every(isStr)) return `${k} is not a list of strings`;
  }
  const lists: Array<[string, (x: unknown) => boolean]> = [
    ['known', (x) => isObj(x) && isStr(x['id']) && isNum(x['loop']) && isNum(x['minute'])],
    ['fudges', (x) => isObj(x) && isStr(x['id']) && typeof x['corrected'] === 'boolean' && isNum(x['loop'])],
    ['loops', (x) => isObj(x) && isNum(x['loop']) && isStr(x['location']) && isNum(x['minute'])],
    ['display', paragraphOk],
    ['cards', cardOk],
  ];
  for (const [k, ok] of lists) {
    const list = st[k];
    if (!Array.isArray(list) || !list.every(ok)) return `${k} has an entry of the wrong shape`;
  }
  if (new Set((st['known'] as Raw[]).map((k) => k['id'])).size !== (st['known'] as unknown[]).length) return 'known has duplicate entries';
  if (!isObj(st['hints']) || !Object.values(st['hints']).every(isNum)) return 'hints is invalid';
  if (!isObj(st['puzzleData'])) return 'puzzleData is not an object';
  if (st['puzzle'] !== null && !isStr(st['puzzle'])) return 'puzzle is invalid';
  if (st['ending'] !== null && !isStr(st['ending'])) return 'ending is invalid';
  return null;
}

/**
 * Fit a well-formed state to the content this build ships. Small drifts are
 * repaired (a renamed scene puts you back in the room; a removed puzzle
 * closes); anything the game cannot stand on is refused.
 */
export function fitToContent(state: GameState, content: Content): string | null {
  const locations = new Map(content.locations.map((l) => [l.id, l] as const));
  const room = locations.get(state.location);
  if (!room) return `location "${state.location}" no longer exists`;
  if (!content.scenes.some((sc) => sc.id === state.scene)) state.scene = room.hub;
  if (state.puzzle && !content.puzzles.some((p) => p.id === state.puzzle)) {
    state.puzzle = null;
    state.darkRun = false;
  }
  const endings = new Set<string>(content.endings.map((e) => e.id));
  if (state.ending && !endings.has(state.ending)) return `ending "${state.ending}" no longer exists`;
  state.cards = state.cards.filter((c) => c.kind !== 'ending' || endings.has(c.ending));
  for (const l of state.loops) if (!locations.has(l.location)) l.location = content.start.location;
  return null;
}

/**
 * Parse, migrate and validate a save envelope from its JSON text. With
 * `content`, the state is also fitted to this build's scenes and endings.
 */
export function parseSave(text: string | null, content?: Content): ReadResult {
  if (text === null || text === '') return { ok: false, reason: 'empty' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'corrupt', detail: 'not valid JSON' };
  }
  if (jsonDepth(raw) > MAX_DEPTH) return { ok: false, reason: 'corrupt', detail: 'nested too deeply' };
  let env = normalise(raw);
  if (!env) return { ok: false, reason: 'invalid', detail: 'not an object' };
  if (env['game'] !== GAME_ID) return { ok: false, reason: 'invalid', detail: 'not a Dark Reaction save' };
  const schema = env['schema'];
  if (typeof schema !== 'number' || !Number.isInteger(schema) || schema < 0) return { ok: false, reason: 'invalid', detail: 'no schema version' };
  if (schema > SAVE_SCHEMA) return { ok: false, reason: 'future', detail: `made by a newer version (schema ${schema})` };
  const migrated = schema < SAVE_SCHEMA;
  for (let v = schema; v < SAVE_SCHEMA; v++) {
    const step = MIGRATIONS[v];
    if (!step) return { ok: false, reason: 'invalid', detail: `no migration from schema ${v}` };
    try {
      env = step(env);
    } catch (e) {
      return { ok: false, reason: 'corrupt', detail: `migration from ${v} failed: ${(e as Error).message}` };
    }
  }
  const problem = stateProblem(env['state']);
  if (problem) return { ok: false, reason: 'corrupt', detail: problem };
  const state = env['state'] as GameState;
  if (content) {
    const misfit = fitToContent(state, content);
    if (misfit) return { ok: false, reason: 'incompatible', detail: misfit };
  }
  const envelope: SaveEnvelope = {
    game: GAME_ID,
    schema: SAVE_SCHEMA,
    savedAt: typeof env['savedAt'] === 'string' ? (env['savedAt'] as string) : new Date(0).toISOString(),
    summary: summarise(state),
    state,
  };
  if (isLocale(env['locale'])) envelope.locale = env['locale'];
  return { ok: true, envelope, migrated };
}

// ── Store ──────────────────────────────────────────────────────────────────

export interface SaveStoreOptions {
  now?: () => Date;
  /** Fit loaded states to this content (repair renamed scenes, refuse what can't run). */
  content?: Content;
}

export class SaveStore {
  private readonly kv: KV;
  private readonly now: () => Date;
  private readonly content: Content | undefined;

  constructor(kv: KV, options: SaveStoreOptions = {}) {
    this.kv = kv;
    this.now = options.now ?? (() => new Date());
    this.content = options.content;
  }

  static key(slot: SlotId): string {
    return slot === 'auto' ? 'dark-reaction.save.auto' : `dark-reaction.save.slot${slot}`;
  }

  /** The envelope for a state, or null if the state cannot be serialised. */
  envelope(state: GameState, locale?: string): SaveEnvelope | null {
    let copy: GameState;
    try {
      // A deep copy: the engine keeps mutating its state after we save.
      copy = JSON.parse(JSON.stringify(state)) as GameState;
    } catch {
      return null;
    }
    const env: SaveEnvelope = { game: GAME_ID, schema: SAVE_SCHEMA, savedAt: this.now().toISOString(), summary: summarise(copy), state: copy };
    if (isLocale(locale)) env.locale = locale;
    return env;
  }

  /** Returns false if nothing was written (storage blocked or full, or the state unserialisable). */
  write(slot: SlotId, state: GameState, locale?: string): boolean {
    const env = this.envelope(state, locale);
    if (!env) return false;
    return this.kv.set(SaveStore.key(slot), JSON.stringify(env));
  }

  read(slot: SlotId): ReadResult {
    const result = parseSave(this.kv.get(SaveStore.key(slot)), this.content);
    // Store migrated saves in the current format so migration happens once.
    if (result.ok && result.migrated) this.kv.set(SaveStore.key(slot), JSON.stringify(result.envelope));
    return result;
  }

  remove(slot: SlotId): void {
    this.kv.remove(SaveStore.key(slot));
  }

  list(): Array<{ slot: SlotId; result: ReadResult }> {
    return SLOTS.map((slot) => ({ slot, result: parseSave(this.kv.get(SaveStore.key(slot)), this.content) }));
  }

  /** The most recently written loadable, unfinished slot (for "Continue"). */
  latest(): SlotId | null {
    let best: { slot: SlotId; at: number } | null = null;
    for (const { slot, result } of this.list()) {
      // An ended game is over, unless its ending card is still to play (#163).
      const st = result.ok ? result.envelope.state : null;
      if (!st || (st.ending && !st.cards.some((c) => c.kind === 'ending'))) continue;
      const at = Date.parse(result.ok ? result.envelope.savedAt : '');
      if (!Number.isFinite(at)) continue;
      if (!best || at > best.at) best = { slot, at };
    }
    return best?.slot ?? null;
  }

  /** Pretty JSON for a save file, or null if the state cannot be serialised. */
  exportText(state: GameState, locale?: string): string | null {
    const env = this.envelope(state, locale);
    return env ? JSON.stringify(env, null, 2) : null;
  }

  importText(text: string): ReadResult {
    return parseSave(text, this.content);
  }
}
