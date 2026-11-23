import { describe, expect, it } from 'vitest';
import { Game, newGameState } from '../src/engine/engine.ts';
import { distances, travelTime } from '../src/engine/map.ts';
import { EDGES, LOCATIONS } from '../src/content/world.ts';
import type { Card, Content, LocationId } from '../src/engine/types.ts';
import { miniContent } from './fixtures/mini.ts';

function drainCards(g: Game): Card[] {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
}
/** A new game with the Act I title card already played. */
function fresh(content: Content = miniContent()): Game {
  const g = new Game(content);
  drainCards(g);
  return g;
}
const keys = (g: Game) => g.state.display.map((p) => p.key);
const ids = (g: Game) => g.choices().map((c) => c.id);

/** Wait (in a hub) until the given minute, an interruption, or lights-out. */
function waitUntil(g: Game, minute: number): void {
  while (g.state.minute < minute && !g.busy) {
    const step = minute - g.state.minute;
    const n = step >= 10 ? 10 : step >= 5 ? 5 : 1;
    g.choose('meta:wait');
    g.choose(`wait:${n}`);
  }
}
function goTo(g: Game, to: LocationId): void {
  g.choose('meta:travel');
  g.choose(`go:${to}`);
}
/** Burn the rest of the loop and clear the transition cards. */
function endLoop(g: Game): Card[] {
  if (g.state.scene !== 'office.hub' && !g.scene.hub) g.choose('meta:back');
  waitUntil(g, 46);
  return drainCards(g);
}

describe('travel', () => {
  const table = distances(LOCATIONS.map((l) => l.id), EDGES);
  it('matches the design document', () => {
    const t = (a: LocationId, b: LocationId) => travelTime(table, a, b);
    expect(t('office', 'synth')).toBe(1);
    expect(t('office', 'pi')).toBe(1);
    expect(t('office', 'stairs')).toBe(1);
    expect(t('office', 'nmr')).toBe(3);
    expect(t('office', 'roof')).toBe(3);
    expect(t('nmr', 'cold')).toBe(1);
    expect(t('roof', 'cold')).toBe(4);
    expect(t('glovebox', 'nmr')).toBe(3);
  });

  it('walking costs the travel time and lands on the entry scene', () => {
    const g = fresh();
    g.choose('meta:travel');
    expect(g.choices().find((c) => c.id === 'go:nmr')?.cost).toBe(3);
    expect(ids(g)).not.toContain('go:office');
    g.choose('go:nmr');
    expect(g.state).toMatchObject({ location: 'nmr', scene: 'nmr.hub', minute: 3 });
    expect(keys(g)).toEqual(['nmr.hub.text']);
  });

  it('decides an open or locked door by the minute you arrive, not the minute you leave', () => {
    // Porter window: minutes 28–31 (03:15–03:18).
    const g = fresh();
    waitUntil(g, 27);
    goTo(g, 'pi'); // leave 27, arrive 28: open
    expect(g.state.minute).toBe(28);
    expect(g.state.scene).toBe('pi.hub');

    const h = fresh();
    waitUntil(h, 30);
    goTo(h, 'pi'); // leave 30, arrive 31: locked again
    expect(h.state.minute).toBe(31);
    expect(h.state.scene).toBe('pi.door');

    const early = fresh();
    goTo(early, 'pi');
    expect(early.state.scene).toBe('pi.door');
  });

  it('a walk that runs into 03:33 still arrives, then the lights go out', () => {
    const g = fresh();
    g.choose('office.arm'); // ev.late at minute 44
    waitUntil(g, 43);
    goTo(g, 'nmr'); // leave 43, arrive 46
    const card = drainCards(g)[0];
    expect(card && card.kind === 'lightsout' ? card.before.map((p) => p.key) : []).toEqual(['nmr.hub.text', 'ev.printer.text', 'ev.late.text', 'ui.noted']);
    expect(g.state.loops[0]).toEqual({ loop: 1, location: 'nmr', minute: 46 });
    expect(g.state.loop).toBe(2);
  });

  it('a choice that sends you somewhere spends its own minutes first, then walks', () => {
    const g = fresh();
    g.choose('office.walk'); // cost 2, then 3 minutes to the NMR suite
    expect(g.state).toMatchObject({ location: 'nmr', scene: 'nmr.hub', minute: 5 });
    expect(keys(g)).toEqual(['r.walk', 'nmr.hub.text']);
  });
});

