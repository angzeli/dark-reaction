/**
 * The engine's part in M7 (#203): anomalies found and kept, a clock that runs on to a minute, events
 * that don't cut a wait short, and conditions on the loop's place in a cycle, on finds and on endings.
 */
import { describe, expect, it } from 'vitest';
import { Game, newGameState } from '../src/engine/engine.ts';
import { checkContent, checkReferences } from '../src/engine/shape.ts';
import { holds } from '../src/engine/conditions.ts';
import { fitToContent } from '../src/save/saves.ts';
import type { Content } from '../src/engine/types.ts';
import { miniContent } from './fixtures/mini.ts';

/** The mini world with a find, a cycle, a sit-until-03:33 and a PA announcement added to the office. */
function world(): Content {
  const c = miniContent();
  const office = c.scenes.find((s) => s.id === 'office.hub')!;
  office.choices.push(
    { id: 'office.doodle', label: 'c.doodle', cost: 1, text: [{ key: 'r.doodle' }], effects: [{ anomaly: 'doodle' }] },
    { id: 'office.poster.0', label: 'c.poster', if: { loopMod: [3, 0] }, text: [{ key: 'r.poster.0' }] },
    { id: 'office.poster.1', label: 'c.poster', if: { loopMod: [3, 1] }, text: [{ key: 'r.poster.1' }] },
    { id: 'office.sit', label: 'c.sit', text: [{ key: 'r.sit' }], effects: [{ timeTo: 40 }] },
  );
  c.events.push({ id: 'ev.pa', minute: 8, ambient: true, if: { at: 'office' }, text: [{ key: 'ev.pa.text' }] });
  c.anomalies.push({ id: 'doodle', trigger: { kind: 'choice', choice: 'office.doodle', setup: {} }, scene: 'office.hub', tone: 'calm', keys: ['r.doodle'] });
  return c;
}
function fresh(c = world()): Game {
  const g = new Game(c);
  while (g.takeCard());
  return g;
}

describe('anomalies', () => {
  it('a choice records its find once, silently, and it stays found across the loop', () => {
    const g = fresh();
    g.choose('office.doodle');
    g.choose('office.doodle');
    expect(g.state.anomalies).toEqual(['doodle']);
    expect(g.state.display.map((p) => p.key)).toEqual(['r.doodle']);
    while (g.state.minute < 46 && !g.busy) g.choose('office.sofa');
    while (g.takeCard());
    expect(g.state.loop).toBe(2);
    expect(g.state.anomalies).toEqual(['doodle']);
  });

  it('discover() takes only registered ids, and says whether the find was new', () => {
    const g = fresh();
    expect(g.discover('doodle')).toBe(true);
    expect(g.discover('doodle')).toBe(false);
    expect(g.discover('not-a-thing')).toBe(false);
    expect(g.state.anomalies).toEqual(['doodle']);
  });

  it('a new game starts with what the gallery has found, without duplicates', () => {
    const s = newGameState(world(), [], { anomalies: ['doodle', 'doodle'], achievements: ['a', 'a', 'b'] });
    expect(s.anomalies).toEqual(['doodle']);
    expect(s.achievements).toEqual(['a', 'b']);
    expect(newGameState(world()).anomalies).toEqual([]);
  });

  it('content that records an unregistered anomaly is refused at load', () => {
    const c = world();
    c.anomalies = [];
    expect(() => checkReferences(c)).toThrow(/unknown anomaly "doodle"/);
  });

  it('a condition that asks about an unregistered anomaly is refused at load, not left never to hold', () => {
    const c = world();
    c.scenes[0]!.choices.push({ id: 'office.typo', label: 'x', text: [{ key: 'x' }], if: { anomaly: 'doodel' } });
    expect(() => checkContent(c)).toThrow(/no anomaly "doodel"/);
  });

  it('a new game and a loaded save keep only the anomalies this build still has', () => {
    expect(newGameState(world(), [], { anomalies: ['doodle', 'gone'] }).anomalies).toEqual(['doodle']);
    const s = newGameState(world());
    s.anomalies = ['doodle', 'gone'];
    expect(fitToContent(s, world())).toBeNull();
    expect(s.anomalies).toEqual(['doodle']);
  });
});

