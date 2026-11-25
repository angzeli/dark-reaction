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
import { LOOP_LENGTH } from '../../src/engine/clock.ts';
import type { Act, Cond, Content, Effect, EndingId, LocationId, SceneDef, TextRef, Tone, ToneTag } from '../../src/engine/types.ts';
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

// ── Tone (docs/HUMOUR.md) ──────────────────────────────────────────────────

/** What a tone check knows about a moment: the act, and where you are. Nothing else. */
export interface ToneContext {
  act: Act;
  scene?: string;
  location?: LocationId;
}

type Tri = 'yes' | 'no' | 'maybe';

/** A condition, evaluated with only the act and the place known: anything else might go either way. */
function tri(cond: Cond | undefined, ctx: ToneContext): Tri {
  if (!cond) return 'yes';
  if ('all' in cond) {
    const r = cond.all.map((c) => tri(c, ctx));
    return r.includes('no') ? 'no' : r.every((x) => x === 'yes') ? 'yes' : 'maybe';
  }
  if ('any' in cond) {
    const r = cond.any.map((c) => tri(c, ctx));
    return r.includes('yes') ? 'yes' : r.every((x) => x === 'no') ? 'no' : 'maybe';
  }
  if ('not' in cond) {
    const r = tri(cond.not, ctx);
    return r === 'yes' ? 'no' : r === 'no' ? 'yes' : 'maybe';
  }
  if ('act' in cond) return ctx.act === cond.act ? 'yes' : 'no';
  if ('actGte' in cond) return ctx.act >= cond.actGte ? 'yes' : 'no';
  if ('scene' in cond && ctx.scene) return ctx.scene === cond.scene ? 'yes' : 'no';
  if ('at' in cond && ctx.location) return ctx.location === cond.at ? 'yes' : 'no';
  if ('always' in cond) return 'yes';
  return 'maybe';
}

/** Whether a condition can hold in this act, in this place. */
export const canHold = (cond: Cond | undefined, ctx: ToneContext): boolean => tri(cond, ctx) !== 'no';

export const toneIn = (tag: ToneTag, act: Act): Tone => (typeof tag === 'string' ? tag : tag[act]);

const ACTS: readonly Act[] = [1, 2, 3];

/** The keys a scene can show in an act: its text, its choices' labels, and what they say when chosen. */
export function sceneKeys(scene: SceneDef, act: Act): Set<string> {
  const ctx: ToneContext = { act, scene: scene.id, location: scene.location };
  const keys = new Set<string>();
  for (const r of scene.text) if (canHold(r.if, ctx)) keys.add(r.key);
  for (const c of scene.choices) {
    if (!canHold(c.if, ctx)) continue;
    keys.add(c.label);
    for (const r of c.text ?? []) if (canHold(r.if, ctx)) keys.add(r.key);
  }
  return keys;
}

export interface HumourRules {
  /** The joke keys: the humour and terminal tables. */
  jokes: ReadonlySet<string>;
  /** Epilogues a joke may appear in, all of it ('any') or only the keys listed. */
  epilogueJokes: Readonly<Partial<Record<EndingId, 'any' | readonly string[]>>>;
}

/** Kinds of anomaly the engine records itself: their keys are already in the content where they show. */
const ENGINE_FOUND = new Set(['choice', 'event', 'lightsout']);

/**
 * The tone rules (docs/HUMOUR.md §1). Every key is counted on the page it lands on, act by act:
 * - a scene's page is its text, its choices' labels and results, and the results of choices elsewhere
 *   that lead to it (a result is printed above the next scene's text); the "Noted:" titles and phantom
 *   pages written there; the events that can fire there; and the console's and the UI's finds there;
 * - a puzzle's results land on the page of the scene that opened it.
 * No joke on a dread page, one at most on an uneasy one. And none, ever, on the 02:47 page (the loop's
 * own text, its phantom pages, what a lights-out rule writes, the start room), in an event that can fire
 * at 03:33, an act title, a dread puzzle, or an epilogue other than the ones allowed. Conditions are read
 * with only the act and the place known, so a joke gated out of Act III doesn't count against Act III.
 */
