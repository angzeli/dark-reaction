/**
 * The ending gallery (結局一覽) and new game+ memory. Stored under its own
 * key, apart from save slots: starting a new game, deleting a slot or
 * importing a save never touches it.
 *
 * From v1.1.0 (gallery v2, docs/HUMOUR.md §2) it also keeps every anomaly
 * found and every achievement earned, in any playthrough. A v1 gallery is
 * read as it is (none of either yet); the key keeps its old name.
 */
import type { EndingId } from '../engine/types.ts';
import type { KV } from './storage.ts';

export const GALLERY_KEY = 'dark-reaction.gallery.v1';
export const ENDING_ORDER: readonly EndingId[] = ['perfect', 'honest', 'clocking', 'infinite', 'dark', 'fire'];

export interface GalleryData {
  v: 1 | 2;
  endings: Partial<Record<EndingId, { first: string; count: number }>>;
  /** Puzzles solved in any playthrough that reached an ending. */
  solved: string[];
  /** Anomalies found, in any playthrough (v2). */
  anomalies: string[];
  /** Achievements earned, with when each was first earned (v2). */
  achievements: Record<string, string>;
}

const empty = (): GalleryData => ({ v: 1, endings: {}, solved: [], anomalies: [], achievements: {} });
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const stamps = (v: unknown): Record<string, string> => {
  const out: Record<string, string> = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) for (const [k, s] of Object.entries(v)) if (typeof s === 'string') out[k] = s;
  return out;
};

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
    out.solved = strings(value['solved']);
    out.anomalies = strings(value['anomalies']);
    out.achievements = stamps(value['achievements']);
    if (value['v'] === 2) out.v = 2;
    return out;
  }

  /**
   * Keep what a playthrough has found and earned: merged into what's stored, never replacing it, with
   * fields from newer builds kept. Returns the achievements that are new to the gallery (to announce).
   */
  recordFinds(anomalies: readonly string[], achievements: readonly string[]): string[] {
    const { value, unreadable } = this.raw();
    const base: Record<string, unknown> = value ?? {};
    // Kept as stored, whatever shape a newer build gave their entries; only new ids are added.
    const had: unknown[] = Array.isArray(base['anomalies']) ? [...base['anomalies']] : [];
    const earned: Record<string, unknown> = base['achievements'] && typeof base['achievements'] === 'object' && !Array.isArray(base['achievements']) ? { ...(base['achievements'] as Record<string, unknown>) } : {};
    const newAnomalies = [...new Set(anomalies)].filter((id) => !had.includes(id));
    const fresh = [...new Set(achievements)].filter((id) => !(id in earned));
    if (!newAnomalies.length && !fresh.length) return [];
    // Unreadable text is backed up first, or not replaced at all.
    if (unreadable !== null && !this.kv.set(`${GALLERY_KEY}.unreadable`, unreadable)) return [];
    const now = this.now().toISOString();
    for (const id of fresh) earned[id] = now;
    const v = typeof base['v'] === 'number' && base['v'] > 2 ? base['v'] : 2;
    const ok = this.kv.set(GALLERY_KEY, JSON.stringify({ ...base, v, anomalies: [...had, ...newAnomalies], achievements: earned }));
    return ok ? fresh : [];
  }

  /** What earlier playthroughs found, for a new game (newGameState's `found`). */
  finds(): { anomalies: string[]; achievements: string[] } {
    const data = this.data();
    return { anomalies: data.anomalies, achievements: Object.keys(data.achievements) };
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
    // Unreadable text is backed up first, or not replaced at all.
    if (unreadable !== null && !this.kv.set(`${GALLERY_KEY}.unreadable`, unreadable)) return false;
    const base: Record<string, unknown> = value ?? {};
    const endings = base['endings'] && typeof base['endings'] === 'object' && !Array.isArray(base['endings']) ? { ...(base['endings'] as Record<string, unknown>) } : {};
    const prev = endings[id] as { first?: unknown; count?: unknown } | undefined;
    endings[id] = {
      first: typeof prev?.first === 'string' ? prev.first : this.now().toISOString(),
      count: (typeof prev?.count === 'number' ? prev.count : 0) + 1,
    };
    const oldSolved = Array.isArray(base['solved']) ? base['solved'].filter((x): x is string => typeof x === 'string') : [];
    // A newer gallery keeps its version; this build never lowers it.
    const v = typeof base['v'] === 'number' && base['v'] > 1 ? base['v'] : 1;
    return this.kv.set(GALLERY_KEY, JSON.stringify({ ...base, v, endings, solved: [...new Set([...oldSolved, ...solved])] }));
  }

  /** The endings reached, in gallery order. */
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
