/**
 * The hidden eggs (docs/HUMOUR.md §7, #209): the Konami code, the title at 03:33 and on Mole Day,
 * Squiddy in a different room each loop, the dark control, and the balance that won't stop drifting.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { SQUID_ROOMS, squidId } from '../src/content/squid.ts';
import { Game } from '../src/engine/engine.ts';
import { t } from '../src/i18n/i18n.ts';
import { bullets, KONAMI, konamiStep, titleEgg } from '../src/ui/eggs.ts';

const keys = (g: Game) => g.state.display.map((p) => p.key);
const ids = (g: Game) => g.choices().map((c) => c.id);
function fresh(): Game {
  const g = new Game(CONTENT);
  while (g.takeCard());
  return g;
}
function to(g: Game, scene: string): void {
  const def = g.index.scenes.get(scene)!;
  g.state.scene = scene;
  g.state.location = def.location;
}
function night(g: Game): void {
  if (!g.scene.hub) g.choose('meta:back');
  while (!g.busy) {
    if (g.state.menu !== 'wait') g.choose(g.scene.hub ? 'meta:wait' : 'meta:back');
    else g.choose('wait:10');
  }
  while (g.takeCard());
}

describe('the Konami code', () => {
  it('↑ ↑ ↓ ↓ ← → ← → B A, in either case, and a wrong key starts again', () => {
    const run = (ks: string[]) => ks.reduce((p, k) => konamiStep(p, k), 0);
    expect(run([...KONAMI])).toBe(KONAMI.length);
    expect(run([...KONAMI.slice(0, 8), 'B', 'A'])).toBe(KONAMI.length);
    expect(run(['ArrowUp', 'ArrowUp', 'ArrowUp', ...KONAMI.slice(2)])).toBe(KONAMI.length);
    expect(run(['ArrowUp', 'x', ...KONAMI.slice(1)])).toBeLessThan(KONAMI.length);
  });

  it('a slide’s bullets: the page’s first sentences, markup gone, kept short', () => {
    expect(bullets(['One *two*. Three! Four? Five. Six.'])).toEqual(['One two.', 'Three!', 'Four?', 'Five.']);
    expect(bullets(['你好。今天。'])).toEqual(['你好。', '今天。']);
    expect(bullets(['x'.repeat(100)])[0]).toHaveLength(72);
  });
});

describe('the title, by the clock and the calendar', () => {
  it('03:33 local time says go to bed; 23 October is Mole Day; any other time, nothing', () => {
    expect(titleEgg(new Date(2026, 10, 25, 3, 33))).toBe('bed');
    expect(titleEgg(new Date(2026, 9, 23, 3, 33))).toBe('bed');
    expect(titleEgg(new Date(2026, 9, 23, 12, 0))).toBe('mole');
    expect(titleEgg(new Date(2026, 10, 25, 3, 34))).toBeNull();
    expect(t('title.egg.mole')).toContain('a mole of PhD students');
  });
});

describe('Squiddy', () => {
  it('is in one room a loop, round the three rooms in turn, in Acts I–II only', () => {
    for (let loop = 1; loop <= 12; loop++) {
      const where = CONTENT.scenes.filter((s) => {
        const g = fresh();
        g.state.loop = loop;
        to(g, s.id);
        return g.choices().some((c) => c.id.startsWith('squid.'));
      });
      expect(where.map((s) => s.location), `loop ${loop}`).toEqual([SQUID_ROOMS[(loop - 1) % SQUID_ROOMS.length]]);
    }
    const g = fresh();
    g.state.act = 3;
    to(g, 'synth.around');
    expect(ids(g).some((id) => id.startsWith('squid.'))).toBe(false);
  });

  it('all three, in any playthrough: Cephalopod Census, and a page at the next 02:47', () => {
    const g = fresh();
    for (const room of SQUID_ROOMS.slice(0, -1)) g.discover(squidId(room));
    expect(g.state.achievements).not.toContain('census');
    g.discover(squidId('office'));
    expect(g.state.achievements).toContain('census');
    night(g);
    expect(g.state.known.map((k) => k.id)).toContain('nb.squiddy');
  });
});

describe('the dark control', () => {
  it('straight to the dark room once you know about 03:33: a whole night, lamp off, and nothing happens', () => {
    const g = fresh();
    g.state.known.push({ id: 'nb.reset', loop: 1, minute: 46 });
    g.choose('meta:travel');
    g.choose('go:synth');
    g.choose('synth.around');
    g.choose('synth.darkroom');
    expect(keys(g)).toEqual(['fun.darkroom']);
    const c = g.choices().find((x) => x.id === 'synth.darkcontrol')!;
    expect(c.cost).toBe(45);
    g.choose('synth.darkcontrol');
    while (g.takeCard());
    expect(g.state.loop).toBe(2);
    expect(g.state.known.map((k) => k.id)).toContain('nb.darkcontrol');
    expect(g.state.anomalies).toContain('darkcontrol');
    expect(g.state.achievements).toContain('dark');
    expect(t('nb.darkcontrol.body')).toContain('nothing happened, as expected');
  });

  it('too late, or before the first 03:33, there is nothing to run; too late, it says when it would have to start', () => {
    const g = fresh();
    to(g, 'synth.darkroom');
    expect(ids(g)).not.toContain('synth.darkcontrol');
    g.state.known.push({ id: 'nb.reset', loop: 1, minute: 46 });
    g.state.minute = 10;
    expect(ids(g)).not.toContain('synth.darkcontrol');
    g.choose('synth.darkcontrol.late');
    expect(t(keys(g)[0]!)).toContain('02:47');
  });
});

describe('the balance', () => {
  it('drifts after every tare, and the third time reads 104 %: 104% Yield', () => {
    const g = fresh();
    to(g, 'synth.around');
    g.state.minute = 12;
    g.choose('synth.tare.1');
    g.choose('synth.tare.2');
    g.choose('synth.tare.3');
    expect(g.state.minute).toBe(15);
    expect(keys(g)).toEqual(['fun.tare.3']);
    expect(t('fun.tare.3')).toContain('104 %');
    expect(g.state.anomalies).toContain('balance');
    expect(g.state.achievements).toContain('yield');
    expect(ids(g).filter((id) => id.startsWith('synth.tare'))).toEqual([]);
  });
});
