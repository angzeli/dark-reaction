/**
 * The invariants the explorer and the fuzzer assert on every transition and
 * every state (docs/DESIGN.md §5–§7, §19): the clock, the reset at 03:33,
 * where every flag, item and notebook entry comes from, what each action
 * costs, saves, and both languages. Pure.
 */
import { LOOP_LENGTH } from '../../../src/engine/clock.ts';
import { Game } from '../../../src/engine/engine.ts';
import type { ChoiceDef, GameState, Paragraph } from '../../../src/engine/types.ts';
import { placeholders, t, type Locale } from '../../../src/i18n/i18n.ts';
import { SaveStore } from '../../../src/save/saves.ts';
import { memoryStorage } from '../../../src/save/storage.ts';
import { DESIGN_COSTS, designTravel, type Model, type Target } from './model.ts';
import { actions, type Action, type Step } from './play.ts';

export type Level = 'error' | 'warning' | 'info';

export interface Finding {
  level: Level;
  check: string;
  /** Findings with the same signature are one finding. */
  sig: string;
  message: string;
}

const f = (level: Level, check: string, sig: string, message: string): Finding => ({ level, check, sig: `${check}|${sig}`, message });

const LOCALES: Locale[] = ['en', 'zh-Hant-TW'];

function diff(a: readonly string[], b: readonly string[]): string[] {
  const set = new Set(a);
  return b.filter((x) => !set.has(x));
}

/** The sources that could have produced something during this step. */
function activeSources(model: Model, before: GameState, action: Action, after: GameState, step: Step): string[] {
  const out: string[] = [];
  if (action.t === 'c') out.push(`choice:${action.id}`);
  if (action.t === 'pz' && before.puzzle) out.push(`puzzle:${before.puzzle}`);
  out.push(`scene:${after.scene}`);
  const newLoop = after.loop !== before.loop;
  if (newLoop) {
    // The rest of the old night ran (its events), 03:33 decided (a rule), and 02:47 wrote its pages.
    // An event that hasn't fired yet fires late once its condition holds, unless its `until` has passed.
    for (const e of model.content.events) {
      const pending = !before.firedEvents.includes(e.id) && (e.until === undefined || before.minute < e.until);
      if (pending || after.firedEvents.includes(e.id)) out.push(`event:${e.id}`);
    }
    for (const r of model.content.lightsOut) out.push(`rule:${r.id}`);
    for (const p of model.content.phantoms) out.push(`phantom:${p.entry}`);
    out.push('loopstart:02:47');
  } else {
    for (const id of diff(before.firedEvents, after.firedEvents)) out.push(`event:${id}`);
    if (step.cards.some((c) => c.kind === 'lightsout')) for (const r of model.content.lightsOut) out.push(`rule:${r.id}`);
  }
  return out;
}

/** What changed, as targets (gains) and losses. */
function gains(before: GameState, after: GameState): { gained: Target[]; lost: string[] } {
  const sameLoop = after.loop === before.loop;
  const gained: Target[] = [];
  const lost: string[] = [];
  for (const id of diff(before.known.map((k) => k.id), after.known.map((k) => k.id))) gained.push(`learn:${id}`);
  for (const id of diff(before.flags, after.flags)) gained.push(`flag:${id}`);
  for (const id of diff(before.fragments, after.fragments)) gained.push(`fragment:${id}`);
  for (const id of diff(before.solved, after.solved)) gained.push(`solve:${id}`);
  for (const fu of after.fudges) {
    const was = before.fudges.find((x) => x.id === fu.id);
    if (!fu.corrected && (!was || was.corrected)) gained.push(`fudge:${fu.id}`);
  }
  if (sameLoop) {
    for (const id of diff(before.lflags, after.lflags)) gained.push(`lflag:${id}`);
    for (const id of diff(before.inventory, after.inventory)) gained.push(`give:${id}`);
    for (const id of diff(after.inventory, before.inventory)) lost.push(id);
    for (const id of diff(after.lflags, before.lflags)) lost.push(`lflag:${id}`);
  } else {
    for (const id of after.lflags) gained.push(`lflag:${id}`);
    for (const id of after.inventory) gained.push(`give:${id}`);
  }
  for (const id of diff(after.flags, before.flags)) lost.push(`flag:${id}`);
  return { gained, lost };
}

/** What a choice costs at this minute: its cost and `time` effects, or, sitting until a minute (`timeTo`), the wait to it. */
function costOf(choice: ChoiceDef, minute: number): number {
  let n = choice.cost ?? 0;
  for (const e of choice.effects ?? []) if ('time' in e) n += e.time;
  for (const e of choice.effects ?? []) if ('timeTo' in e) n = Math.max(n, e.timeTo - minute);
  return n;
}

