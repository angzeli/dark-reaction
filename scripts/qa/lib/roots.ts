/**
 * Where exploration starts: a new game, and the 02:47 of every night each
 * scripted route (src/content/routes.ts) passes through, with the route's
 * own states that night as anchors. Exploring every night from those starts
 * reaches Acts II and III without enumerating every way of getting there,
 * and the anchors keep the way forward in the sample.
 */
import type { Route } from '../../../src/content/routes.ts';
import { newGameState } from '../../../src/engine/engine.ts';
import type { Content, GameState } from '../../../src/engine/types.ts';
import type { Root } from './explorer.ts';
import { analyse } from './model.ts';
import { step, type Action, type LogicTable } from './play.ts';

/** Play a route with the explorer's own step function: one root per night, with every state of that night as an anchor. */
export function routeRoots(content: Content, logic: LogicTable, route: Route): Root[] {
  const model = analyse(content);
  let state = newGameState(content);
  state.cards = [];
  const out: Root[] = [{ label: `new game, 02:47 of loop 1 (${route.ending} route)`, state: structuredClone(state), anchors: [] }];
  const take = (a: Action) => {
    const before = state.loop;
    state = step(model, logic, state, a).state;
    if (state.ending) return;
    if (state.loop !== before) out.push({ label: `${route.ending} route, 02:47 of loop ${state.loop} (act ${state.act})`, state: structuredClone(state), anchors: [] });
    else out[out.length - 1]!.anchors!.push(structuredClone(state));
  };
  const waitUntil = (minute: number) => {
    const loop = state.loop;
    for (let guard = 0; state.loop === loop && state.minute < minute && !state.ending && !state.puzzle && guard < 100; guard++) {
      const scene = content.scenes.find((s) => s.id === state.scene)!;
      if (!scene.hub) take({ t: 'c', id: 'meta:back' });
      const gap = minute - state.minute;
      take({ t: 'wait', n: gap >= 10 ? 10 : gap >= 5 ? 5 : 1 });
    }
  };
  for (const s of route.steps) {
    if (state.ending) break;
    if ('do' in s) take({ t: 'c', id: s.do });
    else if ('go' in s) take({ t: 'go', to: s.go });
    else if ('wait' in s) take({ t: 'wait', n: s.wait });
    else if ('until' in s) waitUntil(s.until);
    else if ('night' in s) waitUntil(46);
    else if ('solve' in s) take({ t: 'pz', o: 'solve' });
    else if ('fail' in s) take({ t: 'pz', o: 'leave' });
    else if ('correct' in s) take({ t: 'fix', id: s.correct });
  }
  return out;
}

export function defaultRoots(content: Content, logic: LogicTable, routes: Route[]): Root[] {
  return routes.flatMap((route) => routeRoots(content, logic, route));
}

export type { GameState };
