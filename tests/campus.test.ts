/**
 * The campus in-jokes (docs/HUMOUR.md §4, #204), driven through the real content: B12, the Research
 * Write-Up Room, your lanyard, the lift on 0, the lab door's poster, the toilets, the corridor, and the
 * shuttle that left at 18:15.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { Card, LocationId } from '../src/engine/types.ts';
import { t, TABLES } from '../src/i18n/i18n.ts';
import { parseSave, SAVE_SCHEMA } from '../src/save/saves.ts';

const drain = (g: Game): Card[] => {
  const out: Card[] = [];
  for (let c = g.takeCard(); c; c = g.takeCard()) out.push(c);
  return out;
};
const keys = (g: Game) => g.state.display.map((p) => p.key);
const ids = (g: Game) => g.choices().map((c) => c.id);
function fresh(): Game {
  const g = new Game(CONTENT);
  drain(g);
  return g;
}
function goTo(g: Game, to: LocationId): void {
  if (!g.scene.hub) g.choose('meta:back');
  g.choose('meta:travel');
  g.choose(`go:${to}`);
}
function endLoop(g: Game): Card[] {
  if (!g.scene.hub) g.choose('meta:back');
  while (g.state.minute < 46 && !g.busy) {
    g.choose('meta:wait');
    g.choose('wait:10');
  }
  return drain(g);
}

describe('B12 and the Research Write-Up Room', () => {
  it('are what the rooms are called, in both languages; the console names no university', () => {
    expect(t('loc.nmr.name', undefined, 'en')).toBe('B12 NMR suite');
    expect(t('loc.nmr.name', undefined, 'zh-Hant-TW')).toBe('B12 NMR 室');
    for (const l of ['en', 'zh-Hant-TW'] as const) {
      expect(t('loc.office.name', undefined, l)).toBe('4.08 Research Write-Up Room');
      expect(t('console.out.motd', undefined, l)).toContain('B12');
    }
    const all = Object.values(TABLES.en).join('\n') + Object.values(TABLES['zh-Hant-TW']).join('\n');
    expect(all).not.toMatch(/B\.03|Kingsmere|Write-up office|研究生辦公室/);
  });

  it('the door plate says so, until Act III', () => {
    const g = fresh();
    g.choose('office.around');
    g.choose('office.plate');
    expect(keys(g)).toEqual(['fun.plate']);
    expect(g.state.anomalies).toContain('plate');
    g.state.act = 3;
    expect(ids(g)).not.toContain('office.plate');
  });
});

describe('your lanyard', () => {
  it('is round your neck at 02:47, and the screen says so', () => {
    const g = fresh();
    expect(g.state.inventory).toEqual(['item.lanyard']);
    expect(t('ui.wearing', { items: t('item.lanyard') })).toBe('Around your neck: your lanyard.');
  });

  it('comes off in the Research Write-Up Room, goes back on, and is round your neck again at the next 02:47', () => {
    const g = fresh();
    g.choose('office.around');
    g.choose('office.lanyard.off');
    expect(keys(g)).toEqual(['fun.lanyard.off']);
    expect(g.state.inventory).not.toContain('item.lanyard');
    expect(g.state.flags).toContain('lanyard.offEver');
    expect(ids(g)).toContain('office.lanyard.on');
    expect(ids(g)).not.toContain('office.lanyard.off');
    g.choose('office.lanyard.on');
    expect(g.state.inventory).toContain('item.lanyard');
    g.choose('office.lanyard.off');
    endLoop(g);
    expect(g.state.loop).toBe(2);
    expect(g.state.inventory).toEqual(['item.lanyard']);
    g.choose('office.around');
    expect(ids(g)).toContain('office.lanyard.off');
    // Having taken it off once is kept: Visible at All Times is gone for this playthrough (#208).
    expect(g.state.flags).toContain('lanyard.offEver');
  });

  it('can come off in the toilets too', () => {
    const g = fresh();
    goTo(g, 'stairs');
    g.choose('stairs.lift');
    g.choose('stairs.toilets');
    g.choose('stairs.toilets.lanyard.off');
    expect(g.state.inventory).not.toContain('item.lanyard');
    g.choose('stairs.toilets.lanyard.on');
    expect(g.state.inventory).toContain('item.lanyard');
  });

  it('her lanyard: she wears it in the photo, and it isn’t in her box', () => {
    const photo = CONTENT.scenes.find((s) => s.id === 'pi.hub')!.choices.find((c) => c.id === 'pi.photo')!;
    expect(photo.text!.map((r) => r.key)).toContain('pi.photo.lanyard');
    expect(CONTENT.scenes.find((s) => s.id === 'pi.box')!.text.map((r) => r.key)).toEqual(['pi.box.text', 'pi.box.lanyard']);
  });

  it('Clocking Off has its lanyard beat only if you are still wearing it, and passes the shuttle stop either way', () => {
    const clocking = CONTENT.endings.find((e) => e.id === 'clocking')!;
    const shown = (inventory: string[]) => {
      const g = fresh();
      g.state.inventory = inventory;
      return g.paragraphs(clocking.epilogue, 'text').map((p) => p.key);
    };
    expect(shown(['item.lanyard'])).toContain('fun.clocking.lanyard');
    expect(shown([])).not.toContain('fun.clocking.lanyard');
    const order = shown(['item.lanyard']);
    expect(order.indexOf('ending.clocking.shuttle')).toBe(order.indexOf('ending.clocking.2') + 1);
    expect(order.indexOf('fun.clocking.lanyard')).toBe(order.indexOf('ending.clocking.7') + 1);
  });

  it('a save from before the lanyard (schema 2) wears it after loading, unless it had ended', () => {
    const g = fresh();
    const state = { ...structuredClone(g.state), v: 2, inventory: ['item.vial'] };
    const env = (s: unknown) => JSON.stringify({ game: 'dark-reaction', schema: 2, savedAt: '2026-11-24T03:00:00Z', state: s });
    const r = parseSave(env(state), CONTENT);
    expect(r.ok && r.envelope.schema).toBe(SAVE_SCHEMA);
    expect(r.ok && r.envelope.state.inventory).toEqual(['item.lanyard', 'item.vial']);
    const ended = parseSave(env({ ...state, ending: 'fire' }), CONTENT);
    expect(ended.ok && ended.envelope.state.inventory).toEqual(['item.vial']);
  });
});

describe('the lift on 0', () => {
  it('waits with its doors open, and from the second night, it was waiting at 03:33 too', () => {
    const g = fresh();
    goTo(g, 'stairs');
    g.choose('stairs.lift');
    expect(keys(g)).toEqual(['fun.lift.r']);
    expect(g.state.anomalies).toContain('lift');
    g.choose('stairs.lift.press');
    expect(keys(g)).toEqual(['fun.lift.press']);
    endLoop(g);
    goTo(g, 'stairs');
    g.choose('stairs.lift');
    expect(keys(g)).toEqual(['fun.lift.r', 'fun.lift.again']);
  });

  it('in Act III it is only waiting, and nobody presses anything', () => {
    const g = fresh();
    g.state.act = 3;
    goTo(g, 'stairs');
    g.choose('stairs.lift');
    expect(keys(g)).toEqual(['stairs.lift.act3']);
    // The timetable stays: Act III's one light line here.
    expect(ids(g)).toEqual(['stairs.timetable', 'stairs.toilets', 'meta:back']);
  });

  it('nothing in the game has it going anywhere any more', () => {
    for (const l of ['en', 'zh-Hant-TW'] as const) {
      expect(t('office.sofa.r', undefined, l)).not.toMatch(/going somewhere on its own|不知道要去哪一層/);
      expect(t('ending.fire.2', undefined, l)).not.toMatch(/sinks to the ground floor|沉到一樓/);
    }
  });

  it('beside it, a floor plan with B12 on it', () => {
    for (const l of ['en', 'zh-Hant-TW'] as const) expect(t('fun.plan', undefined, l)).toContain('B12 NMR');
  });
});

describe('the lab door', () => {
  it('shows one safety poster a night, a different one each loop, five in turn, and keeps which you have read', () => {
    const g = fresh();
    const seen: string[] = [];
    for (let loop = 1; loop <= 6; loop++) {
      goTo(g, 'synth');
      const door = ids(g).filter((id) => id.startsWith('synth.door.'));
      expect(door).toHaveLength(1);
      seen.push(door[0]!);
      const before = g.state.minute;
      g.choose(door[0]!);
      expect(g.state.minute - before).toBe(3);
      expect(keys(g)).toEqual(['fun.labdoor', `fun.labdoor.poster.${(loop - 1) % 5}`]);
      endLoop(g);
    }
    expect(seen).toEqual(['synth.door.0', 'synth.door.1', 'synth.door.2', 'synth.door.3', 'synth.door.4', 'synth.door.0']);
    expect(g.state.flags.filter((f) => f.startsWith('poster.')).sort()).toEqual(['poster.0', 'poster.1', 'poster.2', 'poster.3', 'poster.4']);
  });
});

describe('the toilets', () => {
  it('are quiet: a 03:33 in here is logged with no place', () => {
    const g = fresh();
    goTo(g, 'stairs');
    g.choose('stairs.lift');
    g.choose('stairs.toilets');
    expect(keys(g)).toEqual(['stairs.toilets.text']);
    expect(g.state.anomalies).toContain('toilets');
    expect(g.scene.unrecorded).toBe(true);
    // The toilets aren't a hub, so there's no Wait: set the clock to the last minute and let a choice end it.
    g.state.minute = 45;
    g.choose('stairs.toilets.lanyard.off');
    g.state.minute = 46;
    g.choose('stairs.toilets.lanyard.on');
    drain(g);
    expect(g.state.loops.at(-1)).toMatchObject({ loop: 1, location: 'stairs', unrecorded: true });
    expect(t('nb.loops.row.unrecorded', { loop: 1, clock: '03:33' })).toBe('Loop 1: the lights went out at 03:33.');
  });
});

describe('the corridor and the shuttle', () => {
  it('the professors’ doors carry their signs verbatim, and no names', () => {
    for (const l of ['en', 'zh-Hant-TW'] as const) {
      const text = t('fun.corridor', undefined, l);
      for (const sign of ['Big OP is here', 'Running out of money soon', 'Don’t laugh at students']) expect(text).toContain(sign);
    }
    const g = fresh();
    goTo(g, 'pi');
    expect(g.state.scene).toBe('pi.door');
    g.choose('pi.corridor');
    expect(g.state.anomalies).toContain('corridor');
  });

  it('the shuttle’s timetable is by the main doors, a look of its own, with the time it is now (#211)', () => {
    const g = fresh();
    goTo(g, 'stairs');
    g.choose('stairs.entrance');
    expect(keys(g)).toEqual(['stairs.entrance.r', 'ui.noted']);
    g.choose('stairs.lift');
    g.choose('stairs.timetable');
    const p = g.state.display.find((x) => x.key === 'fun.shuttle.timetable')!;
    expect(t(p.key, p.params, 'en')).toBe('Beside the doors, behind scratched perspex, the shuttle timetable: *LAST SERVICE 18:15*. It is 02:49.');
    expect(t(p.key, p.params, 'zh-Hant-TW')).toContain('LAST SERVICE 18:15');
  });
});