/** Invariants on one transition. */
export function checkStep(model: Model, before: GameState, action: Action, step: Step): Finding[] {
  const out: Finding[] = [];
  const after = step.state;
  const what = `${action.t === 'c' ? action.id : action.t === 'go' ? `walking ${before.location}→${action.to}` : action.t === 'wait' ? `waiting ${action.n}` : action.t === 'pz' ? `${before.puzzle}: ${action.o}` : `striking ${action.id} through`}`;
  const at = `in ${before.scene} at loop ${before.loop}, minute ${before.minute}`;

  // ── The clock ──
  const newLoop = after.loop !== before.loop;
  if (newLoop) {
    if (after.loop !== before.loop + 1) out.push(f('error', 'clock', `jump:${what}`, `${what} ${at} moved the loop from ${before.loop} to ${after.loop}`));
    if (!after.ending && after.minute !== 0) out.push(f('error', 'clock', `start:${what}`, `${what} ${at}: the next loop starts at minute ${after.minute}, not 02:47`));
    if (!step.cards.some((c) => c.kind === 'lightsout' && c.loop === before.loop)) out.push(f('error', 'reset', `nocard:${what}`, `${what} ${at}: a new loop began without the lights going out`));
  } else {
    if (after.minute < before.minute) out.push(f('error', 'clock', `back:${what}`, `${what} ${at}: the clock went back to minute ${after.minute}`));
    if (after.minute > LOOP_LENGTH) out.push(f('error', 'clock', `over:${what}`, `${what} ${at}: the clock reached minute ${after.minute}, past 03:33`));
  }

  // ── The reset: items go, knowledge stays ──
  for (const id of diff(after.known.map((k) => k.id), before.known.map((k) => k.id))) out.push(f('error', 'persist', `known:${id}`, `${what} ${at}: notebook entry ${id} was lost`));
  for (const id of diff(after.solved, before.solved)) out.push(f('error', 'persist', `solved:${id}`, `${what} ${at}: puzzle ${id} became unsolved`));
  for (const id of diff(after.fragments, before.fragments)) out.push(f('error', 'persist', `fragment:${id}`, `${what} ${at}: fragment ${id} was lost`));
  for (const fu of before.fudges) if (!after.fudges.some((x) => x.id === fu.id)) out.push(f('error', 'persist', `fudge:${fu.id}`, `${what} ${at}: fudge ${fu.id} vanished from the notebook`));
  if (after.fudgesEver < before.fudgesEver) out.push(f('error', 'persist', 'fudgesEver', `${what} ${at}: fudgesEver went down`));
  if (newLoop && !after.ending) {
    // Items go at 03:33; 02:47 gives back only what every loop starts with (your lanyard).
    const always = new Set((model.content.onLoopStart ?? []).flatMap((e) => ('give' in e ? [e.give] : [])));
    const carried = after.inventory.filter((i) => !always.has(i));
    if (carried.length) out.push(f('error', 'reset', `items:${carried.join(',')}`, `${what} ${at}: carried into the next loop: ${carried.join(', ')}`));
    for (const i of always) if (!after.inventory.includes(i)) out.push(f('error', 'reset', `start:${i}`, `${what} ${at}: the next loop starts without ${i}`));
    if (after.usedLoop.length || after.chaseUsed.length || after.restUsed.length) out.push(f('error', 'reset', 'used', `${what} ${at}: tonight's used choices carried into the next loop`));
    if (after.location !== model.content.start.location) out.push(f('error', 'reset', 'start', `${what} ${at}: the next loop starts in ${after.location}`));
    const quiet = action.t === 'wait' || action.t === 'go';
    const expected = before.obsession + (before.chasedThisLoop && !before.restedThisLoop ? 1 : 0);
    if (quiet && after.obsession !== expected) out.push(f('error', 'reset', 'obsession', `${what} ${at}: obsession went from ${before.obsession} to ${after.obsession} at 03:33 (expected ${expected})`));
  }

  // ── Provenance: nothing appears without the thing that makes it ──
  const sources = activeSources(model, before, action, after, step);
  const possible = new Set<Target>();
  const takeable = new Set<string>();
  for (const src of sources) {
    for (const t of model.produces.get(src) ?? []) possible.add(t);
    for (const t of model.takes.get(src) ?? []) takeable.add(t);
  }
  const { gained, lost } = gains(before, after);
  for (const g of gained) {
    if (!possible.has(g)) out.push(f('error', 'provenance', `${g}:${what}`, `${what} ${at} produced ${g}, which none of its sources (${sources.join(', ') || 'none'}) can produce`));
  }
  for (const l of lost) {
    if (l.startsWith('flag:')) out.push(f('error', 'persist', `lost:${l}`, `${what} ${at}: persistent ${l} was cleared`));
    else if (!takeable.has(l)) out.push(f('error', 'provenance', `take:${l}:${what}`, `${what} ${at} took ${l}, which none of its sources can take`));
  }

  // ── What it cost, against what was shown and what the design says ──
  if (!newLoop && !after.ending && after.minute < LOOP_LENGTH) {
    const spent = after.minute - before.minute;
    if (action.t === 'c') {
      const entry = model.choices.get(action.id);
      if (entry) {
        const { choice } = entry;
        const expected = costOf(choice, before.minute);
        const opened = !before.puzzle && after.puzzle;
        if (!opened && spent !== expected) out.push(f('error', 'cost', action.id, `${action.id} costs ${expected} min in the content but took ${spent} (${at})`));
        if (opened && spent !== (choice.cost ?? 0)) out.push(f('error', 'cost', action.id, `${action.id} opened ${after.puzzle} after ${spent} min, not its ${choice.cost ?? 0}`));
        if (step.shownCost !== undefined && !opened && step.shownCost !== spent) {
          out.push(f('warning', 'promise', `shown:${action.id}`, `${action.id} shows ${step.shownCost} min but takes ${spent}`));
        }
        const design = DESIGN_COSTS[action.id];
        if (design !== undefined && expected !== design) out.push(f('error', 'cost', `design:${action.id}`, `${action.id} costs ${expected} min; docs/DESIGN.md says ${design}`));
        if (model.inert.has(action.id) && choice.once === 'loop' && (choice.cost ?? 0) !== 1) {
          out.push(f('warning', 'cost', `look:${action.id}`, `${action.id} is a look (text only, once a loop) but costs ${choice.cost ?? 0} min; docs/DESIGN.md §5 says looking closely costs 1`));
        }
      }
    } else if (action.t === 'go') {
      const design = designTravel(before.location, action.to);
      if (spent !== design) out.push(f('error', 'cost', `travel:${before.location}:${action.to}`, `walking ${before.location}→${action.to} took ${spent} min; docs/DESIGN.md §4 says ${design}`));
      if (step.shownCost !== undefined && step.shownCost !== spent) out.push(f('warning', 'promise', `travel-shown:${before.location}:${action.to}`, `walking ${before.location}→${action.to} shows ${step.shownCost} min but takes ${spent}`));
    } else if (action.t === 'wait') {
      const fired = diff(before.firedEvents, after.firedEvents).length > 0;
      if (spent > action.n || (spent < action.n && !fired)) out.push(f('error', 'cost', `wait:${action.n}`, `waiting ${action.n} min ${at} took ${spent}`));
    } else if (action.t === 'fix') {
      if (spent !== 1) out.push(f('error', 'cost', 'fix', `striking a fudge through took ${spent} min; docs/DESIGN.md §6 says 1`));
    }
  }

  // ── Something should happen on screen ──
  if (action.t === 'c' && !after.ending && !after.puzzle && step.cards.length === 0 && after.display.length === 0) {
    out.push(f('warning', 'noop', `blank:${action.id}`, `${action.id} ${at} shows nothing at all`));
  }
  return out;
}

