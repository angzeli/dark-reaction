/**
 * Loading a Layer 3 target into the real game in a Playwright page, and the
 * checks the sweep runs on what the page then shows: horizontal overflow,
 * clipped text, overlapping choices, tap targets, and 避頭尾 (Chinese
 * punctuation that must not start a line, brackets that must not end one).
 */
import type { Page } from '@playwright/test';
import type { GameState } from '../../../src/engine/types.ts';
import type { Locale } from '../../../src/i18n/i18n.ts';
import { SaveStore } from '../../../src/save/saves.ts';
import { memoryStorage } from '../../../src/save/storage.ts';
import type { Target } from './targets.ts';

export interface View {
  locale: Locale;
  reduceMotion: boolean;
  highContrast: boolean;
  /** Default `instant`, so screenshots never catch a passage half-revealed. */
  textSpeed?: 'slow' | 'normal' | 'fast' | 'instant';
  /** 0–3, default 1 (the game's own default). */
  textSize?: 0 | 1 | 2 | 3;
}

export const SETTINGS_KEY = 'dark-reaction.settings.v1';

export function settingsFor(view: View, overlay?: string): Record<string, unknown> {
  return {
    locale: view.locale,
    textSize: view.textSize ?? 1,
    textSpeed: view.textSpeed ?? 'instant',
    reduceMotion: view.reduceMotion,
    flicker: !view.reduceMotion,
    highContrast: view.highContrast,
    audio: false,
    master: 0.8,
    ambience: 0.7,
    effects: 0.8,
    contentNoteSeen: overlay !== 'note',
  };
}

export function envelopeFor(state: GameState): string {
  const env = new SaveStore(memoryStorage()).envelope(state, 'en');
  if (!env) throw new Error('state cannot be saved');
  return JSON.stringify(env);
}

/** Open the game with this target's save and settings, and wait until it has drawn. */
export async function loadTarget(page: Page, base: string, target: Target, view: View): Promise<void> {
  const settings = JSON.stringify(settingsFor(view, target.overlay));
  const save = target.state ? envelopeFor(target.state) : null;
  await page.addInitScript(
    ([key, s, env]) => {
      localStorage.clear();
      localStorage.setItem(key!, s!);
      if (env) localStorage.setItem('dark-reaction.save.auto', env);
    },
    [SETTINGS_KEY, settings, save] as const,
  );
  await page.goto(base);
  await page.waitForSelector('.title, .play, .ending, article.ending', { timeout: 15_000 }).catch(() => undefined);
  if (target.screen !== 'title') {
    await page.evaluate(() => (window as unknown as { darkReaction: { loadSlot(s: string): boolean } }).darkReaction.loadSlot('auto'));
    await page.waitForSelector(target.screen === 'ending' ? 'article.ending' : '.choice, .pz', { timeout: 15_000 });
  }
  if (target.overlay && target.overlay !== 'note') {
    await page.evaluate((o) => (window as unknown as { darkReaction: { openOverlay(o: string): void } }).darkReaction.openOverlay(o), target.overlay);
  }
  await page.evaluate(() => document.fonts.ready);
  // Let the stage draw its first frame and any reveal settle.
  await page.waitForTimeout(250);
}

export interface PageFinding {
  check: 'overflow' | 'clipped' | 'overlap' | 'tap-target' | 'kinsoku' | 'offscreen';
  detail: string;
}

/**
 * Characters that must not start a line in 繁中 (行首禁則), and openers that must not end one (行尾禁則).
 * The ellipsis …… and the dash —— may start a line as a pair, but a pair must never be split.
 */
export const NO_LINE_START = '，。、；：？！」』）】》〉～·％';
export const PAIRED = '…—';
export const NO_LINE_END = '「『（【《〈';

