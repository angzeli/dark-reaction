/**
 * What the QA explorer needs to know about the content before it plays it:
 * which state matters to the game (so equivalent states can be merged),
 * which choices are only flavour text, where every flag, item and notebook
 * entry can come from, and the minutes docs/DESIGN.md gives each action.
 * Pure: content in, tables out.
 */
import type { ChoiceDef, Cond, Content, Effect, LocationId, SceneDef, TextRef } from '../../../src/engine/types.ts';

/** A thing an effect can produce, e.g. `learn:nb.reset`, `give:item.vial`, `lflag:ups.armed`. */
export type Target = string;

/** Somewhere a target can come from. */
export type Source =
  | { kind: 'choice'; id: string }
  /** What every 02:47 gives you (`Content.onLoopStart`: your lanyard). */
  | { kind: 'loopstart'; id: '02:47' }
  | { kind: 'puzzle'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'rule'; id: string }
  | { kind: 'phantom'; id: string }
  | { kind: 'scene'; id: string };

export interface Model {
  content: Content;
  choices: Map<string, { choice: ChoiceDef; scene: SceneDef }>;
  /** Notebook entries some condition asks about (anything else is only read). */
  knowRefs: Set<string>;
  /** The subset asked about by conditions that decide play (choices, events, rules, acts, phantoms, doors), not just which paragraph shows. */
  playKnow: Set<string>;
  /** Choices whose effects only write knowledge (learn, fragment, flag): once those are all in hand, using the choice again changes nothing but the clock. */
  knowledgeOnly: Map<string, Effect[]>;
  /** Events that change state (the rest only print text). */
  eventsWithEffects: Set<string>;
  fragmentRefs: Set<string>;
  usedRefs: Set<string>;
  /** Loop numbers and loops-in-act above these change nothing the content checks. */
  loopCap: number;
  /** Choices that change with the loop's place in a cycle (`loopMod`) need it in the state key: the cycles' common length. */
  loopCycle: number;
  /** Anomalies some condition asks about. */
  anomalyRefs: Set<string>;
  loopsInActCap: number;
  /** Choices that only show text and pass time: no effects, no scene change, nothing asks whether they were used. */
  inert: Set<string>;
  /** For each target, which sources can produce it. */
  provenance: Map<Target, Source[]>;
  /** For each source, what it can produce, and what it can take away. */
  produces: Map<string, Set<Target>>;
  takes: Map<string, Set<string>>;
}

const sourceKey = (s: Source) => `${s.kind}:${s.id}`;

/** Every condition in the content, with whether it decides play or only which paragraph shows. */
function* conditions(content: Content): Generator<{ cond: Cond; text: boolean }> {
  const refs = function* (list: readonly TextRef[] | undefined) {
    for (const r of list ?? []) if (r.if) yield { cond: r.if, text: true };
  };
  for (const loc of content.locations) for (const e of loc.entry ?? []) yield { cond: e.if, text: false };
  yield* refs(content.loopStart);
  for (const scene of content.scenes) {
    yield* refs(scene.text);
    for (const c of scene.choices) {
      if (c.if) yield { cond: c.if, text: false };
      yield* refs(c.text);
    }
  }
  for (const p of content.puzzles) {
    yield* refs(p.solvedText);
    yield* refs(p.failedText);
    yield* refs(p.leftText);
  }
  for (const e of content.events) {
    if (e.if) yield { cond: e.if, text: false };
    yield* refs(e.text);
  }
  for (const r of content.lightsOut) {
    yield { cond: r.if, text: false };
    yield* refs(r.text);
  }
  for (const p of content.phantoms) yield { cond: p.when, text: false };
  for (const a of content.acts) yield { cond: a.when, text: false };
  for (const e of content.endings) yield* refs(e.epilogue);
}

function* leaves(cond: Cond): Generator<Cond> {
  if ('all' in cond) for (const c of cond.all) yield* leaves(c);
  else if ('any' in cond) for (const c of cond.any) yield* leaves(c);
  else if ('not' in cond) yield* leaves(cond.not);
  else yield cond;
}

function targetsOf(effects: readonly Effect[] | undefined): { gives: Target[]; takes: string[] } {
  const gives: Target[] = [];
  const takes: string[] = [];
  for (const e of effects ?? []) {
    if ('learn' in e) gives.push(`learn:${e.learn}`);
    else if ('flag' in e) gives.push(`flag:${e.flag}`);
    else if ('lflag' in e) gives.push(`lflag:${e.lflag}`);
    else if ('give' in e) gives.push(`give:${e.give}`);
    else if ('fragment' in e) gives.push(`fragment:${e.fragment}`);
    else if ('fudge' in e) gives.push(`fudge:${e.fudge}`, `learn:${e.fudge}`);
    else if ('solve' in e) gives.push(`solve:${e.solve}`);
    else if ('take' in e) takes.push(e.take);
    else if ('unflag' in e) takes.push(`flag:${e.unflag}`);
    else if ('unlflag' in e) takes.push(`lflag:${e.unlflag}`);
  }
  return { gives, takes };
}

