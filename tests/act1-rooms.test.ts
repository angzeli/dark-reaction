/**
 * The Act I rooms' new lines (docs/HUMOUR.md §8, #206): a COSHH form for a pencil, your own chapter 4,
 * Tom's plate at Rf 0.3, the fume hood you apologise to (or, in 繁中, put a 乖乖 on), and Ian's table of
 * peaks that aren't yours. And a guard: hubs keep their number keys.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { Act, LocationId } from '../src/engine/types.ts';
import { t } from '../src/i18n/i18n.ts';

const keys = (g: Game) => g.state.display.map((p) => p.key);
const ids = (g: Game) => g.choices().map((c) => c.id);
function at(location: LocationId, act: Act = 1): Game {
  const g = new Game(CONTENT);
  while (g.takeCard());
  g.state.act = act;
  g.state.minute = 12;
  // The night's earlier events have happened (Dan's email at 02:50).
  g.state.firedEvents = CONTENT.events.filter((e) => e.minute < 12).map((e) => e.id);
  const loc = CONTENT.locations.find((l) => l.id === location)!;
  g.state.location = location;
  g.state.scene = loc.entry?.length ? loc.entry[0]!.scene : loc.hub;
  return g;
}

describe('the Research Write-Up Room', () => {
  it('a pencil on the floor needs a COSHH assessment first: two minutes, and an anomaly', () => {
    const g = at('office');
    g.choose('office.around');
    g.choose('office.pencil');
    expect(g.state.minute).toBe(14);
    expect(keys(g)).toEqual(['fun.pencil']);
    expect(g.state.anomalies).toContain('coshh');
    expect(t('fun.pencil', undefined, 'zh-Hant-TW')).toContain('核銷');
  });

  it('your chapter 4, on your monitor, says everything photocatalysis papers say, until Act III', () => {
    const g = at('office');
    g.choose('office.monitor');
    g.choose('office.thesis');
    const text = t('fun.thesis');
    for (const s of ['P25', '3.7', 'λ > 420 nm', '5 cycles', 'C 1s at 284.8 eV', 'apparent quantum yield was not determined']) expect(text).toContain(s);
    const h = at('office', 3);
    h.choose('office.monitor');
    expect(ids(h)).not.toContain('office.thesis');
  });
});

describe('the synthesis lab', () => {
  it('Tom’s plate, every spot at Rf 0.3, is in his hood until Act III', () => {
    const g = at('synth');
    g.choose('synth.hoods');
    expect(keys(g)).toEqual(['synth.hoods.r', 'fun.synth.tlc', 'ui.noted']);
    const h = at('synth', 3);
    h.choose('synth.hoods');
    expect(keys(h)).not.toContain('fun.synth.tlc');
  });

  it('you can say sorry to the hood only once you have lifted its sash to look in', () => {
    const g = at('synth');
    expect(ids(g)).not.toContain('synth.sorry');
    g.choose('synth.hoods');
    g.choose('synth.sorry');
    expect(keys(g)).toEqual(['fun.sorry']);
    expect(g.state.anomalies).toContain('sorry');
    expect(t('synth.sorry')).toBe('Apologise to the fume hood');
    expect(t('synth.sorry', undefined, 'zh-Hant-TW')).toBe('在抽氣櫃上放一包乖乖');
  });
});

describe('B12', () => {
  it('Ian’s table has the residual peaks every chemist half-remembers, in both languages', () => {
    const g = at('nmr');
    g.choose('nmr.chart');
    expect(keys(g)).toEqual(['fun.chart']);
    for (const l of ['en', 'zh-Hant-TW'] as const) {
      const text = t('fun.chart', undefined, l);
      for (const v of ['7.26', '1.56', '2.17', '0.86', '1.26', '7.16', '0.40', '1.55', '0.92', '1.36', '8.41']) expect(text).toContain(v);
    }
    expect(ids(at('nmr', 3))).not.toContain('nmr.chart');
  });
});

describe('hubs keep their number keys (#204)', () => {
  // Number keys reach the first ten choices (README). In Acts I–II every hub but the stairwell keeps
  // Travel and Wait within them; the stairwell has been at eleven since the lift and the toilets (#204).
  it('in Acts I–II, ten choices at most (eleven in the stairwell)', () => {
    for (const act of [1, 2] as const) {
      for (const loc of CONTENT.locations) {
        const n = at(loc.id, act).choices().length;
        expect(n, `${loc.id} in Act ${act}`).toBeLessThanOrEqual(loc.id === 'stairs' ? 11 : 10);
      }
    }
  });
});
