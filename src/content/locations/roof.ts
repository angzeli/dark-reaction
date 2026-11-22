/**
 * The roof: rain, the city, the only phone signal in the building (Priya),
 * and under the deckchair, Y.C.'s rain log. Two kinds of rest.
 * docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';

export const roofScenes: SceneDef[] = [
  {
    id: 'roof.hub',
    location: 'roof',
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
        text: [{ key: 'roof.priya.r.1' }, { key: 'roof.priya.r.2' }, { key: 'roof.priya.r.late', if: { obsessionGte: 4 } }],
      },
      { id: 'roof.rain', label: 'roof.rain', cost: 2, once: 'loop', effects: [{ rest: 'rain' }], tags: ['rest'], text: [{ key: 'roof.rain.r' }] },
      {
        id: 'roof.deckchair',
        label: 'roof.deckchair',
        cost: 1,
        once: 'loop',
        effects: [{ fragment: 'yc.roof' }, { learn: 'nb.rainlog' }],
        text: [{ key: 'roof.deckchair.r' }],
      },
      { id: 'roof.city', label: 'roof.city', cost: 1, once: 'loop', text: [{ key: 'roof.city.r' }] },
    ],
  },
];
