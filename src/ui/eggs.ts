/**
 * Anomalies found outside the game's actions (docs/HUMOUR.md §7): pure, so the App and the tests share
 * them. A panel of the UI that is an anomaly when opened; and, on the title screen, where there's no game
 * to record a find, the gallery keeps it with the achievement it earns.
 */
import type { Content } from '../engine/types.ts';
import type { Gallery } from '../save/gallery.ts';

/** Panels that are anomalies when opened: panel → anomaly id. */
export const PANEL_ANOMALIES: Readonly<Record<string, string>> = { credits: 'credits' };

/** Keep a find made with no game running (the title screen): the anomaly, and its achievement if it has one. */
export function keepOutside(content: Content, gallery: Gallery, id: string): void {
  const def = content.anomalies.find((a) => a.id === id);
  if (!def) return;
  gallery.recordFinds([id], def.achievement ? [def.achievement] : []);
}

/** ↑ ↑ ↓ ↓ ← → ← → B A: in a calm scene, the room becomes a group-meeting slide (docs/HUMOUR.md §7). */
export const KONAMI: readonly string[] = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** How far into the code the keys so far have got (0 to KONAMI.length), after one more key. */
export function konamiStep(progress: number, key: string): number {
  const k = key.length === 1 ? key.toLowerCase() : key;
  if (k === KONAMI[progress]) return progress + 1;
  // A wrong key can still be the start of the code (↑ ↑ ↑ ↓ ↓…).
  if (progress === 2 && k === 'ArrowUp') return 2;
  return k === KONAMI[0] ? 1 : 0;
}

/** Opening the game at 03:33 local time, or on Mole Day (23 October), changes the title's tagline. */
export function titleEgg(now: Date): 'bed' | 'mole' | null {
  if (now.getHours() === 3 && now.getMinutes() === 33) return 'bed';
  if (now.getMonth() === 9 && now.getDate() === 23) return 'mole';
  return null;
}

/** The first sentences of a page, for a slide's bullets: markup gone, each one short. */
export function bullets(texts: readonly string[], max = 4, width = 72): string[] {
  const sentences = texts
    .map((s) => s.replace(/\*/g, ''))
    .flatMap((s) => s.split(/(?<=[.!?。！？])\s*/u))
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.slice(0, max).map((s) => (s.length > width ? `${s.slice(0, width - 1).trimEnd()}…` : s));
}
