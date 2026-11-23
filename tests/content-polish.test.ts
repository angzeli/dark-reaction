/**
 * Small content fixes from the playtest QA pass (docs/qa/PLAYTEST-REPORT.md).
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import { TABLES, t } from '../src/i18n/i18n.ts';

const choice = (id: string) => CONTENT.scenes.flatMap((s) => s.choices).find((c) => c.id === id);
const scene = (id: string) => CONTENT.scenes.find((s) => s.id === id)!;

describe('playtest content polish', () => {
  it('the console’s booking doesn’t count minutes from 02:47: it reads true at 03:28 too (#115)', () => {
    for (const locale of ['en', 'zh-Hant-TW'] as const) {
      const text = t('puzzle.console.solved', undefined, locale);
      expect(text).not.toMatch(/forty|四十/);
    }
  });

  it('every Act III choice in the glovebox room can be shown: the glovebox is always solved by then (#121)', () => {
    expect(choice('glovebox.mini.shut')).toBeUndefined();
    for (const c of scene('glovebox.hub').choices) {
      const json = JSON.stringify(c.if ?? {});
      expect(json.includes('"act":3') && json.includes('{"not":{"solved":"glovebox"}}'), c.id).toBe(false);
    }
  });

  it('the late purge says it’s late before you choose it (#122)', () => {
    expect(choice('glovebox.purge.late')!.label).not.toBe(choice('glovebox.purge')!.label);
  });

  it('from Act II, hot desk 7 says what the picture shows: the top box open (#129)', () => {
    const g = new Game(CONTENT);
    while (g.takeCard());
    g.state.act = 2;
    expect(g.sceneText('office.desk7').map((p) => p.key)).toContain('office.desk7.open');
    g.state.act = 1;
    expect(g.sceneText('office.desk7').map((p) => p.key)).not.toContain('office.desk7.open');
  });

  it('the freezer note says the card is in a red-capped vial, not in the cell under one (#145)', () => {
    const zh = t('puzzle.freezer.note.2', undefined, 'zh-Hant-TW');
    expect(zh).not.toContain('底下');
    expect(zh).toMatch(/紅蓋子的.*小管/);
  });

  it('a mug is 一個 in 繁中, as Taiwan says it (#145)', () => {
    for (const [key, value] of Object.entries(TABLES['zh-Hant-TW'])) expect(value, key).not.toContain('一只');
  });

  it('B.05 is warm with the −80 in it, and the solvent cabinets carry warning triangles (#146)', () => {
    for (const locale of ['en', 'zh-Hant-TW'] as const) {
      const room = t('cold.hub.act1', undefined, locale);
      expect(room).not.toMatch(/coldest|最冷/);
      expect(room + t('cold.cabinets.r', undefined, locale)).not.toMatch(/diamond|菱形/);
    }
  });

  it('the mobile player’s 繁中: the last loop, not last night; a whole page of j; two antechambers told apart (#160)', () => {
    const zh = (key: string) => t(key, undefined, 'zh-Hant-TW');
    expect(zh('nmr.code.empty')).not.toContain('昨晚');
    for (const key of ['loop.start.again', 'loop.start.act3', 'ending.infinite.1']) expect(zh(key)).not.toContain('那一頁 *j*');
    expect(zh('glovebox.purge')).toContain('大前艙');
    expect(zh('glovebox.mini.open')).toContain('小前艙');
    expect(zh('synth.foil.r')).not.toContain('而這正是你需要的');
  });

  it('the 03:25 printer isn’t told at 03:33 by a run that only ended there (#147)', () => {
    const g = new Game(CONTENT);
    for (let c = g.takeCard(); c; c = g.takeCard());
    Object.assign(g.state, { act: 2, location: 'nmr', scene: 'nmr.hub', minute: 39, inventory: ['item.tube.own'] });
    g.state.known.push({ id: 'nb.priority', loop: 1, minute: 0 });
    // At 03:26 the run is the late one, under the same label.
    expect(g.choices().map((c) => c.id)).toContain('nmr.run.late');
    expect(choice('nmr.run.late')!.label).toBe(choice('nmr.run')!.label);
    g.choose('nmr.run.late');
    const [card] = [g.takeCard()];
    expect(card?.kind).toBe('lightsout');
    if (card?.kind === 'lightsout') expect(card.before.map((p) => p.key)).not.toContain('ev.perfect.nmr');
    expect(g.state.flags).not.toContain('perfect.offered');
  });

  it('the access log says where it begins, rather than “Nothing older.” above older entries (#147)', () => {
    expect(t('puzzle.doorlog.archive.start', undefined, 'en')).toBe('The log begins here.');
    expect(t('puzzle.doorlog.archive.start', undefined, 'zh-Hant-TW')).not.toContain('沒有更早');
  });

  it('in Act III the Kraken has her flask on port 4; the office gives no time; the late purge is true when offered (#157)', () => {
    const g = new Game(CONTENT);
    for (let c = g.takeCard(); c; c = g.takeCard());
    Object.assign(g.state, { act: 3, location: 'synth', scene: 'synth.hub' });
    g.choose('synth.kraken');
    expect(g.state.display.map((p) => p.key)).toEqual(['synth.kraken.act3']);
    for (const locale of ['en', 'zh-Hant-TW'] as const) {
      expect(t('office.hub.act3', undefined, locale)).not.toContain('02:47');
      expect(t('glovebox.purge.late', undefined, locale)).not.toMatch(/close to 10|快到 10/);
    }
  });

  it('the Kraken shortcut without foil says so before you choose it (#158)', () => {
    expect(choice('synth.kraken.again.light')!.label).not.toBe(choice('synth.kraken.again')!.label);
    expect(t(choice('synth.kraken.again.light')!.label, undefined, 'en')).toContain('no foil');
    expect(t(choice('synth.kraken.again.light')!.label, undefined, 'zh-Hant-TW')).toContain('沒有鋁箔');
  });
});
