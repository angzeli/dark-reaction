/**
 * Act II as written: the real content driven through the engine. State is
 * set up directly where an earlier act would otherwise have to be replayed.
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
const learnt = (g: Game, ...entries: string[]) => {
  for (const id of entries) g.state.known.push({ id, loop: g.state.loop, minute: g.state.minute });
};
/** A game in Act II, at 02:47, with the Act I puzzles solved. */
function actTwo(): Game {
  const g = new Game(CONTENT);
  drainCards(g);
  g.state.solved.push('tlc', 'glovebox', 'console');
  const cards = endLoop(g);
  expect(cards.map((c) => c.kind)).toEqual(['lightsout', 'act']);
  expect(g.state.act).toBe(2);
  return g;
}

describe('Act II opens', () => {
  it('at the 02:47 after the three Act I puzzles, with a page about doors', () => {
    const g = actTwo();
    expect(known(g)).toContain('ph.door');
    expect(keys(g)).toContain('office.hub.act2');
    expect(keys(g)).not.toContain('office.hub.act1');
  });

  it('not before: two puzzles are not enough', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    g.state.solved.push('tlc', 'glovebox');
    expect(endLoop(g).map((c) => c.kind)).toEqual(['lightsout']);
    expect(g.state.act).toBe(1);
  });
});

describe('Dan’s office', () => {
  it('is locked until 03:15, then holds her email, her box, the photo and the code', () => {
    const g = actTwo();
    goTo(g, 'pi');
    expect(g.state.scene).toBe('pi.door');
    g.choose('pi.knock');
    goTo(g, 'office');
    waitUntil(g, 27); // the corridor clicks at 03:15 if you're on Level 4
    goTo(g, 'pi');
    expect(g.state.scene).toBe('pi.hub');
    g.choose('pi.email');
    g.choose('pi.box');
    expect(g.state.scene).toBe('pi.box');
    expect(ids(g)).not.toContain('meta:back');
    g.choose('pi.drafts');
    g.choose('pi.box.close');
    expect(g.state.scene).toBe('pi.hub'); // still inside, though the door has locked again
    g.choose('pi.photo');
    g.choose('pi.sticky');
    g.choose('pi.paper');
    expect(g.state.minute).toBeGreaterThanOrEqual(31);
    expect(g.state.fragments).toEqual(expect.arrayContaining(['yc.email', 'yc.box', 'yc.photo']));
    expect(known(g)).toEqual(expect.arrayContaining(['nb.email', 'nb.drafts', 'nb.photo', 'nb.priority', 'nb.framed']));
  });

  it('opens for you if you wait at the door: 03:15 comes to you, too (#101)', () => {
    const g = actTwo();
    goTo(g, 'pi');
    expect(g.state.scene).toBe('pi.door');
    expect(ids(g)).not.toContain('pi.enter');
    waitUntil(g, 28);
    expect(g.state.minute).toBe(28); // the lock cuts the wait short
    expect(keys(g)).toContain('ev.unlock.door');
    expect(ids(g)[0]).toBe('pi.enter');
    g.choose('pi.enter');
    expect(g.state.scene).toBe('pi.hub');
    expect(g.state.minute).toBe(28);
  });

  it('and the way in is only there while the porter is cleaning', () => {
    const g = actTwo();
    goTo(g, 'pi');
    waitUntil(g, 31);
    expect(g.state.scene).toBe('pi.door');
    expect(ids(g)).not.toContain('pi.enter');
  });

  it('you hear it unlock from anywhere on Level 4', () => {
    const g = actTwo();
    goTo(g, 'synth');
    waitUntil(g, 28);
    expect(keys(g)).toContain('ev.unlock');
  });

  it('and it unlocks once a night, seen from the side of the door you are on (#142)', () => {
    // Heard from the lab, then walked over: straight in, with no second click at a door you're already through.
    const lab = actTwo();
    goTo(lab, 'synth');
    waitUntil(lab, 28);
    expect(keys(lab)).toContain('ev.unlock');
    goTo(lab, 'pi');
    expect(lab.state.scene).toBe('pi.hub');
    expect(keys(lab)).not.toContain('ev.unlock.door');
    // Seen at the door, then off down the corridor: no second click there either.
    const door = actTwo();
    goTo(door, 'pi');
    waitUntil(door, 28);
    expect(keys(door)).toContain('ev.unlock.door');
    goTo(door, 'synth');
    expect(keys(door)).not.toContain('ev.unlock');
    // Up the stairs after it opened (off Level 4, so nothing heard): the room, and no door-side line inside it.
    const late = actTwo();
    goTo(late, 'stairs');
    waitUntil(late, 28);
    goTo(late, 'pi');
    expect(late.state.minute).toBeLessThan(31);
    expect(late.state.scene).toBe('pi.hub');
    expect(keys(late)).not.toContain('ev.unlock.door');
  });
});

