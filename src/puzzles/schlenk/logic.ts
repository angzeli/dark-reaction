/**
 * P5 · Schlenk line (docs/DESIGN.md §11). The Kraken: a nitrogen manifold
 * with a bubbler, a vacuum manifold on an old pump, and four ports with
 * three-way taps (nitrogen / closed / vacuum). Her dark-run flask is on
 * port 4 and her J. Young tube on port 2's adaptor, joined by a cannula;
 * those two ports have bleeds. Purge the tube three times (#125: the act's
 * three, as in the antechamber), get the flask's contents into it without
 * breaking the laminated rules, shut the tube's tap and wrap it in foil. Breaking a rule is a suck-back or a hiss: everything goes back to
 * how it was, two minutes later.
 *
 * These are the game's rules, not a procedure: no quantities, pressures or
 * real handling steps, here or in the text.
 */
import type { PuzzleLogic } from '../types.ts';

export type Tap = 'n2' | 'closed' | 'vac';
export type Port = 1 | 2 | 3 | 4;
export type Bleed = 'tube' | 'flask';

export const PORTS: readonly Port[] = [1, 2, 3, 4];
export const TAPS: readonly Tap[] = ['n2', 'closed', 'vac'];
/** Her J. Young tube, on the adaptor. */
export const TUBE_PORT: Port = 2;
/** Port 3's joint is cracked. */
export const CRACKED_PORT: Port = 3;
/** Her dark-run flask. */
export const FLASK_PORT: Port = 4;

/** A rule broken, and how the Kraken says so. */
export type Breach =
  /** Rule 1: vacuum with the bubbler not bubbling. */
  | 'suckback'
  /** Rule 2: the pump holds one port at a time. */
  | 'pump'
  /** Rule 3: port 3 is cracked. */
  | 'crack'
  /** Rule 5: the flask on vacuum. */
  | 'flaskVac'
  /** Rule 5: the flask closed with its bleed open. */
  | 'flaskRoom'
  /** Rule 5 again: the liquid would run into a tube still full of the room's air. */
  | 'air'
  /** Rule 6: purged, but not three times; some of the room is still in the tube. */
  | 'thin'
  /** Her filled tube put on vacuum with its tap open: the pump drinks it. */
  | 'drained';

export type SchlenkEvent =
  | 'n2On'
  | 'n2Off'
  | 'tap'
  | 'bleedOpen'
  | 'bleedShut'
  | 'jyOpen'
  | 'jyShut'
  | 'pumped'
  /** Refilled with nitrogen, but fewer than three times so far. */
  | 'refilled'
  /** The third refill: no room air left. */
  | 'purged'
  | 'transfer'
  | 'needsFill'
  | 'needsSeal'
  | 'wrapped'
  | 'light';

export interface SchlenkState {
  /** The nitrogen main: on means the bubbler is bubbling. */
  n2: boolean;
  /** Taps for ports 1–4 (index 0 is port 1). */
  taps: [Tap, Tap, Tap, Tap];
  bleed: Record<Bleed, boolean>;
  /** Her J. Young tube's own tap. Open on the adaptor; shut it to seal the tube. */
  jyOpen: boolean;
  /** The tube has been pumped down since it last held a gas. */
  pumped: boolean;
  /** Times the tube has been pumped down and refilled with nitrogen (up to PURGES): at PURGES, no room air is left. */
  cycles: number;
  /** The flask's contents are in the tube. */
  filled: boolean;
  /** Sealed and wrapped in foil: done. */
  wrapped: boolean;
  /** Sat in the lab light unwrapped: spoiled for the night. */
  spoiled: boolean;
  breaches: number;
  minutes: number;
  last: { kind: SchlenkEvent | Breach; port?: Port; breach?: boolean } | null;
}

export type SchlenkMove =
  | { type: 'n2' }
  | { type: 'tap'; port: Port; to: Tap }
  | { type: 'bleed'; which: Bleed }
  | { type: 'jy' }
  /** Wrap the sealed tube. `foil` is whether the player is carrying any (the view asks the game). */
  | { type: 'wrap'; foil: boolean };

/** Pump-and-refill cycles before the tube may take anything (rule 6, in her pencil). */
export const PURGES = 3;
/** In-game minutes: pumping the tube down, letting nitrogen back in (each, per cycle), the transfer, the foil. */
export const COST = { pump: 2, refill: 1, transfer: 2, wrap: 1, breach: 2 } as const;
/** What a clean run costs, as the later-loop shortcut charges it. */
export const CLEAN_MINUTES = PURGES * (COST.pump + COST.refill) + COST.transfer + COST.wrap;

