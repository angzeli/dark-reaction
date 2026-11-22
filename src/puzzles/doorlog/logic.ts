/**
 * P6 · Door-access log (docs/DESIGN.md §11). The porter's terminal shows
 * seven nights of badge events on Level 4 and the ground floor, 02:40–03:40,
 * Monday 16 to Sunday 22 November 2026. Femi Adeyemi does the same round
 * every night, except on Mondays, when the bins go out through fire exit B
 * and everything runs three minutes late. Tonight is Monday 23 November:
 * mark when Dan's office and fire exit B will be open, and write it down.
 *
 * The log is generated from the porter's routine and the windows in
 * src/content/world.ts, so the answer is stated exactly once.
 */
import { LOOP_LENGTH, LOOP_START_HOUR, LOOP_START_MINUTE } from '../../engine/clock.ts';
import { EXIT_B_OPEN, PI_OPEN } from '../../content/world.ts';
import type { PuzzleLogic } from '../types.ts';

export type DoorId = 'main' | 'exitB' | 'pi' | 'lab' | 'stair';
export type BadgeId = 'femi' | 'lin' | 'tom' | 'ian' | 'none';
export type EventId = 'granted' | 'denied' | 'exit' | 'held' | 'released' | 'locked';
export type Row = 'pi' | 'exit';

export const DOORS: readonly DoorId[] = ['main', 'exitB', 'pi', 'lab', 'stair'];
export const ROWS: readonly Row[] = ['pi', 'exit'];
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
/** The seven nights on screen: Monday 16 to Sunday 22 November 2026. */
export const NIGHTS = [16, 17, 18, 19, 20, 21, 22] as const;
export const MONDAY = 0;
/** On Mondays the porter's whole round runs this many minutes late. */
export const MONDAY_SHIFT = 3;
/** Every window the porter opens lasts as long as Dan's office does tonight. */
export const WINDOW = PI_OPEN.to - PI_OPEN.from;
/** The latest start a window can have and still close by 03:33. */
export const LAST_START = LOOP_LENGTH - WINDOW;
/** Tonight's answer, straight from the building's timetable. */
export const ANSWER: Record<Row, number> = { pi: PI_OPEN.from, exit: EXIT_B_OPEN.from };
/** When he does Dan's office on any other night. */
export const USUAL_PI = PI_OPEN.from - MONDAY_SHIFT;

/** Log times are minutes after midnight; loop minute 0 is 02:47. */
export const LOOP_ZERO = LOOP_START_HOUR * 60 + LOOP_START_MINUTE;
export const LOG_FROM = 2 * 60 + 40;
export const LOG_TO = 3 * 60 + 40;
const at = (loopMinute: number) => LOOP_ZERO + loopMinute;
export const clock = (time: number): string => `${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`;

export interface LogEntry {
  /** Index into NIGHTS (0 = Monday 16). */
  night: number;
  time: number;
  door: DoorId;
  badge: BadgeId;
  event: EventId;
}

function night(n: number): LogEntry[] {
  const shift = n === MONDAY ? MONDAY_SHIFT : 0;
  const e = (loopMinute: number, door: DoorId, badge: BadgeId, event: EventId): LogEntry => ({ night: n, time: at(loopMinute), door, badge, event });
  const out: LogEntry[] = [
    // Y.C.'s card, every night: refused at the door at 02:47, let into her lab at 03:33.
    e(0, 'main', 'lin', 'denied'),
    e(LOOP_LENGTH, 'lab', 'lin', 'granted'),
    // The porter's round: up the stairs, Dan's office for cleaning, back down.
    e(USUAL_PI - 20 + shift, 'stair', 'femi', 'granted'),
    e(USUAL_PI + shift, 'pi', 'femi', 'held'),
    e(USUAL_PI + WINDOW + shift, 'pi', 'none', 'locked'),
    e(USUAL_PI + WINDOW + 1 + shift, 'stair', 'femi', 'granted'),
  ];
  if (n === MONDAY) {
    // Bins night: fire exit B, then back in by the front.
    out.push(e(EXIT_B_OPEN.from, 'exitB', 'femi', 'released'), e(EXIT_B_OPEN.to, 'exitB', 'none', 'locked'), e(EXIT_B_OPEN.to + 1, 'main', 'femi', 'granted'));
  }
  // Noise: Tom on Wednesday, Ian on Thursday.
  if (n === 2) out.push(e(11, 'lab', 'tom', 'granted'), e(40, 'lab', 'tom', 'granted'));
  if (n === 3) out.push(e(3, 'main', 'ian', 'granted'), e(50, 'main', 'ian', 'exit'));
  return out.sort((a, b) => a.time - b.time);
}

export const LOG: readonly LogEntry[] = NIGHTS.flatMap((_, n) => night(n));

// ── The archive: Y.C.'s two entries go back every night to 14/03/2019 ──────

export interface DateParts {
  y: number;
  m: number;
  d: number;
}
export type ArchiveRow = { date: DateParts; time: number; door: DoorId; badge: BadgeId; event: EventId } | { gap: number };

