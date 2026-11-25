/**
 * The roof: rain, the city, the only phone signal in the building (Priya),
 * and under the deckchair, Y.C.'s rain log. Two kinds of rest.
 * docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';
import { CALM_UNTIL_ACT3 } from '../tone.ts';

export const roofScenes: SceneDef[] = [
  {
    id: 'roof.hub',
    location: 'roof',
    tone: CALM_UNTIL_ACT3,
    hub: true,
    text: [
      { key: 'roof.hub.act1', if: { not: { act: 3 } } },
      { key: 'roof.hub.act3', if: { act: 3 } },
    ],
    choices: [
      {
        id: 'roof.priya',
        label: 'roof.priya',
        cost: 3,
        once: 'loop',
        effects: [{ rest: 'priya' }],
        tags: ['rest'],
        // Priya's side of the night changes as yours does.
        text: [
          { key: 'roof.priya.r.1', if: { act: 1 } },
          { key: 'roof.priya.r.2', if: { act: 1 } },
          { key: 'roof.priya.act2.1', if: { act: 2 } },
          { key: 'roof.priya.act2.2', if: { act: 2 } },
          { key: 'roof.priya.act3.1', if: { act: 3 } },
          { key: 'roof.priya.act3.2', if: { act: 3 } },
          { key: 'roof.priya.r.late', if: { obsessionGte: 4 } },
        ],
      },
      {
        id: 'roof.rain',
        label: 'roof.rain',
        cost: 2,
        once: 'loop',
        effects: [{ rest: 'rain' }],
        tags: ['rest'],
        text: [
          { key: 'roof.rain.r', if: { not: { act: 3 } } },
          { key: 'roof.rain.act3', if: { act: 3 } },
        ],
      },
      {
        id: 'roof.deckchair',
        label: 'roof.deckchair',
        cost: 1,
        once: 'loop',
        effects: [{ fragment: 'yc.roof' }, { learn: 'nb.rainlog' }],
        text: [{ key: 'roof.deckchair.r' }, { key: 'roof.deckchair.act3', if: { act: 3 } }],
      },
      { id: 'roof.city', label: 'roof.city', cost: 1, once: 'loop', text: [{ key: 'roof.city.r' }] },
      // Act III: the cranes' red lights keep their own time, and sometimes the same time.
      { id: 'roof.cranes', label: 'roof.cranes', cost: 1, once: 'loop', if: { act: 3 }, text: [{ key: 'roof.cranes.r' }] },
    ],
  },
];
