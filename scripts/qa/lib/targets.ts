/**
 * Layer 3's list of screens: every room in every act, the scenes inside
 * rooms, all ten puzzles, all six endings, the overlays and the title.
 * Each is a game state (built from the scripted routes' own nights, then
 * placed where the screen is) that the sweep and the visual-regression
 * tests load into the real UI as a save. Pure: no browser here.
 */
import { CONTENT } from '../../../src/content/index.ts';
import { ROUTES, type Route } from '../../../src/content/routes.ts';
import { Game } from '../../../src/engine/engine.ts';
import type { Act, EndingId, GameState, LocationId } from '../../../src/engine/types.ts';
import { PUZZLE_LOGIC } from '../../../src/puzzles/logic.ts';
import { routeRoots } from './roots.ts';

export type Overlay = 'notebook' | 'menu' | 'settings' | 'gallery' | 'note';

export interface Target {
  /** File-name-safe, unique: e.g. `act2-office`, `puzzle-freezer`, `ending-dark`. */
  name: string;
  screen: 'title' | 'play' | 'ending';
  state?: GameState;
  overlay?: Overlay;
}

/** A state from each act's first night on the true ending's route. */
function actStates(): Record<Act, GameState> {
  const roots = routeRoots(CONTENT, PUZZLE_LOGIC, ROUTES.dark as Route);
  const first = (act: Act) => roots.find((r) => r.state.act === act)!.state;
  return { 1: first(1), 2: first(2), 3: first(3) };
}

function place(base: GameState, scene: string, patch: Partial<GameState> = {}): GameState {
  const s: GameState = { ...structuredClone(base), ...structuredClone(patch) };
  const game = new Game(CONTENT, s);
  const def = game.index.scenes.get(scene)!;
  s.scene = scene;
  s.location = def.location;
  s.menu = 'none';
  s.cards = [];
  // A save at this minute has already lived through the night's earlier events: without this a
  // player starting here (`drive.ts start --at`) would see 02:50's email arrive after reading it.
  if (patch.minute !== undefined && !patch.firedEvents) s.firedEvents = CONTENT.events.filter((e) => e.minute < s.minute).map((e) => e.id);
  s.display = game.sceneText(scene);
  return s;
}

const MINUTE: Partial<Record<LocationId, number>> = { pi: 29, stairs: 12 };

export function targets(): Target[] {
  const acts = actStates();
  const out: Target[] = [{ name: 'title', screen: 'title' }, { name: 'title-note', screen: 'title', overlay: 'note' }, { name: 'title-settings', screen: 'title', overlay: 'settings' }, { name: 'title-gallery', screen: 'title', overlay: 'gallery' }];

  // Every room's hub in every act; the office as it is at 02:47 (the loop's own first page).
  for (const act of [1, 2, 3] as Act[]) {
    const base = acts[act];
    for (const loc of CONTENT.locations) {
      if (loc.id === 'office') {
        out.push({ name: `act${act}-office-0247`, screen: 'play', state: { ...structuredClone(base), cards: [] } });
        continue;
      }
      out.push({ name: `act${act}-${loc.id}`, screen: 'play', state: place(base, loc.hub, { minute: MINUTE[loc.id] ?? 12 }) });
    }
    out.push({ name: `act${act}-office`, screen: 'play', state: place(base, 'office.hub', { minute: 12 }) });
  }
  out.push({ name: 'act1-pi-door', screen: 'play', state: place(acts[1], 'pi.door', { minute: 5 }) });

  // Scenes inside rooms (Act II unless they need more).
  const a2 = acts[2];
  out.push({ name: 'scene-office-monitor', screen: 'play', state: place(a2, 'office.monitor', { minute: 12 }) });
  out.push({ name: 'scene-office-desk7', screen: 'play', state: place(a2, 'office.desk7', { minute: 12 }) });
  // Her raw data, with its unbreakable filename on screen (#156).
  {
    const g = new Game(CONTENT, place(a2, 'office.hub', { minute: 12, inventory: ['item.microsd'] }));
    g.choose('office.microsd');
    out.push({ name: 'scene-office-microsd', screen: 'play', state: { ...g.state, cards: [] } });
  }
  out.push({ name: 'scene-glovebox-logbook', screen: 'play', state: place(acts[1], 'glovebox.logbook', { minute: 12 }) });
  out.push({ name: 'scene-pi-box', screen: 'play', state: place(a2, 'pi.box', { minute: 29 }) });
  out.push({ name: 'scene-stairs-door', screen: 'play', state: place(a2, 'stairs.door', { minute: 35 }) });
  out.push({
    name: 'scene-stairs-alarm',
    screen: 'play',
    state: place(a2, 'stairs.alarm', { minute: 20, known: [...a2.known, { id: 'nb.keeps', loop: a2.loop, minute: 0 }, { id: 'nb.callpoint', loop: a2.loop, minute: 0 }] }),
  });
  out.push({ name: 'scene-office-process', screen: 'play', state: place(a2, 'office.process', { minute: 40, inventory: ['item.spectrum.own'] }) });
  out.push({
    name: 'scene-office-declare-blocked',
    screen: 'play',
    state: place(a2, 'office.declare.own', {
      minute: 40,
      inventory: ['item.spectrum.own'],
      fudges: [{ id: 'fudge.baseline', corrected: false, loop: a2.loop }],
      fudgesEver: 1,
      known: [...a2.known, { id: 'fudge.baseline', loop: a2.loop, minute: 39 }],
    }),
  });

  // Every puzzle, open, in the room and moment it opens.
  const puzzle = (id: string, act: Act, scene: string, patch: Partial<GameState> = {}) =>
    out.push({ name: `puzzle-${id}`, screen: 'play', state: { ...place(acts[act], scene, { minute: 8, ...patch }), puzzle: id } });
  puzzle('tlc', 1, 'synth.hub');
  puzzle('glovebox', 1, 'glovebox.hub', { inventory: ['item.vial'] });
  puzzle('console', 1, 'nmr.hub');
  puzzle('doorlog', 2, 'stairs.hub');
  puzzle('cipher', 2, 'pi.hub', { minute: 29 });
  puzzle('freezer', 2, 'cold.hub');
  puzzle('schlenk', 3, 'synth.hub', { inventory: ['item.tube.jy', 'item.foil'] });
  puzzle('chirp', 3, 'nmr.hub');
  puzzle('fabrication', 3, 'office.hub', { inventory: ['item.printout'] });
  puzzle('peakmatch', 3, 'nmr.hub', { minute: 46, darkRun: true, lflags: ['holder13.loaded', 'ups.armed'] });

  // Every ending.
  for (const e of CONTENT.endings) {
    const s = place(acts[e.id === 'clocking' || e.id === 'fire' || e.id === 'perfect' || e.id === 'honest' ? 2 : 3], 'office.hub', { minute: 40 });
    s.ending = e.id as EndingId;
    out.push({ name: `ending-${e.id}`, screen: 'ending', state: s });
  }

  // Overlays over the play screen (Act II, with a notebook worth reading).
  out.push({ name: 'overlay-notebook', screen: 'play', state: place(a2, 'office.hub', { minute: 12 }), overlay: 'notebook' });
  out.push({ name: 'overlay-menu', screen: 'play', state: place(a2, 'office.hub', { minute: 12 }), overlay: 'menu' });
  return out;
}
