/**
 * Scripted routes through the game, one per ending. The validator plays
 * them through the engine (scripts/validate.ts) and the Playwright bot
 * plays them through the real UI (e2e/), in both languages. The route to
 * the true ending is the critical path the playtime estimate measures.
 */
import type { EndingId, LocationId } from '../engine/types.ts';

export type RouteStep =
  /** A choice id as the engine knows it (content choice, or meta:/go:/wait: ids). */
  | { do: string }
  /** Walk somewhere (opens the travel menu and picks the destination). */
  | { go: LocationId }
  | { wait: 1 | 5 | 10 }
  /** Wait in the current hub until this loop minute (or until the lights go out). */
  | { until: number }
  /** Let the rest of the night run out: wait until 03:33. */
  | { night: true }
  /** Solve the open puzzle with its logic's known solution. */
  | { solve: string }
  /** Step away from the open puzzle. */
  | { fail: string }
  /** Strike a fudge through in the notebook. */
  | { correct: string };

export interface Route {
  ending: EndingId;
  /** One line on what this route does, for reports. */
  summary: string;
  steps: RouteStep[];
}

export const ROUTES: Partial<Record<EndingId, Route>> = {};
