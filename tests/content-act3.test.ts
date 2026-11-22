/**
 * Act III, part A: the night changes. The dark run itself arrives with the
 * Act III puzzles; this covers the act's opening, the rooms and what she left.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { Card, LocationId } from '../src/engine/types.ts';

function drainCards(g: Game): Card[] {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
}
const keys = (g: Game) => g.state.display.map((p) => p.key);
const ids = (g: Game) => g.choices().map((c) => c.id);
const known = (g: Game) => g.state.known.map((k) => k.id);
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
function endLoop(g: Game): Card[] {
  if (!g.scene.hub) g.choose('meta:back');
  waitUntil(g, 46);
  return drainCards(g);
}
const learnt = (g: Game, ...entries: string[]) => {
  for (const id of entries) g.state.known.push({ id, loop: g.state.loop, minute: g.state.minute });
};
/** Act II with everything Act III asks for: her raw data, her email, the night's offer. */
function readyForThree(): Game {
  const g = new Game(CONTENT);
  drainCards(g);
  g.state.solved.push('tlc', 'glovebox', 'console');
  endLoop(g);
  expect(g.state.act).toBe(2);
  learnt(g, 'nb.raw', 'nb.email');
  g.state.flags.push('perfect.offered');
  return g;
}

describe('Act III opens', () => {
  it('at the 02:47 after her raw data, her email and the night’s offer', () => {
    const g = readyForThree();
    const cards = endLoop(g);
    expect(cards.map((c) => c.kind)).toEqual(['lightsout', 'act']);
    expect(cards[1]).toEqual({ kind: 'act', act: 3 });
    expect(g.state.act).toBe(3);
    expect(known(g)).toContain('ph.port4');
    expect(keys(g)).toContain('loop.start.act3');
    expect(keys(g)).toContain('office.hub.act3');
    expect(keys(g)).not.toContain('office.hub.act2');
  });

  it('not while any of the three is missing', () => {
    for (const missing of ['nb.raw', 'nb.email', 'perfect.offered']) {
      const g = readyForThree();
      if (missing === 'perfect.offered') g.state.flags = g.state.flags.filter((f) => f !== missing);
      else g.state.known = g.state.known.filter((k) => k.id !== missing);
      endLoop(g);
      expect(g.state.act, missing).toBe(2);
    }
  });

  it('every room reads differently in Act III', () => {
    const g = readyForThree();
    endLoop(g);
    for (const [loc, key] of [
      ['synth', 'synth.hub.act3'],
      ['glovebox', 'glovebox.hub.act3'],
      ['stairs', 'stairs.hub.act3'],
      ['nmr', 'nmr.hub.act3'],
      ['cold', 'cold.hub.act3'],
      ['roof', 'roof.hub.act3'],
    ] as const) {
      goTo(g, loc);
      expect(keys(g), loc).toContain(key);
      expect(keys(g).some((k) => k === `${loc}.hub.act1`)).toBe(false);
    }
  });

  it('a page about the booking, two loops into Act III', () => {
    const g = readyForThree();
    endLoop(g);
    endLoop(g);
    expect(known(g)).not.toContain('ph.booking');
    endLoop(g);
    expect(known(g)).toContain('ph.booking');
  });
});

