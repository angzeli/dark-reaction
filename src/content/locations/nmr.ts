/**
 * B.03 NMR suite: the console (puzzle) and the locked queue, the magnet,
 * the carousel with its empty holder 13, Ian's signs, the compressor and its
 * chirp, the printer. docs/DESIGN.md §9.
 */
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
        once: 'loop',
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
        once: 'loop',
        text: [{ key: 'nmr.load.r' }],
        effects: [{ learn: 'nb.queue.locked' }],
      },
      { id: 'nmr.magnet', once: 'loop', label: 'nmr.magnet', cost: 1, text: [{ key: 'nmr.magnet.r' }] },
      { id: 'nmr.carousel', once: 'loop', label: 'nmr.carousel', cost: 1, text: [{ key: 'nmr.carousel.r' }] },
      { id: 'nmr.signs', once: 'loop', label: 'nmr.signs', cost: 1, effects: [{ learn: 'nb.ian' }], text: [{ key: 'nmr.signs.r' }] },
      { id: 'nmr.compressor', once: 'loop', label: 'nmr.compressor', cost: 1, text: [{ key: 'nmr.compressor.r' }] },
      { id: 'nmr.printer', once: 'loop', label: 'nmr.printer', cost: 1, text: [{ key: 'nmr.printer.r' }] },
    ],
  },
];
