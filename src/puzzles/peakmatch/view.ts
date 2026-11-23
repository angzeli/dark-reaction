/**
 * View for the peak match: the console on the UPS, green on black. Her
 * tube's spectrum with a label over each peak (as the software picks them,
 * so the readings move as you reference), a slider for the referencing
 * (arrow keys ±0.01, Page Up/Down ±0.1, or the four buttons), the peaks as
 * a row of buttons to choose from, and her reference beside it.
 *
 * It happens at 03:33, when the clock has stopped: it never reports any
 * minutes (the frame would end an attempt that reaches 03:33).
 */
import { h } from '../../ui/dom.ts';
import { bindRoving, setTabStop } from '../roving.ts';
import { DARK, fraction, HERS, polyline, trace, type Span } from '../spectra.ts';
import type { PuzzleView } from '../types.ts';
import { OFFSET_LIMIT, PEAKS, peakmatchLogic, peakSave, shown, type PeakMove, type PeakState } from './logic.ts';

/** The window on the screen, in referenced ppm. */
const SPAN: Span = { from: 9, to: 6.5 };
/** Her reference, around her peak. */
const REF: Span = { from: 8.75, to: 8.05 };
const W = 1000;
const H = 220;
const RH = 90;
const TICKS = [9, 8.5, 8, 7.5, 7, 6.5];
const STEPS: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
const pct = (f: number) => `${(f * 100).toFixed(2)}%`;
const ppm2 = (n: number) => n.toFixed(2);
const signed = (hundredths: number) => `${hundredths < 0 ? '−' : '+'}${(Math.abs(hundredths) / 100).toFixed(2)}`;

