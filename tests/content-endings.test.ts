/**
 * The endings as written: every route reaches its ending through the
 * engine, epilogues change with what you did, and the doors to them only
 * open when they should.
 */
import { describe, expect, it } from 'vitest';
import { EPILOGUES } from '../src/content/endings.ts';
import { CONTENT } from '../src/content/index.ts';
import { ROUTES } from '../src/content/routes.ts';
import { Game } from '../src/engine/engine.ts';
import { simulate } from '../src/engine/simulate.ts';
import type { Card, EndingId, LocationId } from '../src/engine/types.ts';
import { t } from '../src/i18n/i18n.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';

function drainCards(g: Game): Card[] {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
}
const ids = (g: Game) => g.choices().map((c) => c.id);
const keys = (g: Game) => g.state.display.map((p) => p.key);
function waitUntil(g: Game, minute: number): void {
  while (g.state.minute < minute && !g.busy) {
    const step = minute - g.state.minute;
    g.choose('meta:wait');
    g.choose(`wait:${step >= 10 ? 10 : step >= 5 ? 5 : 1}`);
  }
}
function goTo(g: Game, to: LocationId): void {
  g.choose('meta:travel');
  g.choose(`go:${to}`);
}
function actTwo(): Game {
  const g = new Game(CONTENT);
  drainCards(g);
  g.state.solved.push('tlc', 'glovebox', 'console');
  waitUntil(g, 46);
  drainCards(g);
  expect(g.state.act).toBe(2);
  return g;
}
const epilogueKeys = (g: Game) => {
  const def = CONTENT.endings.find((e) => e.id === g.state.ending)!;
  return g.paragraphs(def.epilogue, 'text').map((p) => p.key);
};

describe('every route reaches its ending', () => {
  for (const [id, route] of Object.entries(ROUTES) as Array<[EndingId, NonNullable<(typeof ROUTES)[EndingId]>]>) {
    it(id, () => {
      const { game, screens } = simulate(CONTENT, PUZZLE_LOGIC, route);
      expect(game.state.ending).toBe(id);
      // The epilogue is the last thing read, so the validator renders and times it.
      expect(screens.at(-1)!.paragraphs.map((p) => p.key)).toEqual(epilogueKeys(game));
    });
  }

  it('Infinite Loop waits for the fourth 03:33', () => {
    const { game } = simulate(CONTENT, PUZZLE_LOGIC, ROUTES.infinite!);
    expect(game.state.loops.at(-1)!.loop).toBe(4);
    expect(game.state.obsession).toBeGreaterThanOrEqual(10);
  });

  it('however far gone, the first three 03:33s only reset; the fourth keeps you', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    for (let loop = 1; loop <= 3; loop++) {
      g.state.obsession = 12;
      waitUntil(g, 46);
      expect(drainCards(g).map((c) => c.kind), `loop ${loop}`).toEqual(['lightsout']);
      expect(g.state.ending).toBeNull();
    }
    g.state.obsession = 10;
    waitUntil(g, 46);
    expect(drainCards(g).map((c) => c.kind)).toEqual(['lightsout', 'ending']);
    expect(g.state.ending).toBe('infinite');
  });

  it('nine is not ten', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    for (let loop = 1; loop <= 4; loop++) {
      g.state.obsession = 9;
      waitUntil(g, 46);
      drainCards(g);
    }
    expect(g.state.ending).toBeNull();
  });
});

describe('Act I keeps the endings shut', () => {
  it('the priority code is refused until holder 13 has run, so there is nothing to upload', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    g.state.known.push({ id: 'nb.priority', loop: 1, minute: 0 });
    g.state.inventory.push('item.tube.own');
    goTo(g, 'nmr');
    expect(ids(g)).not.toContain('nmr.run');
    g.choose('nmr.load');
    expect(keys(g)).toEqual(expect.arrayContaining(['nmr.load.r', 'nmr.load.code']));
    expect(g.state.inventory).not.toContain('item.spectrum.own');
  });

  it('even holding a spectrum and the printout, the portal won’t take either before Act II', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    g.state.inventory.push('item.spectrum.own', 'item.printout');
    g.choose('office.monitor');
    g.choose('office.submit.own');
    expect(ids(g)).toEqual(['meta:back']);
    g.choose('meta:back');
    g.choose('office.monitor');
    g.choose('office.submit.printout');
    expect(ids(g)).toEqual(['meta:back']);
  });
});

