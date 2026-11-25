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
