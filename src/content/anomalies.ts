/**
 * The anomaly registry (docs/HUMOUR.md §2): everything in the building that isn't in the manual. Each
 * entry says how it is found, where, in what register and with which keys. Content records a find with
 * `{ anomaly: id }`; the console and the UI call `Game.discover(id)`. tests/anomalies.test.ts triggers
 * every entry, and the validator checks the tone of the scene each one lives in.
 */
import type { AnomalyDef, AnomalySetup } from '../engine/types.ts';
import { KONAMI } from '../ui/eggs.ts';
import { SQUID_ROOMS, squidId } from './squid.ts';

const hub = (scene: string, extra: AnomalySetup = {}): AnomalySetup => ({ scene, ...extra });
/** Where each room's squid is drawn: its hub, or, where the hub is full, its small things. */
const SQUID_SCENE: Record<(typeof SQUID_ROOMS)[number], string> = { synth: 'synth.around', stairs: 'stairs.lift', cold: 'cold.hub', glovebox: 'glovebox.hub', roof: 'roof.hub', office: 'office.around' };
const cmd = (id: string, command: string, key: string, more: string[] = [], achievement?: string): AnomalyDef => ({
  id: `cmd.${id}`,
  trigger: { kind: 'command', command },
  scene: 'puzzle:console',
  tone: 'calm',
  keys: [key, ...more],
  acts: [1, 2],
  ...(achievement ? { achievement } : {}),
});

