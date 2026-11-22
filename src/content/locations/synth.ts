/**
 * 4.12 Synthesis lab: tonight's fractions (TLC puzzle), the rotavap and the
 * yield you write down, the fume hoods, the Kraken, the poster. docs/DESIGN.md §9.
 */
import type { Cond, SceneDef } from '../../engine/types.ts';

/** The yield is written down once, honestly or not, and never offered again. */
const yieldOpen: Cond = { all: [{ lflag: 'synth.weighed' }, { not: { know: 'nb.yield' } }, { not: { know: 'fudge.yield' } }] };

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
      { id: 'synth.hoods', once: 'loop', label: 'synth.hoods', cost: 1, effects: [{ learn: 'nb.tom' }], text: [{ key: 'synth.hoods.r' }] },
      { id: 'synth.kraken', once: 'loop', label: 'synth.kraken', cost: 1, text: [{ key: 'synth.kraken.r' }] },
      { id: 'synth.poster', once: 'loop', label: 'synth.poster', cost: 1, text: [{ key: 'synth.poster.r' }] },
    ],
  },
];