describe('a new game', () => {
  it('opens with the Act I title card, then 02:47 in the office', () => {
    const g = new Game(miniContent());
    expect(g.busy).toBe(true);
    expect(drainCards(g)).toEqual([{ kind: 'act', act: 1 }]);
    expect(g.state).toMatchObject({ loop: 1, minute: 0, act: 1, actLoop: 1, location: 'office', scene: 'office.hub' });
    expect(keys(g)).toEqual(['loop.start', 'office.hub.act1']);
    expect(ids(g)).toEqual(expect.arrayContaining(['meta:travel', 'meta:wait']));
  });

  it('sets up loop 1 exactly like later loops (the start room runs its onEnter)', () => {
    const g = fresh();
    expect(g.state.lflags).toEqual(['woke']);
    endLoop(g);
    expect(g.state.lflags).toEqual(['woke']);
  });

  it('carries new game+ margins', () => {
    expect(newGameState(miniContent(), ['tlc', 'tlc', 'glovebox']).margins).toEqual(['tlc', 'glovebox']);
  });

  it('refuses unavailable choices', () => {
    const g = fresh();
    expect(() => g.choose('office.submit')).toThrow(/not available/);
    expect(() => g.choose('go:nmr')).toThrow(/not available/);
  });
});

describe('content checks at load', () => {
  it('rejects a condition with two keys (only one would be read)', () => {
    const c = miniContent();
    c.scenes[0]!.choices[0]!.if = { at: 'nmr', minuteGte: 38 } as never;
    expect(() => new Game(c)).toThrow(/exactly one known key/);
  });

  it('rejects a condition on a scene that does not exist', () => {
    const c = miniContent();
    c.scenes[0]!.choices[0]!.if = { scene: 'no.such.scene' };
    expect(() => new Game(c)).toThrow(/no scene "no.such.scene"/);
    c.scenes[0]!.choices[0]!.if = { scene: c.scenes[0]!.id };
    expect(() => new Game(c)).not.toThrow();
  });

  it('rejects an effect with two keys', () => {
    const c = miniContent();
    c.scenes[0]!.choices[0]!.effects = [{ give: 'x', lflag: 'y' } as never];
    expect(() => new Game(c)).toThrow(/exactly one known key/);
  });

  it('rejects movement or time inside events', () => {
    const c = miniContent();
    c.events[0]!.effects = [{ time: 5 }];
    expect(() => new Game(c)).toThrow(/not allowed here/);
  });

  it('rejects events that would open a puzzle (they cannot take over an action)', () => {
    const c = miniContent();
    c.events[0]!.effects = [{ puzzle: 'demo' }];
    expect(() => new Game(c)).toThrow(/not allowed here/);
  });

  it('rejects references to scenes, notebook entries, puzzles or locations that do not exist', () => {
    const c = miniContent();
    c.scenes[0]!.choices.push({ id: 'office.typo', label: 'x', to: 'office.computr', effects: [{ learn: 'nb.nope' }] });
    expect(() => new Game(c)).toThrow(/unknown scene "office.computr"[\s\S]*unknown notebook entry "nb.nope"/);
  });

  it('rejects a choice that moves twice', () => {
    const c = miniContent();
    c.scenes[0]!.choices.push({ id: 'office.twice', label: 'x', to: 'office.computer', effects: [{ go: 'nmr' }] });
    expect(() => new Game(c)).toThrow(/at most one/);
  });
});

