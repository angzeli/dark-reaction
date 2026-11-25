/**
 * P1 · NMR console (docs/DESIGN.md §11). A terminal on the departmental
 * spectrometer. `queue` shows only bookings you can manage; Ian's
 * quick-reference card mentions `--all`; `info 13` tells you what the
 * 03:33 booking is. Output is stored as locale keys so the transcript
 * re-renders in either language.
 *
 * It also answers to more than `help` admits (docs/HUMOUR.md §5): the hidden
 * commands, each an anomaly. In Act III the console stops joking, and they
 * are not found.
 */
import type { Act } from '../../engine/types.ts';
import type { PuzzleLogic } from '../types.ts';

/** A hidden command's answer → the anomaly it is. */
export const HIDDEN: Readonly<Record<string, string>> = {
  'console.out.sudo': 'cmd.sudo',
  'console.out.rm': 'cmd.rm',
  'console.out.xyzzy': 'cmd.xyzzy',
  'console.out.vasp': 'cmd.vasp',
  'console.out.g16': 'cmd.g16',
  'console.out.ping': 'cmd.ping',
  'console.out.history': 'cmd.history',
  'console.out.uptime': 'cmd.uptime',
  'console.out.top': 'cmd.top',
  'console.out.man': 'cmd.man',
  'console.out.blame': 'cmd.blame',
  'console.out.ls': 'cmd.ls',
  'console.out.thesis': 'cmd.thesis',
  'console.out.superseded': 'cmd.thesis',
  'console.out.shuttle': 'cmd.shuttle',
  'console.out.who': 'cmd.who',
};

/** The answer to a hidden command, or null (`c` is normalised: trimmed, lower case, single spaces). */
function hidden(c: string): string | null {
  if (c === 'sudo' || c.startsWith('sudo ')) return 'console.out.sudo';
  if (/^rm -(rf|fr) \/\*?$/.test(c)) return 'console.out.rm';
  if (c === 'xyzzy') return 'console.out.xyzzy';
  if (/^(mpirun( -np \d+)? )?vasp(_std|_gam|_ncl)?$/.test(c)) return 'console.out.vasp';
  if (c === 'g16' || c.startsWith('g16 ')) return 'console.out.g16';
  if (/^ping (supervisor|dan|pi|boss|ridley)$/.test(c)) return 'console.out.ping';
  if (c === 'history') return 'console.out.history';
  if (c === 'uptime') return 'console.out.uptime';
  if (c === 'top' || c === 'htop') return 'console.out.top';
  if (c === 'man sleep') return 'console.out.man';
  if (c === 'git blame' || c.startsWith('git blame ')) return 'console.out.blame';
  if (c === 'ls' || /^ls -[a-z]+$/.test(c)) return 'console.out.ls';
  // The real one, in whichever language ls listed it.
  if (c === 'cat thesis_final_v7_final_actually.docx' || c === 'cat 論文_最終版_老闆改過_真的不改了.docx') return 'console.out.thesis';
  if (/^cat (thesis_final|論文_最終版)[^ ]*\.docx$/u.test(c)) return 'console.out.superseded';
  if (c === 'shuttle') return 'console.out.shuttle';
  if (c === 'who') return 'console.out.who';
  return null;
}

export interface ConsoleOutput {
  key: string;
  params?: Record<string, string | number>;
}

export type ConsoleLine = { input: string } | { out: ConsoleOutput };

export interface ConsoleState {
  start: number;
  /** The act it was opened in: in Act III the hidden commands go quiet. */
  act: Act;
  lines: ConsoleLine[];
  sawAll: boolean;
  saw13: boolean;
  commands: number;
  closed: boolean;
}

/** One typed command, or the special move 'close' when the player logs out. */
export type ConsoleMove = string;

export const MAX_LINES = 60;

