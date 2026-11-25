/**
 * Achievements (docs/HUMOUR.md §6). Deadpan, and named in each language on its own terms. Most are earned
 * by finding an anomaly that names them (src/content/anomalies.ts); the rest by a condition, judged after
 * anything you do, or by making a choice while a condition holds. They are kept with the ending gallery,
 * across new games.
 */
import type { AchievementDef, Cond } from '../engine/types.ts';
import { CENSUS } from './squid.ts';

const ach = (id: string, how: Partial<Pick<AchievementDef, 'if' | 'choice'>> = {}): AchievementDef => ({ id, title: `ach.${id}.title`, desc: `ach.${id}.desc`, ...how });
const flags = (...ids: string[]): Cond => ({ all: ids.map((flag) => ({ flag })) });

export const ACHIEVEMENTS: AchievementDef[] = [
  ach('normal'),
  ach('reply'),
  ach('reported'),
  // Any ending, without having taken your lanyard off even once in the playthrough.
  ach('visible', { if: { all: [{ ended: true }, { not: { flag: 'lanyard.offEver' } }] } }),
  ach('coshh'),
  ach('uncredited'),
  // Every safety poster on the lab door: five nights' reading.
  ach('training', { if: flags('poster.0', 'poster.1', 'poster.2', 'poster.3', 'poster.4') }),
  ach('sorry'),
  ach('writingup', { if: { loopGte: 13 } }),
  // Tea at 02:47, once your own handwriting has told you to make it first.
  ach('tea', { choice: 'office.tea', if: { all: [{ minuteLt: 1 }, { know: 'ph.tea' }] } }),
  // The hidden eggs (§7).
  ach('dark'),
  ach('yield'),
  ach('slide'),
  ach('bed'),
  ach('mole'),
  // Squiddy in all six rooms, in any playthrough.
  ach('census', { if: CENSUS }),
];