describe('the night’s offer', () => {
  it('the code runs your sample: noise. At 03:25 the printer offers a perfect one', () => {
    const g = actTwo();
    learnt(g, 'nb.priority');
    g.state.inventory.push('item.tube.own');
    goTo(g, 'nmr');
    expect(ids(g)).not.toContain('nmr.load');
    g.choose('nmr.run');
    expect(g.state.inventory).toContain('item.spectrum.own');
    expect(g.state.flags).toContain('ran.own');
    waitUntil(g, 38);
    expect(keys(g)).toContain('ev.perfect.nmr');
    expect(g.state.flags).toContain('perfect.offered');
    g.choose('nmr.printout');
    expect(g.state.inventory).toContain('item.printout');
    expect(known(g)).toContain('nb.printout');
    // Taken at 03:25, in your hand at 03:26: 03:33 is seven minutes away (#147).
    expect(g.state.display.find((p) => p.key === 'perfect.describe')!.params).toEqual({ n: 7 });
    expect(g.state.obsession).toBe(1);
  });

  it('nothing is printed for someone who hasn’t run their own sample', () => {
    const g = actTwo();
    goTo(g, 'nmr');
    waitUntil(g, 40);
    expect(g.state.flags).not.toContain('perfect.offered');
    expect(ids(g)).not.toContain('nmr.printout');
  });

  it('at your desk it arrives by email instead', () => {
    const g = actTwo();
    g.state.flags.push('ran.own');
    waitUntil(g, 38);
    expect(keys(g)).toContain('ev.perfect.office');
    g.choose('office.print');
    expect(g.state.inventory).toContain('item.printout');
  });
});

describe('your spectrum and the portal', () => {
  it('a bent integral stops the declaration; struck through, the box can be ticked', () => {
    const g = actTwo();
    g.state.inventory.push('item.spectrum.own');
    g.choose('office.process');
    expect(ids(g)).toEqual(['office.process.honest', 'office.baseline.fudge', 'office.integral.fudge', 'office.reprocess', 'office.stare', 'meta:back']);
    g.choose('office.integral.fudge');
    expect(ids(g)).not.toContain('office.integral.fudge');
    g.choose('meta:back');
    g.choose('office.monitor');
    g.choose('office.submit.own');
    expect(keys(g)).toEqual(['office.declare.own.text', 'office.declare.blocked']);
    g.choose('meta:back');
    expect(g.correctFudge('fudge.integral')).toBe(true);
    g.choose('office.monitor');
    g.choose('office.submit.own');
    expect(keys(g)).toEqual(['office.declare.own.text', 'office.declare.clear']);
  });

  it('her microSD: real, slow, hers', () => {
    const g = actTwo();
    g.state.inventory.push('item.microsd');
    g.choose('office.microsd');
    expect(g.state.fragments).toContain('yc.raw');
    expect(known(g)).toContain('nb.raw');
  });
});

