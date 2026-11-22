/**
 * Player settings: stored apart from saves (a new game never resets them)
 * and applied to <html> as attributes the CSS reads. Defaults follow the
 * operating system: reduced motion, and Chinese if the browser prefers it.
 */
import { HTML_LANG, isLocale, setLocale, type Locale } from '../i18n/i18n.ts';
import type { KV } from '../save/storage.ts';

export const SETTINGS_KEY = 'dark-reaction.settings.v1';
export const TEXT_SIZES = [0, 1, 2, 3] as const;
export const TEXT_SPEEDS = ['slow', 'normal', 'fast', 'instant'] as const;

export type TextSize = (typeof TEXT_SIZES)[number];
export type TextSpeed = (typeof TEXT_SPEEDS)[number];

export interface Settings {
  locale: Locale;
  textSize: TextSize;
  textSpeed: TextSpeed;
  reduceMotion: boolean;
  /** Flicker allowed. Off for photosensitivity. */
  flicker: boolean;
  highContrast: boolean;
  audio: boolean;
  master: number;
  ambience: number;
  effects: number;
  contentNoteSeen: boolean;
}

function prefersReducedMotion(): boolean {
  try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

function preferredLocale(): Locale {
  const langs = globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? 'en'];
  for (const lang of langs) {
    const l = lang.toLowerCase();
    if (l.startsWith('zh')) return 'zh-Hant-TW';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

export function defaultSettings(): Settings {
  const reduce = prefersReducedMotion();
  return {
    locale: preferredLocale(),
    textSize: 1,
    textSpeed: 'normal',
    reduceMotion: reduce,
    flicker: !reduce,
    highContrast: false,
    audio: false,
    master: 0.8,
    ambience: 0.7,
    effects: 0.8,
    contentNoteSeen: false,
  };
}

const unit = (v: unknown, fallback: number) => (typeof v === 'number' && v >= 0 && v <= 1 ? v : fallback);

export function loadSettings(kv: KV): Settings {
  const base = defaultSettings();
  const text = kv.get(SETTINGS_KEY);
  if (!text) return base;
  try {
    const raw = JSON.parse(text) as Partial<Settings>;
    return {
      locale: isLocale(raw.locale) ? raw.locale : base.locale,
      textSize: TEXT_SIZES.includes(raw.textSize as TextSize) ? (raw.textSize as TextSize) : base.textSize,
      textSpeed: TEXT_SPEEDS.includes(raw.textSpeed as TextSpeed) ? (raw.textSpeed as TextSpeed) : base.textSpeed,
      reduceMotion: typeof raw.reduceMotion === 'boolean' ? raw.reduceMotion : base.reduceMotion,
      flicker: typeof raw.flicker === 'boolean' ? raw.flicker : base.flicker,
      highContrast: typeof raw.highContrast === 'boolean' ? raw.highContrast : base.highContrast,
      audio: typeof raw.audio === 'boolean' ? raw.audio : base.audio,
      master: unit(raw.master, base.master),
      ambience: unit(raw.ambience, base.ambience),
      effects: unit(raw.effects, base.effects),
      contentNoteSeen: raw.contentNoteSeen === true,
    };
  } catch {
    return base;
  }
}

export function saveSettings(kv: KV, settings: Settings): boolean {
  return kv.set(SETTINGS_KEY, JSON.stringify(settings));
}

/** Reflect settings on <html> (CSS reads the data attributes) and set the locale. */
export function applySettings(settings: Settings, root: HTMLElement = document.documentElement): void {
  root.lang = HTML_LANG[settings.locale];
  root.dataset['textSize'] = String(settings.textSize);
  root.dataset['motion'] = settings.reduceMotion ? 'reduce' : 'full';
  root.dataset['flicker'] = settings.flicker && !settings.reduceMotion ? 'on' : 'off';
  root.dataset['contrast'] = settings.highContrast ? 'high' : 'normal';
  setLocale(settings.locale);
}

/** Milliseconds per revealed word (or CJK character); 0 means instant. */
export function revealDelay(settings: Settings): number {
  if (settings.reduceMotion) return 0;
  return { slow: 55, normal: 28, fast: 12, instant: 0 }[settings.textSpeed];
}
