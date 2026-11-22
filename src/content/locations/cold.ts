/**
 * B.05 Cold room and solvent store: the −80 °C freezer (puzzle, once you
 * know which rack), the solvent cabinets, the dewar, Tom's boxes.
 * docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';

export const coldScenes: SceneDef[] = [
  {
    id: 'cold.hub',
    location: 'cold',
    hub: true,
    text: [
      { key: 'cold.hub.act1', if: { not: { act: 3 } } },
      { key: 'cold.hub.act3', if: { act: 3 } },
    ],
    choices: [
      { id: 'cold.freezer', label: 'cold.freezer', cost: 1, once: 'loop', if: { not: { know: 'nb.cipher' } }, text: [{ key: 'cold.freezer.r' }] },
      {
        // P4: her box in rack 1, once her notebook has told you where to look.
        // After the alarm the lid stays shut until the next 02:47.
        id: 'cold.rack1',
        label: 'cold.rack1',
        cost: 1,
        if: { all: [{ know: 'nb.cipher' }, { not: { solved: 'freezer' } }, { not: { lflag: 'freezer.alarm' } }] },
        text: [{ key: 'cold.rack1.r' }],
        effects: [{ puzzle: 'freezer' }],
      },
      {
        id: 'cold.e5',
        label: 'cold.e5',
        cost: 2,
        if: { all: [{ solved: 'freezer' }, { not: { item: 'item.microsd' } }] },
        text: [{ key: 'cold.e5.r' }],
        effects: [{ give: 'item.microsd' }],
        tags: ['shortcut'],
      },
      { id: 'cold.cabinets', label: 'cold.cabinets', cost: 1, once: 'loop', text: [{ key: 'cold.cabinets.r' }] },
      { id: 'cold.dewar', label: 'cold.dewar', cost: 1, once: 'loop', text: [{ key: 'cold.dewar.r' }] },
      { id: 'cold.tom', label: 'cold.tom', cost: 1, once: 'loop', text: [{ key: 'cold.tom.r' }] },
    ],
  },
];