describe('choices', () => {
  it('cost minutes, show result text and hide when used once per loop', () => {
    const g = fresh();
    g.choose('office.kettle');
    expect(g.state.minute).toBe(4);
    expect(keys(g)).toEqual(['r.kettle']);
    expect(ids(g)).not.toContain('office.kettle');
  });

  it('navigate to sub-scenes with params and an automatic Back', () => {
    const g = fresh();
    g.choose('meta:wait');
    g.choose('wait:5');
    g.choose('office.computer');
    expect(g.state.scene).toBe('office.computer');
    expect(g.state.display[0]).toMatchObject({ key: 'office.computer.text', params: { minute: 5 } });
    expect(ids(g)).toContain('meta:back');
    g.choose('meta:back');
    expect(g.state.scene).toBe('office.hub');
  });

  it('learn writes the notebook once with a notice', () => {
    const g = fresh();
    g.choose('office.mug');
    expect(g.state.known.map((k) => k.id)).toEqual(['nb.mug']);
    expect(g.state.display).toContainEqual({ key: 'ui.noted', params: { entry: '@nb.mug.title' }, style: 'system' });
    expect(g.state.fragments).toEqual(['yc.mug']);
  });
});

describe('03:33', () => {
  it('resets items, loop flags, per-loop bookkeeping and the clock, but keeps knowledge', () => {
    const g = fresh();
    g.choose('office.pen');
    g.choose('office.mug');
    g.choose('office.kettle');
    g.state.puzzleData = { demo: { half: 'done' } };
    expect(g.state.inventory).toEqual(['item.pen']);
    const cards = endLoop(g);
    expect(cards[0]).toMatchObject({ kind: 'lightsout', loop: 1 });
    expect(g.state).toMatchObject({ loop: 2, minute: 0, location: 'office', scene: 'office.hub', inventory: [], lflags: ['woke'] });
    expect(g.state.restUsed).toEqual([]);
    expect(g.state.chaseUsed).toEqual([]);
    expect(g.state.puzzleData).toEqual({});
    expect(g.state.usedLoop).toEqual([]);
    expect(g.state.known.map((k) => k.id)).toContain('nb.mug');
    expect(g.state.fragments).toEqual(['yc.mug']);
    expect(ids(g)).not.toContain('office.mug'); // once: 'game'
    expect(ids(g)).toContain('office.kettle'); // once: 'loop' comes back
    expect(g.state.loops).toEqual([{ loop: 1, location: 'office', minute: 46 }]);
  });

  it('the lights-out card shows what was on screen, including events in the final minutes', () => {
    const g = fresh();
    g.choose('office.arm');
    waitUntil(g, 40);
    g.choose('office.sofa'); // 10 minutes from 40: ev.late fires at 44, lights out at 46
    const card = g.takeCard();
    expect(card?.kind).toBe('lightsout');
    expect(card && card.kind === 'lightsout' ? card.before.map((p) => p.key) : []).toEqual(['r.sofa', 'ev.late.text', 'ui.noted']);
    expect(g.state.known.map((k) => k.id)).toContain('nb.late');
  });

  it('writes a phantom page at the start of loop 2, once', () => {
    const g = fresh();
    endLoop(g);
    expect(keys(g)).toEqual(['loop.start', 'ui.phantom.notice', 'ph.tea.body', 'office.hub.act1']);
    expect(g.state.known.find((k) => k.id === 'ph.tea')).toMatchObject({ loop: 2, minute: 0 });
    endLoop(g);
    expect(keys(g)).not.toContain('ph.tea.body');
  });

  it('opens the next act at loop start, after the lights-out card, and counts loops in the act', () => {
    const g = fresh();
    g.choose('office.puzzle');
    g.completePuzzle({ solved: true, minutes: 2 });
    expect(g.state.act).toBe(1);
    expect(endLoop(g).map((c) => c.kind)).toEqual(['lightsout', 'act']);
    expect(g.state).toMatchObject({ act: 2, actLoop: 2, loop: 2 });
    expect(keys(g)).toContain('office.hub.act2');
    expect(keys(g)).not.toContain('ph.later.body'); // 0 loops into Act II
    endLoop(g);
    expect(keys(g)).toContain('ph.later.body'); // 1 loop into Act II
  });
});

