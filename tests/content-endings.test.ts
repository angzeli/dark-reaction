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
    expect(ids(g)).toEqual(['office.upload.own', 'meta:back']);
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
    expect(ids(g)).toEqual(['office.upload.printout', 'meta:back']);
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
    expect(ids(g)).toEqual(['stairs.leave.cant', 'stairs.door.close']);
  });

  it('too far gone, you can’t make yourself leave', () => {
    const g = actTwo();
    g.state.obsession = 5;
    goTo(g, 'stairs');
    waitUntil(g, 34);
    g.choose('stairs.exitb.open');
    expect(ids(g)).not.toContain('stairs.leave');
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
    expect(ids(g)).toEqual(['stairs.leave', 'stairs.door.close']);
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
    expect(ids(g)).toEqual(['stairs.leave', 'stairs.door.close']); // no waiting in the doorway, no wandering off
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
