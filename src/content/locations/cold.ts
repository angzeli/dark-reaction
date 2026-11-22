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
      { id: 'cold.cabinets', label: 'cold.cabinets', cost: 1, once: 'loop', text: [{ key: 'cold.cabinets.r' }] },
      { id: 'cold.dewar', label: 'cold.dewar', cost: 1, once: 'loop', text: [{ key: 'cold.dewar.r' }] },
      { id: 'cold.tom', label: 'cold.tom', cost: 1, once: 'loop', text: [{ key: 'cold.tom.r' }] },
    ],
  },
];
