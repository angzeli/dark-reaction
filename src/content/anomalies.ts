/**
 * The anomaly registry (docs/HUMOUR.md §2): everything in the building that isn't in the manual. Each
 * entry says how it is found, where, in what register and with which keys. Content records a find with
 * `{ anomaly: id }`; the console and the UI call `Game.discover(id)`. tests/anomalies.test.ts triggers
 * every entry, and the validator checks the tone of the scene each one lives in.
 */
import type { AnomalyDef, AnomalySetup } from '../engine/types.ts';

const hub = (scene: string, extra: AnomalySetup = {}): AnomalySetup => ({ scene, ...extra });

export const ANOMALIES: AnomalyDef[] = [
  // ── Campus in-jokes (§4) ──────────────────────────────────────────────────
  { id: 'plate', trigger: { kind: 'choice', choice: 'office.plate', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.plate'], acts: [1, 2] },
  { id: 'shuttle.timetable', trigger: { kind: 'choice', choice: 'stairs.entrance', setup: hub('stairs.hub', { minute: 4 }) }, scene: 'stairs.hub', tone: 'calm', keys: ['fun.shuttle.timetable'] },
  { id: 'lanyard.off', trigger: { kind: 'choice', choice: 'office.lanyard.off', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.lanyard.off'] },
  { id: 'lift', trigger: { kind: 'choice', choice: 'stairs.lift', setup: hub('stairs.hub', { loop: 2 }) }, scene: 'stairs.lift', tone: 'calm', keys: ['fun.lift.r', 'fun.lift.again', 'stairs.lift.act3'] },
  { id: 'labdoor', trigger: { kind: 'choice', choice: 'synth.door.0', setup: hub('synth.hub') }, scene: 'synth.hub', tone: 'calm', keys: ['fun.labdoor', 'fun.labdoor.poster.0'], acts: [1, 2] },
  { id: 'toilets', trigger: { kind: 'choice', choice: 'stairs.toilets', setup: hub('stairs.lift') }, scene: 'stairs.toilets', tone: 'calm', keys: ['stairs.toilets.text'] },
  { id: 'corridor', trigger: { kind: 'choice', choice: 'pi.corridor', setup: hub('pi.door', { minute: 5 }) }, scene: 'pi.door', tone: 'calm', keys: ['fun.corridor'], acts: [1, 2] },
];
