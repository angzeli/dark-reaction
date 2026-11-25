/**
 * 4.12 Synthesis lab: tonight's fractions (TLC puzzle), the rotavap and the
 * yield you write down, the fume hoods, the Kraken, the poster. docs/DESIGN.md §9.
 */
import type { ChoiceDef, Cond, SceneDef } from '../../engine/types.ts';
import { CALM_UNTIL_ACT3 } from '../tone.ts';
import { CLEAN_MINUTES as SCHLENK_MINUTES } from '../../puzzles/schlenk/logic.ts';

/** The yield is written down once, honestly or not, and never offered again. */
const yieldOpen: Cond = { all: [{ lflag: 'synth.weighed' }, { not: { know: 'nb.yield' } }, { not: { know: 'fudge.yield' } }] };

export const synthScenes: SceneDef[] = [
  {
    id: 'synth.hub',
    location: 'synth',
    tone: CALM_UNTIL_ACT3,
    hub: true,
    text: [
      { key: 'synth.hub.act1', if: { not: { act: 3 } } },
      { key: 'synth.hub.act3', if: { act: 3 } },
    ],
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
        text: [{ key: 'synth.rotavap.r' }, { key: 'synth.rotavap.r.weigh' }],
        effects: [{ take: 'item.fractions' }, { give: 'item.vial' }, { lflag: 'synth.weighed' }],
      },
      {
        id: 'synth.yield.honest',
        label: 'synth.yield.honest',
        if: yieldOpen,
        text: [{ key: 'synth.yield.honest.r' }],
        effects: [{ learn: 'nb.yield' }],
        tags: ['honest'],
      },
      {
        id: 'synth.yield.fudge',
        label: 'synth.yield.fudge',
        if: yieldOpen,
        text: [{ key: 'synth.yield.fudge.r' }],
        effects: [{ fudge: 'fudge.yield' }],
        tags: ['fudge'],
      },
      {
        // Act III: on the port that has never had anything on it.
        id: 'synth.port4',
        label: 'synth.port4',
        cost: 1,
        once: 'loop',
        if: { act: 3 },
        effects: [{ fragment: 'yc.flask' }, { learn: 'nb.port4' }],
        text: [{ key: 'synth.port4.r' }],
      },
      {
        id: 'synth.foil',
        label: 'synth.foil',
        cost: 1,
        if: { all: [{ act: 3 }, { not: { item: 'item.foil' } }] },
        effects: [{ give: 'item.foil' }],
        text: [{ key: 'synth.foil.r' }],
      },
      {
        // P5: her tube on port 2, her flask on port 4, and the Kraken's rules between them.
        id: 'synth.kraken.fill',
        label: 'synth.kraken.fill',
        cost: 1,
        if: { all: [{ act: 3 }, { item: 'item.tube.jy' }, { not: { solved: 'schlenk' } }] },
        text: [{ key: 'synth.kraken.fill.r' }],
        effects: [{ puzzle: 'schlenk' }],
      },
      {
        // Once you know the way, it takes as long as a clean run does; foil or no foil.
        id: 'synth.kraken.again',
        label: 'synth.kraken.again',
        cost: SCHLENK_MINUTES,
        if: { all: [{ act: 3 }, { item: 'item.tube.jy' }, { solved: 'schlenk' }, { item: 'item.foil' }] },
        text: [{ key: 'synth.kraken.again.r' }],
        effects: [{ take: 'item.tube.jy' }, { give: 'item.tube.dark' }],
        tags: ['shortcut'],
      },
      {
        // Without foil it ruins the sample, and the label says so before you choose it (#158).
        id: 'synth.kraken.again.light',
        label: 'synth.kraken.again.light',
        cost: SCHLENK_MINUTES,
        if: { all: [{ act: 3 }, { item: 'item.tube.jy' }, { solved: 'schlenk' }, { not: { item: 'item.foil' } }] },
        text: [{ key: 'synth.kraken.again.light.r' }],
        effects: [{ take: 'item.tube.jy' }, { lflag: 'tube.spoiled' }],
      },
      { id: 'synth.hoods', once: 'loop', label: 'synth.hoods', cost: 1, effects: [{ learn: 'nb.tom' }], text: [{ key: 'synth.hoods.r' }, { key: 'synth.hoods.act3', if: { act: 3 } }] },
      {
        id: 'synth.kraken',
        once: 'loop',
        label: 'synth.kraken',
        cost: 1,
        // In Act III her flask is on port 4, where nothing has ever been (#157).
        text: [{ key: 'synth.kraken.r', if: { not: { act: 3 } } }, { key: 'synth.kraken.act3', if: { act: 3 } }],
      },
      { id: 'synth.poster', once: 'loop', label: 'synth.poster', cost: 1, text: [{ key: 'synth.poster.r' }, { key: 'synth.poster.act3', if: { act: 3 } }] },
      { id: 'synth.shelf', once: 'loop', label: 'synth.shelf', cost: 1, text: [{ key: 'synth.shelf.r' }] },
      // The lab door (docs/HUMOUR.md §4.6): its notices every night, and this month's poster, which
      // changes every loop. Each poster seen is kept (Mandatory Training, #208).
      ...[0, 1, 2, 3, 4].map(
        (k): ChoiceDef => ({
          id: `synth.door.${k}`,
          label: 'synth.door',
          cost: 3,
          once: 'loop',
          if: { all: [{ loopMod: [5, k] }, { not: { act: 3 } }] },
          effects: [{ anomaly: 'labdoor' }, { flag: `poster.${k}` }],
          text: [{ key: 'fun.labdoor' }, { key: `fun.labdoor.poster.${k}` }],
        }),
      ),
    ],
  },
];
