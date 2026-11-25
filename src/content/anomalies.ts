/**
 * The anomaly registry (docs/HUMOUR.md §2): everything in the building that isn't in the manual. Each
 * entry says how it is found, where, in what register and with which keys. Content records a find with
 * `{ anomaly: id }`; the console and the UI call `Game.discover(id)`. tests/anomalies.test.ts triggers
 * every entry, and the validator checks the tone of the scene each one lives in.
 */
import type { AnomalyDef } from '../engine/types.ts';

export const ANOMALIES: AnomalyDef[] = [];
