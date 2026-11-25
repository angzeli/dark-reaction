import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import type { GameState } from '../src/engine/types.ts';
import { t } from '../src/i18n/i18n.ts';
import { ENDING_ORDER, Gallery, GALLERY_KEY } from '../src/save/gallery.ts';
import { fitToContent, parseSave, SAVE_SCHEMA, SaveStore, stateProblem } from '../src/save/saves.ts';
import { browserStorage, memoryStorage, wrapStorage, type KV } from '../src/save/storage.ts';
import { miniContent } from './fixtures/mini.ts';

const at = (iso: string) => ({ now: () => new Date(iso) });
const content = miniContent();

function playedState(): GameState {
  const g = new Game(miniContent());
  while (g.takeCard());
  g.choose('office.mug');
  g.choose('office.yield');
  g.choose('office.kettle');
  return g.state;
}
const envelopeText = (state: unknown) => JSON.stringify({ game: 'dark-reaction', schema: SAVE_SCHEMA, savedAt: '2026-11-23T03:00:00Z', state });

describe('save slots', () => {
  it('round-trip a state through every slot, with a summary for labels', () => {
    const store = new SaveStore(memoryStorage(), at('2026-11-23T03:15:00Z'));
    const state = playedState();
    for (const slot of ['auto', '1', '2', '3'] as const) {
      expect(store.write(slot, state, 'zh-Hant-TW')).toBe(true);
      const r = store.read(slot);
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      expect(r.migrated).toBe(false);
      expect(r.envelope.state).toEqual(state);
      expect(r.envelope).toMatchObject({ game: 'dark-reaction', schema: SAVE_SCHEMA, savedAt: '2026-11-23T03:15:00.000Z', locale: 'zh-Hant-TW' });
      expect(r.envelope.summary).toEqual({ loop: 1, act: 1, minute: state.minute, location: 'office', ending: null, known: 2 });
    }
  });

  it('save a snapshot, not a live reference', () => {
    const store = new SaveStore(memoryStorage());
    const g = new Game(miniContent());
    while (g.takeCard());
    store.write('1', g.state);
    g.choose('office.kettle');
    const r = store.read('1');
    expect(r.ok && r.envelope.state.minute).toBe(0);
  });

  it('report empty slots and delete without touching others', () => {
    const store = new SaveStore(memoryStorage());
    store.write('2', playedState());
    store.write('3', playedState());
    expect(store.read('1')).toEqual({ ok: false, reason: 'empty' });
    store.remove('2');
    expect(store.read('2')).toEqual({ ok: false, reason: 'empty' });
    expect(store.read('3').ok).toBe(true);
  });

  it('continue from the most recently written unfinished slot, by time not by slot order', () => {
    let t = '2026-11-23T03:00:00Z';
    const store = new SaveStore(memoryStorage(), { now: () => new Date(t) });
    store.write('auto', playedState());
    t = '2026-11-23T03:10:00Z';
    store.write('2', playedState());
    t = '2026-11-23T03:20:00Z';
    const finished = playedState();
    finished.ending = 'honest';
    store.write('3', finished);
    expect(store.latest()).toBe('2');
  });

  it('report a write that cannot be serialised instead of throwing', () => {
    const store = new SaveStore(memoryStorage());
    const state = playedState();
    (state.puzzleData as Record<string, unknown>)['loop'] = state; // circular
    expect(store.write('auto', state)).toBe(false);
    expect(store.exportText(state)).toBeNull();
  });
});