export function normalise(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** The output for one command (pure). `clock` is the console's current time; `act`, the act it's in. */
export function respond(command: string, clock: string, act: Act = 1): ConsoleOutput | 'clear' | 'close' | null {
  const c = normalise(command);
  if (c === '') return null;
  const egg = hidden(c);
  if (egg) return act === 3 ? { key: 'console.out.unknown', params: { command: command.trim().slice(0, 40) } } : egg.endsWith('.g16') || egg.endsWith('.uptime') || egg.endsWith('.shuttle') ? { key: egg, params: { clock } } : { key: egg };
  if (c === 'clear') return 'clear';
  if (c === 'exit' || c === 'logout' || c === 'quit') return 'close';
  if (c === 'help' || c === '?') return { key: 'console.out.help' };
  if (c === 'whoami') return { key: 'console.out.whoami' };
  if (c === 'date') return { key: 'console.out.date', params: { clock } };
  if (c === 'queue') return { key: 'console.out.queue' };
  if (c === 'queue --all' || c === 'queue -a' || c === 'queue all') return { key: 'console.out.queue.all' };
  if (c === 'log') return { key: 'console.out.log' };
  if (c === 'info') return { key: 'console.out.info.usage' };
  const info = /^info (\d{1,2})$/.exec(c);
  if (info) {
    const n = Number(info[1]);
    if (n === 13) return { key: 'console.out.info.13' };
    if (n === 4) return { key: 'console.out.info.4' };
    if (n === 7) return { key: 'console.out.info.7' };
    return { key: 'console.out.info.empty', params: { n } };
  }
  if (c.startsWith('eject')) return { key: 'console.out.eject' };
  return { key: 'console.out.unknown', params: { command: command.trim().slice(0, 40) } };
}

/** Every four commands cost a minute; reading the screen costs two. */
export const consoleMinutes = (commands: number): number => 2 + Math.floor(commands / 4);

/** What a reload needs to put the screen back as it was. */
export type ConsoleSave = Omit<ConsoleState, 'start' | 'closed' | 'act'>;
export const consoleSave = ({ start: _start, closed: _closed, act: _act, ...rest }: ConsoleState): ConsoleSave => rest;

/** A saved line, if it is one this console could have printed. */
function restoreLine(line: unknown): ConsoleLine | null {
  if (!line || typeof line !== 'object') return null;
  const l = line as { input?: unknown; out?: unknown };
  if (typeof l.input === 'string') return { input: l.input.slice(0, 80) };
  const out = (l.out && typeof l.out === 'object' ? l.out : {}) as { key?: unknown; params?: unknown };
  if (typeof out.key !== 'string' || !out.key.startsWith('console.out.')) return null;
  const params: Record<string, string | number> = {};
  if (out.params && typeof out.params === 'object') {
    for (const [k, v] of Object.entries(out.params)) if (typeof v === 'string' || typeof v === 'number') params[k] = v;
  }
  return Object.keys(params).length ? { out: { key: out.key, params } } : { out: { key: out.key } };
}

const clockAt = (minute: number): string => {
  const total = 2 * 60 + 47 + minute;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const consoleLogic: PuzzleLogic<ConsoleState, ConsoleMove> = {
  id: 'console',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : null) as Partial<Record<keyof ConsoleSave, unknown>> | null;
    if (!d) return { start: ctx.minute, act: ctx.act, lines: [{ out: { key: 'console.out.motd' } }], sawAll: false, saw13: false, commands: 0, closed: false };
    const lines = Array.isArray(d.lines) ? d.lines.map(restoreLine).filter((l): l is ConsoleLine => l !== null).slice(-MAX_LINES) : [];
    const commands = typeof d.commands === 'number' && Number.isFinite(d.commands) ? Math.min(999, Math.max(0, Math.floor(d.commands))) : 0;
    return { start: ctx.minute, act: ctx.act, lines, sawAll: d.sawAll === true, saw13: d.saw13 === true, commands, closed: false };
  },
  apply: (s, move) => {
    if (s.closed) return s;
    const reply = respond(move, clockAt(s.start + consoleMinutes(s.commands)), s.act);
    if (reply === null) return s;
    const commands = s.commands + 1;
    if (reply === 'close') return { ...s, commands, closed: true };
    if (reply === 'clear') return { ...s, commands, lines: [] };
    const lines = [...s.lines, { input: move.trim().slice(0, 80) }, { out: reply }].slice(-MAX_LINES);
    return {
      ...s,
      commands,
      lines,
      sawAll: s.sawAll || reply.key === 'console.out.queue.all',
      saw13: s.saw13 || reply.key === 'console.out.info.13',
    };
  },
  isSolved: (s) => s.sawAll && s.saw13,
  minutes: (s) => consoleMinutes(s.commands),
  solution: (s) => [...(s.sawAll ? [] : ['queue --all']), ...(s.saw13 ? [] : ['info 13'])],
};
