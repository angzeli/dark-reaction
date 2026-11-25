/**
 * Squiddy (docs/HUMOUR.md §7): a squid doodle, signed, in a different room each loop (Acts I–II).
 * Each sighting is an anomaly, kept in the gallery, so the three can be found across playthroughs;
 * all three earn Cephalopod Census and a page in the notebook.
 */
import type { ChoiceDef, Cond } from '../engine/types.ts';

/** In order: loop 1 the lab, 2 the glovebox room, 3 the office, then round again. */
export const SQUID_ROOMS = ['synth', 'glovebox', 'office'] as const;
export type SquidRoom = (typeof SQUID_ROOMS)[number];

export const squidId = (room: SquidRoom) => `squid.${room}`;

/** The doodle's look, for the scene it's in: there only on its loop of six, and never in Act III. */
export function squid(room: SquidRoom): ChoiceDef {
  return {
    id: squidId(room),
    label: 'squid.look',
    cost: 1,
    once: 'loop',
    if: { all: [{ loopMod: [SQUID_ROOMS.length, SQUID_ROOMS.indexOf(room)] }, { not: { act: 3 } }] },
    effects: [{ anomaly: squidId(room) }],
    text: [{ key: `fun.squid.${room}` }],
  };
}

/** All six found, in any playthrough. */
export const CENSUS: Cond = { all: SQUID_ROOMS.map((r) => ({ anomaly: squidId(r) })) };