const rendered = new Map<string, string[]>();

/** Render a paragraph in both languages and report what didn't render. */
function renderProblems(p: { key: string; params?: Record<string, string | number> }, where: string): Finding[] {
  const memo = JSON.stringify([p.key, p.params ?? null]);
  let problems = rendered.get(memo);
  if (!problems) {
    problems = [];
    for (const locale of LOCALES) {
      const text = t(p.key, p.params, locale);
      if (text.includes('[[')) problems.push(`${locale}: missing key in "${text.slice(0, 80)}"`);
      const left = placeholders(text);
      if (left.length) problems.push(`${locale}: unfilled {${left.join(', ')}} in "${text.slice(0, 80)}"`);
      if (text.trim() === '') problems.push(`${locale}: "${p.key}" renders empty`);
    }
    rendered.set(memo, problems);
  }
  return problems.map((m) => f('error', 'locale', `${p.key}:${m}`, `${where}: ${m}`));
}

/** Invariants on a state the first time it is reached. */
export function checkState(model: Model, state: GameState, opts: { saves?: boolean } = {}): Finding[] {
  const out: Finding[] = [];
  const at = `${state.scene} at loop ${state.loop}, minute ${state.minute}`;
  const game = new Game(model.content, state);
  const snapshot = JSON.stringify(state);

  // Soft-lock: nothing to do, and nothing pending.
  const acts = actions(game);
  if (!state.ending && acts.length === 0) out.push(f('error', 'softlock', `none:${state.scene}`, `nothing to do in ${at}`));

  // Both languages: everything on screen and every label renders, and rendering changes nothing.
  for (const p of state.display) out.push(...renderProblems(p as Paragraph, at));
  if (!state.puzzle && !state.ending) for (const c of game.choices()) out.push(...renderProblems({ key: c.label, ...(c.params ? { params: c.params } : {}) }, `${at}, choice ${c.id}`));
  if (JSON.stringify(state) !== snapshot) out.push(f('error', 'language', `mutated:${state.scene}`, `rendering ${at} changed the game state`));

  // Save, then load: the same state.
  if (opts.saves !== false) {
    const store = new SaveStore(memoryStorage(), { content: model.content });
    if (!store.write('auto', state, 'en')) out.push(f('error', 'save', `write:${state.scene}`, `could not save ${at}`));
    else {
      const r = store.read('auto');
      if (!r.ok) out.push(f('error', 'save', `read:${r.reason}`, `saved ${at} but loading it failed: ${r.reason}`));
      else if (JSON.stringify(r.envelope.state) !== snapshot) out.push(f('error', 'save', `differs:${state.scene}`, `saving and loading ${at} gave a different state`));
    }
  }
  return out;
}
