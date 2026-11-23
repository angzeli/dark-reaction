/**
 * "You know how, but there's nowhere to do it": the soft-lock that isn't one.
 *
 * Some knowledge is a key: a code, a PIN, a rack number. Choices that use it
 * ask for it in their condition (`know: nb.priority`). When the player knows
 * it and stands in the room where it's used, the room should offer something
 * that answers it, even if only to say what else is missing (the tube, the
 * hour, the act). A room that offers nothing at all about the key leaves the
 * player with a code and nowhere to type it, and no idea why.
 *
 * This is the NMR console canary (#86): with RIDLEY-4 known and no tube, the
 * suite offered nothing about the code. Every ending stayed reachable, so no
 * soft-lock check fired; a real player was stuck anyway.
 *
 * A key-using choice only counts while it could still come back: if a part
 * of its condition can never hold again (its puzzle is solved, the act has
 * passed), the key has done its job there. Pure.
 */
import { Game } from '../../../src/engine/engine.ts';
import type { ChoiceDef, Cond, GameState } from '../../../src/engine/types.ts';
import { holds } from '../../../src/engine/conditions.ts';
import type { Finding } from './checks.ts';
import type { Model } from './model.ts';

/** Leaves of a condition with their polarity (true: as written; false: under a `not`). */
function* leaves(cond: Cond, positive = true): Generator<{ leaf: Cond; positive: boolean }> {
  if ('all' in cond) for (const c of cond.all) yield* leaves(c, positive);
  else if ('any' in cond) for (const c of cond.any) yield* leaves(c, positive);
  else if ('not' in cond) yield* leaves(cond.not, !positive);
  else yield { leaf: cond, positive };
}

/** Keys a choice asks the player to know. */
function keysOf(choice: ChoiceDef): string[] {
  if (!choice.if) return [];
  return [...leaves(choice.if)].filter((x) => x.positive && 'know' in x.leaf).map((x) => (x.leaf as { know: string }).know);
}

function mentions(choice: ChoiceDef, key: string): boolean {
  return !!choice.if && [...leaves(choice.if)].some((x) => 'know' in x.leaf && x.leaf.know === key);
}

/**
 * Whether a condition can never hold again from this state, given what only
 * ever grows (knowledge, solved puzzles, the act, the loop, fragments,
 * persistent flags, choices used in any loop). Items, tonight's flags, the
 * minute, the room and obsession can all change, so they never make it so.
 */
export function neverAgain(cond: Cond, s: GameState, positive = true): boolean {
  if ('all' in cond) return positive ? cond.all.some((c) => neverAgain(c, s, true)) : cond.all.every((c) => neverAgain(c, s, false));
  if ('any' in cond) return positive ? cond.any.every((c) => neverAgain(c, s, true)) : cond.any.some((c) => neverAgain(c, s, false));
  if ('not' in cond) return neverAgain(cond.not, s, !positive);
  const now = holds(cond, s);
  // Only a leaf that is wrong now, and only grows, can be wrong for good.
  if (now === positive) return false;
  if ('know' in cond || 'solved' in cond || 'flag' in cond || 'fragment' in cond || 'usedEver' in cond || 'fudgedEver' in cond) return !positive;
  if ('actGte' in cond || 'loopGte' in cond || 'fragmentsGte' in cond || 'loopsInActGte' in cond) return !positive;
  if ('act' in cond) return positive ? s.act > cond.act : false;
  return false;
}

/** What tonight can still bring: something to carry, something done tonight, the right minute. */
const TONIGHT = (leaf: Cond) => 'item' in leaf || 'lflag' in leaf || 'minuteGte' in leaf || 'minuteLt' in leaf || 'used' in leaf;

/** The parts of a choice's condition that don't hold now. */
function unmet(choice: ChoiceDef, state: GameState): Array<{ leaf: Cond; positive: boolean }> {
  return [...leaves(choice.if!)].filter((x) => holds(x.leaf, state) !== x.positive);
}

export function keyWithNowhereToUseIt(model: Model, state: GameState): Finding[] {
  if (state.ending || state.puzzle || state.menu !== 'none') return [];
  const scene = model.content.scenes.find((x) => x.id === state.scene);
  if (!scene) return [];
  const known = new Set(state.known.map((k) => k.id));
  const visible = new Set(new Game(model.content, state).choices().map((c) => c.id));
  const out: Finding[] = [];
  const keys = new Set(scene.choices.flatMap(keysOf));
  for (const key of keys) {
    if (!known.has(key)) continue;
    // A choice the key opens, where everything that lasts is in place and only tonight's part is missing
    // (the tube not made, the hour not come). Missing knowledge or a later act means the key isn't usable yet.
    const users = scene.choices.filter((c) => keysOf(c).includes(key) && !neverAgain(c.if!, state) && unmet(c, state).every((x) => TONIGHT(x.leaf)));
    if (!users.length) continue;
    const answered = scene.choices.some((c) => mentions(c, key) && (visible.has(c.id) || state.usedLoop.includes(c.id)));
    if (answered) continue;
    const missing = [...new Set(users.flatMap((c) => unmet(c, state).map((x) => `${x.positive ? '' : 'not '}${JSON.stringify(x.leaf)}`)))];
    out.push({
      level: 'error',
      check: 'affordance',
      sig: `affordance|${scene.id}|${key}|${missing.join(',')}`,
      message: `In ${scene.id} the player knows ${key}, which ${users.map((c) => c.id).join(' and ')} use${users.length === 1 ? 's' : ''}, but nothing here answers it (still missing: ${missing.join('; ')}). Loop ${state.loop}, act ${state.act}, minute ${state.minute}.`,
    });
  }
  return out;
}

export const AFFORDANCE_CHECKS = [keyWithNowhereToUseIt];
