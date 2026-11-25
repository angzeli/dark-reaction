/**
 * Stairwell and ground-floor lobby: the porter's desk and radio (rest), the
 * main entrance that won't let you out, fire exit B (released for the bins
 * on Mondays, 03:21–03:24), the fire alarm call point (Fire Alarm, once
 * the door log has shown you what the building keeps). docs/DESIGN.md §9.
 */
import { clockLabel } from '../../engine/clock.ts';
import type { SceneDef } from '../../engine/types.ts';
import { lanyard } from '../lanyard.ts';
import { CALM_UNTIL_ACT3 } from '../tone.ts';
import { EXIT_B_OPEN } from '../world.ts';

const exitOpen = { all: [{ minuteGte: EXIT_B_OPEN.from }, { minuteLt: EXIT_B_OPEN.to }] };

export const stairsScenes: SceneDef[] = [
  {
    id: 'stairs.hub',
    location: 'stairs',
    tone: CALM_UNTIL_ACT3,
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
      {
        id: 'stairs.entrance',
        label: 'stairs.entrance',
        cost: 1,
        once: 'loop',
        effects: [{ learn: 'nb.entrance' }, { anomaly: 'shuttle.timetable' }],
        // Beside the doors, the shuttle's timetable (docs/HUMOUR.md §4.3): Act III's one light line here.
        text: [{ key: 'stairs.entrance.r' }, { key: 'fun.shuttle.timetable', params: (st) => ({ clock: clockLabel(st.minute) }) }],
      },
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
      {
        id: 'stairs.window',
        label: 'stairs.window',
        cost: 1,
        once: 'loop',
        text: [
          { key: 'stairs.window.r', if: { not: { act: 3 } } },
          { key: 'stairs.window.act3', if: { act: 3 } },
        ],
      },
      {
        id: 'stairs.crossword',
        label: 'stairs.crossword',
        cost: 1,
        once: 'loop',
        text: [
          { key: 'stairs.crossword.r', if: { not: { act: 3 } } },
          { key: 'stairs.crossword.act3', if: { act: 3 } },
        ],
      },
      // Act III: two of the green running men have gone out (#69, drawn in #64).
      { id: 'stairs.signs', label: 'stairs.signs', cost: 1, once: 'loop', if: { act: 3 }, text: [{ key: 'stairs.signs.r' }] },
      // v1.1.0 (docs/HUMOUR.md §4.5, §4.7): over by the lift, the floor plan and the toilets.
      { id: 'stairs.lift', label: 'stairs.lift', effects: [{ anomaly: 'lift' }], to: 'stairs.lift' },
    ],
  },
  {
    // In the open doorway. Nothing here checks the clock: once the bar has
    // given, the step out is there however late in the window you pushed it.
    id: 'stairs.door',
    location: 'stairs',
    tone: 'uneasy',
    noBack: true,
    text: [{ key: 'stairs.door.text' }],
    // The way back comes first: keyboard focus and key 1 land on it, so a stray Enter can't end the run (#61).
    choices: [
      { id: 'stairs.door.close', label: 'stairs.door.close', to: 'stairs.hub' },
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
    ],
  },
  {
    // On 0 the lift waits with its doors open, always, even after 03:33; in Act III it is only waiting.
    // Its floor plan puts B12 on the building's own signs.
    id: 'stairs.lift',
    location: 'stairs',
    tone: CALM_UNTIL_ACT3,
    text: [
      { key: 'fun.lift.r', if: { not: { act: 3 } } },
      { key: 'fun.lift.again', if: { all: [{ loopGte: 2 }, { not: { act: 3 } }] } },
      { key: 'stairs.lift.act3', if: { act: 3 } },
    ],
    choices: [
      { id: 'stairs.lift.press', label: 'stairs.lift.press', cost: 1, once: 'loop', if: { not: { act: 3 } }, text: [{ key: 'fun.lift.press' }] },
      { id: 'stairs.plan', label: 'stairs.plan', cost: 1, once: 'loop', if: { not: { act: 3 } }, text: [{ key: 'fun.plan' }] },
      { id: 'stairs.toilets', label: 'stairs.toilets', cost: 1, effects: [{ anomaly: 'toilets' }], to: 'stairs.toilets' },
    ],
  },
  {
    // The toilets: the one place the building can't reach you. The notebook records nothing in here.
    id: 'stairs.toilets',
    location: 'stairs',
    tone: 'calm',
    unrecorded: true,
    text: [{ key: 'stairs.toilets.text' }],
    choices: lanyard('stairs.toilets'),
  },
  {
    // Thumb on the glass of the one thing in the building built to get everybody out.
    id: 'stairs.alarm',
    location: 'stairs',
    tone: 'uneasy',
    noBack: true,
    text: [{ key: 'stairs.alarm.text' }],
    // The way back comes first: keyboard focus and key 1 land on it, so a stray Enter can't end the run.
    choices: [
      { id: 'stairs.alarm.leave', label: 'stairs.alarm.leave', to: 'stairs.hub' },
      { id: 'stairs.alarm.break', label: 'stairs.alarm.break', effects: [{ ending: 'fire' }], tags: ['ending'] },
    ],
  },
];
