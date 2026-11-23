/**
 * View for the UPS panel and the compressor beside it. The chirp pattern
 * plays once when you arrive and again on "Listen again", from one
 * schedule (src/audio/chirp.ts): each chirp is a sound (only if the player
 * has sound on) and a light. With flicker allowed and motion not reduced,
 * the LED flashes; otherwise each chirp lights one steady segment, and the
 * segments clear when the next group begins, so nothing flashes. A screen
 * reader hears each group as words. The keypad is a 3 × 4 grid: arrow keys,
 * taps, or the number keys.
 */
import { h, inline } from '../../ui/dom.ts';
import { bindRoving, setTabStop } from '../roving.ts';
import type { PuzzleView } from '../types.ts';
import { chirpLogic, chirpSave, GROUP_OF, PATTERN, PIN, SCHEDULE, type ChirpMove, type ChirpState } from './logic.ts';

/** The keypad, as laid out on the panel. */
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'] as const;
type Key = (typeof KEYS)[number];
/** A moment before the first chirp, so the light isn't caught mid-group. */
const LEAD_IN = 600;
/** How long a flash stays lit. */
const FLASH = 140;
const SEGMENTS = Math.max(...PATTERN);

export const chirpView: PuzzleView = {
  mount(host, api, data) {
    let state: ChirpState = chirpLogic.init({ minute: api.startMinute, act: api.act, data });
    const flash = api.flicker && !api.reduceMotion;

    const led = h('span', { class: 'cp__led', 'aria-hidden': 'true', dataset: { chirps: '0' } });
    const segments = Array.from({ length: SEGMENTS }, () => h('span', { class: 'cp__seg' }));
    const strip = h('span', { class: 'cp__strip', 'aria-hidden': 'true', dataset: { chirps: '0' } }, ...segments);
    const ledLabel = h('span', { class: 'cp__led-label' });
    const postit = h('p', { class: 'cp__postit' });
    const listen = h('button', { type: 'button', class: 'cp__listen', dataset: { focusKey: 'cp-listen' } });
    const heard = h('p', { class: 'sr-only cp__heard', 'aria-live': 'polite' });
    const panel = h('div', { class: `cp__panel cp__panel--${flash ? 'flash' : 'steady'}` }, h('div', { class: 'cp__light' }, flash ? led : strip, ledLabel), postit, listen, heard);
    const screen = h('p', { class: 'cp__screen' });
    const digits = h('p', { class: 'cp__digits' });
    const keypad = h('div', { class: 'cp__keypad', role: 'group' });
    const ups = h('div', { class: 'cp__ups' }, h('div', { class: 'cp__display' }, screen, digits), keypad);
    const status = h('p', { class: 'cp__status', role: 'status', 'aria-live': 'polite' });
    const done = h('div', { class: 'cp__done' });
    const root = h('div', { class: 'cp' }, panel, ups, status, done);
    let keys: HTMLButtonElement[] = [];
    let shownStatus = '';
    let keyAt = KEYS.indexOf('1');

    // ── The chirps ─────────────────────────────────────────────────────────

    let timers: number[] = [];
    let playing = false;
    const later = (ms: number, f: () => void) => timers.push(window.setTimeout(f, ms));
    const lit = (n: number) => segments.forEach((seg, i) => seg.classList.toggle('cp__seg--on', i < n));

    const stop = () => {
      for (const id of timers) window.clearTimeout(id);
      timers = [];
      playing = false;
      led.classList.remove('cp__led--on');
    };

    const play = () => {
      stop();
      playing = true;
      led.dataset['chirps'] = '0';
      strip.dataset['chirps'] = '0';
      lit(0);
      heard.textContent = '';
      renderListen();
      SCHEDULE.times.forEach((at, i) => {
        const group = GROUP_OF[i]!;
        const inGroup = i - GROUP_OF.indexOf(group);
        later(LEAD_IN + at * 1000, () => {
          api.cue('chirp');
          led.dataset['chirps'] = strip.dataset['chirps'] = String(i + 1);
          if (flash) {
            led.classList.add('cp__led--on');
            later(FLASH, () => led.classList.remove('cp__led--on'));
          } else {
            lit(inGroup + 1);
          }
          // The group's last chirp: say it in words, for anyone who can't see the light.
          if (inGroup === PATTERN[group]! - 1) heard.textContent = api.t(`puzzle.chirp.sr.${PATTERN[group]}`);
        });
      });
      later(LEAD_IN + SCHEDULE.length * 1000, () => {
        playing = false;
        heard.textContent = api.t('puzzle.chirp.sr.cycle');
        renderListen();
      });
    };

    // ── The keypad ─────────────────────────────────────────────────────────

    const move = (m: ChirpMove, focusKey?: string) => {
      state = chirpLogic.apply(state, m);
      api.saveData(chirpSave(state));
      api.setMinutes(chirpLogic.minutes(state));
      render(focusKey);
    };
    const press = (key: Key) => {
      keyAt = KEYS.indexOf(key);
      if (key === 'clear') move({ type: 'clear' }, `cp-key-${key}`);
      else if (key === 'enter') move({ type: 'enter' }, `cp-key-${key}`);
      else move({ type: 'digit', digit: Number(key) }, `cp-key-${key}`);
    };

    const renderListen = () => {
      listen.textContent = api.t(playing ? 'puzzle.chirp.listening' : 'puzzle.chirp.listen');
      listen.setAttribute('aria-busy', String(playing));
    };

    const feedback = (): string => {
      const f = state.last;
      if (!f) return '';
      if (f.kind === 'wrong') return f.rotated ? api.t('puzzle.chirp.rotated', { wrong: '@puzzle.chirp.wrong' }) : api.t('puzzle.chirp.wrong');
      return api.t(`puzzle.chirp.${f.kind}`);
    };

    const render = (focusKey?: string) => {
      ledLabel.textContent = api.t('puzzle.chirp.led');
      postit.textContent = api.t('puzzle.chirp.postit');
      renderListen();
      screen.textContent = api.t(state.armed ? 'puzzle.chirp.display.armed' : 'puzzle.chirp.display.hold');
      screen.dataset['armed'] = String(state.armed);
      // The display shows blanks; a screen reader hears what has been typed.
      const shown = [...PIN].map((_, i) => state.entered[i] ?? '_').join(' ');
      digits.replaceChildren(
        h('span', { 'aria-hidden': 'true' }, shown),
        h('span', { class: 'sr-only' }, state.entered ? api.t('puzzle.chirp.pin', { digits: [...state.entered].join(' ') }) : api.t('puzzle.chirp.pin.empty')),
      );
      keypad.setAttribute('aria-label', api.t('puzzle.chirp.keypad'));
      keys = KEYS.map((key) =>
        h(
          'button',
          {
            type: 'button',
            class: `cp__key cp__key--${/\d/.test(key) ? 'digit' : key}`,
            disabled: state.armed,
            dataset: { key, focusKey: `cp-key-${key}` },
            onclick: () => press(key),
          },
          /\d/.test(key) ? key : api.t(`puzzle.chirp.key.${key}`),
        ),
      );
      keypad.replaceChildren(...keys);
      setTabStop(keys, keyAt);
      // The panel's own words are in capitals and emphasis (*PIN REJECTED*).
      const said = feedback();
      if (said !== shownStatus) {
        shownStatus = said;
        status.innerHTML = inline(said);
      }
      // Solved before its last button is pressed: stepping away keeps it solved (#140).
      if (state.armed) api.solved();
      done.replaceChildren(
        ...(state.armed
          ? [h('button', { type: 'button', class: 'cp__finish', dataset: { focusKey: 'cp-finish' }, onclick: () => api.finish(true) }, api.t('puzzle.chirp.done'))]
          : []),
      );
      const target = state.armed ? done.querySelector<HTMLElement>('button') : focusKey ? root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]:not([disabled])`) : null;
      target?.focus({ preventScroll: !state.armed });
    };

    bindRoving(keypad, {
      items: () => keys,
      spots: () => KEYS.map((_, i) => ({ row: Math.floor(i / 3), col: i % 3 })),
      onMove: (i) => {
        keyAt = i;
        setTabStop(keys, i);
        keys[i]!.focus();
      },
    });
    // The number keys type straight onto the keypad; Backspace and Delete clear it. With all
    // four digits in, Enter sends them from any digit key, as it would on the panel (a fifth
    // digit does nothing anyway); on Clear it still clears.
    keypad.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || state.armed) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key as Key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        press('clear');
      } else if (e.key === 'Enter' && state.entered.length === PIN.length && (e.target as HTMLElement).dataset['key'] !== 'clear') {
        e.preventDefault();
        press('enter');
      }
    });
    listen.addEventListener('click', () => play());

    render();
    host.appendChild(root);
    later(0, () => play());
    return {
      rerender: () => render(),
      destroy: () => {
        stop();
        root.remove();
      },
    };
  },
};
