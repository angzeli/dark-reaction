import type { SceneDef } from '../../engine/types.ts';

export const synthScenes: SceneDef[] = [
  {
    id: 'synth.hub',
    location: 'synth',
    hub: true,
    text: [{ key: 'synth.hub.act1' }],
    choices: [
      {
        id: 'synth.plate',
        label: 'synth.plate',
        cost: 1,
        if: { all: [{ not: { solved: 'tlc' } }, { not: { lflag: 'fractions.taken' } }] },
        text: [{ key: 'synth.plate.r' }],
        effects: [{ puzzle: 'tlc' }],
      },
      {
        id: 'synth.combine',
        label: 'synth.combine',
        cost: 1,
        if: { all: [{ solved: 'tlc' }, { not: { lflag: 'fractions.taken' } }] },
        text: [{ key: 'synth.combine.r' }],
        effects: [{ give: 'item.fractions' }, { lflag: 'fractions.taken' }],
        tags: ['shortcut'],
      },
      {
        id: 'synth.rotavap',
        label: 'synth.rotavap',
        cost: 5,
        if: { item: 'item.fractions' },
        text: [{ key: 'synth.rotavap.r' }],
        effects: [{ take: 'item.fractions' }, { give: 'item.vial' }],
      },
    ],
  },
];