describe('refusing bad saves', () => {
  it('refuses corrupt JSON, foreign files, newer versions and broken states with a reason', () => {
    expect(parseSave('{not json')).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(parseSave('[]')).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseSave(JSON.stringify({ game: 'other-game', schema: 1, state: {} }))).toMatchObject({ ok: false, reason: 'invalid' });
    expect(parseSave(JSON.stringify({ game: 'dark-reaction', schema: SAVE_SCHEMA + 1, state: {} }))).toMatchObject({ ok: false, reason: 'future' });
    expect(parseSave(envelopeText({ ...playedState(), minute: 99 }))).toMatchObject({ ok: false, reason: 'corrupt', detail: 'minute is out of range' });
  });

  it('refuses elements of the wrong shape that would crash the engine later', () => {
    const s = playedState();
    const bad: Array<[string, unknown]> = [
      ['known', [null]],
      ['known', ['nb.mug']],
      ['known', [...s.known, s.known[0]]],
      ['fudges', [null]],
      ['cards', [{ kind: 'nonsense' }]],
      ['display', [{ key: 1, style: 'text' }]],
      ['inventory', [3]],
      ['hints', { demo: 'two' }],
    ];
    for (const [field, value] of bad) {
      expect(parseSave(envelopeText({ ...s, [field]: value })), `${field}: ${JSON.stringify(value)}`).toMatchObject({ ok: false, reason: 'corrupt' });
    }
  });

  it('refuses absurdly deep nesting before it can blow the stack', () => {
    const marker = '"__deep__"';
    const deep = '{"x":'.repeat(5000) + '{}' + '}'.repeat(5000);
    const text = envelopeText({ ...playedState(), puzzleData: '__deep__' }).replace(marker, deep);
    expect(parseSave(text)).toMatchObject({ ok: false, reason: 'corrupt' });
    const store = new SaveStore(memoryStorage());
    expect(() => store.importText(text)).not.toThrow();
    // Moderately deep (but over the limit) parses fine and is refused for depth.
    const moderate = envelopeText({ ...playedState(), puzzleData: '__deep__' }).replace(marker, '{"x":'.repeat(40) + '{}' + '}'.repeat(40));
    expect(parseSave(moderate)).toMatchObject({ ok: false, reason: 'corrupt', detail: 'nested too deeply' });
  });

  it('refuses a bare state that claims a newer version', () => {
    expect(parseSave(JSON.stringify({ ...playedState(), v: SAVE_SCHEMA + 6 }))).toMatchObject({ ok: false, reason: 'future' });
  });

  it('a slot with a bad save does not stop the others from loading', () => {
    const kv = memoryStorage();
    const store = new SaveStore(kv);
    store.write('1', playedState());
    kv.set(SaveStore.key('2'), '{oops');
    const list = store.list();
    expect(list.find((l) => l.slot === '1')?.result.ok).toBe(true);
    expect(list.find((l) => l.slot === '2')?.result).toMatchObject({ ok: false, reason: 'corrupt' });
  });

  it('stateProblem accepts real states', () => {
    expect(stateProblem(playedState())).toBeNull();
  });
});

describe('fitting saves to this build’s content', () => {
  it('puts you back in the room if your scene was renamed, and closes a puzzle that no longer exists', () => {
    const s = playedState();
    s.scene = 'office.renamed';
    s.puzzle = 'gone';
    s.darkRun = true;
    expect(fitToContent(s, content)).toBeNull();
    expect(s).toMatchObject({ scene: 'office.hub', puzzle: null, darkRun: false });
    // And the repaired state runs.
    const g = new Game(miniContent(), s);
    expect(g.choices().length).toBeGreaterThan(0);
  });

  it('refuses a location or an ending the game no longer has', () => {
    const store = new SaveStore(memoryStorage(), { content });
    expect(store.importText(envelopeText({ ...playedState(), location: 'basement2' }))).toMatchObject({ ok: false, reason: 'incompatible' });
    expect(store.importText(envelopeText({ ...playedState(), ending: 'secret7' }))).toMatchObject({ ok: false, reason: 'incompatible' });
  });
});

