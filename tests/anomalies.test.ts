/**
 * Every entry in the anomaly registry, triggered (docs/HUMOUR.md §2, #203): the choice made, the event
 * fired, the night ended, the command typed. Each is then recorded, and what it showed renders in both
 * languages.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { t } from '../src/i18n/i18n.ts';
import type { Content } from '../src/engine/types.ts';
import { miniContent } from './fixtures/mini.ts';
import { trigger } from './helpers/anomalies.ts';

const SAMPLE = { clock: '02:51', n: 2, total: 3, name: 'x', command: 'x', items: 'x' };
const rendersInBoth = (key: string) => (['en', 'zh-Hant-TW'] as const).every((l) => !t(key, SAMPLE, l).includes('[['));

describe('the anomaly registry', () => {
  it('has unique ids', () => {
    const ids = CONTENT.anomalies.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const a of CONTENT.anomalies) {
    it(`finds "${a.id}" (${a.trigger.kind}, ${a.scene})`, () => {
      const r = trigger(CONTENT, a);
      expect(r.found).toBe(true);
      for (const k of a.keys) expect(rendersInBoth(k), k).toBe(true);
    });
  }
});

describe('the trigger harness itself', () => {
  it('finds a choice-triggered anomaly in a world that has one, and fails one that is not offered', () => {
    const c: Content = miniContent();
    c.scenes[0]!.choices.push({ id: 'office.doodle', label: 'c.doodle', text: [{ key: 'r.doodle' }], effects: [{ anomaly: 'doodle' }] });
    const doodle = { id: 'doodle', trigger: { kind: 'choice' as const, choice: 'office.doodle', setup: {} }, scene: 'office.hub', tone: 'calm' as const, keys: ['r.doodle'] };
    c.anomalies.push(doodle);
    expect(trigger(c, doodle)).toEqual({ found: true, shown: ['r.doodle'] });
    expect(() => trigger(c, { ...doodle, trigger: { ...doodle.trigger, setup: { scene: 'nmr.hub' } } })).toThrow(/isn't offered/);
    expect(() => trigger(c, { ...doodle, trigger: { kind: 'clock', at: '03:33' } })).toThrow(/nothing triggers a "clock" anomaly yet/);
    expect(trigger(c, { ...doodle, id: 'cmd.xyzzy', trigger: { kind: 'command', command: 'xyzzy' } })).toEqual({ found: true, shown: ['console.out.xyzzy'] });
    expect(trigger(c, { ...doodle, trigger: { kind: 'command', command: 'queue' } }).found).toBe(false);
  });
});
