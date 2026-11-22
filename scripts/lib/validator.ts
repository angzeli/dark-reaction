/**
 * Content validation: structure, locales, routes, fuzzing and playtime.
 * Every check returns problems instead of throwing, so the CLI can report
 * everything at once. Pure functions over content and tables; tested in
 * tests/validator.test.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Game } from '../../src/engine/engine.ts';
import { RouteError, simulate, type Screen } from '../../src/engine/simulate.ts';
import type { Content, Effect, LocationId, TextRef } from '../../src/engine/types.ts';
import { compareTables, placeholders, t, type Locale, type Table } from '../../src/i18n/i18n.ts';
import type { Route } from '../../src/content/routes.ts';
import type { PuzzleLogic } from '../../src/puzzles/types.ts';

export interface Problem {
  level: 'error' | 'warning';
  check: string;
  message: string;
}

const err = (check: string, message: string): Problem => ({ level: 'error', check, message });
const warn = (check: string, message: string): Problem => ({ level: 'warning', check, message });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LogicTable = Record<string, PuzzleLogic<any, any>>;

// ── Structure ──────────────────────────────────────────────────────────────

/** Loading content runs the engine's own shape and reference checks. */
export function checkLoad(content: Content): Problem[] {
  try {
    new Game(content);
    return [];
  } catch (e) {
    return [err('load', (e as Error).message)];
  }
}

function movesOf(effects: readonly Effect[] | undefined): { scenes: string[]; locations: LocationId[] } {
  const scenes: string[] = [];
  const locations: LocationId[] = [];
  for (const e of effects ?? []) {
    if ('scene' in e) scenes.push(e.scene);
    if ('go' in e) locations.push(e.go);
  }
  return { scenes, locations };
}

/**
 * Every scene must be reachable from the start, and every scene must have
 * a way out. Reachability is structural (conditions ignored): it finds
 * scenes nothing points at, not scenes that are hard to get to.
 */
export function checkGraph(content: Content): Problem[] {
  const problems: Problem[] = [];
  const scenes = new Map(content.scenes.map((s) => [s.id, s] as const));
  const locations = new Map(content.locations.map((l) => [l.id, l] as const));
  const roomScenes = (id: LocationId) => {
    const loc = locations.get(id);
    return loc ? [loc.hub, ...(loc.entry ?? []).map((e) => e.scene)] : [];
  };

  const seen = new Set<string>();
  const queue: string[] = [...roomScenes(content.start.location)];
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const scene = scenes.get(id);
    if (!scene) continue;
    const next: string[] = [];
    // Hubs can walk anywhere.
    if (scene.hub) for (const loc of content.locations) next.push(...roomScenes(loc.id));
    // Back leads to the room's own hub and entry scenes.
    next.push(...roomScenes(scene.location));
    for (const choice of scene.choices) {
      if (choice.to) next.push(choice.to);
      const m = movesOf(choice.effects);
      next.push(...m.scenes);
      for (const loc of m.locations) next.push(...roomScenes(loc));
    }
    queue.push(...next.filter((n) => !seen.has(n)));
  }
  for (const scene of content.scenes) {
    if (!seen.has(scene.id)) problems.push(err('graph', `scene "${scene.id}" is unreachable from the start`));
  }

  for (const scene of content.scenes) {
    if (!scene.hub && scene.noBack) {
      const exits = scene.choices.filter(
        (c) => !c.if && (c.to || movesOf(c.effects).scenes.length || movesOf(c.effects).locations.length || (c.effects ?? []).some((e) => 'hub' in e || 'ending' in e)),
      );
      if (exits.length === 0) problems.push(err('graph', `scene "${scene.id}" has no Back and no unconditional way out (dead end)`));
    }
    if (scene.text.length === 0) problems.push(err('graph', `scene "${scene.id}" has no text`));
    for (const choice of scene.choices) {
      const effects = choice.effects ?? [];
      const saysOrDoes =
        (choice.text?.length ?? 0) > 0 || !!choice.to || effects.some((e) => 'scene' in e || 'go' in e || 'hub' in e || 'puzzle' in e || 'ending' in e);
      if (!saysOrDoes) problems.push(err('graph', `choice "${choice.id}" neither shows text nor goes anywhere`));
    }
  }

  // Keyboard focus and key 1 go to the first choice (#61): a choice that ends the game must
  // never be able to come first. Either an always-available choice precedes it, or Back does.
  const ends = (c: (typeof content.scenes)[number]['choices'][number]) => (c.effects ?? []).some((e) => 'ending' in e);
  for (const scene of content.scenes) {
    const hasBack = !scene.hub && !scene.noBack;
    if (scene.backFirst && !hasBack) problems.push(err('graph', `scene "${scene.id}" sets backFirst but has no Back to put first`));
    const first = scene.choices.findIndex(ends);
    if (first < 0 || (scene.backFirst && hasBack)) continue;
    if (!scene.choices.slice(0, first).some((c) => !c.if && !c.once && !ends(c))) {
      problems.push(err('graph', `scene "${scene.id}": "${scene.choices[first]!.id}" ends the game and can be the first choice; put an always-available choice before it, or set backFirst`));
    }
  }
  return problems;
}

