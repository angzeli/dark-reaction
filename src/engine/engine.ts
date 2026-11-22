/**
 * The game engine. Pure TypeScript, no DOM: content in, state out.
 *
 * The UI calls `choices()` to list what the player can do, `choose(id)` to do
 * it, `completePuzzle()` when a puzzle view finishes, `correctFudge()` from
 * the notebook, and `takeCard()` to consume transitions (lights-out, act
 * titles, endings) after playing them. Tests, the validator and the bot
 * drive exactly the same API.
 *
 * Loop rules (docs/DESIGN.md §5): 46 minutes from 02:47 to 03:33; actions
 * cost minutes; at 03:33 the lights go out, items and loop flags reset and
 * knowledge persists.
 *
 * Order of operations for a choice: result text is evaluated, then effects
 * apply, then any scene change, then the choice's minutes pass (events fire
 * as each minute arrives), then any walk. A walk lets its minutes pass first
 * and only then arrives, so the room you find (an open or locked door) is
 * the room as it is when you get there. Events don't fire while walking;
 * an event whose minute passed while you were away fires on arrival if its
 * condition then holds (and its `until` hasn't passed).
 */
import { LOOP_LENGTH } from './clock.ts';
import { holds, uncorrectedFudges } from './conditions.ts';
import { distances, travelTime, type DistanceTable } from './map.ts';
import { checkContent, checkReferences } from './shape.ts';
import type {
  ChoiceDef,
  ChoiceView,
  Card,
  Content,
  Effect,
  EndingId,
  GameState,
  LocationDef,
  LocationId,
  NotebookDef,
  Paragraph,
  PuzzleDef,
  Result,
  SceneDef,
  TextRef,
} from './types.ts';

export const STATE_VERSION = 1;
export const WAIT_OPTIONS = [1, 5, 10] as const;

interface Index {
  scenes: Map<string, SceneDef>;
  choices: Map<string, { choice: ChoiceDef; scene: SceneDef }>;
  locations: Map<LocationId, LocationDef>;
  notebook: Map<string, NotebookDef>;
  puzzles: Map<string, PuzzleDef>;
  distances: DistanceTable;
}

const indexCache = new WeakMap<Content, Index>();

