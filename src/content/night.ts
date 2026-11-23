/**
 * What the night does on its own: timed events, the pages you don't remember
 * writing, and what happens at 03:33. docs/DESIGN.md §5, §14.
 * All three acts. At 03:33 the dark run's rules come first (§12), then the first night's.
 */
import type { ActDef, Cond, EventDef, LightsOutRule, PhantomDef } from '../engine/types.ts';
import { EXIT_B_OPEN, PI_OPEN } from './world.ts';

const onLevel4 = { any: [{ at: 'office' as const }, { at: 'synth' as const }, { at: 'glovebox' as const }, { at: 'pi' as const }] };
/** The night's own spectrum is offered from Act II, once you have run yours. */
const offered = { all: [{ actGte: 2 as const }, { flag: 'ran.own' }] };

/** Act II opens at the 02:47 after the three Act I puzzles are solved (docs/DESIGN.md §8). */
export const ACTS: ActDef[] = [
  { act: 2, when: { all: [{ solved: 'tlc' }, { solved: 'glovebox' }, { solved: 'console' }, { know: 'nb.reset' }] }, title: 'act.2.title' },
  // Act III: her raw data read, her email read, and the night's perfect spectrum offered at least once.
  { act: 3, when: { all: [{ know: 'nb.raw' }, { know: 'nb.email' }, { flag: 'perfect.offered' }] }, title: 'act.3.title' },
];

export const EVENTS: EventDef[] = [
  // 02:50: Dan's email (21:50 in Boston). If you're elsewhere, it's waiting when you get back.
  { id: 'ev.mail', minute: 3, until: 30, if: { at: 'office' }, text: [{ key: 'ev.mail' }] },
  // 03:05: the porter's hoover, on its way to Dan's office for the Monday clean.
  { id: 'ev.hoover', minute: 18, until: 26, if: onLevel4, text: [{ key: 'ev.hoover' }] },
  // 03:28: the box passes 10 ppm.
  { id: 'ev.o2alarm', minute: 41, if: { at: 'glovebox' }, text: [{ key: 'ev.o2alarm' }] },
  // 03:30: holder 13 gets ready for a sample nobody has loaded.
  { id: 'ev.preparing', minute: 43, if: { at: 'nmr' }, text: [{ key: 'ev.preparing' }] },
  // 02:57: Femi, somewhere below, never seen.
  { id: 'ev.whistle', minute: 10, until: 20, if: { at: 'stairs' }, text: [{ key: 'ev.whistle' }] },
  // 03:15: Dan's office opens for the Monday clean. You hear it once a night: from along the corridor…
  { id: 'ev.unlock', minute: PI_OPEN.from, until: PI_OPEN.to, if: { all: [onLevel4, { not: { at: 'pi' } }, { not: { lflag: 'pi.unlocked' } }] }, effects: [{ lflag: 'pi.unlocked' }], text: [{ key: 'ev.unlock' }] },
  // …or, if you're the one standing at its door, it opens in front of you (the porter still unseen).
  // Only outside it: arriving while it stands open takes you straight in, past the moment it clicked.
  { id: 'ev.unlock.door', minute: PI_OPEN.from, until: PI_OPEN.to, if: { all: [{ scene: 'pi.door' }, { not: { lflag: 'pi.unlocked' } }] }, effects: [{ lflag: 'pi.unlocked' }], text: [{ key: 'ev.unlock.door' }] },
  // 03:21: fire exit B is released for the bins.
  { id: 'ev.bins', minute: EXIT_B_OPEN.from, until: EXIT_B_OPEN.to, if: { at: 'stairs' }, text: [{ key: 'ev.bins' }] },
  // 03:25: the perfect spectrum, printed in the basement or mailed to your desk.
  {
    id: 'ev.perfect.nmr',
    minute: 38,
    if: { all: [offered, { at: 'nmr' }] },
    effects: [{ lflag: 'perfect.printed' }, { flag: 'perfect.offered' }],
    text: [{ key: 'ev.perfect.nmr' }],
  },
  {
    id: 'ev.perfect.office',
    minute: 38,
    if: { all: [offered, { at: 'office' }] },
    effects: [{ lflag: 'perfect.mail' }, { flag: 'perfect.offered' }],
    text: [{ key: 'ev.perfect.office' }],
  },
  // 03:31: every light in the building dims, once.
  { id: 'ev.dim', minute: 44, text: [{ key: 'ev.dim' }] },
];

