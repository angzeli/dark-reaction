/**
 * Act I as written: the real content driven through the engine, with the
 * puzzles solved through their pure logic (as the playthrough bot does).
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { Card, LocationId } from '../src/engine/types.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';

function drainCards(g: Game): Card[] {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
}
function fresh(): Game {
  const g = new Game(CONTENT);
  drainCards(g);
  return g;
}
const keys = (g: Game) => g.state.display.map((p) => p.key);
const ids = (g: Game) => g.choices().map((c) => c.id);
const known = (g: Game) => g.state.known.map((k) => k.id);

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
function endLoop(g: Game): Card[] {
  if (!g.scene.hub) g.choose('meta:back');
  waitUntil(g, 46);
  return drainCards(g);
}
/** Play the open puzzle to its known solution. */
function solve(g: Game): void {
  const logic = PUZZLE_LOGIC[g.state.puzzle!]!;
  let s = logic.init({ minute: g.state.minute, act: g.state.act });
  for (const m of logic.solution(s)) s = logic.apply(s, m);
  expect(logic.isSolved(s)).toBe(true);
  g.completePuzzle({ solved: true, minutes: logic.minutes(s) });
}

describe('Act I: the office', () => {
  it('the queue page shows a booking in your name; Dan’s email arrives at 02:50', () => {
    const g = fresh();
    expect(keys(g)).toContain('loop.start.first');
    g.choose('office.monitor');
    expect(ids(g)).not.toContain('office.email');
    g.choose('office.queue');
    g.choose('office.portal');
    g.choose('office.data'); // 02:50
    expect(keys(g)).toContain('ev.mail');
    g.choose('office.email');
    expect(keys(g)).toEqual(['office.email.r.1', 'office.email.r.2', 'office.email.r.3', 'ui.noted']);
    expect(known(g)).toEqual(['nb.booking', 'nb.portal', 'nb.paper', 'nb.dan']);
    expect(g.state.minute).toBe(4);
  });

  it('tea and the sofa are rest, once a loop each; the tea remembers who told you', () => {
    const g = fresh();
    g.state.obsession = 3;
    g.choose('office.tea');
    expect(g.state.obsession).toBe(2);
    expect(keys(g)).not.toContain('office.tea.r.told');
    expect(ids(g)).not.toContain('office.tea');
    g.choose('office.sofa');
    expect(g.state.obsession).toBe(0);
    expect(g.state.minute).toBe(14);
    endLoop(g);
    g.choose('office.tea');
    expect(keys(g)).toContain('office.tea.r.told');
  });

  it('a look is spent once a loop; at 02:47 the room is as it was', () => {
    const g = fresh();
    g.choose('office.desk7');
    g.choose('office.mug');
    expect(ids(g)).toEqual(['office.drawer', 'meta:back']);
    g.choose('meta:back');
    endLoop(g);
    g.choose('office.desk7');
    expect(ids(g)).toEqual(['office.mug', 'office.drawer', 'meta:back']);
  });

  it('desk 7, the drawer and the SOP are Y.C.’s first three fragments', () => {
    const g = fresh();
    g.choose('office.desk7');
    g.choose('office.mug');
    g.choose('office.drawer');
    g.choose('meta:back');
    goTo(g, 'glovebox');
    g.choose('glovebox.sop');
    expect(g.state.fragments).toEqual(['yc.mug', 'yc.desk', 'yc.sop']);
    expect(known(g)).toEqual(expect.arrayContaining(['nb.mug', 'nb.drawer', 'nb.sop']));
  });
});