describe('what she left', () => {
  it('the flask on port 4, and foil from the drawer', () => {
    const g = readyForThree();
    endLoop(g);
    goTo(g, 'synth');
    g.choose('synth.port4');
    g.choose('synth.foil');
    expect(ids(g)).not.toContain('synth.foil');
    expect(g.state.fragments).toContain('yc.flask');
    expect(g.state.inventory).toContain('item.foil');
    expect(known(g)).toContain('nb.port4');
  });

  it('her tube, but only for someone who knows the purge', () => {
    const g = readyForThree();
    endLoop(g);
    goTo(g, 'glovebox');
    expect(ids(g)).toContain('glovebox.mini.open');
    expect(ids(g)).not.toContain('glovebox.mini');
    g.choose('glovebox.mini.open');
    expect(g.state.inventory).toContain('item.tube.jy');
    expect(g.state.fragments).toContain('yc.tube');
    expect(ids(g)).not.toContain('glovebox.mini.open');

    const h = readyForThree();
    endLoop(h);
    h.state.solved = h.state.solved.filter((p) => p !== 'glovebox');
    goTo(h, 'glovebox');
    expect(ids(h)).not.toContain('glovebox.mini.open');
    h.choose('glovebox.mini.shut');
    expect(keys(h)).toEqual(['glovebox.mini.shut.r']);
  });

  it('Tom’s Post-it, and a chirp that has become a rhythm', () => {
    const g = readyForThree();
    endLoop(g);
    goTo(g, 'nmr');
    g.choose('nmr.compressor');
    expect(keys(g)).toEqual(['nmr.compressor.act3']);
    g.choose('nmr.postit');
    expect(g.state.fragments).toContain('yc.chirp');
  });

  it('none of it before Act III', () => {
    const g = readyForThree();
    goTo(g, 'synth');
    expect(ids(g)).not.toContain('synth.port4');
    goTo(g, 'nmr');
    expect(ids(g)).not.toContain('nmr.postit');
    g.choose('nmr.compressor');
    expect(keys(g)).toEqual(['nmr.compressor.r']);
  });
});

describe('second looks and Act III looks (#69)', () => {
  /** Each Act III look: where it is, and the key it shows. */
  const LOOKS: Array<[LocationId, string]> = [
    ['cold', 'cold.frost'],
    ['office', 'office.ceiling'],
    ['stairs', 'stairs.signs'],
    ['roof', 'roof.cranes'],
  ];

  it('the Act III looks are there only in Act III, and each says what the room now shows', () => {
    const two = readyForThree();
    for (const [where, id] of LOOKS) {
      if (two.state.location !== where) goTo(two, where);
      expect(ids(two), id).not.toContain(id);
    }
    const three = readyForThree();
    endLoop(three);
    expect(three.state.act).toBe(3);
    for (const [where, id] of LOOKS) {
      if (three.state.location !== where) goTo(three, where);
      expect(ids(three), id).toContain(id);
      three.choose(id);
      expect(keys(three)[0]).toBe(`${id}.r`);
      if (!three.scene.hub) three.choose('meta:back');
    }
    expect(known(three)).toContain('nb.frost');
  });

  it('rooms that change in Act III say so when you look again', () => {
    const g = readyForThree();
    endLoop(g);
    goTo(g, 'cold');
    g.choose('cold.dewar');
    expect(keys(g)[0]).toBe('cold.dewar.act3');
    goTo(g, 'stairs');
    g.choose('stairs.window');
    expect(keys(g)[0]).toBe('stairs.window.act3');
    g.choose('stairs.crossword');
    expect(keys(g)[0]).toBe('stairs.crossword.act3');
    goTo(g, 'roof');
    g.choose('roof.priya');
    expect(keys(g).slice(0, 2)).toEqual(['roof.priya.act3.1', 'roof.priya.act3.2']);
  });

  it('Priya’s messages follow the act, and the late line still comes when you are chasing', () => {
    const one = new Game(CONTENT);
    drainCards(one);
    goTo(one, 'roof');
    one.choose('roof.priya');
    expect(keys(one).slice(0, 2)).toEqual(['roof.priya.r.1', 'roof.priya.r.2']);
    const two = readyForThree();
    two.state.obsession = 4;
    goTo(two, 'roof');
    two.choose('roof.priya');
    expect(keys(two)).toEqual(expect.arrayContaining(['roof.priya.act2.1', 'roof.priya.act2.2', 'roof.priya.r.late']));
    expect(keys(two)).not.toContain('roof.priya.r.1');
  });

  it('her mug reads differently once you have found her rain log', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    g.choose('office.desk7');
    g.choose('office.mug');
    expect(keys(g)).not.toContain('office.mug.rain');
    learnt(g, 'nb.rainlog');
    endLoop(g);
    g.choose('office.desk7');
    g.choose('office.mug');
    expect(keys(g)).toContain('office.mug.rain');
  });
});