describe('timed events', () => {
  it('fire once per loop when the minute passes and the condition holds, and re-arm at 02:47', () => {
    const g = fresh();
    goTo(g, 'nmr');
    waitUntil(g, 37);
    expect(ids(g)).not.toContain('nmr.printout');
    g.choose('meta:wait');
    g.choose('wait:1');
    expect(keys(g)).toEqual(['ui.waited', 'ev.printer.text']);
    expect(ids(g)).toContain('nmr.printout');
    g.choose('meta:wait');
    g.choose('wait:1');
    expect(keys(g)).toEqual(['ui.waited']);
    expect(g.state.firedEvents).toEqual(['ev.printer']);

    endLoop(g);
    expect(g.state.firedEvents).toEqual([]);
    goTo(g, 'nmr');
    waitUntil(g, 38);
    expect(g.state.firedEvents).toEqual(['ev.printer']);
  });

  it('interrupt a wait so the player can react', () => {
    const g = fresh();
    g.choose('office.armknock');
    waitUntil(g, 15);
    g.choose('meta:wait');
    g.choose('wait:10');
    expect(g.state.minute).toBe(20);
    expect(keys(g)).toEqual(['ui.waited', 'ev.knock.text']);
  });

  it('say how long the wait really was when one cuts it short', () => {
    const g = fresh();
    g.choose('office.armknock');
    waitUntil(g, 15);
    g.choose('meta:wait');
    g.choose('wait:10');
    expect(g.state.display[0]).toMatchObject({ key: 'ui.waited', params: { n: 5 } });
  });

  it('do not fire while you are walking; they fire on arrival if still due', () => {
    const g = fresh();
    goTo(g, 'nmr');
    waitUntil(g, 37);
    goTo(g, 'office'); // leave 37, arrive 40: you were on the stairs at 38
    expect(g.state.firedEvents).toEqual([]);
    goTo(g, 'nmr'); // arrive 43: the printout is waiting
    expect(g.state.firedEvents).toEqual(['ev.printer']);
    expect(keys(g)).toEqual(['nmr.hub.text', 'ev.printer.text']);
  });

  it('respect `until`', () => {
    const g = fresh();
    waitUntil(g, 30);
    goTo(g, 'pi'); // arrive 31: the hoover (28–31) has gone
    expect(g.state.firedEvents).not.toContain('ev.hoover');
  });
});

describe('honesty', () => {
  it('fudges stand until struck through; striking costs a minute', () => {
    const g = fresh();
    g.choose('office.yield');
    expect(g.state.fudges).toEqual([{ id: 'fudge.yield', corrected: false, loop: 1 }]);
    expect(g.state.fudgesEver).toBe(1);
    expect(g.state.known.map((k) => k.id)).toContain('fudge.yield');
    const before = g.state.minute;
    expect(g.correctFudge('fudge.yield')).toBe(true);
    expect(g.state.minute).toBe(before + 1);
    expect(g.correctFudge('fudge.yield')).toBe(false);
    expect(g.state.fudges[0]?.corrected).toBe(true);
  });

  it('fudging again after a correction counts again; fudging twice in a row does not', () => {
    const g = fresh();
    g.choose('office.yield');
    g.choose('office.yield');
    expect(g.state.fudgesEver).toBe(1);
    g.correctFudge('fudge.yield');
    g.choose('office.yield');
    expect(g.state.fudgesEver).toBe(2);
    expect(g.state.fudges[0]?.corrected).toBe(false);
  });

  it('fudges persist across the loop because the notebook does', () => {
    const g = fresh();
    g.choose('office.yield');
    endLoop(g);
    expect(g.state.fudges).toHaveLength(1);
  });
});

