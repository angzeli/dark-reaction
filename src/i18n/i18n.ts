/**
 * String lookup. Every player-visible string is a key looked up in the
 * current locale's table. Pure: no DOM. The UI listens for locale changes
 * and re-renders; the game state never contains text, so switching
 * language never touches it.
 *
 * Placeholders:
 *   {name}               replaced by params.name
 *   {n:minute:minutes}   singular/plural word chosen by params.n (English)
 *   params values starting with "@" are themselves keys, e.g. { entry: '@nb.mug.title' }
 */
import { en } from './en.ts';
import { zhHantTW } from './zh-Hant-TW.ts';

export type Locale = 'en' | 'zh-Hant-TW';
export type Table = Readonly<Record<string, string>>;
export type Params = Readonly<Record<string, string | number>>;

export const LOCALES: readonly Locale[] = ['en', 'zh-Hant-TW'];
/** BCP 47 tags for <html lang>, so fonts, hyphenation and screen readers follow. */
export const HTML_LANG: Record<Locale, string> = { en: 'en-GB', 'zh-Hant-TW': 'zh-Hant-TW' };

export const TABLES: Record<Locale, Table> = { en, 'zh-Hant-TW': zhHantTW };

let current: Locale = 'en';
const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  return current;
}

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'zh-Hant-TW';
}

export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  for (const listener of listeners) listener(locale);
}

/** Subscribe to locale changes; returns an unsubscribe function. */
export function onLocaleChange(listener: (locale: Locale) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function has(key: string, locale: Locale = current): boolean {
  return Object.prototype.hasOwnProperty.call(TABLES[locale], key);
}

const PLURAL = /\{(\w+):([^:{}]*):([^:{}]*)\}/g;
const PLACEHOLDER = /\{(\w+)\}/g;

function missing(key: string, locale: Locale): string {
  const dev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
  if (dev) console.error(`i18n: missing key "${key}" in ${locale}`);
  return `[[${key}]]`;
}

/** Look up a key and fill its placeholders. */
export function t(key: string, params?: Params, locale: Locale = current): string {
  const template = TABLES[locale][key];
  if (template === undefined) return missing(key, locale);
  if (!params) return template;
  const value = (name: string): string => {
    const v = params[name];
    if (v === undefined) return `{${name}}`;
    if (typeof v === 'string' && v.startsWith('@')) return t(v.slice(1), undefined, locale);
    return String(v);
  };
  return template
    .replace(PLURAL, (_, name: string, one: string, many: string) => (Number(params[name]) === 1 ? one : many))
    .replace(PLACEHOLDER, (match: string, name: string, at: number, whole: string) => fit(value(name), whole[at - 1] ?? '', whole[at + match.length] ?? '', locale));
}

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/;
const LATIN_START = /^[A-Za-z0-9]/;
const LATIN_END = /[A-Za-z0-9]$/;

/**
 * A value set into its template's text. It can't know what's next to it, so: a value that ends its own
 * sentence ("Y.C.L.") doesn't get the template's full stop as well, and in 繁中 a value that starts or
 * ends with Latin letters or digits gets the space the tables put by hand between those and Chinese
 * characters (「你當時在 4.08 研究生辦公室」, #117).
 */
function fit(value: string, before: string, after: string, locale: Locale): string {
  let v = after === '.' && value.endsWith('.') ? value.slice(0, -1) : value;
  if (locale === 'zh-Hant-TW') {
    if (HAN.test(before) && LATIN_START.test(v)) v = ` ${v}`;
    if (HAN.test(after) && LATIN_END.test(v)) v = `${v} `;
  }
  return v;
}

/** The placeholder names a template uses (plural selectors count as uses of their variable). */
export function placeholders(template: string): string[] {
  const names = new Set<string>();
  for (const m of template.matchAll(PLURAL)) names.add(m[1]!);
  for (const m of template.replace(PLURAL, '').matchAll(PLACEHOLDER)) names.add(m[1]!);
  return [...names].sort();
}

export interface TableComparison {
  missingInB: string[];
  missingInA: string[];
  empty: Array<{ locale: 'a' | 'b'; key: string }>;
  placeholderMismatch: Array<{ key: string; a: string[]; b: string[] }>;
}

/**
 * Compare two tables for parity: identical key sets, no empty strings and
 * the same placeholders per key. Plural selectors are English-only, so a
 * key may use {n:…:…} in one locale and {n} in the other.
 */
export function compareTables(a: Table, b: Table): TableComparison {
  const result: TableComparison = { missingInB: [], missingInA: [], empty: [], placeholderMismatch: [] };
  for (const key of Object.keys(a)) if (!(key in b)) result.missingInB.push(key);
  for (const key of Object.keys(b)) if (!(key in a)) result.missingInA.push(key);
  for (const [key, value] of Object.entries(a)) if (value.trim() === '') result.empty.push({ locale: 'a', key });
  for (const [key, value] of Object.entries(b)) if (value.trim() === '') result.empty.push({ locale: 'b', key });
  for (const key of Object.keys(a)) {
    if (!(key in b)) continue;
    const pa = placeholders(a[key]!);
    const pb = placeholders(b[key]!);
    if (pa.join() !== pb.join()) result.placeholderMismatch.push({ key, a: pa, b: pb });
  }
  return result;
}