describe('the portal', () => {
  it('a standing fudge keeps the upload out of reach; struck through, it comes back', () => {
    const g = actTwo();
    g.state.inventory.push('item.spectrum.own');
    g.choose('office.process');
    g.choose('office.baseline.fudge');
    g.choose('meta:back');
    g.choose('office.monitor');
    g.choose('office.submit.own');
    expect(ids(g)).toEqual(['meta:back']);
    g.choose('meta:back');
    g.correctFudge('fudge.baseline');
    g.choose('office.monitor');
    g.choose('office.submit.own');
    expect(ids(g)).toEqual(['meta:back', 'office.upload.own']);
    g.choose('office.upload.own');
    expect(g.state.ending).toBe('honest');
    expect(epilogueKeys(g)).toContain('ending.honest.struck');
    expect(epilogueKeys(g)).not.toContain('ending.honest.clean');
  });

  it('an honest upload with nothing ever bent says so', () => {
    const g = actTwo();
    g.state.inventory.push('item.spectrum.own');
    g.choose('office.monitor');
    g.choose('office.submit.own');
    g.choose('office.upload.own');
    expect(epilogueKeys(g)).toContain('ending.honest.clean');
    expect(g.state.display).toEqual([]); // the epilogue is the ending screen's, not the narrative's
  });

  it('a standing fudge keeps the printout out of the portal too', () => {
    const g = actTwo();
    g.state.fudges.push({ id: 'fudge.yield', corrected: false, loop: 1 });
    g.state.inventory.push('item.printout');
    g.choose('office.monitor');
    g.choose('office.submit.printout');
    expect(keys(g)).toContain('office.declare.blocked');
    expect(ids(g)).toEqual(['meta:back']);
    g.choose('meta:back');
    g.correctFudge('fudge.yield');
    g.choose('office.monitor');
    g.choose('office.submit.printout');
    expect(ids(g)).toEqual(['meta:back', 'office.upload.printout']);
  });

  it('the perfect upload remembers her email only if you read it', () => {
    for (const read of [false, true]) {
      const g = actTwo();
      if (read) g.state.known.push({ id: 'nb.email', loop: 2, minute: 0 });
      g.state.inventory.push('item.printout');
      g.choose('office.monitor');
      g.choose('office.submit.printout');
      g.choose('office.upload.printout');
      expect(g.state.ending).toBe('perfect');
      expect(epilogueKeys(g).includes('ending.perfect.her')).toBe(read);
    }
  });
});