describe('obsession', () => {
  it('chasing counts once per action per loop; rest lowers it to a floor of zero', () => {
    const g = fresh();
    g.choose('office.rerun');
    g.choose('office.rerun');
    g.choose('office.reprocess');
    expect(g.state.obsession).toBe(2);
    g.choose('office.sofa');
    expect(g.state.obsession).toBe(0);
    g.choose('office.kettle');
    expect(g.state.obsession).toBe(0);
  });

  it('a loop spent chasing without rest adds one more at 03:33', () => {
    const g = fresh();
    g.choose('office.rerun');
    endLoop(g);
    expect(g.state.obsession).toBe(2);
    g.choose('office.rerun');
    g.choose('office.kettle');
    endLoop(g);
    expect(g.state.obsession).toBe(2); // +1 chase, −1 tea, no end-of-loop penalty
  });

  it('Infinite Loop fires at exactly the threshold at the end of loop 4', () => {
    const g = fresh();
    for (let loop = 1; loop <= 3; loop++) endLoop(g);
    g.state.obsession = 8;
    g.choose('office.rerun'); // 9, plus the end-of-loop penalty: 10
    expect(endLoop(g).map((c) => c.kind)).toEqual(['lightsout', 'ending']);
    expect(g.state.ending).toBe('infinite');
    expect(g.choices()).toEqual([]);
  });

  it('does not fire one below the threshold', () => {
    const g = fresh();
    for (let loop = 1; loop <= 3; loop++) endLoop(g);
    g.state.obsession = 7;
    g.choose('office.rerun'); // 8 + 1 = 9
    endLoop(g);
    expect(g.state.ending).toBeNull();
    expect(g.state.obsession).toBe(9);
  });

  it('does not fire before the end of loop 4, however high obsession is', () => {
    const g = fresh();
    endLoop(g);
    endLoop(g);
    g.state.obsession = 30;
    endLoop(g); // end of loop 3
    expect(g.state.ending).toBeNull();
    endLoop(g); // end of loop 4
    expect(g.state.ending).toBe('infinite');
  });
});

describe('puzzles', () => {
  it('block choices while open; solving applies effects and the minutes spent', () => {
    const g = fresh();
    g.choose('office.puzzle');
    expect(g.state.puzzle).toBe('demo');
    expect(g.busy).toBe(true);
    expect(g.choices()).toEqual([]);
    expect(g.useHint('demo')).toBe(1);
    expect(g.useHint('demo')).toBe(2);
    g.completePuzzle({ solved: true, minutes: 5 });
    expect(g.state.minute).toBe(6);
    expect(g.state.solved).toEqual(['demo']);
    expect(keys(g)).toEqual(['p.demo.solved', 'ui.noted']);
    expect(g.state.hints).toEqual({ demo: 2 });
  });

  it('time in onSolve is added to the minutes spent', () => {
    const g = fresh();
    g.choose('office.slow');
    g.completePuzzle({ solved: true, minutes: 2 });
    expect(g.state.minute).toBe(9);
    expect(keys(g)).toEqual(['ui.noted']);
  });

  it('stepping away shows the left text, keeps your things and still costs time', () => {
    const g = fresh();
    g.choose('office.pen');
    g.choose('office.puzzle');
    g.completePuzzle({ solved: false, minutes: 3 });
    expect(g.state.solved).toEqual([]);
    expect(keys(g)).toEqual(['p.demo.left']);
    expect(g.state.minute).toBe(4);
    expect(g.state.inventory).toEqual(['item.pen']);
  });

  it('failing outright applies onFail (the sample is lost) and shows the failure text', () => {
    const g = fresh();
    g.choose('office.pen');
    g.choose('office.puzzle');
    g.completePuzzle({ solved: false, failed: true, minutes: 3 });
    expect(keys(g)).toEqual(['p.demo.failed']);
    expect(g.state.inventory).toEqual([]);
    expect(g.state.lflags).toContain('demo.ruined');
  });

  it('a puzzle that runs past 03:33 ends with the lights', () => {
    const g = fresh();
    waitUntil(g, 40);
    g.choose('office.puzzle');
    g.completePuzzle({ solved: true, minutes: 10 });
    expect(g.state.loop).toBe(2);
    expect(g.state.solved).toEqual(['demo']);
  });
});