export function checkTone(content: Content, rules: HumourRules): Problem[] {
  const problems: Problem[] = [];
  const jokesIn = (keys: Iterable<string>) => [...new Set(keys)].filter((k) => rules.jokes.has(k));
  const list = (keys: string[]) => keys.map((k) => `"${k}"`).join(', ');
  const budget = (what: string, tone: Tone, act: Act, keys: Iterable<string>) => {
    const jokes = jokesIn(keys);
    if (tone === 'dread' && jokes.length) problems.push(err('tone', `${what} is dread in Act ${act}, but can show ${list(jokes)}`));
    if (tone === 'uneasy' && jokes.length > 1) problems.push(err('tone', `${what} is uneasy in Act ${act} and gets one light line at most, but can show ${jokes.length}: ${list(jokes)}`));
  };
  const notebook = new Map(content.notebook.map((n) => [n.id, n] as const));
  /** What a page shows when an entry is written there: the phantom page itself, or "Noted:" and the title. */
  const written = (effects: readonly Effect[] | undefined) =>
    (effects ?? []).flatMap((e) => {
      const id = 'learn' in e ? e.learn : 'fudge' in e ? e.fudge : null;
      const def = id ? notebook.get(id) : undefined;
      return def ? [def.kind === 'phantom' ? def.body : def.title] : [];
    });
  const locations = new Map(content.locations.map((l) => [l.id, l] as const));
  const roomScenes = (id: LocationId) => {
    const loc = locations.get(id);
    return loc ? [loc.hub, ...(loc.entry ?? []).map((e) => e.scene)] : [];
  };
  const outside = (where: string, act: Act) =>
    content.anomalies.filter((a) => a.scene === where && !ENGINE_FOUND.has(a.trigger.kind) && (!a.acts || a.acts.includes(act))).flatMap((a) => a.keys);

  // Every page, act by act.
  const pages = new Map<string, Set<string>>();
  const page = (scene: string, act: Act) => {
    const key = `${scene}|${act}`;
    let set = pages.get(key);
    if (!set) pages.set(key, (set = new Set()));
    return set;
  };
  const openers = new Map<string, Array<{ scene: string; act: Act }>>();
  for (const scene of content.scenes) {
    for (const act of ACTS) {
      const ctx: ToneContext = { act, scene: scene.id, location: scene.location };
      const here = page(scene.id, act);
      for (const k of sceneKeys(scene, act)) here.add(k);
      for (const k of written(scene.onEnter)) here.add(k);
      for (const k of outside(scene.id, act)) here.add(k);
      for (const c of scene.choices) {
        if (!canHold(c.if, ctx)) continue;
        const result = [...(c.text ?? []).filter((r) => canHold(r.if, ctx)).map((r) => r.key), ...written(c.effects)];
        const next = [scene.id, ...(c.to ? [c.to] : [])];
        for (const e of c.effects ?? []) {
          if ('scene' in e) next.push(e.scene);
          if ('hub' in e) next.push(...roomScenes(scene.location));
          if ('go' in e) next.push(...roomScenes(e.go));
          if ('puzzle' in e) openers.set(e.puzzle, [...(openers.get(e.puzzle) ?? []), { scene: scene.id, act }]);
        }
        for (const n of next) for (const k of result) page(n, act).add(k);
      }
      for (const ev of content.events) {
        if (!canHold(ev.if, ctx)) continue;
        for (const r of ev.text) if (canHold(r.if, ctx)) here.add(r.key);
        for (const k of written(ev.effects)) here.add(k);
      }
    }
  }
  for (const p of content.puzzles) {
    const own = [...p.hints, `puzzle.${p.id}.title`, `puzzle.${p.id}.intro`];
    const results = [...[...(p.solvedText ?? []), ...(p.failedText ?? []), ...(p.leftText ?? [])].map((r) => r.key), ...written([...p.onSolve, ...(p.onFail ?? [])])];
    for (const act of ACTS) budget(`puzzle "${p.id}"`, toneIn(p.tone, act), act, [...own, ...results, ...outside(`puzzle:${p.id}`, act)]);
    for (const o of openers.get(p.id) ?? []) for (const k of results) page(o.scene, o.act).add(k);
  }
  const scenes = new Map(content.scenes.map((s) => [s.id, s] as const));
  for (const [key, keys] of pages) {
    const [id, a] = key.split('|');
    const act = Number(a) as Act;
    budget(`scene "${id}"`, toneIn(scenes.get(id!)!.tone, act), act, keys);
  }

  const never = (keys: readonly string[], what: string) => {
    const jokes = jokesIn(keys);
    if (jokes.length) problems.push(err('tone', `${what} never has a joke, but shows ${list(jokes)}`));
  };
  const refs = (list: readonly TextRef[] | undefined) => (list ?? []).map((r) => r.key);
  never(refs(content.loopStart), 'the 02:47 page');
  for (const ph of content.phantoms) never(written([{ learn: ph.entry }]), `the 02:47 page (phantom "${ph.entry}")`);
  const start = roomScenes(content.start.location).flatMap((id) => refs(scenes.get(id)?.text));
  never(start, `the 02:47 page (the start room)`);
  for (const rule of content.lightsOut) never([...refs(rule.text), ...written(rule.effects)], `lights-out rule "${rule.id}"`);
  for (const ev of content.events) {
    // Any event still unfired at 03:33 can fire then (you arrive, or its condition comes true), unless its `until` has passed.
    if (ev.minute >= LOOP_LENGTH || ev.until === undefined || ev.until > LOOP_LENGTH) never([...refs(ev.text), ...written(ev.effects)], `event "${ev.id}", which can fire at 03:33`);
    if (ev.minute === 0) never(refs(ev.text), `event "${ev.id}" at 02:47`);
  }
  for (const act of content.acts) never([act.title], `Act ${act.act}'s title`);
  for (const ending of content.endings) {
    const allowed = rules.epilogueJokes[ending.id];
    if (allowed === 'any') continue;
    never(
      ending.epilogue.filter((r) => !allowed?.includes(r.key)).map((r) => r.key),
      `the ${ending.id} epilogue${allowed?.length ? ` (beyond ${list([...allowed])})` : ''}`,
    );
  }
  return problems;
}

