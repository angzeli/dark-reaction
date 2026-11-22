/**
 * View for the NMR console: a transcript, a prompt you can type into, and
 * tappable command chips so touch players never need a keyboard. Ian's
 * laminated quick-reference card sits beside it.
 */
import { h } from '../../ui/dom.ts';
import type { PuzzleView } from '../types.ts';
import { consoleLogic, consoleSave, type ConsoleState } from './logic.ts';

const PROMPT = 'ar4217@nmr400:~$';

export const consoleView: PuzzleView = {
  mount(host, api, data) {
    let state: ConsoleState = consoleLogic.init({ minute: api.startMinute, act: api.act, data });

    const card = h('pre', { class: 'con__card' });
    const transcript = h('div', { class: 'con__log', role: 'log', 'aria-live': 'polite', tabindex: '0' });
    const input = h('input', {
      class: 'con__input',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: false,
      enterkeyhint: 'send',
      dataset: { focusKey: 'con-input' },
    });
    const run = h('button', { type: 'button', class: 'con__run' });
    const label = h('label', { class: 'con__prompt' }, h('span', { 'aria-hidden': 'true' }, PROMPT), input);
    const form = h('form', { class: 'con__form' }, label, run);
    const chips = h('div', { class: 'con__chips', role: 'group' });
    const done = h('div', { class: 'con__done' });
    const screen = h('div', { class: 'con__screen' }, transcript, form, chips);
    const root = h('div', { class: 'con' }, screen, card, done);

    const submit = (command: string) => {
      state = consoleLogic.apply(state, command);
      api.saveData(consoleSave(state));
      api.setMinutes(consoleLogic.minutes(state));
      if (state.closed) {
        api.finish(consoleLogic.isSolved(state));
        return;
      }
      input.value = '';
      render();
      if (consoleLogic.isSolved(state)) (done.querySelector('button') as HTMLButtonElement | null)?.focus();
    };

    const render = () => {
      card.textContent = api.t('puzzle.console.card');
      transcript.setAttribute('aria-label', api.t('puzzle.console.transcript'));
      transcript.replaceChildren(
        ...state.lines.map((line) =>
          'input' in line
            ? h('p', { class: 'con__line con__line--in' }, h('span', { 'aria-hidden': 'true' }, `${PROMPT} `), line.input)
            : h('pre', { class: 'con__line con__line--out' }, api.t(line.out.key, line.out.params)),
        ),
      );
      transcript.scrollTop = transcript.scrollHeight;
      input.setAttribute('aria-label', api.t('puzzle.console.input'));
      run.textContent = api.t('puzzle.console.run');
      chips.setAttribute('aria-label', api.t('puzzle.console.chips'));
      const commands = ['help', 'queue', 'queue --all', ...(state.sawAll ? ['info 13'] : []), 'log', 'clear', 'exit'];
      chips.replaceChildren(
        ...commands.map((c) => h('button', { type: 'button', class: 'con__chip', dataset: { command: c, focusKey: `con-chip-${c}` }, onclick: () => submit(c) }, c)),
      );
      done.replaceChildren(
        ...(consoleLogic.isSolved(state)
          ? [
              h('p', { class: 'con__note' }, api.t('puzzle.console.solvedNote')),
              h('button', { type: 'button', class: 'con__finish', dataset: { focusKey: 'con-finish' }, onclick: () => api.finish(true) }, api.t('puzzle.console.done')),
            ]
          : []),
      );
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submit(input.value);
      input.focus();
    });
    run.addEventListener('click', () => {
      submit(input.value);
      input.focus();
    });
    render();
    host.appendChild(root);
    input.focus({ preventScroll: true });
    return { rerender: render, destroy: () => root.remove() };
  },
};