const tapOf = (s: SchlenkState, port: Port) => s.taps[port - 1]!;

/** The Kraken as you find it: everything shut, her tube open on its adaptor. */
const APPARATUS = {
  n2: false,
  taps: ['closed', 'closed', 'closed', 'closed'] as SchlenkState['taps'],
  bleed: { tube: false, flask: false },
  jyOpen: true,
  pumped: false,
  cycles: 0,
  filled: false,
};

/** Which rule a setting of the line breaks, if any. */
export function breach(s: Pick<SchlenkState, 'n2' | 'taps' | 'bleed' | 'jyOpen' | 'filled'>): Breach | null {
  const onVac = PORTS.filter((p) => s.taps[p - 1] === 'vac');
  if (onVac.includes(CRACKED_PORT)) return 'crack';
  if (onVac.includes(FLASK_PORT)) return 'flaskVac';
  if (s.taps[FLASK_PORT - 1] === 'closed' && s.bleed.flask) return 'flaskRoom';
  if (onVac.length > 1) return 'pump';
  if (onVac.length > 0 && !s.n2) return 'suckback';
  if (s.filled && s.jyOpen && onVac.includes(TUBE_PORT)) return 'drained';
  return null;
}

/** Liquid moves from the vessel on nitrogen to the vessel that's closed with its bleed open (rule 4). A port open to a dead manifold isn't on nitrogen. */
const transferring = (s: SchlenkState) =>
  !s.filled && s.n2 && s.jyOpen && tapOf(s, FLASK_PORT) === 'n2' && tapOf(s, TUBE_PORT) === 'closed' && s.bleed.tube;

const fresh = (): SchlenkState => ({ ...APPARATUS, taps: [...APPARATUS.taps], bleed: { ...APPARATUS.bleed }, wrapped: false, spoiled: false, breaches: 0, minutes: 0, last: null });

/** Everything back as it was (a suck-back or a hiss), two minutes later. */
const reset = (s: SchlenkState, kind: Breach): SchlenkState => ({
  ...s,
  ...APPARATUS,
  taps: [...APPARATUS.taps],
  bleed: { ...APPARATUS.bleed },
  breaches: s.breaches + 1,
  minutes: s.minutes + COST.breach,
  last: { kind, breach: true },
});

/** Pumped down and refilled three times, and not pumped down again since: ready to take the liquid. */
export const purged = (s: Pick<SchlenkState, 'pumped' | 'cycles'>) => !s.pumped && s.cycles >= PURGES;

/** After a legal change: the tube pumps down, fills with nitrogen, or takes the flask's contents. */
function settle(s: SchlenkState, last: SchlenkState['last']): SchlenkState {
  const broken = breach(s);
  if (broken) return s;
  let next = { ...s, last };
  if (!next.filled && next.jyOpen && tapOf(next, TUBE_PORT) === 'vac' && !next.pumped) {
    next = { ...next, pumped: true, minutes: next.minutes + COST.pump, last: { kind: 'pumped', port: TUBE_PORT } };
  }
  if (!next.filled && next.n2 && next.jyOpen && tapOf(next, TUBE_PORT) === 'n2' && next.pumped) {
    const cycles = Math.min(PURGES, next.cycles + 1);
    next = { ...next, pumped: false, cycles, minutes: next.minutes + COST.refill, last: { kind: cycles >= PURGES ? 'purged' : 'refilled', port: TUBE_PORT } };
  }
  if (transferring(next)) {
    // Never purged (or pumped down again since): the room's air. Purged, but not three times: some of it.
    if (!purged(next)) return reset(s, next.cycles > 0 && !next.pumped ? 'thin' : 'air');
    next = { ...next, filled: true, minutes: next.minutes + COST.transfer, last: { kind: 'transfer' } };
  }
  return next;
}

/** What a reload needs: the whole line, the tube, and the time spent. */
export type SchlenkSave = Omit<SchlenkState, 'last'>;
export const schlenkSave = ({ last: _last, ...rest }: SchlenkState): SchlenkSave => rest;

const flag = (v: unknown) => v === true;
const isTap = (v: unknown): v is Tap => v === 'n2' || v === 'closed' || v === 'vac';
const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(999, Math.max(0, Math.floor(v))) : 0);

/** The state's apparatus as a key, for the search. */
const key = (s: SchlenkState) => `${+s.n2}${s.taps.join('')}${+s.bleed.tube}${+s.bleed.flask}${+s.jyOpen}${+s.pumped}${s.cycles}${+s.filled}`;
const MOVES: SchlenkMove[] = [
  { type: 'n2' },
  ...PORTS.flatMap((port) => TAPS.map((to): SchlenkMove => ({ type: 'tap', port, to }))),
  { type: 'bleed', which: 'tube' },
  { type: 'bleed', which: 'flask' },
  { type: 'jy' },
  { type: 'wrap', foil: true },
];

