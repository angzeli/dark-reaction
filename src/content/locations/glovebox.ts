/**
 * 4.14 Glovebox room: the antechamber (puzzle) and the purge shortcut, the
 * climbing O₂ meter, the SOP with Y.C.'s pencil, the logbook (a fudge), the
 * sealed mini-antechamber. docs/DESIGN.md §9.
 */
import type { Cond, SceneDef } from '../../engine/types.ts';
import { LAST_PURGE_START, PURGE_MINUTES } from '../../puzzles/glovebox/logic.ts';
import { o2At } from '../lab.ts';

const ppm = (s: { minute: number }) => ({ ppm: o2At(s.minute).toFixed(1) });

/** The regeneration check is signed off once, honestly or not. */
const logbookOpen: Cond = { all: [{ not: { know: 'nb.logbook' } }, { not: { know: 'fudge.logbook' } }] };

export const gloveboxScenes: SceneDef[] = [
  {
    id: 'glovebox.hub',
    location: 'glovebox',
    hub: true,
    text: [{ key: 'glovebox.hub.act1', params: ppm }],
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
      { id: 'glovebox.meter', label: 'glovebox.meter', cost: 1, text: [{ key: 'glovebox.meter.r', params: ppm }] },
      {
        id: 'glovebox.sop',
        once: 'loop',
        label: 'glovebox.sop',
        cost: 1,
        effects: [{ fragment: 'yc.sop' }, { learn: 'nb.sop' }],
        text: [{ key: 'glovebox.sop.r' }],
      },
      { id: 'glovebox.logbook', label: 'glovebox.logbook', cost: 1, to: 'glovebox.logbook' },
      { id: 'glovebox.mini', once: 'loop', label: 'glovebox.mini', cost: 1, effects: [{ learn: 'nb.mini' }], text: [{ key: 'glovebox.mini.r' }] },
    ],
  },
  {
    id: 'glovebox.logbook',
    location: 'glovebox',
    text: [{ key: 'glovebox.logbook.text' }],
    choices: [
      {
        id: 'glovebox.logbook.honest',
        label: 'glovebox.logbook.honest',
        cost: 1,
        if: logbookOpen,
        effects: [{ learn: 'nb.logbook' }],
        text: [{ key: 'glovebox.logbook.honest.r' }],
        tags: ['honest'],
      },
      {
        id: 'glovebox.logbook.fudge',
        label: 'glovebox.logbook.fudge',
        if: logbookOpen,
        effects: [{ fudge: 'fudge.logbook' }],
        text: [{ key: 'glovebox.logbook.fudge.r' }],
        tags: ['fudge'],
      },
    ],
  },
];
