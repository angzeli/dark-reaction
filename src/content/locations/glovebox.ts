import type { SceneDef } from '../../engine/types.ts';
import { LAST_PURGE_START, PURGE_MINUTES } from '../../puzzles/glovebox/logic.ts';
import { o2At } from '../lab.ts';

export const gloveboxScenes: SceneDef[] = [
  {
    id: 'glovebox.hub',
    location: 'glovebox',
    hub: true,
    text: [{ key: 'glovebox.hub.act1', params: (s) => ({ ppm: o2At(s.minute).toFixed(1) }) }],
    choices: [
      {
        id: 'glovebox.antechamber',
        label: 'glovebox.antechamber',
        if: { all: [{ item: 'item.vial' }, { not: { solved: 'glovebox' } }] },
        text: [{ key: 'glovebox.antechamber.r' }],
        effects: [{ puzzle: 'glovebox' }],
      },
      {
        // Knowing the purge doesn't beat the clock: start by 03:19 or the O₂ wins,
        // exactly as it would in the puzzle itself.
        id: 'glovebox.purge',
        label: 'glovebox.purge',
        cost: PURGE_MINUTES,
        if: { all: [{ item: 'item.vial' }, { solved: 'glovebox' }, { minuteLt: LAST_PURGE_START + 1 }] },
        text: [{ key: 'glovebox.purge.r' }],
        effects: [{ take: 'item.vial' }, { give: 'item.tube.own' }],
        tags: ['shortcut'],
      },
      {
        id: 'glovebox.purge.late',
        label: 'glovebox.purge',
        cost: PURGE_MINUTES,
        if: { all: [{ item: 'item.vial' }, { solved: 'glovebox' }, { minuteGte: LAST_PURGE_START + 1 }] },
        text: [{ key: 'glovebox.purge.late.r' }],
        effects: [{ take: 'item.vial' }, { lflag: 'sample.ruined' }],
      },
    ],
  },
];