describe('Act I: 03:33', () => {
  it('the first lights-out: the dark, then 02:47 with a page you don’t remember writing', () => {
    const g = fresh();
    const cards = endLoop(g);
    expect(cards[0]).toMatchObject({ kind: 'lightsout', loop: 1 });
    expect(g.state.loop).toBe(2);
    // What 03:33 wrote comes after you come to, under the same notice as 02:47's own pages.
    expect(keys(g)).toEqual(['lo.first', 'loop.start.second', 'ui.noted', 'ui.phantom.notice', 'ph.tea.body', 'office.hub.act1']);
    expect(known(g)).toEqual(expect.arrayContaining(['nb.reset', 'ph.tea']));
    endLoop(g);
    expect(keys(g)).not.toContain('lo.first');
    expect(keys(g)).toContain('loop.start.again');
  });

  it('loop 3 brings pages about the purge and the queue, unless you already know', () => {
    const g = fresh();
    endLoop(g);
    endLoop(g);
    expect(known(g)).toEqual(expect.arrayContaining(['ph.three', 'ph.all']));
    // Two pages at once share one notice.
    const at = keys(g).indexOf('ui.phantom.notice');
    expect(keys(g).filter((k) => k === 'ui.phantom.notice')).toHaveLength(1);
    expect(keys(g).slice(at, at + 3)).toEqual(['ui.phantom.notice', 'ph.three.body', 'ph.all.body']);
    expect(g.state.display[at]!.params).toEqual({ n: 2 });
    const h = fresh();
    endLoop(h);
    h.state.solved.push('glovebox', 'console');
    endLoop(h);
    expect(known(h)).not.toContain('ph.three');
    expect(known(h)).not.toContain('ph.all');
  });

  it('the night has its own timetable: the hoover, the O₂ alarm, the lights dimming', () => {
    const g = fresh();
    goTo(g, 'glovebox');
    waitUntil(g, 18);
    expect(keys(g)).toContain('ev.hoover');
    waitUntil(g, 41);
    expect(keys(g)).toContain('ev.o2alarm');
    waitUntil(g, 44);
    expect(keys(g)).toContain('ev.dim');
    const n = fresh();
    goTo(n, 'nmr');
    waitUntil(n, 43);
    expect(keys(n)).toContain('ev.preparing');
  });
});

describe('Act I: the work', () => {
  it('the whole chain with the real puzzles, the yield written honestly', () => {
    const g = fresh();
    goTo(g, 'synth');
    g.choose('synth.plate');
    expect(g.state.puzzle).toBe('tlc');
    solve(g);
    g.choose('synth.rotavap');
    expect(keys(g)).toContain('synth.rotavap.r.weigh');
    expect(ids(g)).toEqual(expect.arrayContaining(['synth.yield.honest', 'synth.yield.fudge']));
    g.choose('synth.yield.honest');
    expect(ids(g)).not.toContain('synth.yield.fudge');
    goTo(g, 'glovebox');
    g.choose('glovebox.antechamber');
    solve(g);
    expect(g.state.inventory).toEqual(['item.lanyard', 'item.tube.own']);
    goTo(g, 'nmr');
    g.choose('nmr.console');
    solve(g);
    g.choose('nmr.load');
    expect(ids(g)).not.toContain('nmr.load');
    expect(known(g)).toEqual(expect.arrayContaining(['nb.tlc', 'nb.yield', 'nb.purge', 'nb.queue.0333', 'nb.holder13', 'nb.queue.locked']));
    expect(g.state.fudges).toEqual([]);
    expect(g.state.minute).toBeLessThan(30);
  });

  it('fudging the yield leaves a page standing; the next 02:47 says how to strike it', () => {
    const g = fresh();
    g.state.inventory.push('item.fractions');
    goTo(g, 'synth');
    g.choose('synth.rotavap');
    g.choose('synth.yield.fudge');
    expect(g.state.fudges).toEqual([{ id: 'fudge.yield', corrected: false, loop: 1 }]);
    expect(ids(g)).not.toContain('synth.yield.honest');
    endLoop(g);
    expect(keys(g)).toContain('ph.strike.body');
    g.state.inventory.push('item.fractions');
    goTo(g, 'synth');
    g.choose('synth.rotavap');
    expect(ids(g)).not.toContain('synth.yield.fudge');
    expect(ids(g)).not.toContain('synth.yield.honest');
    expect(g.correctFudge('fudge.yield')).toBe(true);
    expect(g.state.fudges[0]!.corrected).toBe(true);
  });

  it('the logbook is signed once, honestly or not', () => {
    const g = fresh();
    goTo(g, 'glovebox');
    g.choose('glovebox.logbook');
    expect(ids(g)).toEqual(['glovebox.logbook.honest', 'glovebox.logbook.fudge', 'meta:back']);
    g.choose('glovebox.logbook.fudge');
    expect(ids(g)).toEqual(['meta:back']);
    expect(g.state.fudgesEver).toBe(1);
    expect(known(g)).toContain('fudge.logbook');
  });
});