describe('migrations', () => {
  const v0 = readFileSync(new URL('./fixtures/save-v0.json', import.meta.url), 'utf8');

  it('migrate the frozen v0 prototype save (bare state, no actLoop) to the current schema, once', () => {
    const kv = memoryStorage();
    kv.set(SaveStore.key('1'), v0);
    const store = new SaveStore(kv, { content });
    const r = store.read('1');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.migrated).toBe(true);
    expect(r.envelope.schema).toBe(SAVE_SCHEMA);
    expect(r.envelope.state).toMatchObject({ v: SAVE_SCHEMA, actLoop: 1, loop: 1, minute: 2, anomalies: [], achievements: [] });
    // The migrated save loads into the engine and plays on.
    const g = new Game(miniContent(), r.envelope.state);
    g.choose('office.sofa');
    expect(g.state.minute).toBe(12);
    // Written back in the current format, so the next read is not a migration.
    const stored = parseSave(kv.get(SaveStore.key('1')));
    expect(stored.ok).toBe(true);
    expect(stored.ok && stored.migrated).toBe(false);
    expect(JSON.parse(kv.get(SaveStore.key('1'))!).schema).toBe(SAVE_SCHEMA);
  });

  it('load a real v1.0.0 save (schema 1, made by the v1.0.1 engine) with nothing lost (#203)', () => {
    const text = readFileSync(new URL('./fixtures/save-v1.0.0.json', import.meta.url), 'utf8');
    const before = JSON.parse(text) as { schema: number; locale: string; savedAt: string; state: Record<string, unknown> };
    expect(before.schema).toBe(1);
    const r = parseSave(text, CONTENT);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.migrated).toBe(true);
    expect(r.envelope).toMatchObject({ schema: SAVE_SCHEMA, locale: before.locale, savedAt: before.savedAt });
    // Every field the v1.0.0 state had is still there, unchanged; the new ones start empty; and, being
    // mid-night, it is wearing its lanyard (schema 3, #204).
    const { v: _v, anomalies, achievements, inventory, ...rest } = r.envelope.state;
    const { v: _old, inventory: had, ...was } = before.state as { inventory: string[] } & Record<string, unknown>;
    expect(rest).toEqual(was);
    expect({ anomalies, achievements }).toEqual({ anomalies: [], achievements: [] });
    expect(inventory).toEqual(['item.lanyard', ...had]);
    // And it plays on in this build: the same choices are offered as before.
    const g = new Game(CONTENT, r.envelope.state);
    expect(g.choices().length).toBeGreaterThan(0);
    expect(g.state.inventory).toContain('item.vial');
  });

  it('give a v0 save from a later act its act loop as the current loop', () => {
    const raw = JSON.parse(v0);
    const r = parseSave(JSON.stringify({ ...raw, act: 2, loop: 6 }));
    expect(r.ok && r.envelope.state.actLoop).toBe(6);
  });
});

describe('export and import', () => {
  it('round-trip through text', () => {
    const store = new SaveStore(memoryStorage(), { content });
    const state = playedState();
    const text = store.exportText(state, 'en')!;
    expect(text).toContain('"game": "dark-reaction"');
    const r = store.importText(text);
    expect(r.ok && r.envelope.state).toEqual(state);
  });

  it('refuse garbage and drop an unknown locale', () => {
    const store = new SaveStore(memoryStorage());
    expect(store.importText('hello')).toMatchObject({ ok: false, reason: 'corrupt' });
    expect(store.importText('')).toMatchObject({ ok: false, reason: 'empty' });
    const r = store.importText(JSON.stringify({ ...JSON.parse(envelopeText(playedState())), locale: 'klingon' }));
    expect(r.ok && r.envelope.locale).toBeUndefined();
  });
});