export const schlenkLogic: PuzzleLogic<SchlenkState, SchlenkMove> = {
  id: 'schlenk',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : null) as Partial<Record<keyof SchlenkSave, unknown>> | null;
    if (!d) return fresh();
    const taps = Array.isArray(d.taps) && d.taps.length === 4 && d.taps.every(isTap) ? (d.taps as SchlenkState['taps']) : fresh().taps;
    const b = (d.bleed && typeof d.bleed === 'object' ? d.bleed : {}) as Partial<Record<Bleed, unknown>>;
    const filled = flag(d.filled);
    const legacy = d as Record<string, unknown>;
    // Saves from before three purges (#125) say only whether the tube was purged: that was one cycle.
    const cycles = filled ? PURGES : d.cycles !== undefined ? Math.min(PURGES, count(d.cycles)) : flag(legacy['purged']) ? 1 : 0;
    const restored: SchlenkState = {
      n2: flag(d.n2),
      taps: [...taps],
      bleed: { tube: flag(b.tube), flask: flag(b.flask) },
      jyOpen: d.jyOpen === undefined ? true : flag(d.jyOpen),
      pumped: flag(d.pumped) && !filled,
      cycles,
      filled,
      wrapped: flag(d.wrapped) && filled,
      spoiled: flag(d.spoiled) && filled,
      breaches: count(d.breaches),
      minutes: count(d.minutes),
      last: null,
    };
    // A line no player could have left it in comes back as the Kraken stands.
    return breach(restored) ? { ...fresh(), breaches: restored.breaches, minutes: restored.minutes } : restored;
  },
  apply: (s, m) => {
    if (s.wrapped || s.spoiled) return s;
    switch (m.type) {
      case 'n2': {
        const next = { ...s, n2: !s.n2 };
        const broken = breach(next);
        return broken ? reset(s, broken) : settle(next, { kind: next.n2 ? 'n2On' : 'n2Off' });
      }
      case 'tap': {
        if (!PORTS.includes(m.port) || !TAPS.includes(m.to) || tapOf(s, m.port) === m.to) return s;
        const taps = [...s.taps] as SchlenkState['taps'];
        taps[m.port - 1] = m.to;
        const next = { ...s, taps };
        const broken = breach(next);
        return broken ? reset(s, broken) : settle(next, { kind: 'tap', port: m.port });
      }
      case 'bleed': {
        if (m.which !== 'tube' && m.which !== 'flask') return s;
        const open = !s.bleed[m.which];
        const next = { ...s, bleed: { ...s.bleed, [m.which]: open } };
        const broken = breach(next);
        return broken ? reset(s, broken) : settle(next, { kind: open ? 'bleedOpen' : 'bleedShut', port: m.which === 'tube' ? TUBE_PORT : FLASK_PORT });
      }
      case 'jy': {
        const next = { ...s, jyOpen: !s.jyOpen };
        const broken = breach(next);
        return broken ? reset(s, broken) : settle(next, { kind: next.jyOpen ? 'jyOpen' : 'jyShut' });
      }
      case 'wrap': {
        if (!s.filled) return { ...s, last: { kind: 'needsFill' } };
        if (s.jyOpen) return { ...s, last: { kind: 'needsSeal' } };
        return m.foil
          ? { ...s, wrapped: true, minutes: s.minutes + COST.wrap, last: { kind: 'wrapped' } }
          : { ...s, spoiled: true, minutes: s.minutes + COST.wrap, last: { kind: 'light' } };
      }
    }
  },
  isSolved: (s) => s.wrapped,
  isFailed: (s) => s.spoiled,
  minutes: (s) => s.minutes,
  /** The fewest moves to a wrapped tube from here, found by searching the line's own rules (and assuming you brought foil). */
  solution: (s) => {
    if (s.wrapped || s.spoiled) return [];
    const seen = new Set([key(s)]);
    let frontier: Array<{ state: SchlenkState; path: SchlenkMove[] }> = [{ state: s, path: [] }];
    while (frontier.length) {
      const next: typeof frontier = [];
      for (const { state, path } of frontier) {
        for (const move of MOVES) {
          const after = schlenkLogic.apply(state, move);
          if (after.wrapped) return [...path, move];
          if (after.last?.breach || after === state) continue;
          const k = key(after);
          if (seen.has(k)) continue;
          seen.add(k);
          next.push({ state: after, path: [...path, move] });
        }
      }
      frontier = next;
    }
    return [];
  },
};
