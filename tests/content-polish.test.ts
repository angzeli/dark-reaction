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
    // At 03:26 the run is the late one (under its own label since #198).
    expect(g.choices().map((c) => c.id)).toContain('nmr.run.late');
    g.choose('nmr.run.late');
    const [card] = [g.takeCard()];
    expect(card?.kind).toBe('lightsout');
    if (card?.kind === 'lightsout') expect(card.before.map((p) => p.key)).not.toContain('ev.perfect.nmr');
    expect(g.state.flags).not.toContain('perfect.offered');
  });

  describe('the run that can’t beat 03:33 says so before you take it, as the late purge does (#198)', () => {
    /** Act II at the NMR suite at `minute`, tube in hand, RIDLEY-4 known. */
    const at = (minute: number) => {
      const g = new Game(CONTENT);
      for (let c = g.takeCard(); c; c = g.takeCard());
      Object.assign(g.state, { act: 2, location: 'nmr', scene: 'nmr.hub', minute, inventory: ['item.tube.own'] });
      g.state.known.push({ id: 'nb.priority', loop: 1, minute: 0 });
      return g;
    };
    const runs = (g: Game) => g.choices().filter((c) => c.id.startsWith('nmr.run'));

    it('at 03:24 the run ends at 03:32, under the plain label', () => {
      expect(runs(at(37)).map((c) => [c.id, c.label])).toEqual([['nmr.run', 'nmr.run']]);
    });

    it('from 03:25 (8 min would reach 03:33) the label is the late one, in both locales', () => {
      for (const minute of [38, 39, 45]) {
        const offered = runs(at(minute));
        expect(offered).toHaveLength(1);
        expect(offered[0]!.label).toBe('nmr.run.late');
      }
      expect(choice('glovebox.purge.late')!.label).not.toBe(choice('glovebox.purge')!.label);
      for (const locale of ['en', 'zh-Hant-TW'] as const) {
        expect(t('nmr.run.late', undefined, locale)).toContain(t('nmr.run', undefined, locale));
        expect(t('nmr.run.late', undefined, locale)).toContain('03:33');
      }
    });

    it('at 03:25 only the label changes: the run still happens, and the printer still prints for it', () => {
      const g = at(38);
      g.choose('nmr.run.last');
      const card = g.takeCard();
      expect(card?.kind).toBe('lightsout');
      if (card?.kind === 'lightsout') expect(card.before.map((p) => p.key)).toEqual(expect.arrayContaining(['nmr.run.r.1', 'ev.perfect.nmr']));
      expect(g.state.flags).toEqual(expect.arrayContaining(['ran.own', 'perfect.offered']));
    });

    it('a run already made that night is not offered again at 03:25 or after', () => {
      const g = at(29);
      g.choose('nmr.run');
      for (const minute of [38, 39]) {
        g.state.minute = minute;
        expect(runs(g)).toEqual([]);
      }
    });
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

describe('the owner’s decisions on the playtest proposals', () => {
  const both = ['en', 'zh-Hant-TW'] as const;

  it('the box has a reason: the product survives air dry, not dissolved, and the dried C₆D₆ is in the box (#124)', () => {
    for (const locale of both) {
      expect(t('puzzle.glovebox.intro', undefined, locale)).toContain('C₆D₆');
      // It goes green as it dissolves, not as a dry film: dry, it came through the column in air.
      for (const key of ['puzzle.glovebox.ev.ruined', 'glovebox.purge.late.r']) expect(t(key, undefined, locale), key).toMatch(/dissolve|make it up|溶開/);
    }
  });

  it('the chemist’s small touches: the stain, the mixed fractions, the wet weight, the held queue (#125)', () => {
    for (const locale of both) {
      expect(t('puzzle.tlc.intro', undefined, locale)).toContain('anisaldehyde');
      expect(t('puzzle.tlc.solved', undefined, locale)).toMatch(/11 (and|和) 15/);
      for (const key of ['synth.rotavap.r.weigh', 'synth.yield.honest.r', 'nb.yield.body']) expect(t(key, undefined, locale), key).toMatch(/not (quite|yet) dry|還沒抽乾/);
      const queue = t('console.out.queue.all', undefined, locale);
      expect(queue).not.toContain('QUEUED');
      expect(queue.match(/HELD · PRIORITY 13/g)).toHaveLength(2);
    }
  });

  /** A game at 03:32 in `at`, the door log read or not, waiting the last minute out. */
  const lastPage = (at: 'synth' | 'office', readLog: boolean) => {
    const g = new Game(CONTENT);
    for (let c = g.takeCard(); c; c = g.takeCard());
    Object.assign(g.state, { act: 2, location: at, scene: `${at}.hub`, minute: 45, firedEvents: CONTENT.events.filter((e) => e.minute < 45).map((e) => e.id) });
    g.state.known.push({ id: 'nb.reset', loop: 1, minute: 46 });
    if (readLog) g.state.known.push({ id: 'nb.keeps', loop: 1, minute: 20 });
    g.choose('meta:wait');
    g.choose('wait:1');
    const card = g.takeCard();
    expect(card?.kind).toBe('lightsout');
    return card?.kind === 'lightsout' ? { keys: card.before.map((p) => p.key), hold: card.hold === true } : { keys: [], hold: false };
  };

  it('in 4.12 at 03:33, having read the door log, the last page before the dark has her card let in (#153)', () => {
    const page = lastPage('synth', true);
    expect(page.keys).toContain('ev.keeps');
    // A wait goes straight into the dark; this page waits to be read.
    expect(page.hold).toBe(true);
    for (const locale of both) expect(t('ev.keeps', undefined, locale)).not.toMatch(/^\[\[/);
  });

  it('nowhere else, and not before the log is read (#153)', () => {
    for (const page of [lastPage('synth', false), lastPage('office', true)]) {
      expect(page.keys).not.toContain('ev.keeps');
      expect(page.hold).toBe(false);
    }
  });
});
