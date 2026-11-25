/**
 * The rest of the building (docs/HUMOUR.md §7–8, #207): B.05's box and fridge, the PA, and past-you's
 * pencil in the notebook's margins; and Act III, which stays quiet.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { holds } from '../src/engine/conditions.ts';
import { Game } from '../src/engine/engine.ts';
import type { Act, LocationId } from '../src/engine/types.ts';
import { t } from '../src/i18n/i18n.ts';

const keys = (g: Game) => g.state.display.map((p) => p.key);
function at(scene: string, minute: number, act: Act = 1): Game {
  const g = new Game(CONTENT);
  while (g.takeCard());
  g.state.act = act;
  g.state.minute = minute;
  g.state.firedEvents = CONTENT.events.filter((e) => e.minute < minute).map((e) => e.id);
  const def = g.index.scenes.get(scene)!;
  g.state.scene = scene;
  g.state.location = def.location as LocationId;
  return g;
}
const wait = (g: Game, n: 1 | 5 | 10) => {
  g.choose('meta:wait');
  g.choose(`wait:${n}`);
};

describe('B.05', () => {
  it('the −80 has a box nobody has thrown away since 2009, until Act III', () => {
    const g = at('cold.hub', 12);
    g.choose('cold.freezer');
    expect(keys(g)).toEqual(['cold.freezer.r', 'fun.cold.box']);
    const h = at('cold.hub', 12, 3);
    h.choose('cold.freezer');
    expect(keys(h)).toEqual(['cold.freezer.r']);
  });

  it('the fridge marked NO FOOD has a meal deal in it', () => {
    const g = at('cold.hub', 12);
    g.choose('cold.fridge');
    expect(t('fun.cold.fridge')).toContain('meal deal');
    expect(t('fun.cold.fridge', undefined, 'zh-Hant-TW')).toContain('meal deal');
  });
});

describe('the PA', () => {
  it('at 02:55, in a calm room: heard, found, and the wait goes on', () => {
    const g = at('stairs.hub', 5);
    wait(g, 5);
    expect(g.state.minute).toBe(10);
    expect(keys(g)).toContain('fun.pa.test');
    expect(g.state.anomalies).toContain('pa.test');
  });

  it('at 03:12 too, about a car that has been there since September', () => {
    const g = at('roof.hub', 22);
    wait(g, 5);
    expect(keys(g)).toContain('fun.pa.car');
    expect(t('fun.pa.car')).toContain('since September');
  });

  it('isn’t heard in the toilets, at her desk, or in Act III', () => {
    for (const [scene, act] of [
      ['stairs.toilets', 1],
      ['office.desk7', 1],
      ['stairs.hub', 3],
    ] as const) {
      const g = at(scene, 7, act);
      g.state.minute = 8;
      // Fire what's due without a choice: the pages a minute later carry it, or not.
      const def = CONTENT.events.find((e) => e.id === 'ev.pa.test')!;
      expect(holds(def.if, g.state), `${scene}, Act ${act}`).toBe(false);
    }
  });

  it('never at 03:33: it has an until, like every event with a joke', () => {
    for (const id of ['ev.pa.test', 'ev.pa.car']) expect(CONTENT.events.find((e) => e.id === id)!.until).toBeLessThanOrEqual(46);
  });
});

describe('past-you’s margins', () => {
  it('appear beside five entries from the third night, in both languages', () => {
    const asides = CONTENT.notebook.filter((n) => n.asides?.length);
    expect(asides.map((n) => n.id).sort()).toEqual(['nb.ian', 'nb.purge', 'nb.reset', 'nb.tlc', 'nb.yield']);
    const g = at('office.hub', 0);
    const shown = (loop: number) => {
      g.state.loop = loop;
      return asides.filter((n) => n.asides!.every((a) => holds(a.if, g.state))).length;
    };
    expect(shown(2)).toBe(0);
    expect(shown(3)).toBe(5);
    for (const n of asides) for (const l of ['en', 'zh-Hant-TW'] as const) expect(t(n.asides![0]!.key, undefined, l)).not.toContain('[[');
    expect(t('nb.aside.tlc')).toBe('label your vials. you didn’t.');
  });
});