// ── Locales ────────────────────────────────────────────────────────────────

/** Every key the content refers to, with where it is used. */
export function referencedKeys(content: Content): Map<string, string> {
  const keys = new Map<string, string>();
  const add = (key: string | undefined, where: string) => {
    if (key && !keys.has(key)) keys.set(key, where);
  };
  const refs = (list: readonly TextRef[] | undefined, where: string) => (list ?? []).forEach((r) => add(r.key, where));

  refs(content.loopStart, 'loopStart');
  for (const loc of content.locations) add(loc.name, `location ${loc.id}`);
  for (const scene of content.scenes) {
    refs(scene.text, `scene ${scene.id}`);
    for (const choice of scene.choices) {
      add(choice.label, `choice ${choice.id}`);
      refs(choice.text, `choice ${choice.id}`);
    }
  }
  for (const n of content.notebook) {
    add(n.title, `notebook ${n.id}`);
    add(n.body, `notebook ${n.id}`);
  }
  for (const p of content.puzzles) {
    p.hints.forEach((h) => add(h, `puzzle ${p.id}`));
    add(`puzzle.${p.id}.title`, `puzzle ${p.id}`);
    add(`puzzle.${p.id}.intro`, `puzzle ${p.id}`);
    add(p.margin, `puzzle ${p.id}`);
    refs(p.solvedText, `puzzle ${p.id}`);
    refs(p.failedText, `puzzle ${p.id}`);
  }
  for (const ev of content.events) refs(ev.text, `event ${ev.id}`);
  for (const rule of content.lightsOut) refs(rule.text, `lightsOut ${rule.id}`);
  for (const act of content.acts) add(act.title, `act ${act.act}`);
  for (const e of content.endings) {
    add(e.title, `ending ${e.id}`);
    add(e.clue, `ending ${e.id}`);
    refs(e.epilogue, `ending ${e.id}`);
  }
  return keys;
}

/** Keys used literally in code: t('some.key'). Template-built keys can't be checked statically. */
export function codeKeys(dir: string): Map<string, string> {
  const keys = new Map<string, string>();
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((name) => {
      const p = join(d, name);
      if (statSync(p).isDirectory()) return name === 'i18n' ? [] : walk(p);
      return p.endsWith('.ts') ? [p] : [];
    });
  for (const file of walk(dir)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/\bt\(\s*'([a-z0-9_.-]+)'/gi)) if (!keys.has(m[1]!)) keys.set(m[1]!, file);
  }
  return keys;
}

const CJK_COMMA = /[\u4e00-\u9fff],[\u4e00-\u9fff]/;