const dayNumber = ({ y, m, d }: DateParts) => Date.UTC(y, m - 1, d) / 86_400_000;
const addDays = (p: DateParts, n: number): DateParts => {
  const t = new Date((dayNumber(p) + n) * 86_400_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
};
/** Her first 03:33: the night she badged into Lab 4.12 and never badged out. */
export const FIRST_NIGHT: DateParts = { y: 2019, m: 3, d: 14 };
/** The last archived night: the Sunday before the log's seven. */
export const LAST_ARCHIVED: DateParts = { y: 2026, m: 11, d: NIGHTS[0] - 1 };

const hers = (date: DateParts): ArchiveRow[] => [
  { date, time: at(0), door: 'main', badge: 'lin', event: 'denied' },
  { date, time: at(LOOP_LENGTH), door: 'lab', badge: 'lin', event: 'granted' },
];
const second = addDays(FIRST_NIGHT, 1);
/** Her first entry in the window: 14/03/2019, Lab 4.12, 03:33. */
export const FIRST_ENTRY = { date: FIRST_NIGHT, time: at(LOOP_LENGTH), door: 'lab', badge: 'lin', event: 'granted' } as const;
export const ARCHIVE: readonly ArchiveRow[] = [
  FIRST_ENTRY,
  ...hers(second),
  { gap: dayNumber(LAST_ARCHIVED) - dayNumber(second) - 1 },
  ...hers(LAST_ARCHIVED),
];

// ── The puzzle ─────────────────────────────────────────────────────────────

export type NightFilter = 'all' | number;
export type DoorFilter = 'all' | DoorId;

export type DoorlogFeedback = { kind: 'unmarked'; rows: Row[] } | { kind: 'wrong'; rows: Row[]; usual: boolean };

export interface DoorlogState {
  night: NightFilter;
  door: DoorFilter;
  older: boolean;
  /** Start minute (loop minute) of each window marked for tonight. */
  marks: Record<Row, number | null>;
  wrong: number;
  solved: boolean;
  last: DoorlogFeedback | null;
}

export type DoorlogMove =
  | { type: 'night'; night: NightFilter }
  | { type: 'door'; door: DoorFilter }
  | { type: 'older' }
  | { type: 'mark'; row: Row; start: number }
  | { type: 'write' };

/** Reading seven nights of log costs a couple of minutes; each wrong write-up another. */
export const READING_MINUTES = 2;

const isNight = (v: unknown): v is NightFilter => v === 'all' || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < NIGHTS.length);
const isDoor = (v: unknown): v is DoorFilter => v === 'all' || DOORS.includes(v as DoorId);
const clampStart = (v: number) => Math.min(LAST_START, Math.max(0, Math.round(v)));

export const visibleLog = (s: Pick<DoorlogState, 'night' | 'door'>): LogEntry[] =>
  LOG.filter((e) => (s.night === 'all' || e.night === s.night) && (s.door === 'all' || e.door === s.door));
/** The archive under the door filter (the night filter is for this week only); empty if none of it is for that door. */
export function visibleArchive(s: Pick<DoorlogState, 'door' | 'older'>): ArchiveRow[] {
  if (!s.older) return [];
  const rows = ARCHIVE.filter((r) => 'gap' in r || s.door === 'all' || r.door === s.door);
  return rows.some((r) => !('gap' in r)) ? rows : [];
}

/** What a reload needs to put the terminal and your marks back. */
export type DoorlogSave = Omit<DoorlogState, 'solved' | 'last'>;
export const doorlogSave = ({ solved: _solved, last: _last, ...rest }: DoorlogState): DoorlogSave => rest;

export const doorlogLogic: PuzzleLogic<DoorlogState, DoorlogMove> = {
  id: 'doorlog',
  init: (ctx) => {
    const d = (ctx.data && typeof ctx.data === 'object' ? ctx.data : {}) as Partial<Record<keyof DoorlogSave, unknown>>;
    const m = (d.marks && typeof d.marks === 'object' ? d.marks : {}) as Partial<Record<Row, unknown>>;
    const mark = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? clampStart(v) : null);
    const wrong = typeof d.wrong === 'number' && Number.isFinite(d.wrong) ? Math.min(999, Math.max(0, Math.floor(d.wrong))) : 0;
    return {
      night: isNight(d.night) ? d.night : 'all',
      door: isDoor(d.door) ? d.door : 'all',
      older: d.older === true,
      marks: { pi: mark(m.pi), exit: mark(m.exit) },
      wrong,
      solved: false,
      last: null,
    };
  },
  apply: (s, m) => {
    if (s.solved) return s;
    switch (m.type) {
      case 'night':
        return isNight(m.night) ? { ...s, night: m.night, last: null } : s;
      case 'door':
        return isDoor(m.door) ? { ...s, door: m.door, last: null } : s;
      case 'older':
        return { ...s, older: !s.older, last: null };
      case 'mark':
        return ROWS.includes(m.row) && Number.isFinite(m.start) ? { ...s, marks: { ...s.marks, [m.row]: clampStart(m.start) }, last: null } : s;
      case 'write': {
        const unmarked = ROWS.filter((r) => s.marks[r] === null);
        if (unmarked.length) return { ...s, last: { kind: 'unmarked', rows: unmarked } };
        const off = ROWS.filter((r) => s.marks[r] !== ANSWER[r]);
        if (off.length === 0) return { ...s, solved: true, last: null };
        return { ...s, wrong: s.wrong + 1, last: { kind: 'wrong', rows: off, usual: s.marks.pi === USUAL_PI } };
      }
    }
  },
  isSolved: (s) => s.solved,
  minutes: (s) => READING_MINUTES + s.wrong,
  solution: (s) => [
    ...ROWS.filter((r) => s.marks[r] !== ANSWER[r]).map((row): DoorlogMove => ({ type: 'mark', row, start: ANSWER[row] })),
    { type: 'write' },
  ],
};
