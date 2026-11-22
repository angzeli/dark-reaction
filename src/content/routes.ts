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

/** The true ending's last night (Act III, with her traces, Figure 3 proved and the PIN known): her tube filled in the dark, holder 13, the UPS, 03:33, her peak. */
export const DARK_NIGHT: RouteStep[] = [
  { go: 'glovebox' },
  { do: 'glovebox.mini.open' },
  { go: 'synth' },
  { do: 'synth.foil' },
  { do: 'synth.kraken.fill' },
  { solve: 'schlenk' },
  { go: 'nmr' },
  { do: 'nmr.ups.again' },
  { do: 'nmr.holder13' },
  { night: true },
  { solve: 'peakmatch' },
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
  dark: {
    ending: 'dark',
    summary: 'The true ending, and the critical path: Act I with her mug, drawer and SOP; her office at 03:15 and your own run; the freezer, her raw data, the door log and the rain log; Act III: the flask, the chirp and Figure 3 proved; then her tube, filled in the dark, in holder 13 at 03:33.',
    steps: steps(
      // Loop 1, Act I: her mug and drawer, the SOP's pencil, and the three puzzles.
      [{ do: 'office.desk7' }, { do: 'office.mug' }, { do: 'office.drawer' }, { do: 'meta:back' }],
      ACT_ONE.slice(0, 6),
      [{ do: 'glovebox.sop' }],
      ACT_ONE.slice(6),
      // Loop 2, Act II: your sample made up, her office at 03:15 (the code, her email, her box, her notebook), and your run, which
      // ends as the lights go; the night offers its printout at 03:25 while it runs.
      [
        { go: 'synth' },
        { do: 'synth.combine' },
        { do: 'synth.rotavap' },
        { go: 'glovebox' },
        { do: 'glovebox.purge' },
        { go: 'office' },
        { until: 28 },
        { go: 'pi' },
        { do: 'pi.sticky' },
        { do: 'pi.email' },
        { do: 'pi.box' },
        { do: 'pi.box.close' },
        { do: 'pi.notebook' },
        { solve: 'cipher' },
        { go: 'nmr' },
        { do: 'nmr.run' },
      ],
      // Loop 3: rack one and her raw data; the porter's log; her rain log.
      [
        { go: 'cold' },
        { do: 'cold.rack1' },
        { solve: 'freezer' },
        { go: 'office' },
        { do: 'office.microsd' },
        { go: 'stairs' },
        { do: 'stairs.terminal' },
        { solve: 'doorlog' },
        { go: 'roof' },
        { do: 'roof.deckchair' },
        { night: true },
      ],
      // Loop 4, Act III: the flask on port 4, Tom's Post-it and the chirp; at 03:25 the printout, and Figure 3 proved.
      [
        { go: 'synth' },
        { do: 'synth.port4' },
        { go: 'nmr' },
        { do: 'nmr.postit' },
        { do: 'nmr.ups' },
        { solve: 'chirp' },
        { go: 'office' },
        { until: 38 },
        { do: 'office.print' },
        { do: 'office.compare' },
        { solve: 'fabrication' },
        { night: true },
      ],
      // Loop 5: her tube, foil, the Kraken; the UPS and holder 13; 03:33 in the dark, and her peak.
      DARK_NIGHT,
    ),
  },
  fire: {
    ending: 'fire',
    summary: 'Act I, then in Act II look at the call point, read the door log (whoever is inside at 03:33, the building keeps), and break the glass.',
    steps: steps(ACT_ONE, [{ go: 'stairs' }, { do: 'stairs.callpoint' }, { do: 'stairs.terminal' }, { solve: 'doorlog' }, { do: 'stairs.glass' }, { do: 'stairs.alarm.break' }]),
  },
  infinite: {
    ending: 'infinite',
    summary: 'Act I, then three Act II nights of every chase and no rest (each runs past 03:33 on its own), until the fourth 03:33 keeps you.',
    steps: steps(ACT_ONE, TUBE_AND_CODE, [{ do: 'nmr.printout' }, { do: 'nmr.rerun' }], CHASE_LOOP, CHASE_LOOP),
  },
};
