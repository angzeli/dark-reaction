import type { EdgeDef, LocationId } from './types.ts';

export type DistanceTable = Map<LocationId, Map<LocationId, number>>;

/**
 * All-pairs shortest travel times (Floyd–Warshall; eight rooms, so cost is
 * irrelevant). Walking between two rooms costs the quickest route.
 */
export function distances(locations: readonly LocationId[], edges: readonly EdgeDef[]): DistanceTable {
  const d: DistanceTable = new Map();
  for (const a of locations) {
    const row = new Map<LocationId, number>();
    for (const b of locations) row.set(b, a === b ? 0 : Infinity);
    d.set(a, row);
  }
  for (const { a, b, minutes } of edges) {
    if (!d.has(a) || !d.has(b)) throw new Error(`Edge ${a}–${b} names an unknown location`);
    const ab = Math.min(d.get(a)!.get(b)!, minutes);
    d.get(a)!.set(b, ab);
    d.get(b)!.set(a, ab);
  }
  for (const k of locations)
    for (const i of locations)
      for (const j of locations) {
        const via = d.get(i)!.get(k)! + d.get(k)!.get(j)!;
        if (via < d.get(i)!.get(j)!) d.get(i)!.set(j, via);
      }
  return d;
}

export function travelTime(table: DistanceTable, from: LocationId, to: LocationId): number {
  const t = table.get(from)?.get(to);
  if (t === undefined || !Number.isFinite(t)) throw new Error(`No route from ${from} to ${to}`);
  return t;
}