export function analyse(content: Content): Model {
  const knowRefs = new Set<string>();
  const playKnow = new Set<string>();
  const fragmentRefs = new Set<string>();
  const usedRefs = new Set<string>();
  let loopCap = 1;
  let loopsInActCap = 0;
  let loopCycle = 1;
  const anomalyRefs = new Set<string>();
  const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
  for (const { cond, text } of conditions(content)) {
    for (const leaf of leaves(cond)) {
      if ('know' in leaf) {
        knowRefs.add(leaf.know);
        if (!text) playKnow.add(leaf.know);
      } else if ('fragment' in leaf) fragmentRefs.add(leaf.fragment);
      else if ('used' in leaf) usedRefs.add(leaf.used);
      else if ('usedEver' in leaf) usedRefs.add(leaf.usedEver);
      else if ('loopGte' in leaf) loopCap = Math.max(loopCap, leaf.loopGte);
      else if ('loopsInActGte' in leaf) loopsInActCap = Math.max(loopsInActCap, leaf.loopsInActGte);
      else if ('loopMod' in leaf) loopCycle = (loopCycle * leaf.loopMod[0]) / gcd(loopCycle, leaf.loopMod[0]);
      else if ('anomaly' in leaf) anomalyRefs.add(leaf.anomaly);
    }
  }
  // Infinite Loop asks how many loops have passed, too.
  loopCap = Math.max(loopCap, content.obsession.infiniteFromLoop + 1);

  const choices = new Map<string, { choice: ChoiceDef; scene: SceneDef }>();
  const inert = new Set<string>();
  const knowledgeOnly = new Map<string, Effect[]>();
  for (const scene of content.scenes) {
    for (const choice of scene.choices) {
      choices.set(choice.id, { choice, scene });
      if (usedRefs.has(choice.id) || choice.to) continue;
      const effects = choice.effects ?? [];
      if (!effects.length) inert.add(choice.id);
      else if (effects.every((e) => 'learn' in e || 'fragment' in e || 'flag' in e)) knowledgeOnly.set(choice.id, effects);
    }
  }
  const eventsWithEffects = new Set(content.events.filter((e) => e.effects?.length).map((e) => e.id));

  const provenance = new Map<Target, Source[]>();
  const produces = new Map<string, Set<Target>>();
  const takes = new Map<string, Set<string>>();
  const add = (source: Source, effects: readonly Effect[] | undefined, extra: Target[] = []) => {
    const t = targetsOf(effects);
    const key = sourceKey(source);
    const set = produces.get(key) ?? new Set<Target>();
    for (const g of [...t.gives, ...extra]) {
      set.add(g);
      const list = provenance.get(g) ?? [];
      list.push(source);
      provenance.set(g, list);
    }
    produces.set(key, set);
    const tk = takes.get(key) ?? new Set<string>();
    for (const x of t.takes) tk.add(x);
    takes.set(key, tk);
  };
  for (const scene of content.scenes) {
    add({ kind: 'scene', id: scene.id }, scene.onEnter);
    for (const choice of scene.choices) add({ kind: 'choice', id: choice.id }, choice.effects);
  }
  for (const p of content.puzzles) {
    add({ kind: 'puzzle', id: p.id }, [...p.onSolve, ...(p.onFail ?? [])], [`solve:${p.id}`]);
  }
  for (const e of content.events) add({ kind: 'event', id: e.id }, e.effects);
  for (const r of content.lightsOut) add({ kind: 'rule', id: r.id }, r.effects);
  for (const p of content.phantoms) add({ kind: 'phantom', id: p.entry }, [{ learn: p.entry }]);
  add({ kind: 'loopstart', id: '02:47' }, content.onLoopStart);

  return { content, choices, knowRefs, playKnow, knowledgeOnly, eventsWithEffects, fragmentRefs, usedRefs, loopCap, loopCycle, anomalyRefs, loopsInActCap, inert, provenance, produces, takes };
}

// ── What docs/DESIGN.md says things cost ───────────────────────────────────

/**
 * Minutes from docs/DESIGN.md §5, §9 and §11 for the actions it names. Looks
 * (flavour choices that only show text) cost 1, per §5. Puzzle openers cost
 * what the content says; the puzzle's own minutes are its logic's.
 */
export const DESIGN_COSTS: Record<string, number> = {
  'office.tea': 4,
  'office.sofa': 10,
  'stairs.radio': 3,
  'roof.priya': 3,
  'roof.rain': 2,
  'synth.rotavap': 5,
  'nmr.run': 8,
  'nmr.run.last': 8,
  'nmr.run.late': 8,
  'nmr.rerun': 8,
  'glovebox.purge': 9,
  'glovebox.purge.late': 9,
  'glovebox.mini.open': 9,
  'synth.combine': 1,
  'cold.e5': 2,
  'synth.kraken.again': 6,
  'synth.kraken.again.light': 6,
  'office.compare': 1,
  'synth.kraken.fill': 1,
  'nmr.ups': 1,
  'nmr.ups.again': 1,
};

/** Walking times from docs/DESIGN.md §4 (shortest routes). */
export function designTravel(a: LocationId, b: LocationId): number {
  const level4 = new Set<LocationId>(['office', 'synth', 'glovebox', 'pi']);
  const basement = new Set<LocationId>(['nmr', 'cold']);
  const toStairs = (x: LocationId) => (level4.has(x) ? 1 : basement.has(x) ? 2 : x === 'roof' ? 2 : 0);
  if (a === b) return 0;
  if (level4.has(a) && level4.has(b)) return 1;
  if (basement.has(a) && basement.has(b)) return 1;
  return toStairs(a) + toStairs(b);
}