describe('fire exit B', () => {
  it('in Act I the door opens but you don’t go', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    goTo(g, 'stairs');
    waitUntil(g, 34);
    g.choose('stairs.exitb.open');
    expect(ids(g)).not.toContain('stairs.leave');
    g.choose('stairs.leave.cant');
    expect(keys(g)[0]).toBe('stairs.leave.notyet');
    expect(keys(g)).not.toContain('stairs.leave.cant');
    expect(g.state.ending).toBeNull();
    // The door has swung shut behind the words; push it again and it asks again.
    expect(g.state.scene).toBe('stairs.hub');
    g.choose('stairs.exitb.open');
    expect(ids(g)).toEqual(['stairs.door.close', 'stairs.leave.cant']);
  });

  it('too far gone, you can’t make yourself leave', () => {
    const g = actTwo();
    g.state.obsession = 5;
    goTo(g, 'stairs');
    waitUntil(g, 34);
    g.choose('stairs.exitb.open');
    expect(ids(g)).not.toContain('stairs.leave');
    expect(ids(g)).toEqual(['stairs.door.close', 'stairs.leave.cant']);
    g.choose('stairs.leave.cant');
    expect(keys(g)[0]).toBe('stairs.leave.cant');
    expect(keys(g)).not.toContain('stairs.leave.notyet');
    expect(g.state.scene).toBe('stairs.hub');
    expect(g.state.ending).toBeNull();
  });

  it('four is still not too far', () => {
    const g = actTwo();
    g.state.obsession = 4;
    goTo(g, 'stairs');
    waitUntil(g, 34);
    g.choose('stairs.exitb.open');
    expect(ids(g)).toEqual(['stairs.door.close', 'stairs.leave']);
  });

  it('otherwise you step out, and the rain log comes with you if you found it', () => {
    const g = actTwo();
    g.state.known.push({ id: 'nb.rainlog', loop: 2, minute: 0 });
    goTo(g, 'stairs');
    waitUntil(g, 34);
    g.choose('stairs.exitb.open');
    expect(ids(g)).toContain('stairs.leave');
    g.choose('stairs.leave');
    expect(g.state.ending).toBe('clocking');
    expect(drainCards(g)).toEqual([{ kind: 'ending', ending: 'clocking' }]);
    expect(epilogueKeys(g)).toContain('ending.clocking.rain');
  });

  it('without the rain log, the epilogue has no rain line', () => {
    const g = actTwo();
    goTo(g, 'stairs');
    waitUntil(g, 34);
    g.choose('stairs.exitb.open');
    g.choose('stairs.leave');
    expect(g.state.ending).toBe('clocking');
    expect(epilogueKeys(g)).not.toContain('ending.clocking.rain');
  });

  it('the step out is only in the doorway: push the bar while the bins go out, or the door stays shut', () => {
    const g = actTwo();
    goTo(g, 'stairs');
    waitUntil(g, 34);
    expect(ids(g)).not.toContain('stairs.leave');
    g.choose('stairs.exitb.open');
    expect(ids(g)).toEqual(['stairs.door.close', 'stairs.leave']); // no waiting in the doorway, no wandering off
    g.choose('stairs.door.close');
    expect(g.state.scene).toBe('stairs.hub');
    waitUntil(g, 37);
    expect(ids(g)).not.toContain('stairs.exitb.open');
    expect(ids(g)).not.toContain('stairs.leave');
  });

  it('pushed late in the window, the doorway still lets you go', () => {
    const g = actTwo();
    goTo(g, 'stairs');
    waitUntil(g, 36); // the last minute the bar gives
    expect(ids(g)).toContain('stairs.exitb.open');
    g.choose('stairs.exitb.open'); // 03:23 → 03:24, past the window
    expect(g.state.minute).toBe(37);
    g.choose('stairs.leave');
    expect(g.state.ending).toBe('clocking');
  });
});

describe('the call point', () => {
  const keeps = (g: Game) => g.state.known.push({ id: 'nb.keeps', loop: g.state.loop, minute: 0 });
  const looked = (g: Game) => g.state.known.push({ id: 'nb.callpoint', loop: g.state.loop, minute: 0 });

  it('offers the glass only once the door log has shown you what the building keeps, and you have looked at the box', () => {
    const g = actTwo();
    goTo(g, 'stairs');
    expect(ids(g)).not.toContain('stairs.glass');
    keeps(g); // the log alone isn't enough…
    expect(ids(g)).not.toContain('stairs.glass');
    g.choose('stairs.callpoint'); // …until you have looked at the box
    expect(ids(g)).toContain('stairs.glass');
  });

  it('looking at the box alone isn’t enough either', () => {
    const g = actTwo();
    goTo(g, 'stairs');
    g.choose('stairs.callpoint');
    expect(ids(g)).not.toContain('stairs.glass');
  });

  it('a thumb on the glass can still be taken away, and that is the first choice; breaking it gets everybody out, at no cost', () => {
    const g = actTwo();
    keeps(g);
    looked(g);
    goTo(g, 'stairs');
    const before = g.state.minute;
    g.choose('stairs.glass');
    expect(g.state.scene).toBe('stairs.alarm');
    // The way back first, so keyboard focus and key 1 land on it; no waiting with your thumb on it.
    expect(g.choices().map((c) => [c.id, c.cost])).toEqual([
      ['stairs.alarm.leave', 0],
      ['stairs.alarm.break', 0],
    ]);
    g.choose('stairs.alarm.leave');
    expect(g.state.scene).toBe('stairs.hub');
    expect(g.state.ending).toBeNull();
    g.choose('stairs.glass');
    g.choose('stairs.alarm.break');
    expect(g.state.ending).toBe('fire');
    expect(g.state.minute).toBe(before);
    expect(drainCards(g)).toEqual([{ kind: 'ending', ending: 'fire' }]);
    expect(epilogueKeys(g)).toEqual(EPILOGUES.fire.map((p) => p.key));
  });

  it('still there at 03:32, and breaking it then is the ending, not the dark', () => {
    const g = actTwo();
    keeps(g);
    looked(g);
    goTo(g, 'stairs');
    waitUntil(g, 45);
    expect(g.state.minute).toBe(45);
    g.choose('stairs.glass');
    g.choose('stairs.alarm.break');
    expect(g.state.ending).toBe('fire');
    expect(drainCards(g).map((c) => c.kind)).toEqual(['ending']);
  });

  it('and in Act III', () => {
    const g = actTwo();
    g.state.act = 3;
    keeps(g);
    looked(g);
    goTo(g, 'stairs');
    expect(ids(g)).toContain('stairs.glass');
  });

  it('not in Act I: even having read the door log, before your first 03:33 the box stays a box', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    goTo(g, 'stairs');
    expect(ids(g)).toContain('stairs.terminal'); // the log can be read early
    keeps(g);
    g.choose('stairs.callpoint');
    expect(ids(g)).not.toContain('stairs.glass');
  });

  it('not in Act I’s later loops either: a lived 03:33 without the three puzzles keeps you in Act I', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    waitUntil(g, 46);
    drainCards(g);
    expect(g.state.loop).toBe(2);
    expect(g.state.act).toBe(1);
    keeps(g);
    looked(g);
    goTo(g, 'stairs');
    expect(ids(g)).not.toContain('stairs.glass');
  });
});

