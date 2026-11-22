/**
 * Load-time checks on content shape. TypeScript accepts an object literal
 * with two discriminating keys (e.g. `{ at: 'nmr', minuteGte: 38 }`) as a
 * valid union member, but the engine would only read one of them. These
 * checks reject such objects, and effects used where they cannot work, the
 * moment content is loaded.
 */
import type { Content, Cond, Effect } from './types.ts';

const COND_KEYS = new Set([
  'all', 'any', 'not', 'flag', 'lflag', 'know', 'item', 'solved', 'act', 'actGte', 'loopGte', 'minuteGte', 'minuteLt',
  'at', 'obsessionGte', 'obsessionLt', 'uncorrectedGte', 'fudgedEver', 'fragment', 'fragmentsGte', 'loopsInActGte',
  'used', 'usedEver', 'always',
]);

const EFFECT_KEYS = new Set([
  'learn', 'flag', 'unflag', 'lflag', 'unlflag', 'give', 'take', 'fragment', 'fudge', 'chase', 'rest', 'time', 'go',
  'scene', 'hub', 'puzzle', 'solve', 'ending',
]);

/** Effects that move the player or the clock can only run inside a choice (and `time` in a puzzle's onSolve). */
const NAVIGATION = new Set(['time', 'go', 'scene', 'hub']);
/** Events, onEnter and lights-out effects also may not open puzzles (rules use `puzzle:` instead). */
const PASSIVE = new Set([...NAVIGATION, 'puzzle']);

export function checkCond(cond: Cond | undefined, where: string): void {
  if (cond === undefined) return;
  const keys = Object.keys(cond);
  if (keys.length !== 1 || !COND_KEYS.has(keys[0]!)) {
    throw new Error(`${where}: a condition must have exactly one known key, got {${keys.join(', ')}}`);
  }
  if ('all' in cond) cond.all.forEach((c, i) => checkCond(c, `${where}.all[${i}]`));
  if ('any' in cond) cond.any.forEach((c, i) => checkCond(c, `${where}.any[${i}]`));
  if ('not' in cond) checkCond(cond.not, `${where}.not`);
}

export function checkEffect(effect: Effect, where: string, forbid: ReadonlySet<string> = new Set()): void {
  const keys = Object.keys(effect).filter((k) => !(k === 'amount' && 'rest' in effect));
  if (keys.length !== 1 || !EFFECT_KEYS.has(keys[0]!)) {
    throw new Error(`${where}: an effect must have exactly one known key, got {${Object.keys(effect).join(', ')}}`);
  }
  if (forbid.has(keys[0]!)) throw new Error(`${where}: "${keys[0]}" effects are not allowed here`);
}

export function checkContent(content: Content): void {
  const all = (effects: readonly Effect[] | undefined, where: string, forbid?: ReadonlySet<string>) =>
    (effects ?? []).forEach((e, i) => checkEffect(e, `${where}[${i}]`, forbid));
  const texts = (refs: ReadonlyArray<{ if?: Cond }> | undefined, where: string) =>
    (refs ?? []).forEach((r, i) => checkCond(r.if, `${where}[${i}].if`));

  texts(content.loopStart, 'loopStart');
  for (const loc of content.locations) (loc.entry ?? []).forEach((e, i) => checkCond(e.if, `location ${loc.id}.entry[${i}]`));
  for (const scene of content.scenes) {
    texts(scene.text, `scene ${scene.id}.text`);
    all(scene.onEnter, `scene ${scene.id}.onEnter`, PASSIVE);
    for (const choice of scene.choices) {
      checkCond(choice.if, `choice ${choice.id}.if`);
      texts(choice.text, `choice ${choice.id}.text`);
      all(choice.effects, `choice ${choice.id}.effects`);
      const moves = (choice.effects ?? []).filter((e) => 'go' in e || 'scene' in e || 'hub' in e).length + (choice.to ? 1 : 0);
      if (moves > 1) throw new Error(`choice ${choice.id}: at most one of go / scene / hub / to`);
    }
  }
  for (const p of content.puzzles) {
    all(p.onSolve, `puzzle ${p.id}.onSolve`, new Set(['go', 'scene', 'hub']));
    texts(p.solvedText, `puzzle ${p.id}.solvedText`);
    texts(p.failedText, `puzzle ${p.id}.failedText`);
  }
  for (const ev of content.events) {
    checkCond(ev.if, `event ${ev.id}.if`);
    all(ev.effects, `event ${ev.id}.effects`, PASSIVE);
    texts(ev.text, `event ${ev.id}.text`);
  }
  for (const ph of content.phantoms) checkCond(ph.when, `phantom ${ph.entry}.when`);
  for (const rule of content.lightsOut) {
    checkCond(rule.if, `lightsOut ${rule.id}.if`);
    all(rule.effects, `lightsOut ${rule.id}.effects`, PASSIVE);
    texts(rule.text, `lightsOut ${rule.id}.text`);
  }
  for (const act of content.acts) checkCond(act.when, `act ${act.act}.when`);
  for (const ending of content.endings) texts(ending.epilogue, `ending ${ending.id}.epilogue`);
}

