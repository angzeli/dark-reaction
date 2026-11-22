/**
 * Text reveal: new paragraphs fade in word by word (character by character
 * for CJK). Any click, tap, Space or Enter completes it at once; with
 * reduced motion or the "instant" speed there is no reveal at all. The text
 * is fully present in the DOM from the start, so screen readers never get
 * half a sentence.
 */

const CJK = /[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/;

/** Wrap every word (or CJK character) in the element's text nodes in a span. */
function tokenise(root: HTMLElement): HTMLElement[] {
  const spans: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) texts.push(n as Text);
  for (const text of texts) {
    const value = text.nodeValue ?? '';
    const frag = document.createDocumentFragment();
    // Words with their trailing space, or single CJK characters with any trailing punctuation.
    const tokens = value.match(/[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef][\u3000-\u303f\uff00-\uffef]*|[^\s\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]+\s*|\s+/g) ?? [];
    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        frag.append(token);
        continue;
      }
      const span = document.createElement('span');
      span.className = 'rv';
      span.textContent = token;
      frag.append(span);
      spans.push(span);
    }
    text.replaceWith(frag);
  }
  return spans;
}

export interface Reveal {
  readonly done: Promise<void>;
  readonly running: boolean;
  /** Show everything now. */
  complete(): void;
}

/**
 * Reveal `elements` in order. `delay` is ms per token (0 = instant).
 * Returns a handle that resolves when everything is visible.
 */
export function reveal(elements: HTMLElement[], delay: number): Reveal {
  const container = elements[0]?.parentElement ?? null;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  let running = true;
  let timer: number | undefined;

  const finish = () => {
    if (!running) return;
    running = false;
    if (timer !== undefined) window.clearTimeout(timer);
    container?.classList.add('rv-done');
    for (const el of elements) el.classList.add('rv-done');
    resolveDone();
  };

  if (delay <= 0 || elements.length === 0) {
    for (const el of elements) el.classList.add('rv-done');
    running = false;
    resolveDone();
    return { done, running: false, complete: () => undefined };
  }

  container?.classList.remove('rv-done');
  const spans = elements.flatMap((el) => {
    el.classList.add('rv-pending');
    return tokenise(el);
  });
  let i = 0;
  const step = () => {
    // Reveal a few tokens per tick to keep timers coarse.
    const batch = 2;
    for (let k = 0; k < batch && i < spans.length; k++, i++) spans[i]!.classList.add('rv-on');
    if (i >= spans.length) {
      finish();
      return;
    }
    const last = spans[i - 1]!;
    const pause = /[.!?。！？…]\s*$/.test(last.textContent ?? '') ? 6 : CJK.test(last.textContent ?? '') ? 0.6 : 1;
    timer = window.setTimeout(step, delay * batch * pause);
  };
  step();

  return {
    done,
    get running() {
      return running;
    },
    complete: finish,
  };
}