export function checkLocales(tables: Record<Locale, Table>, used: Map<string, string>): Problem[] {
  const problems: Problem[] = [];
  const cmp = compareTables(tables.en, tables['zh-Hant-TW']);
  for (const k of cmp.missingInB) problems.push(err('locales', `"${k}" is missing in zh-Hant-TW`));
  for (const k of cmp.missingInA) problems.push(err('locales', `"${k}" is missing in en`));
  for (const e of cmp.empty) problems.push(err('locales', `"${e.key}" is empty in ${e.locale === 'a' ? 'en' : 'zh-Hant-TW'}`));
  for (const m of cmp.placeholderMismatch) problems.push(err('locales', `"${m.key}" placeholders differ: en {${m.a.join(', ')}} vs zh {${m.b.join(', ')}}`));
  for (const [key, where] of used) {
    if (!(key in tables.en)) problems.push(err('locales', `"${key}" (used by ${where}) is not in the locale tables`));
  }
  for (const [key, value] of Object.entries(tables['zh-Hant-TW'])) {
    if (value.includes('"')) problems.push(warn('style', `zh "${key}" uses a straight double quote; prefer 「」`));
    if (CJK_COMMA.test(value)) problems.push(warn('style', `zh "${key}" has a half-width comma between Chinese characters`));
  }
  for (const [key, value] of Object.entries(tables.en)) {
    if (/\b(color|colors|colored|program|realize|realized|analyze|organize|gray|center|centered|favor|favorite|behavior|labeled|traveled|canceled|toward|honor|neighbor|aluminum|gotten)\b/i.test(value)) problems.push(warn('style', `en "${key}" may use American spelling`));
    // Typeset quotes: ’ for apostrophes, “ ” for quotation marks (straight ones read as code).
    if (value.includes("'")) problems.push(warn('style', `en "${key}" uses a straight apostrophe; prefer ’`));
    if (value.includes('"')) problems.push(warn('style', `en "${key}" uses a straight double quote; prefer “ ”`));
  }
  return problems;
}

// ── Reading ────────────────────────────────────────────────────────────────