/** Run in the page: everything the sweep checks without looking. */
export async function pageFindings(page: Page, opts: { touch: boolean; zh: boolean }): Promise<PageFinding[]> {
  return page.evaluate(
    ({ touch, zh, noStart, noEnd, paired }) => {
      const out: Array<{ check: string; detail: string }> = [];
      const vw = window.innerWidth;
      const describe = (el: Element) => {
        const cls = (el as HTMLElement).className && typeof (el as HTMLElement).className === 'string' ? `.${(el as HTMLElement).className.trim().split(/\s+/).join('.')}` : '';
        const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 50);
        return `${el.tagName.toLowerCase()}${cls} “${text}”`;
      };
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
      };
      // The page itself scrolls sideways.
      if (document.documentElement.scrollWidth > vw + 1) out.push({ check: 'overflow', detail: `page is ${document.documentElement.scrollWidth}px wide in a ${vw}px viewport` });
      // Text that runs past the viewport's right edge, or is cut off by its box.
      for (const el of document.querySelectorAll('p, li, button, h1, h2, h3, label, td, th, span, a, pre, code, figcaption, .choice')) {
        if (!visible(el) || el.closest('[aria-hidden="true"], svg')) continue;
        const r = el.getBoundingClientRect();
        // Content inside something built to scroll sideways (the cipher's periodic table) is meant to run past the edge.
        let scroller = false;
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          const ox = getComputedStyle(a).overflowX;
          if ((ox === 'auto' || ox === 'scroll') && a.scrollWidth > a.clientWidth) scroller = true;
        }
        if (r.right > vw + 1 && !scroller) out.push({ check: 'offscreen', detail: `${describe(el)} ends at ${Math.round(r.right)}px` });
        const cs = getComputedStyle(el);
        // Screen-reader-only text is clipped to a pixel on purpose.
        if ((el as HTMLElement).clientWidth <= 1 || el.closest('.sr-only, .visually-hidden')) continue;
        if ((cs.overflowX === 'hidden' || cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis') && el.scrollWidth > (el as HTMLElement).clientWidth + 1) out.push({ check: 'clipped', detail: `${describe(el)} is cut off (${el.scrollWidth} > ${(el as HTMLElement).clientWidth})` });
      }
      // Choices drawn over one another.
      const choices = [...document.querySelectorAll('.choice')].filter(visible).map((el) => ({ el, r: el.getBoundingClientRect() }));
      for (let i = 0; i < choices.length; i++) {
        for (let j = i + 1; j < choices.length; j++) {
          const a = choices[i]!.r;
          const b = choices[j]!.r;
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) out.push({ check: 'overlap', detail: `${describe(choices[i]!.el)} overlaps ${describe(choices[j]!.el)}` });
        }
      }
      // Tap targets on a touch screen: WCAG 2.5.8 asks 24 px; Apple and Material ask 44/48.
      if (touch) {
        for (const el of document.querySelectorAll('button, a[href], input, select, [role="button"], [role="radio"], [role="tab"], .choice')) {
          if (!visible(el) || el.closest('[aria-hidden="true"]')) continue;
          // A checkbox or radio inside its label is hit by the whole label: measure that.
          const label = el instanceof HTMLInputElement ? el.labels?.[0] : null;
          const box = (label ?? el).getBoundingClientRect();
          // What a thumb can hit, not only the drawn box: a hit area can reach past it (a ::after, padding).
          const reach = (dx: number, dy: number) => {
            const hit = document.elementFromPoint(box.left + box.width / 2 + dx, box.top + box.height / 2 + dy);
            return !!hit && (hit === el || el.contains(hit) || (label ? label.contains(hit) : false));
          };
          const r = {
            width: box.width >= 24 || (reach(-12, 0) && reach(12, 0)) ? Math.max(box.width, 24) : box.width,
            height: box.height >= 24 || (reach(0, -12) && reach(0, 12)) ? Math.max(box.height, 24) : box.height,
          };
          if (r.width < 24 || r.height < 24) out.push({ check: 'tap-target', detail: `${describe(el)} is ${Math.round(r.width)}×${Math.round(r.height)} px (under WCAG 2.5.8’s 24)` });
          else if (r.height < 40 || r.width < 40) out.push({ check: 'tap-target', detail: `${describe(el)} is ${Math.round(r.width)}×${Math.round(r.height)} px (under 44)` });
        }
      }
      // 避頭尾: find where each line of Chinese text starts and ends.
      if (zh) {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent ?? '';
          const parent = node.parentElement;
          if (!parent || !text.trim() || !visible(parent) || parent.closest('[aria-hidden="true"], svg, script, style, pre')) continue;
          let prevTop: number | null = null;
          let prevChar = '';
          for (let i = 0; i < text.length; i++) {
            const ch = text[i]!;
            if (/\s/.test(ch)) continue;
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const rect = range.getClientRects()[0];
            if (!rect) continue;
            if (prevTop !== null && rect.top > prevTop + rect.height * 0.5) {
              const line = text.slice(Math.max(0, i - 6), i + 6).replace(/\s+/g, ' ');
              if (noStart.includes(ch)) out.push({ check: 'kinsoku', detail: `“${ch}” starts a line in ${describe(parent)}: …${line}…` });
              if (paired.includes(ch) && prevChar === ch) out.push({ check: 'kinsoku', detail: `“${ch}${ch}” is split across two lines in ${describe(parent)}: …${line}…` });
              if (noEnd.includes(prevChar)) out.push({ check: 'kinsoku', detail: `“${prevChar}” ends a line in ${describe(parent)}: …${line}…` });
            }
            prevTop = rect.top;
            prevChar = ch;
          }
        }
      }
      return out;
    },
    { touch: opts.touch, zh: opts.zh, noStart: NO_LINE_START, noEnd: NO_LINE_END, paired: PAIRED },
  ) as Promise<PageFinding[]>;
}