export const peakmatchView: PuzzleView = {
  mount(host, api, data) {
    let state: PeakState = peakmatchLogic.init({ minute: api.startMinute, act: api.act, data });
    /** The peak holding the row's Tab stop. */
    let peakAt = 0;

    const head = h('p', { class: 'pm__head' });
    const plot = h('div', { class: 'pm__plot' });
    const describe = h('p', { class: 'sr-only' });
    const slider = h('div', { class: 'pm__slider', role: 'slider', tabindex: '0', 'aria-valuemin': String(-OFFSET_LIMIT), 'aria-valuemax': String(OFFSET_LIMIT), dataset: { focusKey: 'pm-slider' } });
    const nudges = h('div', { class: 'pm__nudges' });
    const peaksRow = h('div', { class: 'pm__peaks', role: 'group' });
    const refTitle = h('p', { class: 'pm__ref-title' });
    const refPlot = h('div', { class: 'pm__ref-plot', 'aria-hidden': 'true' });
    const refNotes = h('ul', { class: 'pm__ref-notes', 'aria-hidden': 'true' });
    const refDescribe = h('p', { class: 'sr-only' });
    const ref = h('aside', { class: 'pm__ref' }, refTitle, refPlot, refNotes, refDescribe);
    const status = h('p', { class: 'pm__status', role: 'status', 'aria-live': 'polite' });
    const done = h('div', { class: 'pm__done' });
    const root = h(
      'div',
      { class: 'pm' },
      h('div', { class: 'pm__screen' }, head, plot, describe, h('div', { class: 'pm__controls' }, slider, nudges), peaksRow),
      ref,
      status,
      done,
    );
    let peakButtons: HTMLButtonElement[] = [];

    // Her reference never moves: draw it once.
    refPlot.innerHTML = `<svg viewBox="0 0 ${W} ${RH}" preserveAspectRatio="none" focusable="false"><polyline points="${polyline(trace(HERS, REF), W, RH, 0.16, -0.01)}" class="pm__trace pm__trace--ref" vector-effect="non-scaling-stroke"/></svg>`;

    const move = (m: PeakMove, focusKey?: string) => {
      state = peakmatchLogic.apply(state, m);
      api.saveData(peakSave(state));
      render(focusKey);
    };

    const feedback = (): string => {
      const f = state.last;
      if (!f) return '';
      if (f.kind === 'axis') return api.t('puzzle.peakmatch.axisWrong', { ppm: ppm2(shown(f.peak, state.offset)) });
      return api.t(`puzzle.peakmatch.${f.kind}`);
    };

    const render = (focusKey?: string) => {
      const found = state.found;
      // Solved before its last button is pressed: stepping away keeps it solved (#140).
      if (found) api.solved();
      head.textContent = api.t('puzzle.peakmatch.screen');
      // The trace, slid along the axis by the referencing.
      const values = trace(DARK, SPAN, state.offset / 100);
      const ticks = TICKS.map((t) => `<line x1="${fraction(t, SPAN) * W}" y1="${H - 8}" x2="${fraction(t, SPAN) * W}" y2="${H}" class="pm__tick"/>`).join('');
      plot.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${ticks}<polyline points="${polyline(values, W, H, 0.72, -0.04)}" class="pm__trace" vector-effect="non-scaling-stroke"/></svg>`;
      // Peak labels (as the software picks them) and the axis, in HTML so they stay crisp.
      for (const p of PEAKS) {
        const at = fraction(shown(p.id, state.offset), SPAN);
        if (at < 0.01 || at > 0.99) continue;
        plot.append(h('span', { class: `pm__label pm__label--${p.id}`, 'aria-hidden': 'true', style: `left: ${pct(at)}` }, ppm2(shown(p.id, state.offset))));
      }
      plot.append(h('div', { class: 'pm__axis', 'aria-hidden': 'true' }, ...TICKS.map((t) => h('span', { style: `left: ${pct(fraction(t, SPAN))}` }, t.toFixed(1)))));
      describe.textContent = api.t('puzzle.peakmatch.describe', {
        solvent: ppm2(shown('solvent', state.offset)),
        bump: ppm2(shown('bump', state.offset)),
        decoy: ppm2(shown('decoy', state.offset)),
        product: ppm2(shown('product', state.offset)),
      });

      slider.setAttribute('aria-label', api.t('puzzle.peakmatch.slider'));
      slider.setAttribute('aria-valuenow', String(state.offset));
      slider.setAttribute('aria-valuetext', `${signed(state.offset)} ppm`);
      slider.setAttribute('aria-disabled', String(found));
      slider.textContent = api.t('puzzle.peakmatch.offset', { offset: signed(state.offset) });
      nudges.replaceChildren(
        ...[-10, -1, 1, 10].map((by) =>
          h(
            'button',
            {
              type: 'button',
              class: 'pm__nudge',
              'aria-label': api.t('puzzle.peakmatch.nudge', { by: signed(by) }),
              disabled: found,
              dataset: { by: String(by), focusKey: `pm-nudge-${by}` },
              onclick: () => move({ type: 'nudge', by }, `pm-nudge-${by}`),
            },
            signed(by),
          ),
        ),
      );

      // The peaks, left to right as they sit on the screen.
      const visible = PEAKS.filter((p) => {
        const at = fraction(shown(p.id, state.offset), SPAN);
        return at >= 0.01 && at <= 0.99;
      });
      peakButtons = visible.map((p) =>
        h(
          'button',
          {
            type: 'button',
            class: 'pm__peak',
            disabled: found,
            dataset: { peak: p.id, focusKey: `pm-peak-${p.id}` },
            onclick: () => move({ type: 'pick', peak: p.id }, `pm-peak-${p.id}`),
          },
          api.t('puzzle.peakmatch.peak', { ppm: ppm2(shown(p.id, state.offset)) }),
        ),
      );
      peaksRow.setAttribute('aria-label', api.t('puzzle.peakmatch.peaks'));
      peaksRow.replaceChildren(...peakButtons);
      peakAt = Math.min(peakAt, Math.max(0, peakButtons.length - 1));
      setTabStop(peakButtons, peakAt);

      refTitle.textContent = api.t('puzzle.peakmatch.reference');
      refNotes.replaceChildren(h('li', {}, api.t('puzzle.peakmatch.reference.product')), h('li', {}, api.t('puzzle.peakmatch.reference.solvent')));
      refDescribe.textContent = api.t('puzzle.peakmatch.reference.describe');

      const said = feedback();
      if (status.textContent !== said) status.textContent = said;
      done.replaceChildren(
        ...(found ? [h('button', { type: 'button', class: 'pm__finish', dataset: { focusKey: 'pm-finish' }, onclick: () => api.finish(true) }, api.t('puzzle.peakmatch.done'))] : []),
      );
      const target = found ? done.querySelector<HTMLElement>('button') : focusKey ? root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]:not([disabled])`) : null;
      target?.focus({ preventScroll: !found });
    };

    slider.addEventListener('keydown', (e) => {
      if (state.found || e.altKey || e.ctrlKey || e.metaKey) return;
      const by = e.key in STEPS ? STEPS[e.key]! : e.key === 'Home' ? -OFFSET_LIMIT - state.offset : e.key === 'End' ? OFFSET_LIMIT - state.offset : null;
      if (by === null) return;
      e.preventDefault();
      move({ type: 'nudge', by }, 'pm-slider');
    });
    bindRoving(peaksRow, {
      items: () => peakButtons,
      spots: () => peakButtons.map((_, i) => ({ row: 0, col: i })),
      linear: true,
      onMove: (i) => {
        peakAt = i;
        setTabStop(peakButtons, i);
        peakButtons[i]!.focus();
      },
    });
    peaksRow.addEventListener('focusin', (e) => {
      const i = peakButtons.indexOf(e.target as HTMLButtonElement);
      if (i >= 0) {
        peakAt = i;
        setTabStop(peakButtons, i);
      }
    });

    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
