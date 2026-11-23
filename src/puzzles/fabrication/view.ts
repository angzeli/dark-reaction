/**
 * View for the three spectra: yours on the left-hand screen, the printout,
 * and Figure 3 of the 2020 paper, each drawn from src/puzzles/spectra.ts.
 * Under the printout and the figure, a strip of baseline magnified twenty
 * times, where noise can be seen. "Lay the printout over Figure 3" draws
 * one over the other; the noise then reads as a single line, and only then
 * can it be circled (before that, tapping it says it's only noise). Every
 * feature you can circle is a real button over the plot, with a name, and
 * each plot is described in words.
 */
import { h, setInline } from '../../ui/dom.ts';
import { FIGURE_3, fraction, OWN, polyline, PRINTOUT, PRODUCT_PPM, SOLVENT_PPM, trace, type Span, type SpectrumSpec } from '../spectra.ts';
import type { PuzzleView } from '../types.ts';
import { fabricationLogic, fabricationSave, TELLS, type FabricationMove, type FabricationState, type Feature } from './logic.ts';

const FULL: Span = { from: 10, to: 0 };
/** A stretch of empty baseline, left of the peak, magnified. */
const STRIP: Span = { from: 10, to: 8.7 };
const W = 1000;
const H = 200;
const SH = 60;
const TICKS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
const pct = (f: number) => `${(f * 100).toFixed(2)}%`;

/** The main trace and a magnified strip of baseline, as SVG polylines. */
const mainLine = (spec: SpectrumSpec) => polyline(trace(spec, FULL), W, H, 1, -0.05);
function stripLine(spec: SpectrumSpec): string {
  const values = trace(spec, STRIP);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return polyline(
    values.map((v) => v - mean),
    W,
    SH,
    0.03,
    -0.03,
  );
}
/** The printout's integral: a step over the peak, labelled 1.000. */
function integralPath(): string {
  const x0 = fraction(PRODUCT_PPM + 0.05, FULL) * W;
  const x1 = fraction(PRODUCT_PPM - 0.05, FULL) * W;
  return `M${x0 - 20} 52 L${x0} 52 C${(x0 + x1) / 2} 52 ${(x0 + x1) / 2} 22 ${x1} 22 L${x1 + 20} 22`;
}

