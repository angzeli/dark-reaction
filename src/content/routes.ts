/**
 * Scripted routes through the game, one per ending. The validator plays
 * every one through the engine in both languages (scripts/validate.ts);
 * the Playwright bot (e2e/bot.ts) plays the same steps through the real UI
 * (e2e/endings.spec.ts). The route to the true ending is the critical path
 * the playtime estimate measures.
 */
import type { EndingId, LocationId } from '../engine/types.ts';

export type RouteStep =
  /** A choice id as the engine knows it (content choice, or meta:/go:/wait: ids). */
  | { do: string }
  /** Walk somewhere (opens the travel menu and picks the destination). */
  | { go: LocationId }
  | { wait: 1 | 5 | 10 }
  /** Wait in the current hub until this loop minute (or until the lights go out). */
  | { until: number }
  /** Let the rest of the night run out: wait until 03:33. */
  | { night: true }
  /** Solve the open puzzle with its logic's known solution. */
  | { solve: string }
  /** Step away from the open puzzle. */
  | { fail: string }
  /** Strike a fudge through in the notebook. */
  | { correct: string };

export interface Route {
  ending: EndingId;
  /** One line on what this route does, for reports. */
  summary: string;
  steps: RouteStep[];
}

/** Loop 1: the three Act I puzzles, then the first 03:33 (Act II opens at the next 02:47). */
export const ACT_ONE: RouteStep[] = [
  { go: 'synth' },
  { do: 'synth.plate' },
  { solve: 'tlc' },
  { do: 'synth.rotavap' },
  { do: 'synth.yield.honest' },
  { go: 'glovebox' },
  { do: 'glovebox.antechamber' },
  { solve: 'glovebox' },
  { go: 'nmr' },
  { do: 'nmr.console' },
  { solve: 'console' },
  { do: 'nmr.load' },
  { night: true },
];

/** An Act II morning worked to the minute: the shortcuts, Dan's office at 03:15, your own run (03:33–03:41). */
export const TUBE_AND_CODE: RouteStep[] = [
  { go: 'synth' },
  { do: 'synth.combine' },
  { do: 'synth.rotavap' },
  { go: 'glovebox' },
  { do: 'glovebox.purge' },
  { go: 'office' },
  { until: 28 },
  { go: 'pi' },
  { do: 'pi.sticky' },
  { go: 'nmr' },
  { do: 'nmr.run' },
];

/** A night spent chasing the peak: every chase there is, and no rest. */
export const CHASE_LOOP: RouteStep[] = [
  { go: 'synth' },
  { do: 'synth.combine' },
  { do: 'synth.rotavap' },
  { go: 'glovebox' },
  { do: 'glovebox.purge' },
  { go: 'nmr' },
  { do: 'nmr.run' },
  { do: 'nmr.rerun' },
  { until: 38 },
  { do: 'nmr.printout' },
  { go: 'office' },
  { do: 'office.process' },
  { do: 'office.reprocess' },
  { do: 'office.stare' },
];

const steps = (...parts: RouteStep[][]): RouteStep[] => parts.flat();

export const ROUTES: Partial<Record<EndingId, Route>> = {
  perfect: {
    ending: 'perfect',
    summary: 'Act I, then in Act II run your own sample with the code, take the 03:25 printout up to the portal and upload it.',
    steps: steps(ACT_ONE, TUBE_AND_CODE, [
      { do: 'nmr.printout' },
      { go: 'office' },
      { do: 'office.monitor' },
      { do: 'office.submit.printout' },
      { do: 'office.upload.printout' },
    ]),
  },
  honest: {
    ending: 'honest',
    summary: 'Act I, then in Act II run your own sample, write down what is there, and upload the noise.',
    steps: steps(ACT_ONE, TUBE_AND_CODE, [
      { go: 'office' },
      { do: 'office.process' },
      { do: 'office.process.honest' },
      { do: 'meta:back' },
      { do: 'office.monitor' },
      { do: 'office.submit.own' },
      { do: 'office.upload.own' },
    ]),
  },
  clocking: {
    ending: 'clocking',
    summary: 'Act I, then in Act II be at fire exit B when the bins go out at 03:21, and leave.',
    steps: steps(ACT_ONE, [{ go: 'stairs' }, { until: 34 }, { do: 'stairs.exitb.open' }, { do: 'stairs.leave' }]),
  },
  infinite: {
    ending: 'infinite',
    summary: 'Act I, then three Act II nights of every chase and no rest (each runs past 03:33 on its own), until the fourth 03:33 keeps you.',
    steps: steps(ACT_ONE, TUBE_AND_CODE, [{ do: 'nmr.printout' }, { do: 'nmr.rerun' }], CHASE_LOOP, CHASE_LOOP),
  },
};