export function buildIndex(content: Content): Index {
  const cached = indexCache.get(content);
  if (cached) return cached;
  checkContent(content);
  checkReferences(content);
  const scenes = new Map<string, SceneDef>();
  const choices = new Map<string, { choice: ChoiceDef; scene: SceneDef }>();
  for (const scene of content.scenes) {
    if (scenes.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`);
    scenes.set(scene.id, scene);
    for (const choice of scene.choices) {
      if (choices.has(choice.id)) throw new Error(`Duplicate choice id: ${choice.id}`);
      if (/^(meta|go|wait):/.test(choice.id)) throw new Error(`Reserved choice id prefix: ${choice.id}`);
      choices.set(choice.id, { choice, scene });
    }
  }
  const index: Index = {
    scenes,
    choices,
    locations: new Map(content.locations.map((l) => [l.id, l] as const)),
    notebook: new Map(content.notebook.map((n) => [n.id, n] as const)),
    puzzles: new Map(content.puzzles.map((p) => [p.id, p] as const)),
    distances: distances(
      content.locations.map((l) => l.id),
      content.edges,
    ),
  };
  indexCache.set(content, index);
  return index;
}

/** A fresh game at 02:47 of loop 1. `margins` are puzzles solved in earlier playthroughs (new game+). */
export function newGameState(content: Content, margins: string[] = []): GameState {
  const index = buildIndex(content);
  const location = content.start.location;
  const state: GameState = {
    v: STATE_VERSION,
    loop: 1,
    minute: 0,
    act: 1,
    actLoop: 1,
    location,
    scene: index.locations.get(location)!.hub,
    menu: 'none',
    inventory: [],
    flags: [],
    lflags: [],
    known: [],
    solved: [],
    hints: {},
    usedLoop: [],
    usedEver: [],
    firedEvents: [],
    fudges: [],
    fudgesEver: 0,
    fragments: [],
    obsession: 0,
    chasedThisLoop: false,
    restedThisLoop: false,
    chaseUsed: [],
    restUsed: [],
    loops: [],
    display: [],
    cards: [{ kind: 'act', act: 1 }],
    puzzle: null,
    darkRun: false,
    ending: null,
    margins: [...new Set(margins)],
    puzzleData: {},
    turns: 0,
  };
  new Game(content, state).startLoop([]);
  return state;
}

interface Applied {
  minutes: number;
  go?: LocationId;
  scene?: string;
}

export class Game {
  readonly content: Content;
  readonly index: Index;
  state: GameState;
  /** System paragraphs produced by effects during the current action. */
  private notices: Paragraph[] = [];

  constructor(content: Content, state?: GameState) {
    this.content = content;
    this.index = buildIndex(content);
    this.state = state ?? newGameState(content);
  }

  // ── Reading ──────────────────────────────────────────────────────────────

  get scene(): SceneDef {
    const scene = this.index.scenes.get(this.state.scene);
    if (!scene) throw new Error(`Unknown scene: ${this.state.scene}`);
    return scene;
  }

  /** True when the UI should show something other than the scene and its choices. */
  get busy(): boolean {
    return this.state.ending !== null || this.state.puzzle !== null || this.state.cards.length > 0;
  }

  entrySceneFor(location: LocationId): string {
    const loc = this.index.locations.get(location);
    if (!loc) throw new Error(`Unknown location: ${location}`);
    for (const entry of loc.entry ?? []) if (holds(entry.if, this.state)) return entry.scene;
    return loc.hub;
  }

  paragraphs(refs: readonly TextRef[] | undefined, style: Paragraph['style']): Paragraph[] {
    const out: Paragraph[] = [];
    for (const ref of refs ?? []) {
      if (!holds(ref.if, this.state)) continue;
      const p: Paragraph = { key: ref.key, style: ref.style ?? style };
      if (ref.params) p.params = ref.params(this.state);
      out.push(p);
    }
    return out;
  }

  sceneText(sceneId: string): Paragraph[] {
    const scene = this.index.scenes.get(sceneId);
    if (!scene) throw new Error(`Unknown scene: ${sceneId}`);
    return this.paragraphs(scene.text, 'text');
  }

  private visible(choice: ChoiceDef): boolean {
    if (!holds(choice.if, this.state)) return false;
    if (choice.once === 'loop' && this.state.usedLoop.includes(choice.id)) return false;
    if (choice.once === 'game' && this.state.usedEver.includes(choice.id)) return false;
    return true;
  }

  /** What the player can do right now. Empty while a card, puzzle or ending is pending. */
  choices(): ChoiceView[] {
    const s = this.state;
    if (this.busy) return [];
    if (s.menu === 'travel') {
      const out: ChoiceView[] = [];
      for (const loc of this.content.locations) {
        if (loc.id === s.location) continue;
        out.push({ id: `go:${loc.id}`, label: loc.name, cost: travelTime(this.index.distances, s.location, loc.id), kind: 'travel' });
      }
      out.push({ id: 'meta:back', label: 'ui.stay', cost: 0, kind: 'meta' });
      return out;
    }
    if (s.menu === 'wait') {
      return [
        ...WAIT_OPTIONS.map((n): ChoiceView => ({ id: `wait:${n}`, label: 'ui.wait.minutes', params: { n }, cost: n, kind: 'wait' })),
        { id: 'meta:back', label: 'ui.back', cost: 0, kind: 'meta' },
      ];
    }
    const scene = this.scene;
    const out: ChoiceView[] = scene.choices
      .filter((c) => this.visible(c))
      .map((c) => ({ id: c.id, label: c.label, cost: c.cost ?? 0, kind: 'normal' }));
    if (scene.hub) {
      out.push({ id: 'meta:travel', label: 'ui.travel', cost: 0, kind: 'meta' });
      out.push({ id: 'meta:wait', label: 'ui.wait', cost: 0, kind: 'meta' });
    } else if (!scene.noBack) {
      out.push({ id: 'meta:back', label: 'ui.back', cost: 0, kind: 'meta' });
    }
    return out;
  }

  // ── Acting ───────────────────────────────────────────────────────────────

  choose(id: string): void {
    const available = this.choices();
    if (!available.some((c) => c.id === id)) {
      throw new Error(`Choice "${id}" is not available in scene ${this.state.scene} (menu ${this.state.menu}).`);
    }
    const s = this.state;
    s.turns += 1;
    this.notices = [];

    if (id === 'meta:travel' || id === 'meta:wait') {
      s.menu = id === 'meta:travel' ? 'travel' : 'wait';
      return;
    }
    if (id === 'meta:back') {
      if (s.menu !== 'none') {
        s.menu = 'none';
        return;
      }
      this.navigate(this.entrySceneFor(s.location));
      s.display = [...this.notices, ...this.sceneText(s.scene)];
      return;
    }
    if (id.startsWith('go:')) {
      s.menu = 'none';
      this.walk(id.slice(3) as LocationId, []);
      return;
    }
    if (id.startsWith('wait:')) {
      const n = Number(id.slice(5));
      const params = { n };
      const start = { loop: s.loop, minute: s.minute };
      s.menu = 'none';
      s.display = [{ key: 'ui.waited', params, style: 'system' }];
      this.advance(n, { interruptible: true });
      // An event can cut the wait short; say how long it really was.
      params.n = (s.loop === start.loop ? s.minute : LOOP_LENGTH) - start.minute;
      return;
    }

    const { choice } = this.index.choices.get(id)!;
    if (!s.usedLoop.includes(id)) s.usedLoop.push(id);
    if (!s.usedEver.includes(id)) s.usedEver.push(id);

    const result = this.paragraphs(choice.text, 'result');
    let minutes = choice.cost ?? 0;
    let walkTo: LocationId | undefined;
    let sceneTo = choice.to;
    for (const effect of choice.effects ?? []) {
      const r = this.apply(effect);
      minutes += r.minutes;
      if (r.go) walkTo = r.go;
      if (r.scene) sceneTo = r.scene;
    }
    if (sceneTo) this.navigate(sceneTo);
    s.display = [...result, ...this.notices, ...(sceneTo ? this.sceneText(s.scene) : [])];
    if (s.ending) return;
    if (!this.advance(minutes)) return;
    if (walkTo) this.walk(walkTo, s.display);
  }

  /** Reveal the next hint tier for a puzzle (1–3). Hints are free but counted. */
  useHint(puzzleId: string): number {
    const tier = Math.min(3, (this.state.hints[puzzleId] ?? 0) + 1);
    this.state.hints[puzzleId] = tier;
    return tier;
  }

  /** Called by a puzzle view when the puzzle is solved or abandoned. */
  completePuzzle(result: Result): void {
    const s = this.state;
    const id = s.puzzle;
    if (!id) throw new Error('No puzzle is open.');
    const def = this.index.puzzles.get(id);
    if (!def) throw new Error(`Unknown puzzle: ${id}`);
    s.puzzle = null;
    delete s.puzzleData[id];
    this.notices = [];
    let minutes = Math.max(0, Math.round(result.minutes));
    let text: Paragraph[];
    if (result.solved) {
      if (!s.solved.includes(id)) s.solved.push(id);
      for (const effect of def.onSolve) minutes += this.apply(effect).minutes;
      text = this.paragraphs(def.solvedText, 'result');
    } else if (result.failed) {
      for (const effect of def.onFail ?? []) minutes += this.apply(effect).minutes;
      text = this.paragraphs(def.failedText, 'result');
    } else {
      text = this.paragraphs(def.leftText, 'result');
    }
    s.display = [...text, ...this.notices];
    if (s.ending) return;
    if (s.darkRun) {
      // The dark run happens at 03:33; whatever happened, the night ends here.
      s.darkRun = false;
      this.reset();
      return;
    }
    this.advance(minutes);
  }

  /** Strike a fudge through, initial and date it. Costs a minute. */
  correctFudge(id: string): boolean {
    const s = this.state;
    const fudge = s.fudges.find((f) => f.id === id && !f.corrected);
    if (!fudge || this.busy) return false;
    fudge.corrected = true;
    this.notices = [];
    s.display = [{ key: 'ui.fudge.corrected', params: { entry: `@${this.index.notebook.get(id)?.title ?? id}` }, style: 'system' }];
    this.advance(1);
    return true;
  }

  /** The next transition for the UI to play; removes it from the queue. */
  takeCard(): Card | undefined {
    return this.state.cards.shift();
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private navigate(sceneId: string): void {
    const scene = this.index.scenes.get(sceneId);
    if (!scene) throw new Error(`Unknown scene: ${sceneId}`);
    this.state.scene = sceneId;
    this.state.location = scene.location;
    for (const effect of scene.onEnter ?? []) this.apply(effect);
  }

  /**
   * Walk to another room: the minutes pass first (nothing fires en route),
   * then you arrive at whatever the room is by then, and anything that came
   * due while you were walking fires if it still applies. A walk that runs
   * into 03:33 still arrives, then the lights go out. `prefix` stays on
   * screen above the arrival (e.g. the result of the choice that sent you).
   */
  private walk(to: LocationId, prefix: Paragraph[]): void {
    const s = this.state;
    s.minute = Math.min(LOOP_LENGTH, s.minute + travelTime(this.index.distances, s.location, to));
    this.notices = [];
    this.navigate(this.entrySceneFor(to));
    s.display = [...prefix, ...this.notices, ...this.sceneText(s.scene)];
    this.fireEvents();
    if (s.minute >= LOOP_LENGTH && !s.ending) this.lightsOut();
  }

  private learn(id: string): void {
    const s = this.state;
    if (s.known.some((k) => k.id === id)) return;
    const def = this.index.notebook.get(id);
    if (!def) throw new Error(`Unknown notebook entry: ${id}`);
    s.known.push({ id, loop: s.loop, minute: s.minute });
    if (def.kind === 'phantom') {
      // Pages found together share one notice: "There are pages in your notebook…".
      const page: Paragraph = { key: def.body, style: 'phantom' };
      const last = this.notices[this.notices.length - 1];
      const notice = this.notices.findLast((p) => p.key === 'ui.phantom.notice');
      if (last?.style === 'phantom' && notice) {
        notice.params = { n: Number(notice.params?.['n'] ?? 1) + 1 };
        this.notices.push(page);
      } else {
        this.notices.push({ key: 'ui.phantom.notice', params: { n: 1 }, style: 'system' }, page);
      }
    } else {
      this.notices.push({ key: 'ui.noted', params: { entry: `@${def.title}` }, style: 'system' });
    }
  }

  /** Apply one effect. Movement is returned for the caller to perform. */
  private apply(effect: Effect): Applied {
    const s = this.state;
    if ('learn' in effect) this.learn(effect.learn);
    else if ('flag' in effect) {
      if (!s.flags.includes(effect.flag)) s.flags.push(effect.flag);
    } else if ('unflag' in effect) s.flags = s.flags.filter((f) => f !== effect.unflag);
    else if ('lflag' in effect) {
      if (!s.lflags.includes(effect.lflag)) s.lflags.push(effect.lflag);
    } else if ('unlflag' in effect) s.lflags = s.lflags.filter((f) => f !== effect.unlflag);
    else if ('give' in effect) {
      if (!s.inventory.includes(effect.give)) s.inventory.push(effect.give);
    } else if ('take' in effect) s.inventory = s.inventory.filter((i) => i !== effect.take);
    else if ('fragment' in effect) {
      if (!s.fragments.includes(effect.fragment)) s.fragments.push(effect.fragment);
    } else if ('fudge' in effect) {
      const existing = s.fudges.find((f) => f.id === effect.fudge);
      if (!existing) {
        s.fudges.push({ id: effect.fudge, corrected: false, loop: s.loop });
        s.fudgesEver += 1;
      } else if (existing.corrected) {
        existing.corrected = false;
        existing.loop = s.loop;
        s.fudgesEver += 1;
      }
      this.learn(effect.fudge);
    } else if ('chase' in effect) {
      if (!s.chaseUsed.includes(effect.chase)) {
        s.chaseUsed.push(effect.chase);
        s.obsession += 1;
        s.chasedThisLoop = true;
      }
    } else if ('rest' in effect) {
      if (!s.restUsed.includes(effect.rest)) {
        s.restUsed.push(effect.rest);
        s.obsession = Math.max(0, s.obsession - (effect.amount ?? 1));
        s.restedThisLoop = true;
      }
    } else if ('time' in effect) return { minutes: effect.time };
    else if ('go' in effect) return { minutes: 0, go: effect.go };
    else if ('scene' in effect) return { minutes: 0, scene: effect.scene };
    else if ('hub' in effect) return { minutes: 0, scene: this.entrySceneFor(s.location) };
    else if ('puzzle' in effect) {
      if (!this.index.puzzles.has(effect.puzzle)) throw new Error(`Unknown puzzle: ${effect.puzzle}`);
      s.puzzle = effect.puzzle;
    } else if ('solve' in effect) {
      if (!s.solved.includes(effect.solve)) s.solved.push(effect.solve);
    } else if ('ending' in effect) this.end(effect.ending);
    else {
      const unknown: never = effect;
      throw new Error(`Unknown effect: ${JSON.stringify(unknown)}`);
    }
    return { minutes: 0 };
  }

  private end(ending: EndingId): void {
    const s = this.state;
    if (s.ending) return;
    s.ending = ending;
    s.puzzle = null;
    s.darkRun = false;
    s.menu = 'none';
    s.cards.push({ kind: 'ending', ending });
  }

  /**
   * Let time pass minute by minute, firing timed events as their minute
   * arrives. Returns false if something took over: the lights went out, the
   * game ended, or (for interruptible waits) an event happened that the
   * player should get to react to.
   */
  private advance(minutes: number, opts: { events?: boolean; interruptible?: boolean } = {}): boolean {
    const s = this.state;
    const events = opts.events ?? true;
    for (let i = 0; i < minutes; i++) {
      s.minute += 1;
      if (events) {
        const fired = this.fireEvents();
        if (s.ending) return false;
        if (fired && opts.interruptible && s.minute < LOOP_LENGTH) return false;
      }
      if (s.minute >= LOOP_LENGTH) {
        this.lightsOut();
        return false;
      }
    }
    if (s.minute >= LOOP_LENGTH && !s.ending) {
      this.lightsOut();
      return false;
    }
    return true;
  }

  /** Fire every due event. Returns whether any fired. */
  private fireEvents(): boolean {
    const s = this.state;
    let fired = false;
    for (const event of this.content.events) {
      if (s.firedEvents.includes(event.id)) continue;
      if (s.minute < event.minute) continue;
      if (event.until !== undefined && s.minute >= event.until) continue;
      if (!holds(event.if, s)) continue;
      s.firedEvents.push(event.id);
      fired = true;
      this.notices = [];
      for (const effect of event.effects ?? []) this.apply(effect);
      s.display = [...s.display, ...this.paragraphs(event.text, 'event'), ...this.notices];
      if (s.ending) break;
    }
    return fired;
  }

  private lightsOut(): void {
    const s = this.state;
    if (s.ending) return;
    const before = s.display;
    s.minute = LOOP_LENGTH;
    s.puzzle = null;
    s.menu = 'none';
    s.loops.push({ loop: s.loop, location: s.location, minute: LOOP_LENGTH });
    if (s.chasedThisLoop && !s.restedThisLoop) s.obsession += 1;

    for (const rule of this.content.lightsOut) {
      if (!holds(rule.if, s)) continue;
      const text = this.paragraphs(rule.text, 'event');
      if (rule.ending || rule.puzzle) {
        s.cards.push({ kind: 'lightsout', loop: s.loop, before, dark: true });
        s.display = text;
        if (rule.ending) this.end(rule.ending);
        else {
          s.puzzle = rule.puzzle!;
          s.darkRun = true;
        }
        return;
      }
      this.notices = [];
      const cardAt = s.cards.length;
      for (const effect of rule.effects ?? []) this.apply(effect);
      if (s.ending) {
        s.cards.splice(cardAt, 0, { kind: 'lightsout', loop: s.loop, before, dark: true });
        s.display = [...text, ...this.notices];
        return;
      }
      this.reset([...text, ...this.notices]);
      return;
    }
    this.reset();
  }

  /** 02:47 again. Items and loop flags go; knowledge stays. */
  private reset(carried: Paragraph[] = []): void {
    const s = this.state;
    if (s.ending) return;
    const c = this.content;
    s.cards.push({ kind: 'lightsout', loop: s.loop, before: s.display });
    s.loop += 1;
    s.minute = 0;
    s.menu = 'none';
    s.inventory = [];
    s.lflags = [];
    s.usedLoop = [];
    s.firedEvents = [];
    s.chasedThisLoop = false;
    s.restedThisLoop = false;
    s.chaseUsed = [];
    s.restUsed = [];
    s.puzzle = null;
    s.darkRun = false;
    s.puzzleData = {};

    if (s.obsession >= c.obsession.infinite && s.loop - 1 >= c.obsession.infiniteFromLoop) {
      s.display = [];
      this.end('infinite');
      return;
    }

    const next = c.acts.find((a) => a.act === s.act + 1);
    if (next && holds(next.when, s)) {
      s.act = next.act;
      s.actLoop = s.loop;
      s.cards.push({ kind: 'act', act: next.act });
    }
    this.startLoop(carried);
  }

  /** Set up 02:47 of the current loop: phantom pages, the start room, loop-start text. */
  startLoop(carried: Paragraph[]): void {
    const s = this.state;
    const c = this.content;
    this.notices = [];
    for (const phantom of c.phantoms) {
      if (!s.known.some((k) => k.id === phantom.entry) && holds(phantom.when, s)) this.learn(phantom.entry);
    }
    const phantoms = this.notices;
    this.notices = [];
    this.navigate(this.entrySceneFor(c.start.location));
    s.display = [...carried, ...this.paragraphs(c.loopStart, 'text'), ...phantoms, ...this.notices, ...this.sceneText(s.scene)];
    this.fireEvents();
  }
}

/** Convenience for the UI and validator: how many fudges are still standing. */
export { uncorrectedFudges };
