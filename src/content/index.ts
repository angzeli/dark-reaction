/**
 * The game's content: the Vellacott Building, its rooms and everything in
 * them, assembled from one file per location. docs/DESIGN.md is the spec.
 */
import type { Content } from '../engine/types.ts';
import { coldScenes } from './locations/cold.ts';
import { gloveboxScenes } from './locations/glovebox.ts';
import { nmrScenes } from './locations/nmr.ts';
import { officeScenes } from './locations/office.ts';
import { piScenes } from './locations/pi.ts';
import { roofScenes } from './locations/roof.ts';
import { stairsScenes } from './locations/stairs.ts';
import { synthScenes } from './locations/synth.ts';
import { ACTS, EVENTS, LIGHTS_OUT, PHANTOMS } from './night.ts';
import { NOTEBOOK } from './notebook.ts';
import { PUZZLE_DEFS } from './puzzles.ts';
import { EDGES, LOCATIONS } from './world.ts';

export const CONTENT: Content = {
  start: { location: 'office' },
  locations: LOCATIONS,
  edges: EDGES,
  loopStart: [
    { key: 'loop.start.first', if: { not: { loopGte: 2 } } },
    { key: 'loop.start.second', if: { all: [{ loopGte: 2 }, { not: { loopGte: 3 } }] } },
    { key: 'loop.start.again', if: { all: [{ loopGte: 3 }, { not: { act: 3 } }] } },
    { key: 'loop.start.act3', if: { all: [{ loopGte: 3 }, { act: 3 }] } },
  ],
  obsession: { decay1: 4, decay2: 7, infinite: 10, infiniteFromLoop: 4 },
  scenes: [...officeScenes, ...synthScenes, ...gloveboxScenes, ...piScenes, ...stairsScenes, ...nmrScenes, ...coldScenes, ...roofScenes],
  notebook: NOTEBOOK,
  puzzles: PUZZLE_DEFS,
  events: EVENTS,
  phantoms: PHANTOMS,
  lightsOut: LIGHTS_OUT,
  acts: ACTS,
  endings: [],
};
