/** Small DOM helpers shared by the UI and puzzle views. */

type Child = Node | string | null | undefined | false;

/** Create an element: h('button', { class: 'x', onclick }, 'Label'). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === 'class') {
      el.className = String(value);
    } else if (key === 'dataset' && typeof value === 'object') {
      for (const [dk, dv] of Object.entries(value as Record<string, string>)) el.dataset[dk] = dv;
    } else if (key in el && typeof value !== 'string') {
      (el as unknown as Record<string, unknown>)[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}

/** What Tab can reach: nothing disabled, and nothing taken out of the tab order (a roving group keeps one stop). */
const FOCUSABLE = ['a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]']
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(', ');

/** Keep Tab and Shift+Tab inside `root`. Returns a function that removes the trap. */
export function trapFocus(root: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    const active = document.activeElement as HTMLElement | null;
    // Focus may sit on something that isn't a Tab stop (the dialog's title, focused on open): step
    // from there to the next control in document order, or the previous one, wrapping inside.
    if (active && !items.includes(active)) {
      e.preventDefault();
      const after = items.filter((el) => active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      const before = items.filter((el) => active.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING);
      (e.shiftKey ? (before.at(-1) ?? last) : (after[0] ?? first)).focus();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}

/**
 * Keep keyboard focus inside `root` when the control that had it goes away:
 * a button that disables itself once pressed ("Put the vial in"), or one a
 * view redraws. After every click or key inside, if focus has fallen out to
 * the page, it goes to the nearest usable control from the same place:
 * the next one, or failing that the one before (#104).
 */
const FOCUSABLE_ANY = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function keepFocusIn(root: HTMLElement): () => void {
  let anchor: { el: HTMLElement; index: number } | null = null;
  const controls = () => [...root.querySelectorAll<HTMLElement>(FOCUSABLE_ANY)];
  const usable = (el: HTMLElement) =>
    !(el as HTMLButtonElement).disabled && el.getAttribute('aria-hidden') !== 'true' && el.tabIndex >= 0 && (el.offsetParent !== null || el.getClientRects().length > 0);
  const restore = () => {
    const a = anchor;
    anchor = null;
    if (!a || !root.isConnected) return;
    const active = document.activeElement;
    // Focus moved somewhere on purpose (inside, or into another dialog): leave it.
    if (active && active !== document.body && active !== document.documentElement) return;
    const list = controls();
    const at = a.el.isConnected ? list.indexOf(a.el) : Math.min(a.index, list.length);
    const target = list.slice(Math.max(0, at)).find(usable) ?? list.slice(0, Math.max(0, at)).reverse().find(usable);
    target?.focus();
  };
  const note = () => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || !root.contains(active)) return;
    anchor = { el: active, index: controls().indexOf(active) };
    window.setTimeout(restore, 0);
  };
  root.addEventListener('keydown', note, true);
  root.addEventListener('click', note, true);
  return () => {
    root.removeEventListener('keydown', note, true);
    root.removeEventListener('click', note, true);
  };
}

/**
 * Set an element's text the way the scenes render it: *emphasis* in italics, never as asterisks
 * (#128). Only touches the DOM when it changes, so a live region doesn't repeat itself.
 */
export function setInline(el: HTMLElement, text: string): void {
  const html = inline(text);
  if (el.innerHTML !== html) el.innerHTML = html;
}

/** The same text as plain words, for places that can't carry markup (a live region's copy, #109). */
export function plain(text: string): string {
  return text.replace(/\*([^*\n]+)\*/g, '$1');
}

/** Escape text for safe insertion and turn *emphasis* and line breaks into markup. */
export function inline(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return glue(escaped).replace(/\*([^*\n]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
}

/**
 * In 繁中 a number or a Latin word keeps its space from the Han after it, but not a line break: 「4 號」,
 * 「3 分鐘」 and 「microSD 卡」 were split across lines at the larger text sizes (#185).
 */
function glue(html: string): string {
  // A filename breaks after its underscores, so it never needs an emergency break that strands a 。.
  return html.replace(/_(?=[A-Za-z0-9])/g, '_<wbr>').replace(/([A-Za-z0-9]) (?=[\u3400-\u9fff\uf900-\ufaff])/g, '$1&nbsp;');
}

const ARROWS: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

/**
 * The arrow keys move between the buttons of a group (`role="group"`), as the README promises (#143):
 * left and up go back, right and down go on. Sliders, text fields and roving groups (src/puzzles/
 * roving.ts: the freezer, the cipher, the keypad, …) keep their own arrows.
 */
export function arrowsInGroups(root: HTMLElement): () => void {
  const onKey = (e: KeyboardEvent) => {
    const step = ARROWS[e.key];
    if (!step || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const target = e.target as HTMLElement;
    if (target.closest('[role="slider"], input, textarea, select, [data-roving]')) return;
    const group = target.closest<HTMLElement>('[role="group"]');
    if (!group || !root.contains(group)) return;
    const buttons = [...group.querySelectorAll<HTMLButtonElement>('button')].filter((b) => !b.disabled && b.getClientRects().length > 0);
    const next = buttons[buttons.indexOf(target as HTMLButtonElement) + step];
    if (buttons.includes(target as HTMLButtonElement) && next) {
      e.preventDefault();
      next.focus();
    }
  };
  root.addEventListener('keydown', onKey);
  return () => root.removeEventListener('keydown', onKey);
}
