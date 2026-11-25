/**
 * Which keys are jokes, and where the rules bend (docs/HUMOUR.md §1–2). Joke keys are the keys of the
 * humour and terminal tables. The validator reads this file; the game doesn't need it.
 */
import type { EndingId } from '../engine/types.ts';
import { humour } from '../i18n/en/humour.ts';
import { terminal } from '../i18n/en/terminal.ts';

type JokeKey = keyof typeof humour | keyof typeof terminal;

export const JOKE_KEYS: ReadonlySet<string> = new Set<string>([...Object.keys(humour), ...Object.keys(terminal)]);

/**
 * Jokes that tell a different joke in each language. Every other joke key carries the same numbers in
 * both locales; these may differ in meaning, numbers and all.
 */
export const LOCALISED_VARIANTS: ReadonlySet<string> = new Set<JokeKey>([
  // 繁中: 「寫不完的房間」, not "optimistic on both counts".
  'fun.plate',
  // 繁中: you've clocked off; the lanyard hasn't.
  'fun.clocking.lanyard',
  // 繁中: the ground floor is 0 in Britain, which took a term to get used to.
  'fun.lift.press',
  // 繁中: who to tell at 3 a.m.? Your PI's in Boston; he's probably up.
  'fun.labdoor.poster.3',
  // 繁中: a gloss on each sign, where English leaves them bare.
  'fun.corridor',
]);

/** The only epilogues a joke may appear in: Fire Alarm's, all of it; Clocking Off's, only its lanyard beat. */
export const EPILOGUE_JOKES: Readonly<Partial<Record<EndingId, 'any' | readonly JokeKey[]>>> = { fire: 'any', clocking: ['fun.clocking.lanyard'] };