/**
 * The anomaly registry against the content (docs/HUMOUR.md §2): every entry lives somewhere real that
 * isn't dread in any act it can be found in, shows keys both locales have, and the choice, event or
 * rule that triggers it really records it, where the entry says it is.
 */
export function checkAnomalies(content: Content, tables: Record<Locale, Table>): Problem[] {
  const problems: Problem[] = [];
  const scenes = new Map(content.scenes.map((s) => [s.id, s] as const));
  const puzzles = new Map(content.puzzles.map((p) => [p.id, p] as const));
  const records = (effects: readonly Effect[] | undefined, id: string) => (effects ?? []).some((e) => 'anomaly' in e && e.anomaly === id);
  const choices = new Map(content.scenes.flatMap((s) => s.choices.map((c) => [c.id, { c, s }] as const)));
  for (const a of content.anomalies) {
    const where = a.scene;
    const tag = where.startsWith('puzzle:') ? puzzles.get(where.slice(7))?.tone : where.startsWith('ui:') ? (where.length > 3 ? 'calm' : undefined) : scenes.get(where)?.tone;
    if (!tag) problems.push(err('anomalies', `"${a.id}" lives in "${where}", which doesn't exist`));
    else for (const act of a.acts ?? ACTS) if (toneIn(tag, act) === 'dread') problems.push(err('anomalies', `"${a.id}" lives in "${where}", which is dread in Act ${act}`));
    if ((a.tone as Tone) === 'dread') problems.push(err('anomalies', `"${a.id}" is dread: nothing hidden for fun lives there`));
    if (a.keys.length === 0) problems.push(err('anomalies', `"${a.id}" shows no keys`));
    for (const k of a.keys) for (const loc of ['en', 'zh-Hant-TW'] as const) if (!(k in tables[loc])) problems.push(err('anomalies', `"${a.id}" shows "${k}", which isn't in ${loc}`));
    const tr = a.trigger;
    if (tr.kind === 'choice') {
      const found = choices.get(tr.choice);
      if (!records(found?.c.effects, a.id)) problems.push(err('anomalies', `"${a.id}" is found by choice "${tr.choice}", which doesn't record it`));
      else if (where !== found!.s.id && where !== found!.c.to) problems.push(err('anomalies', `"${a.id}" says it lives in "${where}", but its choice is in "${found!.s.id}"`));
    }
    if (tr.kind === 'event' && !records(content.events.find((e) => e.id === tr.event)?.effects, a.id)) problems.push(err('anomalies', `"${a.id}" is found by event "${tr.event}", which doesn't record it`));
    if (tr.kind === 'lightsout') {
      const rule = content.lightsOut.find((r) => r.id === tr.rule);
      if (!records(rule?.effects, a.id)) problems.push(err('anomalies', `"${a.id}" is found by lights-out rule "${tr.rule}", which doesn't record it`));
      // A rule that ends the game or opens the dark run never applies its effects.
      else if (rule!.ending || rule!.puzzle) problems.push(err('anomalies', `"${a.id}" is recorded by lights-out rule "${tr.rule}", which ends the night another way and never applies its effects`));
    }
  }
  return problems;
}