describe('the gallery', () => {
  it('records endings and solved puzzles; margins appear only after a first ending', () => {
    const gallery = new Gallery(memoryStorage(), () => new Date('2026-11-23T06:12:00Z'));
    expect(gallery.found()).toEqual([]);
    expect(gallery.margins()).toEqual([]);
    gallery.recordEnding('honest', ['tlc', 'glovebox']);
    gallery.recordEnding('fire', ['tlc', 'doorlog']);
    gallery.recordEnding('honest', []);
    expect(gallery.found()).toEqual(['honest', 'fire']);
    expect(gallery.data().endings.honest).toEqual({ first: '2026-11-23T06:12:00.000Z', count: 2 });
    expect(gallery.margins().sort()).toEqual(['doorlog', 'glovebox', 'tlc']);
  });

  it('survives new games, slot deletion and imports, because it lives under its own key', () => {
    const kv = memoryStorage();
    const gallery = new Gallery(kv);
    const store = new SaveStore(kv);
    gallery.recordEnding('clocking', ['tlc']);
    store.write('1', playedState());
    for (const slot of ['auto', '1', '2', '3'] as const) store.remove(slot);
    store.importText(store.exportText(playedState())!);
    expect(new Gallery(kv).found()).toEqual(['clocking']);
  });

  it('never wipes what it has: a damaged field keeps the rest, and newer fields survive a write', () => {
    const kv = memoryStorage();
    kv.set(GALLERY_KEY, JSON.stringify({ v: 1, endings: { honest: { first: 'x', count: 3 }, futureEnding: { first: 'y', count: 1 } }, solved: 'oops', extra: 42 }));
    const gallery = new Gallery(kv);
    expect(gallery.found()).toEqual(['honest']);
    gallery.recordEnding('dark', ['schlenk']);
    const stored = JSON.parse(kv.get(GALLERY_KEY)!);
    expect(stored.endings.honest).toEqual({ first: 'x', count: 3 });
    expect(stored.endings.futureEnding).toEqual({ first: 'y', count: 1 });
    expect(stored.extra).toBe(42);
    expect(stored.solved).toEqual(['schlenk']);
  });

  it('can name and hint at all six endings in both languages, found or not', () => {
    expect(ENDING_ORDER).toHaveLength(6);
    for (const id of ENDING_ORDER) {
      for (const locale of ['en', 'zh-Hant-TW'] as const) {
        for (const key of [`ending.${id}.title`, `ending.${id}.clue`]) expect(t(key, {}, locale), `${key} ${locale}`).not.toMatch(/^\[\[/);
      }
    }
  });

  it('backs up unreadable gallery text before replacing it', () => {
    const kv = memoryStorage();
    kv.set(GALLERY_KEY, '{broken');
    const gallery = new Gallery(kv);
    expect(gallery.found()).toEqual([]);
    gallery.recordEnding('perfect', []);
    expect(gallery.found()).toEqual(['perfect']);
    expect(kv.get(`${GALLERY_KEY}.unreadable`)).toBe('{broken');
  });
});

describe('storage that misbehaves', () => {
  const throwing = (opts: { readable: boolean }): Storage => {
    const data = new Map<string, string>([['dark-reaction.save.auto', 'old']]);
    return {
      getItem: (k: string) => {
        if (!opts.readable) throw new Error('SecurityError');
        return data.get(k) ?? null;
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
      key: (i: number) => [...data.keys()][i] ?? null,
      get length(): number {
        if (!opts.readable) throw new Error('SecurityError');
        return data.size;
      },
      clear: () => undefined,
    } as unknown as Storage;
  };
  const original = globalThis.localStorage;
  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: original, configurable: true, writable: true });
  });

  it('never throws: writes report failure, reads report empty', () => {
    const kv: KV = wrapStorage(throwing({ readable: false }));
    const store = new SaveStore(kv);
    expect(store.write('auto', playedState())).toBe(false);
    expect(store.read('auto')).toEqual({ ok: false, reason: 'empty' });
    expect(store.list()).toHaveLength(4);
    expect(() => store.remove('1')).not.toThrow();
    expect(new Gallery(kv).recordEnding('dark', [])).toBe(false);
  });

  it('a full quota does not hide existing saves: storage stays local and only writes fail', () => {
    Object.defineProperty(globalThis, 'localStorage', { value: throwing({ readable: true }), configurable: true, writable: true });
    const kv = browserStorage();
    expect(kv.persistent).toBe(true);
    expect(kv.get('dark-reaction.save.auto')).toBe('old');
    expect(kv.set('x', 'y')).toBe(false);
  });

  it('falls back to memory only when storage cannot even be read', () => {
    Object.defineProperty(globalThis, 'localStorage', { value: throwing({ readable: false }), configurable: true, writable: true });
    expect(browserStorage().persistent).toBe(false);
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true, writable: true });
    const kv = browserStorage();
    expect(kv.persistent).toBe(false);
    expect(kv.set('a', 'b')).toBe(true);
    expect(kv.get('a')).toBe('b');
  });
});
