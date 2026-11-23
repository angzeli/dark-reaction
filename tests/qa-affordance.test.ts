/**
 * The playtest QA's canary (docs/qa/PLAYTEST-REPORT.md): the NMR console
 * bug a real player hit before v1.0.0 (#86, fixed in #87). Layer 1 as first
 * built didn't catch it on the build before the fix: every ending stayed
 * reachable, so no soft-lock check fired. The affordance check
 * (scripts/qa/lib/affordance.ts) is what would have. This keeps it able to.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { ROUTES, type Route } from '../src/content/routes.ts';
import type { Content, GameState } from '../src/engine/types.ts';
import { PUZZLE_LOGIC } from '../src/puzzles/logic.ts';
import { AFFORDANCE_CHECKS, keyWithNowhereToUseIt, neverAgain } from '../scripts/qa/lib/affordance.ts';
import { explore } from '../scripts/qa/lib/explorer.ts';
import { analyse } from '../scripts/qa/lib/model.ts';
import { step } from '../scripts/qa/lib/play.ts';
import { routeRoots } from '../scripts/qa/lib/roots.ts';

/** The NMR suite as it was before #87: no way to type the code without the tube, and the console once a night. */
function beforeTheFix(): Content {
  const scenes = CONTENT.scenes.map((scene) =>
    scene.id !== 'nmr.hub'
      ? scene
      : {
          ...scene,
          choices: scene.choices.filter((ch) => ch.id !== 'nmr.code').map((ch) => (ch.id === 'nmr.console.again' ? { ...ch, once: 'loop' as const } : ch)),
        },
  );
  return { ...CONTENT, scenes };
}

/** Act II, the night after Dan's office: RIDLEY-4 known, no tube yet, walking straight down to the NMR suite. */
function atTheConsoleWithTheCode(content: Content): GameState {
  const roots = routeRoots(CONTENT, PUZZLE_LOGIC, ROUTES.dark as Route);
  const night = roots.find((r) => r.state.act === 2 && r.state.known.some((k) => k.id === 'nb.priority'))!;
  return step(analyse(content), PUZZLE_LOGIC, night.state, { t: 'go', to: 'nmr' }).state;
}

describe('the NMR console canary (#86)', () => {
  it('is caught on the build before the fix', () => {
    const content = beforeTheFix();
    const found = keyWithNowhereToUseIt(analyse(content), atTheConsoleWithTheCode(content));
    expect(found.map((f) => f.message).join('\n')).toMatch(/nmr\.hub.*nb\.priority.*item\.tube\.own/);
  });

  it('is quiet on the game as it is', () => {
    expect(keyWithNowhereToUseIt(analyse(CONTENT), atTheConsoleWithTheCode(CONTENT))).toEqual([]);
  });

  it('is found by a search of that night without being told where to look', () => {
    const content = beforeTheFix();
    const roots = routeRoots(CONTENT, PUZZLE_LOGIC, ROUTES.dark as Route).filter((r) => r.state.act === 2);
    const report = explore(content, PUZZLE_LOGIC, roots, { perMinute: 10, nightsAfter: 0, branches: 0, maxStates: 200_000, seed: 1, saves: false, stateChecks: AFFORDANCE_CHECKS });
    expect(report.findings.filter((f) => f.check === 'affordance').map((f) => f.message).join('\n')).toMatch(/nb\.priority/);
  });
});

describe('neverAgain', () => {
  const s = { ...atTheConsoleWithTheCode(CONTENT) };
  it('knows what only grows', () => {
    expect(neverAgain({ not: { solved: 'console' } }, s)).toBe(true); // solved in Act I
    expect(neverAgain({ act: 1 }, s)).toBe(true);
    expect(neverAgain({ solved: 'freezer' }, s)).toBe(false); // not yet, but it can be
    expect(neverAgain({ item: 'item.tube.own' }, s)).toBe(false);
    expect(neverAgain({ all: [{ item: 'item.tube.own' }, { act: 1 }] }, s)).toBe(true);
    expect(neverAgain({ any: [{ act: 1 }, { item: 'item.tube.own' }] }, s)).toBe(false);
  });
});
