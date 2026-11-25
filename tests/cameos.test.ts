/**
 * The cameos (docs/HUMOUR.md §8, #210): subtle, at most one in each place, and the roof's line a quiet
 * moment rather than a joke.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { JOKE_KEYS } from '../src/content/humour.ts';
import { Game } from '../src/engine/engine.ts';
import { t } from '../src/i18n/i18n.ts';

const cameos = CONTENT.anomalies.filter((a) => a.id.startsWith('cameo.'));

describe('the cameos', () => {
  it('are five, at most one in each place', () => {
    expect(cameos.map((a) => a.id).sort()).toEqual(['cameo.boforge', 'cameo.macbook', 'cameo.rack', 'cameo.tank', 'cameo.whiteboard']);
    const places = cameos.map((a) => CONTENT.scenes.find((s) => s.id === a.scene)!.location);
    expect(new Set(places).size).toBe(places.length);
  });

  it('say what they should, in both languages', () => {
    expect(t('fun.rack')).toContain('forty-eight');
    expect(t('glovebox.terminal.r')).toContain('ask bo-forge what to run next');
    expect(t('glovebox.terminal.r', undefined, 'zh-Hant-TW')).toContain('ask bo-forge what to run next');
    expect(t('fun.macbook')).toContain('It’s converging. Nobody knows how.');
    for (const l of ['en', 'zh-Hant-TW'] as const) expect(t('synth.whiteboard.r', undefined, l)).toContain('ZnIn₂S₄');
  });

  it('the water tank: the same words in both languages, untranslated, in every act, and not a joke', () => {
    for (const l of ['en', 'zh-Hant-TW'] as const) expect(t('roof.tank.r', undefined, l)).toContain('下一秒想去看海');
    expect(JOKE_KEYS.has('roof.tank.r')).toBe(false);
    for (const act of [1, 2, 3] as const) {
      const g = new Game(CONTENT);
      while (g.takeCard());
      g.state.act = act;
      g.state.scene = 'roof.hub';
      g.state.location = 'roof';
      expect(g.choices().map((c) => c.id), `Act ${act}`).toContain('roof.tank');
    }
  });
});
