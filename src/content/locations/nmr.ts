import type { SceneDef } from '../../engine/types.ts';

export const nmrScenes: SceneDef[] = [
  {
    id: 'nmr.hub',
    location: 'nmr',
    hub: true,
    text: [{ key: 'nmr.hub.act1' }],
    choices: [
      {
        id: 'nmr.console',
        label: 'nmr.console',
        cost: 1,
        if: { not: { solved: 'console' } },
        text: [{ key: 'nmr.console.r' }],
        effects: [{ puzzle: 'console' }],
      },
      {
        id: 'nmr.console.again',
        label: 'nmr.console.again',
        cost: 2,
        if: { solved: 'console' },
        text: [{ key: 'nmr.console.again.r' }],
      },
      {
        id: 'nmr.load',
        label: 'nmr.load',
        cost: 1,
        if: { item: 'item.tube.own' },
        text: [{ key: 'nmr.load.r' }],
        effects: [{ learn: 'nb.queue.locked' }],
      },
    ],
  },
];