describe('lights-out rules', () => {
  const setUpDarkRun = (g: Game) => {
    g.choose('office.computer');
    g.choose('office.email');
    g.choose('meta:back');
    g.choose('office.loaded');
    waitUntil(g, 46);
  };

  it('a dark run opens a puzzle at 03:33 instead of resetting; solving it ends the game', () => {
    const g = fresh();
    setUpDarkRun(g);
    expect(g.state).toMatchObject({ loop: 1, puzzle: 'dark', darkRun: true });
    expect(keys(g)).toEqual(['lo.dark.text']);
    expect(g.takeCard()).toMatchObject({ kind: 'lightsout', dark: true });
    g.completePuzzle({ solved: true, minutes: 0 });
    expect(g.state).toMatchObject({ ending: 'dark', darkRun: false });
    expect(g.takeCard()).toEqual({ kind: 'ending', ending: 'dark' });
  });

  it('a failed dark run resets the loop (a dark card, then the reset card)', () => {
    const g = fresh();
    setUpDarkRun(g);
    g.completePuzzle({ solved: false, minutes: 0 });
    expect(g.state).toMatchObject({ loop: 2, ending: null, darkRun: false });
    expect(drainCards(g).map((c) => c.kind === 'lightsout' && !!c.dark)).toEqual([true, false]);
  });

  it('the first matching rule wins', () => {
    const g = fresh();
    g.choose('office.yield'); // lo.pages would match too…
    setUpDarkRun(g); // …but lo.dark comes first
    expect(g.state.puzzle).toBe('dark');
    expect(g.state.known.map((k) => k.id)).not.toContain('ph.pages');
  });

  it('a rule with effects applies them and still resets, carrying its text and, after 02:47, the phantom page', () => {
    const g = fresh();
    g.choose('office.yield');
    g.choose('office.loaded');
    endLoop(g);
    expect(g.state.loop).toBe(2);
    expect(g.state.known.map((k) => k.id)).toContain('ph.pages');
    expect(keys(g).slice(0, 4)).toEqual(['lo.pages.text', 'loop.start', 'ui.phantom.notice', 'ph.pages.body']);
  });

  it('a rule whose effects end the game does not reset', () => {
    const g = fresh();
    g.choose('office.alarm');
    const cards = endLoop(g);
    expect(cards.map((c) => c.kind)).toEqual(['lightsout', 'ending']);
    expect(g.state).toMatchObject({ ending: 'fire', loop: 1 });
  });
});

describe('endings', () => {
  it('an ending effect ends the game immediately and queues its card', () => {
    const g = fresh();
    g.choose('office.pen');
    g.choose('office.submit');
    expect(g.state.ending).toBe('honest');
    expect(g.takeCard()).toEqual({ kind: 'ending', ending: 'honest' });
    expect(g.choices()).toEqual([]);
    expect(g.correctFudge('fudge.yield')).toBe(false);
  });
});

describe('state', () => {
  it('is plain JSON and survives a round trip mid-loop', () => {
    const g = fresh();
    g.choose('office.mug');
    g.choose('office.yield');
    const copy = new Game(miniContent(), JSON.parse(JSON.stringify(g.state)));
    expect(copy.state).toEqual(g.state);
    copy.choose('office.kettle');
    expect(copy.state.minute).toBe(g.state.minute + 4);
  });

  it('survives a round trip with pending cards and an open dark-run puzzle', () => {
    const g = fresh();
    g.choose('office.computer');
    g.choose('office.email');
    g.choose('meta:back');
    g.choose('office.loaded');
    waitUntil(g, 46);
    const copy = new Game(miniContent(), JSON.parse(JSON.stringify(g.state)));
    expect(copy.state).toEqual(g.state);
    expect(copy.takeCard()).toMatchObject({ kind: 'lightsout', dark: true });
    copy.completePuzzle({ solved: true, minutes: 0 });
    expect(copy.state.ending).toBe('dark');
  });
});
