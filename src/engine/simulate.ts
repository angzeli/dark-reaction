/**
 * Play a route through the engine headlessly, recording every screen of
 * text the player would read. Used by the validator (reachability and the
 * playtime estimate) and by tests. Pure: engine and puzzle logic only.
 */
import type { Route, RouteStep } from '../content/routes.ts';
import type { PuzzleLogic } from '../puzzles/types.ts';
import { Game } from './engine.ts';
import type { Act, Content, Paragraph } from './types.ts';

export interface Screen {
  act: Act;
  loop: number;
  minute: number;
  paragraphs: Paragraph[];
  /** The label of the content choice that led here, if any. */
  chose?: { key: string; params?: Record<string, string | number> };
}

export interface SimulationResult {
  game: Game;
  screens: Screen[];
  /** Puzzles solved along the way, in order. */
  solved: string[];
  steps: number;
}

export class RouteError extends Error {
  readonly step: number;
  constructor(message: string, step: number) {
    super(message);
    this.step = step;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogicTable = Record<string, PuzzleLogic<any, any>>;

export function simulate(content: Content, logic: LogicTable, route: Route, margins: string[] = []): SimulationResult {
  const game = new Game(content);
  game.state.margins = [...margins];
  const screens: Screen[] = [];
  const solved: string[] = [];
  let lastDisplay = '';

  const record = (chose?: Screen['chose']) => {
    // Transitions carry what was on screen when the lights went out; it was already recorded.
    while (game.takeCard());
    const key = JSON.stringify(game.state.display);
    if (key === lastDisplay && !chose) return;
    lastDisplay = key;
    const s = game.state;
    const screen: Screen = { act: s.act, loop: s.loop, minute: s.minute, paragraphs: s.display };
    if (chose) screen.chose = chose;
    screens.push(screen);
  };

  const choose = (id: string, index: number) => {
    const view = game.choices().find((c) => c.id === id);
    if (!view) {
      const options = game.choices().map((c) => c.id).join(', ') || '(none)';
      throw new RouteError(`step ${index + 1}: "${id}" is not available in ${game.state.scene} at minute ${game.state.minute} (loop ${game.state.loop}). Available: ${options}`, index);
    }
    game.choose(id);
    record(view.kind === 'normal' ? { key: view.label, ...(view.params ? { params: view.params } : {}) } : undefined);
  };

  const waitUntil = (minute: number, index: number) => {
    const loop = game.state.loop;
    let guard = 0;
    while (game.state.loop === loop && game.state.minute < minute && !game.state.ending && !game.state.puzzle) {
      if (!game.scene.hub) choose('meta:back', index);
      const gap = minute - game.state.minute;
      choose('meta:wait', index);
      choose(`wait:${gap >= 10 ? 10 : gap >= 5 ? 5 : 1}`, index);
      if (++guard > 100) throw new RouteError(`step ${index + 1}: waiting never reached minute ${minute}`, index);
    }
  };

  record();
  route.steps.forEach((step: RouteStep, index) => {
    if (game.state.ending) throw new RouteError(`step ${index + 1}: the game already ended (${game.state.ending})`, index);
    if ('do' in step) choose(step.do, index);
    else if ('go' in step) {
      choose('meta:travel', index);
      choose(`go:${step.go}`, index);
    } else if ('wait' in step) {
      choose('meta:wait', index);
      choose(`wait:${step.wait}`, index);
    } else if ('until' in step) waitUntil(step.until, index);
    else if ('night' in step) waitUntil(46, index);
    else if ('solve' in step || 'fail' in step) {
      const id = 'solve' in step ? step.solve : step.fail;
      if (game.state.puzzle !== id) throw new RouteError(`step ${index + 1}: expected puzzle "${id}" to be open, found ${game.state.puzzle ?? 'none'}`, index);
      const l = logic[id];
      if (!l) throw new RouteError(`step ${index + 1}: no logic registered for puzzle "${id}"`, index);
      if ('solve' in step) {
        let state = l.init({ minute: game.state.minute, act: game.state.act, data: game.state.puzzleData[id] });
        for (const move of l.solution(state)) state = l.apply(state, move);
        if (!l.isSolved(state)) throw new RouteError(`step ${index + 1}: puzzle "${id}"'s own solution does not solve it`, index);
        game.completePuzzle({ solved: true, minutes: l.minutes(state) });
        solved.push(id);
      } else {
        game.completePuzzle({ solved: false, minutes: 0 });
      }
      record();
    } else if ('correct' in step) {
      if (!game.correctFudge(step.correct)) throw new RouteError(`step ${index + 1}: could not strike "${step.correct}" through`, index);
      record();
    }
  });

  if (game.state.ending !== route.ending) {
    throw new RouteError(`route ended with ${game.state.ending ?? 'no ending'} (loop ${game.state.loop}, ${game.state.scene}), expected ${route.ending}`, route.steps.length);
  }
  // The epilogue is read too: record it as the last screen, so it is rendered,
  // checked for missing keys and placeholders, and counted in the playtime.
  const ending = content.endings.find((e) => e.id === game.state.ending);
  if (ending) {
    const s = game.state;
    screens.push({ act: s.act, loop: s.loop, minute: s.minute, paragraphs: game.paragraphs(ending.epilogue, 'text') });
  }
  return { game, screens, solved, steps: route.steps.length };
}