export const fabricationView: PuzzleView = {
  mount(host, api, data) {
    let state: FabricationState = fabricationLogic.init({ minute: api.startMinute, act: api.act, data });
    const lines = { own: mainLine(OWN), printout: mainLine(PRINTOUT), figure: mainLine(FIGURE_3), printoutStrip: stripLine(PRINTOUT), figureStrip: stripLine(FIGURE_3) };

    const overlay = h('button', { type: 'button', class: 'fb__overlay', dataset: { focusKey: 'fb-overlay' } });
    const plots = h('div', { class: 'fb__plots' });
    const circled = h('p', { class: 'fb__circled' });
    const status = h('p', { class: 'fb__status', role: 'status', 'aria-live': 'polite' });
    const done = h('div', { class: 'fb__done' });
    const root = h('div', { class: 'fb' }, overlay, plots, circled, status, done);

    const move = (m: FabricationMove, focusKey?: string) => {
      state = fabricationLogic.apply(state, m);
      api.saveData(fabricationSave(state));
      api.setMinutes(fabricationLogic.minutes(state));
      render(focusKey);
    };

    const axis = () =>
      h(
        'div',
        { class: 'fb__axis', 'aria-hidden': 'true' },
        // The end ticks sit inside the plot's edges; the unit rides on the last one.
        ...TICKS.map((ppm, i) =>
          h('span', { class: ppm % 2 ? 'fb__tick--odd' : '', style: `left: ${pct(fraction(ppm, FULL))}` }, i === TICKS.length - 1 ? `${ppm} ${api.t('puzzle.fabrication.axis')}` : String(ppm)),
        ),
      );

    /** A circle-able feature: a button laid over the plot, placed by `css`. */
    const spot = (feature: Feature, css: string, label = `puzzle.fabrication.mark.${feature}`) => {
      const tell = (TELLS as readonly string[]).includes(feature);
      const marked = tell && state.marked.includes(feature as never);
      return h('button', {
        type: 'button',
        class: `fb__spot fb__spot--${feature}${marked ? ' fb__spot--marked' : ''}`,
        'aria-label': api.t(label),
        'aria-pressed': tell ? String(marked) : undefined,
        disabled: fabricationLogic.isSolved(state),
        dataset: { feature, focusKey: `fb-${feature}` },
        style: css,
        onclick: () => move({ type: 'mark', feature }, `fb-${feature}`),
      });
    };
    const around = (at: number, half: number) => `left: ${pct(at - half)}; width: ${pct(half * 2)};`;

    const svg = (cls: string, height: number, ...paths: string[]) => {
      const el = h('span', { class: cls, 'aria-hidden': 'true' });
      el.innerHTML = `<svg viewBox="0 0 ${W} ${height}" preserveAspectRatio="none" focusable="false">${paths.join('')}</svg>`;
      return el;
    };
    const path = (points: string, cls: string) => `<polyline points="${points}" class="${cls}" vector-effect="non-scaling-stroke"/>`;

    const render = (focusKey?: string) => {
      const solved = fabricationLogic.isSolved(state);
      // Solved before its last button is pressed: stepping away keeps it solved (#140).
      if (solved) api.solved();
      overlay.textContent = api.t('puzzle.fabrication.overlay');
      overlay.setAttribute('aria-pressed', String(state.overlay));
      overlay.disabled = solved;
      const peak = fraction(PRODUCT_PPM, FULL);
      const solvent = fraction(SOLVENT_PPM, FULL);

      const own = h(
        'figure',
        { class: 'fb__plot fb__plot--own', dataset: { plot: 'own' } },
        h('figcaption', { class: 'fb__caption' }, api.t('puzzle.fabrication.own')),
        h('div', { class: 'fb__frame fb__frame--screen' }, h('div', { class: 'fb__area' }, svg('fb__svg', H, path(lines.own, 'fb__trace fb__trace--own')))),
        axis(),
        h('p', { class: 'sr-only' }, api.t('puzzle.fabrication.describe.own')),
      );

      const printout = h(
        'figure',
        { class: 'fb__plot fb__plot--printout', dataset: { plot: 'printout' } },
        h('figcaption', { class: 'fb__caption' }, api.t('puzzle.fabrication.printout')),
        h(
          'div',
          { class: 'fb__frame fb__frame--paper' },
          h('div', { class: 'fb__printhead' }, h('p', { class: 'fb__header', 'aria-hidden': 'true' }, api.t('puzzle.fabrication.header')), spot('acquired', 'inset: 0.1rem;')),
          h(
            'div',
            { class: 'fb__area' },
            svg('fb__svg', H, path(lines.printout, 'fb__trace fb__trace--print'), `<path d="${integralPath()}" class="fb__integral" vector-effect="non-scaling-stroke"/>`),
            h('span', { class: 'fb__coffee', 'aria-hidden': 'true' }),
            h('span', { class: 'fb__integral-label', 'aria-hidden': 'true', style: `left: ${pct(peak)}` }, '1.000'),
            spot('coffee', 'right: 0.35rem; width: 4.2rem; top: 0.15rem; height: 3.6rem;'),
            spot('integral', `${around(peak + 0.02, 0.06)} top: 0.1rem; height: 1.9rem;`),
            spot('peak', `${around(peak, 0.022)} top: 2.2rem; bottom: 2.3rem;`),
            spot('satellites', `${around(peak, 0.07)} bottom: 0.2rem; height: 1.9rem;`),
            spot('solvent', `${around(solvent, 0.045)} bottom: 0.2rem; height: 1.9rem;`),
          ),
        ),
        axis(),
        h('div', { class: 'fb__strip fb__strip--paper' }, svg('fb__svg', SH, path(lines.printoutStrip, 'fb__trace fb__trace--print')), h('span', { class: 'fb__strip-label' }, api.t('puzzle.fabrication.zoom'))),
        h('p', { class: 'sr-only' }, api.t('puzzle.fabrication.describe.printout')),
      );

      const over = state.overlay;
      const figure = h(
        'figure',
        { class: `fb__plot fb__plot--figure${over ? ' fb__plot--overlaid' : ''}`, dataset: { plot: 'figure', overlay: String(over) } },
        h('figcaption', { class: 'fb__caption' }, api.t('puzzle.fabrication.figure')),
        h(
          'div',
          { class: 'fb__frame fb__frame--pdf' },
          h('div', { class: 'fb__area' }, svg('fb__svg', H, path(lines.figure, 'fb__trace fb__trace--figure'), over ? path(lines.printout, 'fb__trace fb__trace--over') : '')),
        ),
        axis(),
        h(
          'div',
          { class: 'fb__strip fb__strip--pdf' },
          svg('fb__svg', SH, path(lines.figureStrip, 'fb__trace fb__trace--figure'), over ? path(lines.printoutStrip, 'fb__trace fb__trace--over') : ''),
          h('span', { class: 'fb__strip-label' }, api.t('puzzle.fabrication.zoom')),
          // Tapped on its own it's just noise; laid over the printout's, it gives itself away.
          spot('noise', 'inset: 0;', over ? 'puzzle.fabrication.mark.noise' : 'puzzle.fabrication.mark.baseline'),
        ),
        h('p', { class: 'sr-only' }, api.t(over ? 'puzzle.fabrication.describe.overlay' : 'puzzle.fabrication.describe.figure')),
      );
      plots.replaceChildren(own, printout, figure);

      const names = state.marked.map((t) => api.t(`puzzle.fabrication.mark.${t}`));
      circled.textContent = names.length ? api.t('puzzle.fabrication.circled', { list: names.join(api.t('puzzle.fabrication.list.sep')) }) : api.t('puzzle.fabrication.circled.none');

      const f = state.last;
      const said = !f
        ? ''
        : f.kind === 'marked'
          ? api.t(`puzzle.fabrication.why.${f.feature}`)
          : f.kind === 'unmarked'
            ? api.t('puzzle.fabrication.unmarked')
            : f.kind === 'decoy'
              ? api.t(`puzzle.fabrication.decoy.${f.feature}`)
              : f.kind === 'overlayFirst'
                ? api.t('puzzle.fabrication.overlayFirst')
                : api.t(f.on ? 'puzzle.fabrication.overlay.on' : 'puzzle.fabrication.overlay.off');
      setInline(status, said);

      done.replaceChildren(
        ...(solved
          ? [
              h('p', { class: 'fb__enough' }, api.t('puzzle.fabrication.enough')),
              h('button', { type: 'button', class: 'fb__finish', dataset: { focusKey: 'fb-finish' }, onclick: () => api.finish(true) }, api.t('puzzle.fabrication.done')),
            ]
          : []),
      );
      const target = solved ? done.querySelector<HTMLElement>('button') : focusKey ? root.querySelector<HTMLElement>(`[data-focus-key="${focusKey}"]:not([disabled])`) : null;
      target?.focus({ preventScroll: !solved });
    };

    overlay.addEventListener('click', () => move({ type: 'overlay' }, 'fb-overlay'));
    render();
    host.appendChild(root);
    return { rerender: () => render(), destroy: () => root.remove() };
  },
};