export const PHANTOMS: PhantomDef[] = [
  { entry: 'ph.tea', when: { loopGte: 2 } },
  { entry: 'ph.three', when: { all: [{ loopGte: 3 }, { not: { solved: 'glovebox' } }] } },
  { entry: 'ph.all', when: { all: [{ loopGte: 3 }, { not: { solved: 'console' } }] } },
  { entry: 'ph.strike', when: { fudgedEver: true } },
  { entry: 'ph.door', when: { actGte: 2 } },
  {
    entry: 'ph.radium',
    when: { all: [{ actGte: 2 }, { loopsInActGte: 3 }, { not: { solved: 'cipher' } }, { any: [{ usedEver: 'pi.box' }, { usedEver: 'pi.notebook' }] }] },
  },
  { entry: 'ph.decay', when: { obsessionGte: 4 } },
  { entry: 'ph.decay2', when: { obsessionGte: 7 } },
  { entry: 'ph.port4', when: { actGte: 3 } },
  { entry: 'ph.booking', when: { all: [{ actGte: 3 }, { loopsInActGte: 2 }] } },
];

/** The dark run (#20): you in the NMR suite at 03:33, her tube in holder 13. */
const inPlace: Cond = { all: [{ at: 'nmr' }, { lflag: 'holder13.loaded' }] };
/** Her raw data read, and at least nine of her traces, five of them these. */
const knowsHer: Cond = {
  all: [{ know: 'nb.raw' }, { fragmentsGte: 9 }, ...['yc.email', 'yc.raw', 'yc.flask', 'yc.tube', 'yc.chirp'].map((fragment): Cond => ({ fragment }))],
};

/** A dark run that gives only noise, and the page (`page`) that says why. */
function failed(id: string, missing: Cond, page: string): LightsOutRule {
  return {
    id,
    if: { all: [inPlace, missing] },
    effects: [{ learn: page }],
    // Rule text is read before its effects run, so the page shows here only on a repeat.
    text: [{ key: 'lo.dark.noise' }, { key: `${page}.body`, style: 'phantom', if: { know: page } }],
  };
}

/** Checked in order at 03:33; later acts put their rules (and the endings) first. */
export const LIGHTS_OUT: LightsOutRule[] = [
  // No UPS: the console goes out with everything else, and holder 13 never drops.
  { id: 'lo.dark.nopower', if: { all: [inPlace, { not: { lflag: 'ups.armed' } }] }, text: [{ key: 'lo.dark.nopower' }] },
  // The run goes, but something is missing: only noise, and a page in your hand saying what.
  // The page is written once; on a later failure for the same reason it is shown again.
  failed('lo.dark.pages', { uncorrectedGte: 1 }, 'ph.pages'),
  failed('lo.dark.figure', { not: { know: 'nb.fabrication' } }, 'ph.figure'),
  failed('lo.dark.her', { not: knowsHer }, 'ph.her'),
  // Everything in place: the run, in the dark, and her peak to find (Dark Reaction, if you do).
  // No text: the peak match takes the narrative's place at once, and its intro says it.
  { id: 'lo.dark.run', if: inPlace, puzzle: 'peakmatch' },
  { id: 'lo.first', if: { not: { know: 'nb.reset' } }, effects: [{ learn: 'nb.reset' }], text: [{ key: 'lo.first' }] },
];