describe('rest, obsession and the doors', () => {
  it('chasing raises obsession, loops that only chase add one more, and at 4 the pages start', () => {
    const g = actTwo();
    learnt(g, 'nb.priority');
    g.state.inventory.push('item.tube.own');
    g.state.flags.push('ran.own');
    goTo(g, 'nmr');
    g.choose('nmr.run');
    g.choose('nmr.rerun');
    goTo(g, 'office');
    g.choose('office.process');
    g.choose('office.reprocess');
    g.choose('office.stare');
    expect(g.state.obsession).toBe(3);
    endLoop(g);
    expect(g.state.obsession).toBe(4);
    expect(known(g)).toContain('ph.decay');
  });

  it('the stairs and the roof let you rest; Priya notices when you’re far gone', () => {
    const g = actTwo();
    g.state.obsession = 5;
    goTo(g, 'stairs');
    g.choose('stairs.radio');
    goTo(g, 'roof');
    g.choose('roof.priya');
    expect(keys(g)).toContain('roof.priya.r.late');
    g.choose('roof.rain');
    expect(g.state.obsession).toBe(2);
    expect(g.state.restedThisLoop).toBe(true);
  });

  it('fire exit B gives only while the bins go out; the main entrance never does', () => {
    const g = actTwo();
    goTo(g, 'stairs');
    g.choose('stairs.entrance');
    g.choose('stairs.exitb');
    expect(keys(g)).toContain('stairs.exitb.r');
    waitUntil(g, 34);
    expect(keys(g)).toContain('ev.bins');
    expect(ids(g)).toContain('stairs.exitb.open');
    g.choose('stairs.exitb.open');
    expect(known(g)).toEqual(expect.arrayContaining(['nb.entrance', 'nb.exitb']));
    expect(g.state.scene).toBe('stairs.door');
    g.choose('stairs.door.close');
    waitUntil(g, 37);
    expect(ids(g)).not.toContain('stairs.exitb.open');
  });

  it('a page about radium, three loops into Act II, if you found her notebook but not its meaning', () => {
    const g = actTwo();
    g.state.usedEver.push('pi.box');
    endLoop(g);
    endLoop(g);
    expect(known(g)).not.toContain('ph.radium');
    endLoop(g);
    expect(known(g)).toContain('ph.radium');
  });
});

describe('the NMR console after it is solved (#86)', () => {
  it('stays in the room: checking the queue can be done again, and again', () => {
    const g = actTwo();
    goTo(g, 'nmr');
    for (let i = 0; i < 2; i++) {
      expect(ids(g)).toContain('nmr.console.again');
      g.choose('nmr.console.again');
      expect(keys(g)[0]).toBe('nmr.console.again.r');
    }
    expect(ids(g)).toContain('nmr.console.again');
  });

  it('knowing RIDLEY-4 without your tube, you can still type it, and the console says what is missing', () => {
    const g = actTwo();
    learnt(g, 'nb.priority');
    goTo(g, 'nmr');
    expect(ids(g)).toContain('nmr.code');
    expect(ids(g)).not.toContain('nmr.run');
    g.choose('nmr.code');
    expect(keys(g)[0]).toBe('nmr.code.empty');
    // With the tube in hand, the code runs it instead.
    g.state.inventory.push('item.tube.own');
    expect(ids(g)).toContain('nmr.run');
    expect(ids(g)).not.toContain('nmr.code');
  });

  it('in Act I the code is refused until holder 13 has run', () => {
    const g = new Game(CONTENT);
    drainCards(g);
    learnt(g, 'nb.priority');
    goTo(g, 'nmr');
    g.choose('nmr.code');
    expect(keys(g)[0]).toBe('nmr.code.locked');
  });
});

describe('the last minute before 03:33 (#127)', () => {
  it('a choice that runs into 03:33 marks its page to wait for the player', () => {
    const g = actTwo();
    waitUntil(g, 43);
    g.state.inventory.push('item.microsd');
    g.choose('office.microsd');
    const [card] = drainCards(g);
    expect(card).toMatchObject({ kind: 'lightsout', hold: true });
    if (card?.kind === 'lightsout') expect(card.before.map((p) => p.key)).toContain('office.microsd.r.1');
  });

  it('a wait or a walk into 03:33 goes straight into the dark', () => {
    const wait = actTwo();
    waitUntil(wait, 45);
    wait.choose('meta:wait');
    wait.choose('wait:1');
    expect(drainCards(wait)[0]).not.toHaveProperty('hold');
    const walk = actTwo();
    waitUntil(walk, 44);
    goTo(walk, 'nmr');
    expect(drainCards(walk)[0]).not.toHaveProperty('hold');
  });
});