export const ANOMALIES: AnomalyDef[] = [
  // ── Campus in-jokes (§4) ──────────────────────────────────────────────────
  { id: 'plate', trigger: { kind: 'choice', choice: 'office.plate', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.plate'], acts: [1, 2] },
  { id: 'shuttle.timetable', trigger: { kind: 'choice', choice: 'stairs.entrance', setup: hub('stairs.hub', { minute: 4 }) }, scene: 'stairs.hub', tone: 'calm', keys: ['fun.shuttle.timetable'] },
  { id: 'lanyard.off', trigger: { kind: 'choice', choice: 'office.lanyard.off', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.lanyard.off'] },
  { id: 'lift', trigger: { kind: 'choice', choice: 'stairs.lift', setup: hub('stairs.hub', { loop: 2 }) }, scene: 'stairs.lift', tone: 'calm', keys: ['fun.lift.r', 'fun.lift.again', 'stairs.lift.act3'] },
  { id: 'labdoor', trigger: { kind: 'choice', choice: 'synth.door.0', setup: hub('synth.hub') }, scene: 'synth.hub', tone: 'calm', keys: ['fun.labdoor', 'fun.labdoor.poster.0'], acts: [1, 2] },
  { id: 'toilets', trigger: { kind: 'choice', choice: 'stairs.toilets', setup: hub('stairs.lift') }, scene: 'stairs.toilets', tone: 'calm', keys: ['stairs.toilets.text'] },
  // ── The title screen (§7) ───────────────────────────────────────────────────
  { id: 'credits', trigger: { kind: 'panel', panel: 'credits' }, scene: 'ui:title', tone: 'calm', keys: ['credits.reviewer'], achievement: 'uncredited' },
  // ── The hidden eggs (§7) ──────────────────────────────────────────────────
  { id: 'slide', trigger: { kind: 'keys', keys: KONAMI }, scene: 'ui:play', tone: 'calm', keys: ['slide.preliminary', 'slide.promising', 'slide.future', 'slide.footer', 'slide.close'], achievement: 'slide' },
  { id: 'bed', trigger: { kind: 'clock', at: '03:33' }, scene: 'ui:title', tone: 'calm', keys: ['title.egg.bed'], achievement: 'bed' },
  { id: 'mole', trigger: { kind: 'date', month: 10, day: 23 }, scene: 'ui:title', tone: 'calm', keys: ['title.egg.mole'], achievement: 'mole' },
  ...SQUID_ROOMS.map(
    (room, i): AnomalyDef => ({
      id: squidId(room),
      trigger: { kind: 'choice', choice: squidId(room), setup: { loop: i + 1, scene: SQUID_SCENE[room] } },
      scene: SQUID_SCENE[room],
      tone: 'calm',
      keys: [`fun.squid.${room}`],
      acts: [1, 2],
    }),
  ),
  { id: 'darkcontrol', trigger: { kind: 'lightsout', rule: 'lo.darkcontrol', setup: { scene: 'synth.darkroom', minute: 45, lflags: ['dark.control'], known: ['nb.reset'] } }, scene: 'synth.darkroom', tone: 'calm', keys: ['nb.darkcontrol.body'], acts: [1, 2], achievement: 'dark' },
  { id: 'balance', trigger: { kind: 'choice', choice: 'synth.tare.3', setup: hub('synth.around', { lflags: ['tare.1', 'tare.2'] }) }, scene: 'synth.around', tone: 'calm', keys: ['fun.tare.1', 'fun.tare.2', 'fun.tare.3'], acts: [1, 2], achievement: 'yield' },
  // ── The rooms (§8) ────────────────────────────────────────────────────────
  { id: 'coshh', trigger: { kind: 'choice', choice: 'office.pencil', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.pencil'], acts: [1, 2], achievement: 'coshh' },
  { id: 'sorry', trigger: { kind: 'choice', choice: 'synth.sorry', setup: hub('synth.hub', { usedLoop: ['synth.hoods'] }) }, scene: 'synth.hub', tone: 'calm', keys: ['synth.sorry', 'fun.sorry'], acts: [1, 2], achievement: 'sorry' },
  { id: 'pa.test', trigger: { kind: 'event', event: 'ev.pa.test', setup: hub('stairs.hub', { minute: 7 }) }, scene: 'stairs.hub', tone: 'calm', keys: ['fun.pa.test'], acts: [1, 2] },
  { id: 'pa.car', trigger: { kind: 'event', event: 'ev.pa.car', setup: hub('roof.hub', { minute: 24 }) }, scene: 'roof.hub', tone: 'calm', keys: ['fun.pa.car'], acts: [1, 2] },
  // ── Cameos (§8): at most one in each place ──────────────────────────────────
  { id: 'cameo.macbook', trigger: { kind: 'choice', choice: 'office.macbook', setup: hub('office.around') }, scene: 'office.around', tone: 'calm', keys: ['fun.macbook'], acts: [1, 2] },
  { id: 'cameo.whiteboard', trigger: { kind: 'choice', choice: 'synth.whiteboard', setup: hub('synth.around') }, scene: 'synth.around', tone: 'calm', keys: ['synth.whiteboard.r'] },
  { id: 'cameo.boforge', trigger: { kind: 'choice', choice: 'glovebox.terminal', setup: hub('glovebox.hub') }, scene: 'glovebox.hub', tone: 'calm', keys: ['glovebox.terminal.r'] },
  { id: 'cameo.rack', trigger: { kind: 'choice', choice: 'nmr.rack', setup: hub('nmr.hub') }, scene: 'nmr.hub', tone: 'calm', keys: ['fun.rack'], acts: [1, 2] },
  { id: 'cameo.railing', trigger: { kind: 'choice', choice: 'roof.railing', setup: hub('roof.hub') }, scene: 'roof.hub', tone: 'calm', keys: ['roof.railing.r'] },
  // ── The console's hidden commands (§5): Acts I–II; in Act III it stops joking ─
  cmd('sudo', 'sudo', 'console.out.sudo', [], 'reported'),
  cmd('rm', 'rm -rf /', 'console.out.rm'),
  cmd('xyzzy', 'xyzzy', 'console.out.xyzzy'),
  cmd('vasp', 'vasp', 'console.out.vasp'),
  cmd('orca', 'orca', 'console.out.orca'),
  cmd('g16', 'g16', 'console.out.g16', [], 'normal'),
  cmd('coffee', 'make coffee', 'console.out.coffee'),
  cmd('ping', 'ping supervisor', 'console.out.ping', [], 'reply'),
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