/** Strip markup and placeholders, then count English words. */
export function englishWords(text: string): number {
  return text.replace(/\*/g, '').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Count Chinese characters; each Latin word or number counts as one. */
export function chineseChars(text: string): number {
  const han = text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g)?.length ?? 0;
  const latin = text.replace(/[\u3000-\u9fff\uf900-\ufaff\uff00-\uffef]/g, ' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  return han + latin;
}

export interface ReadingTotals {
  en: number;
  zh: number;
}

export type Render = (key: string, params: Record<string, string | number> | undefined, locale: Locale) => string;
const defaultRender: Render = (key, params, locale) => t(key, params, locale);

function renderScreen(screen: Screen, locale: Locale, render: Render): string[] {
  const out = screen.paragraphs.map((p) => render(p.key, p.params, locale));
  if (screen.chose) out.push(render(screen.chose.key, screen.chose.params, locale));
  return out;
}

// ── Routes and playtime ────────────────────────────────────────────────────

export const WPM_EN = 230;
export const CPM_ZH = 350;
export const MIN_CRITICAL_PATH = 30;

export interface RouteReport {
  ending: string;
  ok: boolean;
  steps: number;
  loops: number;
  words: ReadingTotals;
  parMinutes: number;
  minutes: { en: number; zh: number };
  byAct: Record<number, ReadingTotals>;
}

/** Play every route; check every displayed string renders in both locales; total the reading. */
export function checkRoutes(content: Content, logic: LogicTable, routes: Route[], render: Render = defaultRender): { problems: Problem[]; reports: RouteReport[] } {
  const problems: Problem[] = [];
  const reports: RouteReport[] = [];
  const par = new Map(content.puzzles.map((p) => [p.id, p.par] as const));
  for (const route of routes) {
    try {
      const sim = simulate(content, logic, route);
      const words: ReadingTotals = { en: 0, zh: 0 };
      const byAct: Record<number, ReadingTotals> = {};
      for (const screen of sim.screens) {
        for (const locale of ['en', 'zh-Hant-TW'] as const) {
          for (const text of renderScreen(screen, locale, render)) {
            if (text.includes('[[')) problems.push(err('routes', `${route.ending}: a missing key rendered in ${locale}: ${text.slice(0, 60)}`));
            const left = placeholders(text);
            if (left.length) problems.push(err('routes', `${route.ending}: unfilled {${left.join(', ')}} in ${locale}: ${text.slice(0, 60)}`));
            const act = (byAct[screen.act] ??= { en: 0, zh: 0 });
            if (locale === 'en') {
              const n = englishWords(text);
              words.en += n;
              act.en += n;
            } else {
              const n = chineseChars(text);
              words.zh += n;
              act.zh += n;
            }
          }
        }
      }
      const parMinutes = sim.solved.reduce((sum, id) => sum + (par.get(id) ?? 0), 0);
      reports.push({
        ending: route.ending,
        ok: true,
        steps: sim.steps,
        loops: sim.game.state.loop,
        words,
        parMinutes,
        minutes: { en: words.en / WPM_EN + parMinutes, zh: words.zh / CPM_ZH + parMinutes },
        byAct,
      });
    } catch (e) {
      const message = e instanceof RouteError ? e.message : `${(e as Error).message}`;
      problems.push(err('routes', `${route.ending}: ${message}`));
      reports.push({ ending: route.ending, ok: false, steps: 0, loops: 0, words: { en: 0, zh: 0 }, parMinutes: 0, minutes: { en: 0, zh: 0 }, byAct: {} });
    }
  }
  return { problems, reports };
}

/** Every ending the content defines needs a route; the true ending's must be long enough. */
export function checkCoverage(content: Content, routes: Route[], reports: RouteReport[]): Problem[] {
  const problems: Problem[] = [];
  for (const ending of content.endings) {
    if (!routes.some((r) => r.ending === ending.id)) problems.push(err('endings', `ending "${ending.id}" has no route proving it can be reached`));
  }
  const dark = reports.find((r) => r.ending === 'dark' && r.ok);
  if (dark) {
    for (const [locale, minutes] of [['en', dark.minutes.en], ['zh-Hant-TW', dark.minutes.zh]] as const) {
      if (minutes < MIN_CRITICAL_PATH) problems.push(err('playtime', `critical path to the true ending is ${minutes.toFixed(1)} min in ${locale}; it must be at least ${MIN_CRITICAL_PATH}`));
    }
  }
  return problems;
}

// ── Fuzz ───────────────────────────────────────────────────────────────────

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random walks: whatever a player does, the game must never throw and must
 * never offer nothing to do. Puzzles are solved or abandoned at random.
 */
export function fuzz(content: Content, logic: LogicTable, seeds: number, maxSteps: number): { problems: Problem[]; endings: Record<string, number> } {
  const problems: Problem[] = [];
  const endings: Record<string, number> = {};
  for (let seed = 1; seed <= seeds; seed++) {
    const random = rng(seed);
    const game = new Game(content);
    try {
      for (let step = 0; step < maxSteps && !game.state.ending; step++) {
        while (game.takeCard());
        if (game.state.ending) break;
        if (game.state.puzzle) {
          const id = game.state.puzzle;
          const l = logic[id];
          if (l && random() < 0.6) {
            let st = l.init({ minute: game.state.minute, act: game.state.act });
            for (const move of l.solution(st)) st = l.apply(st, move);
            game.completePuzzle({ solved: true, minutes: l.minutes(st) });
          } else {
            game.completePuzzle({ solved: false, minutes: Math.floor(random() * 4) });
          }
          continue;
        }
        const choices = game.choices();
        if (choices.length === 0) {
          problems.push(err('fuzz', `seed ${seed}: nothing to do in ${game.state.scene} at loop ${game.state.loop}, minute ${game.state.minute}`));
          break;
        }
        // Prefer content choices; menus are walked less often so walks go deeper.
        const content_ = choices.filter((c) => c.kind === 'normal');
        const pool = content_.length && random() < 0.7 ? content_ : choices;
        game.choose(pool[Math.floor(random() * pool.length)]!.id);
      }
    } catch (e) {
      problems.push(err('fuzz', `seed ${seed}: threw "${(e as Error).message}" in ${game.state.scene} at loop ${game.state.loop}, minute ${game.state.minute}`));
    }
    if (game.state.ending) endings[game.state.ending] = (endings[game.state.ending] ?? 0) + 1;
  }
  return { problems, endings };
}

// ── Size ───────────────────────────────────────────────────────────────────

export function contentSize(tables: Record<Locale, Table>): ReadingTotals {
  let en = 0;
  let zh = 0;
  for (const v of Object.values(tables.en)) en += englishWords(v);
  for (const v of Object.values(tables['zh-Hant-TW'])) zh += chineseChars(v);
  return { en, zh };
}
