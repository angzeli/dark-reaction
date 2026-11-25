import type { Cond, GameState } from './types.ts';

/** Number of fudges still standing in the notebook. */
export function uncorrectedFudges(state: GameState): number {
  return state.fudges.filter((f) => !f.corrected).length;
}

/** Evaluate a condition against the state. An absent condition is true. */
export function holds(cond: Cond | undefined, state: GameState): boolean {
  if (!cond) return true;
  if ('all' in cond) return cond.all.every((c) => holds(c, state));
  if ('any' in cond) return cond.any.some((c) => holds(c, state));
  if ('not' in cond) return !holds(cond.not, state);
  if ('flag' in cond) return state.flags.includes(cond.flag);
  if ('lflag' in cond) return state.lflags.includes(cond.lflag);
  if ('know' in cond) return state.known.some((k) => k.id === cond.know);
  if ('item' in cond) return state.inventory.includes(cond.item);
  if ('solved' in cond) return state.solved.includes(cond.solved);
  if ('act' in cond) return state.act === cond.act;
  if ('actGte' in cond) return state.act >= cond.actGte;
  if ('loopGte' in cond) return state.loop >= cond.loopGte;
  if ('minuteGte' in cond) return state.minute >= cond.minuteGte;
  if ('minuteLt' in cond) return state.minute < cond.minuteLt;
  if ('at' in cond) return state.location === cond.at;
  if ('scene' in cond) return state.scene === cond.scene;
  if ('obsessionGte' in cond) return state.obsession >= cond.obsessionGte;
  if ('obsessionLt' in cond) return state.obsession < cond.obsessionLt;
  if ('uncorrectedGte' in cond) return uncorrectedFudges(state) >= cond.uncorrectedGte;
  if ('fudgedEver' in cond) return state.fudgesEver > 0;
  if ('fragment' in cond) return state.fragments.includes(cond.fragment);
  if ('fragmentsGte' in cond) return state.fragments.length >= cond.fragmentsGte;
  if ('loopsInActGte' in cond) return state.loop - state.actLoop >= cond.loopsInActGte;
  if ('used' in cond) return state.usedLoop.includes(cond.used);
  if ('usedEver' in cond) return state.usedEver.includes(cond.usedEver);
  if ('loopMod' in cond) return (state.loop - 1) % cond.loopMod[0] === cond.loopMod[1];
  if ('anomaly' in cond) return state.anomalies.includes(cond.anomaly);
  if ('ended' in cond) return state.ending !== null;
  if ('always' in cond) return true;
  const unknown: never = cond;
  throw new Error(`Unknown condition: ${JSON.stringify(unknown)}`);
}

/** Every string id a condition refers to, for the validator. */
export function condRefs(cond: Cond | undefined, out: Array<{ kind: string; id: string }> = []): Array<{ kind: string; id: string }> {
  if (!cond) return out;
  if ('all' in cond) cond.all.forEach((c) => condRefs(c, out));
  else if ('any' in cond) cond.any.forEach((c) => condRefs(c, out));
  else if ('not' in cond) condRefs(cond.not, out);
  else if ('know' in cond) out.push({ kind: 'notebook', id: cond.know });
  else if ('item' in cond) out.push({ kind: 'item', id: cond.item });
  else if ('solved' in cond) out.push({ kind: 'puzzle', id: cond.solved });
  else if ('fragment' in cond) out.push({ kind: 'fragment', id: cond.fragment });
  else if ('used' in cond) out.push({ kind: 'choice', id: cond.used });
  else if ('usedEver' in cond) out.push({ kind: 'choice', id: cond.usedEver });
  else if ('flag' in cond) out.push({ kind: 'flag', id: cond.flag });
  else if ('lflag' in cond) out.push({ kind: 'lflag', id: cond.lflag });
  else if ('scene' in cond) out.push({ kind: 'scene', id: cond.scene });
  else if ('anomaly' in cond) out.push({ kind: 'anomaly', id: cond.anomaly });
  return out;
}