const NUMBER = /\d+(?:[.,:]\d+)*/g;
/**
 * The numbers in a string, placeholders aside and thousands commas dropped, sorted. Full-width digits
 * and a full-width colon or point between digits read as their ASCII twins (「１０４」, 「18：15」).
 */
export const numbersIn = (text: string): string[] =>
  (
    text
      .replace(/\{[^}]*\}/g, ' ')
      .replace(/[\uff10-\uff19]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xfee0))
      .replace(/(\d)[：．](?=\d)/g, (_, d: string, i: number, all: string) => `${d}${all[i + 1] === '：' ? ':' : '.'}`)
      .match(NUMBER) ?? []
  )
    .map((n) => n.replace(/,(?=\d{3}(?!\d))/g, ''))
    .sort();

/**
 * A joke carries the same numbers in both languages (104, 0.3, 284.8, 18:15): that's the same joke.
 * A key flagged `localisedVariant` tells a different joke in each, and may differ however it likes.
 */
export function checkVariants(tables: Record<Locale, Table>, jokes: ReadonlySet<string>, variants: ReadonlySet<string>): Problem[] {
  const problems: Problem[] = [];
  for (const key of jokes) {
    if (variants.has(key)) continue;
    const en = tables.en[key];
    const zh = tables['zh-Hant-TW'][key];
    if (en === undefined || zh === undefined) continue;
    const a = numbersIn(en);
    const b = numbersIn(zh);
    if (a.join(' ') !== b.join(' ')) {
      problems.push(err('variants', `joke "${key}" has [${a.join(', ')}] in English and [${b.join(', ')}] in 繁中: the same joke keeps its numbers; flag it localisedVariant if it's a different one`));
    }
  }
  for (const key of variants) if (!jokes.has(key)) problems.push(err('variants', `"${key}" is flagged localisedVariant but isn't a joke key`));
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

// ── Glyphs ─────────────────────────────────────────────────────────────────

const describeCp = (cp: number) => `U+${cp.toString(16).toUpperCase().padStart(4, '0')} ${String.fromCodePoint(cp)}`;

/**
 * Every character a locale's strings use must be in the subset fonts the
 * build ships (src/assets/fonts/generated/), in that locale's own font
 * stack (src/styles/fonts.css): otherwise it falls back to a system font,
 * or to a tofu box where there is none. 繁中 is set in Noto Serif TC, then
 * Source Serif 4: a character only the second has renders in the Latin
 * face, which is a warning (it shows, but in the other typeface). English
 * is Source Serif 4, then Noto Serif TC (names like 林雨晨). Whitespace has
 * no glyph to check.
 */
export function checkGlyphs(tables: Record<Locale, Table>, fonts: { cjk: Set<number>; latin: Set<number> }): Problem[] {
  const problems: Problem[] = [];
  const scan = (table: Table, locale: string, first: Set<number>, then: Set<number>, names: [string, string], fallbackIsWarning: boolean) => {
    const missing = new Map<number, string>();
    const fallback = new Map<number, string>();
    for (const [key, value] of Object.entries(table)) {
      for (const ch of value) {
        const cp = ch.codePointAt(0)!;
        if (/\s/u.test(ch) || cp < 0x20 || (cp >= 0xfe00 && cp <= 0xfe0f)) continue;
        if (first.has(cp)) continue;
        if (then.has(cp)) {
          if (fallbackIsWarning && !fallback.has(cp)) fallback.set(cp, key);
        } else if (!missing.has(cp)) missing.set(cp, key);
      }
    }
    for (const [cp, key] of missing) problems.push(err('glyphs', `${locale} "${key}" uses ${describeCp(cp)}, which neither subset font in its stack (${names.join(', ')}) has: it will fall back to a system font or a tofu box`));
    for (const [cp, key] of fallback) problems.push(warn('glyphs', `${locale} "${key}" uses ${describeCp(cp)}: not in the subset ${names[0]}, so it renders in ${names[1]}`));
  };
  scan(tables['zh-Hant-TW'], 'zh', fonts.cjk, fonts.latin, ['Noto Serif TC', 'Source Serif 4'], true);
  scan(tables.en, 'en', fonts.latin, fonts.cjk, ['Source Serif 4', 'Noto Serif TC'], false);
  return problems;
}

/**
 * Typesetting in 繁中: Latin letters and digits keep a space from Han characters ("Schlenk line 上",
 * "7 號"), as everywhere else in the Chinese text. Placeholders get theirs when they're filled in
 * (`fit` in src/i18n/i18n.ts); this checks the text around them.
 */
export function checkSpacing(tables: Record<Locale, Table>): Problem[] {
  const touching = /([A-Za-z0-9][\u3400-\u9fff\uf900-\ufaff]|[\u3400-\u9fff\uf900-\ufaff][A-Za-z0-9])/u;
  // An English sentence's stop (or its closing *) runs straight into Han: "CAROUSEL.*樣品槽".
  const stopTouching = /([A-Za-z0-9][.,;:!?]\*?[\u3400-\u9fff\uf900-\ufaff])/u;
  const problems: Problem[] = [];
  for (const [key, value] of Object.entries(tables['zh-Hant-TW'])) {
    // Placeholders are filled (and spaced) at runtime; their insides, like {n:一頁:幾頁}, aren't text.
    const text = value.replace(/\{[^}]*\}/g, ' ');
    const m = touching.exec(text) ?? stopTouching.exec(text);
    if (m) problems.push(err('spacing', `zh "${key}": "${m[1]}" needs a space between the Latin text and the Han characters`));
  }
  return problems;
}

// ── Size ───────────────────────────────────────────────────────────────────

export function contentSize(tables: Record<Locale, Table>): ReadingTotals {
  let en = 0;
  let zh = 0;
  for (const v of Object.values(tables.en)) en += englishWords(v);
  for (const v of Object.values(tables['zh-Hant-TW'])) zh += chineseChars(v);
  return { en, zh };
}
