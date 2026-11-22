/**
 * Stairwell and ground-floor lobby: the porter's desk and radio (rest), the
 * main entrance that won't let you out, fire exit B (released for the bins
 * on Mondays, 03:21–03:24), the fire alarm call point. docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';
import { EXIT_B_OPEN } from '../world.ts';

const exitOpen = { all: [{ minuteGte: EXIT_B_OPEN.from }, { minuteLt: EXIT_B_OPEN.to }] };

export const stairsScenes: SceneDef[] = [
  {
    id: 'stairs.hub',
    location: 'stairs',
    hub: true,
    text: [
      { key: 'stairs.hub.act1', if: { not: { act: 3 } } },
      { key: 'stairs.hub.act3', if: { act: 3 } },
    ],
    choices: [
      { id: 'stairs.desk', label: 'stairs.desk', cost: 1, once: 'loop', effects: [{ learn: 'nb.femi' }], text: [{ key: 'stairs.desk.r' }] },
      {
        id: 'stairs.radio',
        label: 'stairs.radio',
        cost: 3,
        once: 'loop',
        effects: [{ rest: 'radio' }],
        tags: ['rest'],
        text: [{ key: 'stairs.radio.r' }],
      },
      { id: 'stairs.entrance', label: 'stairs.entrance', cost: 1, once: 'loop', effects: [{ learn: 'nb.entrance' }], text: [{ key: 'stairs.entrance.r' }] },
      { id: 'stairs.exitb', label: 'stairs.exitb', cost: 1, if: { not: exitOpen }, text: [{ key: 'stairs.exitb.r' }] },
      { id: 'stairs.exitb.open', label: 'stairs.exitb', cost: 1, if: exitOpen, effects: [{ learn: 'nb.exitb' }], text: [{ key: 'stairs.exitb.open.r' }] },
      { id: 'stairs.callpoint', label: 'stairs.callpoint', cost: 1, once: 'loop', effects: [{ learn: 'nb.callpoint' }], text: [{ key: 'stairs.callpoint.r' }] },
      { id: 'stairs.window', label: 'stairs.window', cost: 1, once: 'loop', text: [{ key: 'stairs.window.r' }] },
    ],
  },
];