describe('the dark run at 03:33', () => {
  const HER = ['yc.email', 'yc.raw', 'yc.flask', 'yc.tube', 'yc.chirp', 'yc.mug', 'yc.desk', 'yc.sop', 'yc.notebook'];
  /** Act III, her tube in holder 13, waiting in the NMR suite for 03:33; each option takes one thing away. */
  function inTheDark(
    o: { ups?: boolean; fudge?: boolean | 'corrected'; proved?: boolean; fragments?: string[]; at?: LocationId; obsessed?: boolean } = {},
  ): Game {
    const g = new Game(CONTENT);
    drainCards(g);
    g.state.solved.push('tlc', 'glovebox', 'console');
    waitUntil(g, 46);
    drainCards(g);
    for (const id of ['nb.raw', 'nb.email']) g.state.known.push({ id, loop: g.state.loop, minute: 0 });
    g.state.flags.push('perfect.offered', 'ran.own');
    waitUntil(g, 46);
    drainCards(g);
    expect(g.state.act).toBe(3);
    g.state.fragments.push(...(o.fragments ?? HER));
    if (o.proved ?? true) g.state.known.push({ id: 'nb.fabrication', loop: g.state.loop, minute: 0 });
    if (o.fudge) {
      g.state.fudges.push({ id: 'fudge.yield', corrected: o.fudge === 'corrected', loop: 1 });
      g.state.fudgesEver += 1;
    }
    if (o.obsessed) {
      // Late enough, and chased hard enough, for 03:33 to keep you (Infinite Loop).
      g.state.loop = 6;
      g.state.obsession = 12;
    }
    goTo(g, 'nmr');
    g.state.inventory.push('item.tube.dark');
    g.choose('nmr.holder13');
    expect(g.state.inventory).not.toContain('item.tube.dark');
    if (o.ups ?? true) g.state.lflags.push('ups.armed');
    if (o.at) goTo(g, o.at);
    waitUntil(g, 46);
    return g;
  }
  const known = (g: Game) => g.state.known.map((k) => k.id);

  it('with everything in place, the lights go out and the peak match opens in the dark; finding her peak is Dark Reaction', () => {
    const g = inTheDark();
    expect(g.state.puzzle).toBe('peakmatch');
    expect(g.state.darkRun).toBe(true);
    const loop = g.state.loop;
    expect(drainCards(g)).toEqual([expect.objectContaining({ kind: 'lightsout', dark: true })]);
    g.completePuzzle({ solved: true, minutes: 0 });
    expect(g.state.ending).toBe('dark');
    expect(g.state.loop).toBe(loop); // no 02:47 this time
    expect(drainCards(g)).toEqual([{ kind: 'ending', ending: 'dark' }]);
    expect(epilogueKeys(g)).toEqual(EPILOGUES.dark.map((p) => p.key));
  });

  it('stepping away from the peak in the dark lets the night end as usual', () => {
    const g = inTheDark();
    const loop = g.state.loop;
    g.completePuzzle({ solved: false, minutes: 0 });
    expect(g.state.ending).toBeNull();
    expect(g.state.loop).toBe(loop + 1);
    expect(g.state.minute).toBe(0);
    expect(g.state.darkRun).toBe(false);
  });

  it('without the UPS armed the console goes out too: no run, no page, just 02:47', () => {
    const g = inTheDark({ ups: false });
    expect(g.state.puzzle).toBeNull();
    expect(g.state.minute).toBe(0);
    expect(keys(g)[0]).toBe('lo.dark.nopower');
    expect(known(g).filter((k) => ['ph.pages', 'ph.figure', 'ph.her'].includes(k))).toEqual([]);
  });

  it('a standing fudge: only noise, and a page in your hand about those pages', () => {
    const g = inTheDark({ fudge: true });
    expect(g.state.puzzle).toBeNull();
    expect(keys(g)[0]).toBe('lo.dark.noise');
    expect(known(g)).toContain('ph.pages');
  });

  it('Figure 3 not yet proved: only noise, and a page saying so', () => {
    const g = inTheDark({ proved: false });
    expect(g.state.puzzle).toBeNull();
    expect(known(g)).toContain('ph.figure');
  });

  it('not knowing her well enough: eight traces are not nine, and nine without her email are not enough', () => {
    const eight = inTheDark({ fragments: HER.slice(0, 8) });
    expect(eight.state.puzzle).toBeNull();
    expect(known(eight)).toContain('ph.her');
    const noEmail = inTheDark({ fragments: [...HER.slice(1), 'yc.box', 'yc.badge'] });
    expect(noEmail.state.fragments).toHaveLength(10);
    expect(noEmail.state.puzzle).toBeNull();
    expect(known(noEmail)).toContain('ph.her');
  });

  it('her tube in holder 13 means nothing if you are somewhere else at 03:33', () => {
    const g = inTheDark({ at: 'office' });
    expect(g.state.puzzle).toBeNull();
    expect(g.state.minute).toBe(0);
    expect(keys(g)).not.toContain('lo.dark.noise');
  });

  it('holder 13 takes only her dark tube, and only in Act III', () => {
    const g = actTwo();
    g.state.inventory.push('item.tube.dark');
    goTo(g, 'nmr');
    expect(ids(g)).not.toContain('nmr.holder13');
    // Act III without the tube: nothing to load.
    const three = inTheDark();
    drainCards(three);
    three.completePuzzle({ solved: false, minutes: 0 });
    drainCards(three);
    goTo(three, 'nmr');
    expect(three.state.act).toBe(3);
    expect(ids(three)).not.toContain('nmr.holder13');
    three.state.inventory.push('item.tube.dark');
    expect(ids(three)).toContain('nmr.holder13');
  });

  it('the rules go in order: no power before the pages, the pages before Figure 3, Figure 3 before her', () => {
    const noPower = inTheDark({ ups: false, fudge: true, proved: false, fragments: HER.slice(0, 8) });
    expect(keys(noPower)[0]).toBe('lo.dark.nopower');
    expect(known(noPower).filter((k) => k.startsWith('ph.') && ['ph.pages', 'ph.figure', 'ph.her'].includes(k))).toEqual([]);
    const pages = inTheDark({ fudge: true, proved: false, fragments: HER.slice(0, 8) });
    expect(known(pages)).toContain('ph.pages');
    expect(known(pages)).not.toContain('ph.figure');
    expect(known(pages)).not.toContain('ph.her');
    const figure = inTheDark({ proved: false, fragments: HER.slice(0, 8) });
    expect(known(figure)).toContain('ph.figure');
    expect(known(figure)).not.toContain('ph.her');
  });

  it('a fudge struck through no longer stands in the way', () => {
    const g = inTheDark({ fudge: 'corrected' });
    expect(g.state.puzzle).toBe('peakmatch');
    expect(known(g)).not.toContain('ph.pages');
  });

  it('nine traces are not enough without her flask', () => {
    const g = inTheDark({ fragments: [...HER.filter((f) => f !== 'yc.flask'), 'yc.box'] });
    expect(g.state.fragments).toHaveLength(9);
    expect(g.state.puzzle).toBeNull();
    expect(known(g)).toContain('ph.her');
  });

  it('a failed run writes its page after you come to, and a second failure for the same reason shows it again', () => {
    const g = inTheDark({ proved: false });
    const first = keys(g);
    expect(first[0]).toBe('lo.dark.noise');
    expect(first.indexOf('ph.figure.body')).toBeGreaterThan(first.indexOf('loop.start.act3'));
    expect(first.filter((k) => k === 'ui.phantom.notice')).toHaveLength(1);
    drainCards(g);
    goTo(g, 'nmr');
    g.state.inventory.push('item.tube.dark');
    g.choose('nmr.holder13');
    g.state.lflags.push('ups.armed');
    waitUntil(g, 46);
    const again = keys(g);
    expect(again.slice(0, 2)).toEqual(['lo.dark.noise', 'ph.figure.body']);
    expect(g.state.display[1]?.style).toBe('phantom');
    // Shown once, and not written again (02:47 may bring other pages of its own).
    expect(again.filter((k) => k === 'ph.figure.body')).toHaveLength(1);
    expect(known(g).filter((k) => k === 'ph.figure')).toHaveLength(1);
  });

  it('stepping away keeps what you saw: the dark comes in close, then 02:47', () => {
    const g = inTheDark();
    g.completePuzzle({ solved: false, minutes: 0 });
    expect(keys(g).slice(0, 2)).toEqual(['puzzle.peakmatch.left', 'loop.start.act3']);
  });

  it('a solved dark run beats Infinite Loop; stepping away from it does not', () => {
    const solved = inTheDark({ obsessed: true });
    expect(solved.state.puzzle).toBe('peakmatch');
    solved.completePuzzle({ solved: true, minutes: 0 });
    expect(solved.state.ending).toBe('dark');
    const left = inTheDark({ obsessed: true });
    left.completePuzzle({ solved: false, minutes: 0 });
    expect(left.state.ending).toBe('infinite');
  });

  it('once her tube is in, the room no longer says holder 13 is empty', () => {
    const g = inTheDark({ at: 'cold' });
    // Back to the NMR suite next loop with the tube loaded again, and before 03:33 look round.
    drainCards(g);
    goTo(g, 'nmr');
    expect(keys(g)).toContain('nmr.hub.act3');
    g.state.inventory.push('item.tube.dark');
    g.choose('nmr.holder13');
    goTo(g, 'cold');
    goTo(g, 'nmr');
    expect(keys(g)).toContain('nmr.hub.act3.loaded');
    expect(keys(g)).not.toContain('nmr.hub.act3');
    g.choose('nmr.carousel');
    expect(keys(g)[0]).toBe('nmr.carousel.loaded.r');
    g.choose('nmr.console.again');
    expect(keys(g)[0]).toBe('nmr.console.loaded.r');
  });
});

