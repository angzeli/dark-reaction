/**
 * The Vellacott Building: locations and walking times (docs/DESIGN.md §4).
 * All Level 4 rooms are a minute apart and a minute from the stairwell; the
 * basement is two minutes down; the roof two minutes up.
 */
import type { EdgeDef, LocationDef, LocationId } from '../engine/types.ts';

export const LEVEL_4: LocationId[] = ['office', 'synth', 'glovebox', 'pi'];

export const LOCATIONS: LocationDef[] = [
  { id: 'office', name: 'loc.office.name', hub: 'office.hub', art: 'office', ambience: 'office' },
  { id: 'synth', name: 'loc.synth.name', hub: 'synth.hub', art: 'synth', ambience: 'synth' },
  { id: 'glovebox', name: 'loc.glovebox.name', hub: 'glovebox.hub', art: 'glovebox', ambience: 'glovebox' },
  {
    id: 'pi',
    name: 'loc.pi.name',
    hub: 'pi.hub',
    // Locked except while the porter cleans it: Mondays 03:15–03:18 (minutes 28–31).
    entry: [{ if: { any: [{ minuteLt: 28 }, { minuteGte: 31 }] }, scene: 'pi.door' }],
    art: 'pi',
    ambience: 'pi',
  },
  { id: 'stairs', name: 'loc.stairs.name', hub: 'stairs.hub', art: 'stairs', ambience: 'stairs' },
  { id: 'nmr', name: 'loc.nmr.name', hub: 'nmr.hub', art: 'nmr', ambience: 'nmr' },
  { id: 'cold', name: 'loc.cold.name', hub: 'cold.hub', art: 'cold', ambience: 'cold' },
  { id: 'roof', name: 'loc.roof.name', hub: 'roof.hub', art: 'roof', ambience: 'roof' },
];

const level4Pairs: EdgeDef[] = LEVEL_4.flatMap((a, i) => LEVEL_4.slice(i + 1).map((b) => ({ a, b, minutes: 1 })));

export const EDGES: EdgeDef[] = [
  ...level4Pairs,
  ...LEVEL_4.map((a): EdgeDef => ({ a, b: 'stairs', minutes: 1 })),
  { a: 'stairs', b: 'nmr', minutes: 2 },
  { a: 'stairs', b: 'cold', minutes: 2 },
  { a: 'nmr', b: 'cold', minutes: 1 },
  { a: 'stairs', b: 'roof', minutes: 2 },
];

/** Porter's Monday windows (loop minutes). */
export const PI_OPEN = { from: 28, to: 31 } as const; // 03:15–03:18
export const EXIT_B_OPEN = { from: 34, to: 37 } as const; // 03:21–03:24
