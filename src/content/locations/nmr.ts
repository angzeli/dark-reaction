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
      { key: 'nmr.hub.act3', if: { all: [{ act: 3 }, { not: { lflag: 'holder13.loaded' } }] } },
      { key: 'nmr.hub.act3.loaded', if: { all: [{ act: 3 }, { lflag: 'holder13.loaded' }] } },
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
        // Once the console is solved it stays in the room: a player who comes back to use it must find it.
        id: 'nmr.console.again',
        label: 'nmr.console.again',
        cost: 2,
        if: { solved: 'console' },
        text: [
          { key: 'nmr.console.again.r', if: { not: { lflag: 'holder13.loaded' } } },
          { key: 'nmr.console.loaded.r', if: { lflag: 'holder13.loaded' } },
        ],
      },
      {
        id: 'nmr.load',
        label: 'nmr.load',
        cost: 1,
        // Act I: the code is refused until holder 13 has run (i.e. until you have lived a 03:33).
        if: { all: [{ item: 'item.tube.own' }, { any: [{ act: 1 }, { not: { know: 'nb.priority' } }] }] },
        once: 'loop',
        text: [{ key: 'nmr.load.r' }, { key: 'nmr.load.code', if: { know: 'nb.priority' } }],
        effects: [{ learn: 'nb.queue.locked' }],
      },
      {
        // Your sample before it is a tube: the vial (or the fractions) brought down too soon.
        // The room says what's missing instead of offering nothing at all (#196).
        id: 'nmr.load.unmade',
        label: 'nmr.load.unmade',
        cost: 1,
        once: 'loop',
        if: { all: [{ any: [{ item: 'item.vial' }, { item: 'item.fractions' }] }, { not: { item: 'item.tube.own' } }] },
        text: [
          { key: 'nmr.load.vial.r', if: { item: 'item.vial' } },
          { key: 'nmr.load.fractions.r', if: { item: 'item.fractions' } },
        ],
      },
      {
        // Ian's code, typed with nothing in the carousel: say why nothing runs, and what to bring.
        // What to bring depends on what you're holding (#196).
        id: 'nmr.code',
        label: 'nmr.code',
        cost: 1,
        once: 'loop',
        if: { all: [{ know: 'nb.priority' }, { not: { item: 'item.tube.own' } }] },
        text: [
          { key: 'nmr.code.locked', if: { act: 1 } },
          { key: 'nmr.code.vial', if: { all: [{ actGte: 2 }, { item: 'item.vial' }] } },
          { key: 'nmr.code.fractions', if: { all: [{ actGte: 2 }, { item: 'item.fractions' }] } },
          { key: 'nmr.code.ruined', if: { all: [{ actGte: 2 }, { lflag: 'sample.ruined' }] } },
          {
            key: 'nmr.code.empty',
            if: { all: [{ actGte: 2 }, { not: { item: 'item.vial' } }, { not: { item: 'item.fractions' } }, { not: { lflag: 'sample.ruined' } }] },
          },
        ],
      },
      {
        // Act II: Ian's priority code jumps the locked queue for one run (8 min), begun by 03:24 so it ends before 03:33.
        id: 'nmr.run',
        label: 'nmr.run',
        cost: 8,
        once: 'loop',
        if: { all: [{ item: 'item.tube.own' }, { know: 'nb.priority' }, { actGte: 2 }, { minuteLt: 38 }] },
        effects: [{ give: 'item.spectrum.own' }, { flag: 'ran.own' }],
        text: [{ key: 'nmr.run.r.1' }, { key: 'nmr.run.r.2' }],
      },
      {
        // The same run begun at 03:25: it can't end before 03:33, and its label says so before you take it,
        // as the late purge's does (#198). Otherwise it is the run above: the printer still prints for it at 03:25.
        id: 'nmr.run.last',
        label: 'nmr.run.late',
        cost: 8,
        once: 'loop',
        if: { all: [{ item: 'item.tube.own' }, { know: 'nb.priority' }, { actGte: 2 }, { minuteGte: 38 }, { minuteLt: 39 }, { not: { used: 'nmr.run' } }] },
        effects: [{ give: 'item.spectrum.own' }, { flag: 'ran.own' }],
        text: [{ key: 'nmr.run.r.1' }, { key: 'nmr.run.r.2' }],
      },
      {
        // The same run begun after 03:25 (from 03:26): that night’s printer has been and gone without it, so it
        // mustn't print for it afterwards (#147). Not a second run: that is nmr.rerun. Its label is the late one (#198).
        id: 'nmr.run.late',
        label: 'nmr.run.late',
        cost: 8,
        once: 'loop',
        if: {
          all: [{ item: 'item.tube.own' }, { know: 'nb.priority' }, { actGte: 2 }, { minuteGte: 39 }, { not: { used: 'nmr.run' } }, { not: { used: 'nmr.run.last' } }],
        },
        effects: [{ give: 'item.spectrum.own' }, { flag: 'ran.own' }, { lflag: 'ran.late' }],
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
        // Its countdown starts from the minute it's in your hand: taking it is that minute (#147).
        id: 'nmr.printout',
        label: 'nmr.printout',
        cost: 1,
        if: { all: [{ lflag: 'perfect.printed' }, { not: { item: 'item.printout' } }] },
        effects: [{ give: 'item.printout' }, { chase: 'printout' }, { learn: 'nb.printout' }],
        tags: ['chase'],
        text: [{ key: 'nmr.printout.r' }, { key: 'perfect.describe', params: (st) => ({ n: 46 - (st.minute + 1) }) }],
      },
      { id: 'nmr.magnet', once: 'loop', label: 'nmr.magnet', cost: 1, text: [{ key: 'nmr.magnet.r' }, { key: 'nmr.magnet.act3', if: { act: 3 } }] },
      {
        id: 'nmr.carousel',
        once: 'loop',
        label: 'nmr.carousel',
        cost: 1,
        text: [
          { key: 'nmr.carousel.r', if: { not: { lflag: 'holder13.loaded' } } },
          { key: 'nmr.carousel.loaded.r', if: { lflag: 'holder13.loaded' } },
        ],
      },
      {
        id: 'nmr.signs',
        once: 'loop',
        label: 'nmr.signs',
        cost: 1,
        effects: [{ learn: 'nb.ian' }],
        text: [{ key: 'nmr.signs.r' }, { key: 'nmr.signs.act3', if: { act: 3 } }],
      },
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
      {
        // P8: the UPS keypad, once Tom's Post-it has made you listen.
        id: 'nmr.ups',
        label: 'nmr.ups',
        cost: 1,
        if: { all: [{ act: 3 }, { know: 'nb.postit' }, { not: { solved: 'chirp' } }] },
        text: [{ key: 'nmr.ups.r' }],
        effects: [{ puzzle: 'chirp' }],
      },
      {
        // The PIN is knowledge; arming is tonight's (ups.armed lasts until 03:33).
        id: 'nmr.ups.again',
        label: 'nmr.ups.again',
        cost: 1,
        if: { all: [{ act: 3 }, { solved: 'chirp' }, { not: { lflag: 'ups.armed' } }] },
        text: [{ key: 'nmr.ups.again.r' }],
        effects: [{ lflag: 'ups.armed' }],
        tags: ['shortcut'],
      },
      {
        // The dark run (#20): her tube in holder 13, the one slot without dust, for 03:33.
        id: 'nmr.holder13',
        label: 'nmr.holder13',
        cost: 1,
        if: { all: [{ act: 3 }, { item: 'item.tube.dark' }] },
        effects: [{ take: 'item.tube.dark' }, { lflag: 'holder13.loaded' }],
        text: [{ key: 'nmr.holder13.r' }],
      },
      { id: 'nmr.printer', once: 'loop', label: 'nmr.printer', cost: 1, text: [{ key: 'nmr.printer.r' }] },
    ],
  },
];
