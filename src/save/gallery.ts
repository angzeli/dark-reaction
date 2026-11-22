/**
 * The ending gallery (結局一覽) and new game+ memory. Stored under its own
 * key, apart from save slots: starting a new game, deleting a slot or
 * importing a save never touches it.
 */
import type { EndingId } from '../engine/types.ts';
import type { KV } from './storage.ts';

export const GALLERY_KEY = 'dark-reaction.gallery.v1';
export const ENDING_ORDER: readonly EndingId[] = ['perfect', 'honest', 'clocking', 'infinite', 'dark', 'fire'];

export interface GalleryData {
  v: 1;
  endings: Partial<Record<EndingId, { first: string; count: number }>>;
  /** Puzzles solved in any playthrough that reached an ending. */
  solved: string[];
}

const empty = (): GalleryData => ({ v: 1, endings: {}, solved: [] });

export class Gallery {
  private readonly kv: KV;
  private readonly now: () => Date;

  constructor(kv: KV, now: () => Date = () => new Date()) {
    this.kv = kv;
    this.now = now;
  }

  /** The raw stored object (kept whole so fields from newer builds survive), or null. */
  private raw(): { value: Record<string, unknown> | null; unreadable: string | null } {
    const text = this.kv.get(GALLERY_KEY);
    if (!text) return { value: null, unreadable: null };
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { value: parsed as Record<string, unknown>, unreadable: null };
    } catch {
      /* fall through */
    }
    return { value: null, unreadable: text };
  }

  data(): GalleryData {
    const { value } = this.raw();
    const out = empty();
    if (!value) return out;
    const endings = value['endings'];
    if (endings && typeof endings === 'object') {
      for (const id of ENDING_ORDER) {
        const e = (endings as Record<string, unknown>)[id] as { first?: unknown; count?: unknown } | undefined;
        if (e && typeof e.first === 'string' && typeof e.count === 'number') out.endings[id] = { first: e.first, count: e.count };
      }
    }
    if (Array.isArray(value['solved'])) out.solved = value['solved'].filter((x): x is string => typeof x === 'string');
    return out;
  }

  /**
   * Record an ending and the puzzles solved on the way. Called the moment
   * an ending is reached, before the epilogue plays, so closing the tab
   * mid-epilogue still counts. Never discards what is already stored: the
   * new data is merged into the stored object (fields from newer builds
   * are kept), and text that cannot be read is backed up before it is
   * replaced.
   */
  recordEnding(id: EndingId, solved: readonly string[]): boolean {
    const { value, unreadable } = this.raw();
    if (unreadable !== null) this.kv.set(`${GALLERY_KEY}.unreadable`, unreadable);
    const base: Record<string, unknown> = value ?? {};
    const endings = base['endings'] && typeof base['endings'] === 'object' && !Array.isArray(base['endings']) ? { ...(base['endings'] as Record<string, unknown>) } : {};
    const prev = endings[id] as { first?: unknown; count?: unknown } | undefined;
    endings[id] = {
      first: typeof prev?.first === 'string' ? prev.first : this.now().toISOString(),
      count: (typeof prev?.count === 'number' ? prev.count : 0) + 1,
    };
    const oldSolved = Array.isArray(base['solved']) ? base['solved'].filter((x): x is string => typeof x === 'string') : [];
    return this.kv.set(GALLERY_KEY, JSON.stringify({ ...base, v: 1, endings, solved: [...new Set([...oldSolved, ...solved])] }));
  }

  found(): EndingId[] {
    const data = this.data();
    return ENDING_ORDER.filter((id) => data.endings[id]);
  }

  /** Puzzles to pencil into the margins of a new game: only after a first ending. */
  margins(): string[] {
    const data = this.data();
    return Object.keys(data.endings).length > 0 ? data.solved : [];
  }
}
