/**
 * Achievements and the anomaly counter (docs/HUMOUR.md §6, #208): how each is earned, and how the gallery
 * keeps them, and the anomalies, across new games without losing anything a v1.0 gallery had.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game, newGameState } from '../src/engine/engine.ts';
import { t } from '../src/i18n/i18n.ts';
import { Gallery, GALLERY_KEY } from '../src/save/gallery.ts';
import { memoryStorage } from '../src/save/storage.ts';

const fresh = () => {
  const g = new Game(CONTENT);
  while (g.takeCard());
  return g;
};
const has = (g: Game, id: string) => g.state.achievements.includes(id);

describe('the achievements', () => {
  it('each has a name and a reason in both languages, and a way to be earned', () => {
    const granted = new Set(CONTENT.anomalies.map((a) => a.achievement).filter(Boolean));
    for (const a of CONTENT.achievements) {
      for (const l of ['en', 'zh-Hant-TW'] as const) for (const k of [a.title, a.desc]) expect(t(k, undefined, l), `${a.id} ${l}`).not.toMatch(/\[\[/);
      expect(granted.has(a.id) || !!a.if, `${a.id} can be earned`).toBe(true);
    }
    // Each language names them on its own terms.
    expect(t('ach.writingup.title', undefined, 'zh-Hant-TW')).toBe('延畢');
    expect(t('ach.reply.title', undefined, 'zh-Hant-TW')).toBe('老闆秒回');
    expect(t('ach.visible.title')).toBe('Visible at All Times');
  });

  it('found with an anomaly: sudo, g16 and ping at the console', () => {
    const g = fresh();
    g.discover('cmd.sudo');
    g.discover('cmd.g16');
    g.discover('cmd.ping');
    expect(g.state.achievements).toEqual(['reported', 'normal', 'reply']);
  });

  it('Visible at All Times: any ending, lanyard never off', () => {
    const g = fresh();
    g.state.ending = 'fire';
    g.checkAchievements();
    expect(has(g, 'visible')).toBe(true);
    const h = fresh();
    h.choose('office.around');
    h.choose('office.lanyard.off');
    h.choose('office.lanyard.on');
    h.state.ending = 'fire';
    h.checkAchievements();
    expect(has(h, 'visible')).toBe(false);
  });

  it('Mandatory Training: all five posters, over five nights', () => {
    const g = fresh();
    g.state.flags.push('poster.0', 'poster.1', 'poster.2', 'poster.3');
    g.checkAchievements();
    expect(has(g, 'training')).toBe(false);
    g.state.flags.push('poster.4');
    g.checkAchievements();
    expect(has(g, 'training')).toBe(true);
  });

  it('Writing-Up Year (延畢): the thirteenth 02:47', () => {
    const g = fresh();
    g.state.loop = 12;
    g.choose('meta:wait');
    while (!g.busy) {
      if (g.state.menu !== 'wait') g.choose('meta:wait');
      g.choose('wait:10');
    }
    while (g.takeCard());
    expect(g.state.loop).toBe(13);
    expect(has(g, 'writingup')).toBe(true);
  });

  it('Make Tea First: tea at 02:47, once your own hand has said so; not later, and not before', () => {
    const early = fresh();
    early.choose('office.tea');
    expect(has(early, 'tea')).toBe(false);
    const told = fresh();
    told.state.known.push({ id: 'ph.tea', loop: 2, minute: 0 });
    told.choose('office.tea');
    expect(has(told, 'tea')).toBe(true);
    const late = fresh();
    late.state.known.push({ id: 'ph.tea', loop: 2, minute: 0 });
    late.choose('office.window');
    late.choose('office.tea');
    expect(has(late, 'tea')).toBe(false);
  });

  it('Risk Assessed and Sorry, by doing the thing', () => {
    const g = fresh();
    g.choose('office.around');
    g.choose('office.pencil');
    expect(has(g, 'coshh')).toBe(true);
  });
});

describe('the gallery keeps finds (#208)', () => {
  it('merges what a playthrough found, says what is new, and never loses anything', () => {
    const kv = memoryStorage();
    const gallery = new Gallery(kv, () => new Date('2026-11-25T03:00:00Z'));
    expect(gallery.recordFinds(['lift', 'cmd.g16'], ['normal'])).toEqual(['normal']);
    expect(gallery.recordFinds(['lift'], ['normal'])).toEqual([]);
    expect(gallery.recordFinds(['toilets'], ['normal', 'reply'])).toEqual(['reply']);
    const d = gallery.data();
    expect(d.v).toBe(2);
    expect(d.anomalies).toEqual(['lift', 'cmd.g16', 'toilets']);
    expect(d.achievements).toEqual({ normal: '2026-11-25T03:00:00.000Z', reply: '2026-11-25T03:00:00.000Z' });
    expect(gallery.finds()).toEqual({ anomalies: ['lift', 'cmd.g16', 'toilets'], achievements: ['normal', 'reply'] });
  });

  it('reads a v1.0 gallery with nothing lost, and keeps its endings when it gains finds', () => {
    const kv = memoryStorage();
    const v1 = { v: 1, endings: { honest: { first: '2026-11-20T04:00:00.000Z', count: 2 } }, solved: ['tlc', 'glovebox'], future: 'kept' };
    kv.set(GALLERY_KEY, JSON.stringify(v1));
    const gallery = new Gallery(kv);
    expect(gallery.data()).toMatchObject({ v: 1, endings: v1.endings, solved: v1.solved, anomalies: [], achievements: {} });
    gallery.recordFinds(['lift'], ['visible']);
    const raw = JSON.parse(kv.get(GALLERY_KEY)!);
    expect(raw).toMatchObject({ v: 2, endings: v1.endings, solved: v1.solved, future: 'kept', anomalies: ['lift'] });
    expect(Object.keys(raw.achievements)).toEqual(['visible']);
    // An ending recorded afterwards keeps the finds.
    gallery.recordEnding('fire', ['tlc']);
    expect(gallery.data()).toMatchObject({ v: 2, anomalies: ['lift'], solved: ['tlc', 'glovebox'] });
    expect(gallery.found()).toEqual(['honest', 'fire']);
  });

  it('never replaces unreadable text it couldn’t back up first, and never lowers a newer gallery’s version or entries (from the cold review)', () => {
    // Storage nearly full: the backup (a new key) fails, so nothing is overwritten.
    const kv = memoryStorage();
    kv.set(GALLERY_KEY, '{not json');
    const tight = { ...kv, set: (k: string, v: string) => (k.endsWith('.unreadable') ? false : kv.set(k, v)) };
    const gallery = new Gallery(tight);
    expect(gallery.recordFinds(['lift'], ['visible'])).toEqual([]);
    expect(gallery.recordEnding('fire', [])).toBe(false);
    expect(kv.get(GALLERY_KEY)).toBe('{not json');
    // A newer build's gallery: its version and its own shape of entries survive this one's writes.
    const kv2 = memoryStorage();
    kv2.set(GALLERY_KEY, JSON.stringify({ v: 3, endings: {}, solved: [], anomalies: ['lift', { id: 'x' }], achievements: { visible: { at: 'then', by: 'v3' } } }));
    const newer = new Gallery(kv2);
    newer.recordFinds(['toilets'], ['normal']);
    newer.recordEnding('fire', []);
    const raw = JSON.parse(kv2.get(GALLERY_KEY)!);
    expect(raw.v).toBe(3);
    expect(raw.anomalies).toEqual(['lift', { id: 'x' }, 'toilets']);
    expect(raw.achievements.visible).toEqual({ at: 'then', by: 'v3' });
    expect(Object.keys(raw.achievements)).toEqual(['visible', 'normal']);
  });

  it('a new game starts with the gallery’s finds, so conditions on them hold and nothing is announced twice', () => {
    const s = newGameState(CONTENT, [], { anomalies: ['lift', 'gone'], achievements: ['normal', 'gone'] });
    expect(s.anomalies).toEqual(['lift']);
    expect(s.achievements).toEqual(['normal']);
  });
});