describe('epilogues', () => {
  const words = (key: string) => t(key, { clock: '03:30' }, 'en').replace(/\*/g, '').split(/\s+/).filter(Boolean).length;
  const hanzi = (key: string) => [...t(key, { clock: '03:30' }, 'zh-Hant-TW')].filter((c) => /\p{Script=Han}/u.test(c)).length;

  it('all six are written, and each runs 500–900 words in English however its optional lines fall, with a 繁中 telling of matching length', () => {
    expect(Object.keys(EPILOGUES).sort()).toEqual(['clocking', 'dark', 'fire', 'honest', 'infinite', 'perfect']);
    for (const [id, epilogue] of Object.entries(EPILOGUES)) {
      const always = epilogue.filter((p) => !p.if);
      const optional = epilogue.filter((p) => p.if).map((p) => words(p.key));
      // Honest Noise has an either/or pair; the others have at most one optional paragraph.
      const either = id === 'honest';
      const base = always.reduce((n, p) => n + words(p.key), 0);
      const shortest = base + (either ? Math.min(...optional) : 0);
      const longest = base + (either ? Math.max(...optional) : optional.reduce((a, b) => a + b, 0));
      expect(shortest, id).toBeGreaterThanOrEqual(500);
      expect(longest, id).toBeLessThanOrEqual(900);
      // 500 words at 230 wpm is about 760 characters at 350 cpm.
      expect(always.reduce((n, p) => n + hanzi(p.key), 0), id).toBeGreaterThanOrEqual(700);
      for (const p of epilogue) {
        for (const locale of ['en', 'zh-Hant-TW'] as const) expect(t(p.key, { clock: '03:30' }, locale), `${p.key} ${locale}`).not.toMatch(/\[\[|\{/);
      }
    }
  });

  it('the endings in play are told by those epilogues', () => {
    for (const ending of CONTENT.endings) expect(ending.epilogue).toBe(EPILOGUES[ending.id]);
  });
});
