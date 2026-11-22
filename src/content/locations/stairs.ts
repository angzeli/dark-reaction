/**
 * Stairwell and ground-floor lobby: the porter's desk and radio (rest), the
 * main entrance that won't let you out, fire exit B (released for the bins
 * on Mondays, 03:21–03:24), the fire alarm call point (Fire Alarm, once
 * the door log has shown you what the building keeps). docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';
import { EXIT_B_OPEN } from '../world.ts';

const exitOpen = { all: [{ minuteGte: EXIT_B_OPEN.from }, { minuteLt: EXIT_B_OPEN.to }] };

export const stairsScenes: SceneDef[] = [
  {
    id: 'stairs.hub',
    location: 'stairs',
    hub: true,
    text: [
      { key: 'stairs.hub.act1', if: { not: { act: 3 } } },
      { key: 'stairs.hub.act3', if: { act: 3 } },
    ],
    choices: [
      { id: 'stairs.desk', label: 'stairs.desk', cost: 1, once: 'loop', effects: [{ learn: 'nb.femi' }], text: [{ key: 'stairs.desk.r' }] },
      {
        // P6: seven nights of badges, and the porter's Monday.
        id: 'stairs.terminal',
        label: 'stairs.terminal',
        cost: 1,
        if: { not: { solved: 'doorlog' } },
        text: [{ key: 'stairs.terminal.r' }],
        effects: [{ puzzle: 'doorlog' }],
      },
      {
        id: 'stairs.radio',
        label: 'stairs.radio',
        cost: 3,
        once: 'loop',
        effects: [{ rest: 'radio' }],
        tags: ['rest'],
        text: [{ key: 'stairs.radio.r' }],
      },
      { id: 'stairs.entrance', label: 'stairs.entrance', cost: 1, once: 'loop', effects: [{ learn: 'nb.entrance' }], text: [{ key: 'stairs.entrance.r' }] },
      { id: 'stairs.exitb', label: 'stairs.exitb', cost: 1, if: { not: exitOpen }, text: [{ key: 'stairs.exitb.r' }] },
      {
        id: 'stairs.exitb.open',
        label: 'stairs.exitb',
        cost: 1,
        if: exitOpen,
        effects: [{ learn: 'nb.exitb' }],
        text: [{ key: 'stairs.exitb.open.r' }],
        to: 'stairs.door',
      },
      { id: 'stairs.callpoint', label: 'stairs.callpoint', cost: 1, once: 'loop', effects: [{ learn: 'nb.callpoint' }], text: [{ key: 'stairs.callpoint.r' }] },
      {
        // Fire Alarm: from Act II (like every ending), once you know the building
        // keeps whoever is inside at 03:33 (the door log, which can be read
        // earlier) and have looked at the call point.
        id: 'stairs.glass',
        label: 'stairs.glass',
        if: { all: [{ actGte: 2 }, { know: 'nb.keeps' }, { know: 'nb.callpoint' }] },
        to: 'stairs.alarm',
      },
      { id: 'stairs.window', label: 'stairs.window', cost: 1, once: 'loop', text: [{ key: 'stairs.window.r' }] },
    ],
  },
  {
    // In the open doorway. Nothing here checks the clock: once the bar has
    // given, the step out is there however late in the window you pushed it.
    id: 'stairs.door',
    location: 'stairs',
    noBack: true,
    text: [{ key: 'stairs.door.text' }],
    choices: [
      {
        // Clocking Off: from Act II, if you can still make yourself go.
        id: 'stairs.leave',
        label: 'stairs.leave',
        if: { all: [{ actGte: 2 }, { obsessionLt: 5 }] },
        effects: [{ ending: 'clocking' }],
        tags: ['ending'],
      },
      {
        // Not yet, or not any more: you let the door go, every time you try.
        id: 'stairs.leave.cant',
        label: 'stairs.leave',
        cost: 1,
        if: { any: [{ act: 1 }, { obsessionGte: 5 }] },
        text: [
          { key: 'stairs.leave.notyet', if: { all: [{ act: 1 }, { obsessionLt: 5 }] } },
          { key: 'stairs.leave.cant', if: { obsessionGte: 5 } },
        ],
        to: 'stairs.hub',
      },
      { id: 'stairs.door.close', label: 'stairs.door.close', to: 'stairs.hub' },
    ],
  },
  {
    // Thumb on the glass of the one thing in the building built to get everybody out.
    id: 'stairs.alarm',
    location: 'stairs',
    noBack: true,
    text: [{ key: 'stairs.alarm.text' }],
    // The way back comes first: keyboard focus and key 1 land on it, so a stray Enter can't end the run.
    choices: [
      { id: 'stairs.alarm.leave', label: 'stairs.alarm.leave', to: 'stairs.hub' },
      { id: 'stairs.alarm.break', label: 'stairs.alarm.break', effects: [{ ending: 'fire' }], tags: ['ending'] },
    ],
  },
];