describe('the clock and the cycle', () => {
  it('timeTo runs the clock on to its minute, firing the events on the way', () => {
    const g = fresh();
    g.choose('office.sit');
    expect(g.state.minute).toBe(40);
    expect(g.state.firedEvents).toContain('ev.pa');
  });

  it('timeTo counts the choice’s own cost: it lands on its minute, and says so (#203, from the cold review)', () => {
    const c = world();
    c.scenes[0]!.choices.push({ id: 'office.sitlong', label: 'c.sit', cost: 3, text: [{ key: 'r.sit' }], effects: [{ time: 5 }, { timeTo: 30 }] });
    const g = fresh(c);
    expect(g.choices().find((x) => x.id === 'office.sitlong')!.cost).toBe(30);
    expect(g.choices().find((x) => x.id === 'office.sit')!.cost).toBe(40);
    g.choose('office.sitlong');
    expect(g.state.minute).toBe(30);
  });

  it('timeTo is for choices only, and must be a loop minute', () => {
    const c = world();
    c.events[0]!.effects = [{ timeTo: 40 }];
    expect(() => checkContent(c)).toThrow(/"timeTo" effects are not allowed here/);
    const d = world();
    d.scenes[0]!.choices.push({ id: 'office.forever', label: 'x', text: [{ key: 'x' }], effects: [{ timeTo: 90 }] });
    expect(() => checkReferences(d)).toThrow(/timeTo must be a loop minute/);
  });

  it('an ambient event shows, but doesn’t cut a wait short; an ordinary one still does', () => {
    const g = fresh();
    g.choose('meta:wait');
    g.choose('wait:10');
    expect(g.state.minute).toBe(10);
    expect(g.state.display.map((p) => p.key)).toContain('ev.pa.text');
    const plain = world();
    plain.events.find((e) => e.id === 'ev.pa')!.ambient = false;
    const h = fresh(plain);
    h.choose('meta:wait');
    h.choose('wait:10');
    expect(h.state.minute).toBe(8);
  });

  it('loopMod picks one choice of a cycle each loop', () => {
    const g = fresh();
    const poster = () => g.choices().filter((c) => c.id.startsWith('office.poster')).map((c) => c.id);
    expect(poster()).toEqual(['office.poster.0']);
    g.choose('office.sit');
    while (g.state.minute < 46 && !g.busy) g.choose('office.sofa');
    while (g.takeCard());
    expect(poster()).toEqual(['office.poster.1']);
    g.state.loop = 3;
    expect(poster()).toEqual([]);
    g.state.loop = 4;
    expect(poster()).toEqual(['office.poster.0']);
  });

  it('loopMod is refused unless it is [n ≥ 2, 0 ≤ r < n]', () => {
    for (const bad of [[3, 3], [3, 1, 9], 5, [1, 0]]) {
      const c = world();
      c.scenes[0]!.choices.push({ id: 'office.bad', label: 'x', text: [{ key: 'x' }], if: { loopMod: bad as unknown as [number, number] } });
      expect(() => checkContent(c)).toThrow(/loopMod must be \[n, r\]/);
    }
  });
});

describe('conditions on finds and endings', () => {
  it('anomaly and ended read the state', () => {
    const s = newGameState(world(), [], { anomalies: ['doodle'] });
    expect(holds({ anomaly: 'doodle' }, s)).toBe(true);
    expect(holds({ anomaly: 'other' }, s)).toBe(false);
    expect(holds({ ended: true }, s)).toBe(false);
    s.ending = 'fire';
    expect(holds({ ended: true }, s)).toBe(true);
  });
});

describe('tone tags', () => {
  it('every scene and puzzle must say how it feels: one tone, or one for each act', () => {
    const c = world();
    expect(() => checkContent(c)).not.toThrow();
    (c.scenes[0] as { tone: unknown }).tone = 'jolly';
    expect(() => checkContent(c)).toThrow(/tone must be/);
    const d = world();
    (d.scenes[0] as { tone: unknown }).tone = { 1: 'calm', 2: 'calm' };
    expect(() => checkContent(d)).toThrow(/tone must be/);
    const e = world();
    (e.puzzles[0] as { tone: unknown }).tone = undefined;
    expect(() => checkContent(e)).toThrow(/puzzle demo: tone must be/);
  });
});
