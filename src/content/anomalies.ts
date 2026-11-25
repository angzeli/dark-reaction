/**
 * The anomaly registry (docs/HUMOUR.md §2): everything in the building that isn't in the manual. Each
 * entry says how it is found, where, in what register and with which keys. Content records a find with
 * `{ anomaly: id }`; the console and the UI call `Game.discover(id)`. tests/anomalies.test.ts triggers
 * every entry, and the validator checks the tone of the scene each one lives in.
 */
import type { AnomalyDef, AnomalySetup } from '../engine/types.ts';

const hub = (scene: string, extra: AnomalySetup = {}): AnomalySetup => ({ scene, ...extra });
const cmd = (id: string, command: string, key: string, more: string[] = []): AnomalyDef => ({
  id: `cmd.${id}`,
  trigger: { kind: 'command', command },
  scene: 'puzzle:console',
  tone: 'calm',
  keys: [key, ...more],
  acts: [1, 2],
});

export const ANOMALIES: AnomalyDef[] = [
  // ── Campus in-jokes (§4) ──────────────────────────────────────────────────
  { id: 'plate', trigger: { kind: 'choice', choice: 'office.plate', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.plate'], acts: [1, 2] },
  { id: 'shuttle.timetable', trigger: { kind: 'choice', choice: 'stairs.entrance', setup: hub('stairs.hub', { minute: 4 }) }, scene: 'stairs.hub', tone: 'calm', keys: ['fun.shuttle.timetable'] },
  { id: 'lanyard.off', trigger: { kind: 'choice', choice: 'office.lanyard.off', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.lanyard.off'] },
  { id: 'lift', trigger: { kind: 'choice', choice: 'stairs.lift', setup: hub('stairs.hub', { loop: 2 }) }, scene: 'stairs.lift', tone: 'calm', keys: ['fun.lift.r', 'fun.lift.again', 'stairs.lift.act3'] },
  { id: 'labdoor', trigger: { kind: 'choice', choice: 'synth.door.0', setup: hub('synth.hub') }, scene: 'synth.hub', tone: 'calm', keys: ['fun.labdoor', 'fun.labdoor.poster.0'], acts: [1, 2] },
  { id: 'toilets', trigger: { kind: 'choice', choice: 'stairs.toilets', setup: hub('stairs.lift') }, scene: 'stairs.toilets', tone: 'calm', keys: ['stairs.toilets.text'] },
  // ── The rooms (§8) ────────────────────────────────────────────────────────
  { id: 'coshh', trigger: { kind: 'choice', choice: 'office.pencil', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.pencil'], acts: [1, 2] },
  { id: 'sorry', trigger: { kind: 'choice', choice: 'synth.sorry', setup: hub('synth.hub', { usedLoop: ['synth.hoods'] }) }, scene: 'synth.hub', tone: 'calm', keys: ['synth.sorry', 'fun.sorry'], acts: [1, 2] },
  { id: 'pa.test', trigger: { kind: 'event', event: 'ev.pa.test', setup: hub('stairs.hub', { minute: 7 }) }, scene: 'stairs.hub', tone: 'calm', keys: ['fun.pa.test'], acts: [1, 2] },
  { id: 'pa.car', trigger: { kind: 'event', event: 'ev.pa.car', setup: hub('roof.hub', { minute: 24 }) }, scene: 'roof.hub', tone: 'calm', keys: ['fun.pa.car'], acts: [1, 2] },
  // ── The console's hidden commands (§5): Acts I–II; in Act III it stops joking ─
  cmd('sudo', 'sudo', 'console.out.sudo'),
  cmd('rm', 'rm -rf /', 'console.out.rm'),
  cmd('xyzzy', 'xyzzy', 'console.out.xyzzy'),
  cmd('vasp', 'vasp', 'console.out.vasp'),
  cmd('orca', 'orca', 'console.out.orca'),
  cmd('g16', 'g16', 'console.out.g16'),
  cmd('coffee', 'make coffee', 'console.out.coffee'),
  cmd('ping', 'ping supervisor', 'console.out.ping'),
  cmd('history', 'history', 'console.out.history'),
  cmd('uptime', 'uptime', 'console.out.uptime'),
  cmd('top', 'top', 'console.out.top'),
  cmd('man', 'man sleep', 'console.out.man'),
  cmd('blame', 'git blame', 'console.out.blame'),
  cmd('ls', 'ls', 'console.out.ls'),
  cmd('thesis', 'cat thesis_final_v7_FINAL_actually.docx', 'console.out.thesis', ['console.out.superseded']),
  cmd('shuttle', 'shuttle', 'console.out.shuttle'),
  cmd('who', 'who', 'console.out.who'),
  cmd('coshh', 'coshh', 'console.out.coshh'),
  { id: 'corridor', trigger: { kind: 'choice', choice: 'pi.corridor', setup: hub('pi.door', { minute: 5 }) }, scene: 'pi.door', tone: 'calm', keys: ['fun.corridor'], acts: [1, 2] },
];
