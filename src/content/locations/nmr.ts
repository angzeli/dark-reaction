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
    text: [
      { key: 'nmr.hub.act1', if: { not: { act: 3 } } },
      { key: 'nmr.hub.act3', if: { act: 3 } },
    ],
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
        if: { all: [{ item: 'item.tube.own' }, { not: { know: 'nb.priority' } }] },
        once: 'loop',
        text: [{ key: 'nmr.load.r' }],
        effects: [{ learn: 'nb.queue.locked' }],
      },
      {
        // Act II: Ian's priority code jumps the locked queue for one run (8 min).
        id: 'nmr.run',
        label: 'nmr.run',
        cost: 8,
        once: 'loop',
        if: { all: [{ item: 'item.tube.own' }, { know: 'nb.priority' }] },
        effects: [{ give: 'item.spectrum.own' }, { flag: 'ran.own' }],
        text: [{ key: 'nmr.run.r.1' }, { key: 'nmr.run.r.2' }],
      },
      {
        id: 'nmr.rerun',
        label: 'nmr.rerun',
        cost: 8,
        once: 'loop',
        if: { item: 'item.spectrum.own' },
        effects: [{ chase: 'rerun' }],
        tags: ['chase'],
        text: [{ key: 'nmr.rerun.r' }],
      },
      {
        // 03:25: the night prints the spectrum you wanted.
        id: 'nmr.printout',
        label: 'nmr.printout',
        cost: 1,
        if: { all: [{ lflag: 'perfect.printed' }, { not: { item: 'item.printout' } }] },
        effects: [{ give: 'item.printout' }, { chase: 'printout' }, { learn: 'nb.printout' }],
        tags: ['chase'],
        text: [{ key: 'nmr.printout.r' }, { key: 'perfect.describe', params: (st) => ({ n: 46 - st.minute }) }],
      },
      { id: 'nmr.magnet', once: 'loop', label: 'nmr.magnet', cost: 1, text: [{ key: 'nmr.magnet.r' }] },
      { id: 'nmr.carousel', once: 'loop', label: 'nmr.carousel', cost: 1, text: [{ key: 'nmr.carousel.r' }] },
      { id: 'nmr.signs', once: 'loop', label: 'nmr.signs', cost: 1, effects: [{ learn: 'nb.ian' }], text: [{ key: 'nmr.signs.r' }] },
      {
        id: 'nmr.compressor',
        once: 'loop',
        label: 'nmr.compressor',
        cost: 1,
        text: [
          { key: 'nmr.compressor.r', if: { not: { act: 3 } } },
          { key: 'nmr.compressor.act3', if: { act: 3 } },
        ],
      },
      {
        id: 'nmr.postit',
        label: 'nmr.postit',
        cost: 1,
        once: 'loop',
        if: { act: 3 },
        effects: [{ fragment: 'yc.chirp' }, { learn: 'nb.postit' }],
        text: [{ key: 'nmr.postit.r' }],
      },
      { id: 'nmr.printer', once: 'loop', label: 'nmr.printer', cost: 1, text: [{ key: 'nmr.printer.r' }] },
    ],
  },
];