/**
 * Every scene, notebook entry, puzzle and location that content points at
 * must exist, so no action can fail half-way through on a typo.
 */
export function checkReferences(content: Content): void {
  const scenes = new Set(content.scenes.map((s) => s.id));
  const notebook = new Set(content.notebook.map((n) => n.id));
  const puzzles = new Set(content.puzzles.map((p) => p.id));
  const locations = new Set(content.locations.map((l) => l.id));
  const endings = new Set(content.endings.map((e) => e.id));
  const problems: string[] = [];
  const need = (set: Set<string>, id: string, kind: string, where: string) => {
    if (!set.has(id)) problems.push(`${where}: unknown ${kind} "${id}"`);
  };
  const effects = (list: readonly Effect[] | undefined, where: string) => {
    for (const e of list ?? []) {
      if ('learn' in e) need(notebook, e.learn, 'notebook entry', where);
      else if ('fudge' in e) need(notebook, e.fudge, 'notebook entry (fudge)', where);
      else if ('scene' in e) need(scenes, e.scene, 'scene', where);
      else if ('go' in e) need(locations, e.go, 'location', where);
      else if ('puzzle' in e) need(puzzles, e.puzzle, 'puzzle', where);
      else if ('solve' in e) need(puzzles, e.solve, 'puzzle', where);
      else if ('ending' in e) need(endings, e.ending, 'ending', where);
    }
  };
  need(locations, content.start.location, 'location', 'start');
  for (const loc of content.locations) {
    need(scenes, loc.hub, 'scene', `location ${loc.id}.hub`);
    for (const entry of loc.entry ?? []) need(scenes, entry.scene, 'scene', `location ${loc.id}.entry`);
  }
  for (const scene of content.scenes) {
    need(locations, scene.location, 'location', `scene ${scene.id}`);
    effects(scene.onEnter, `scene ${scene.id}.onEnter`);
    for (const choice of scene.choices) {
      if (choice.to) need(scenes, choice.to, 'scene', `choice ${choice.id}.to`);
      effects(choice.effects, `choice ${choice.id}`);
    }
  }
  for (const p of content.puzzles) effects(p.onSolve, `puzzle ${p.id}.onSolve`);
  for (const ev of content.events) effects(ev.effects, `event ${ev.id}`);
  for (const ph of content.phantoms) need(notebook, ph.entry, 'notebook entry', `phantom ${ph.entry}`);
  for (const rule of content.lightsOut) {
    effects(rule.effects, `lightsOut ${rule.id}`);
    if (rule.puzzle) need(puzzles, rule.puzzle, 'puzzle', `lightsOut ${rule.id}`);
    if (rule.ending) need(endings, rule.ending, 'ending', `lightsOut ${rule.id}`);
  }
  if (problems.length) throw new Error(`Content references:\n  ${problems.join('\n  ')}`);
}
