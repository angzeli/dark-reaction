/**
 * The settings panel and the first-launch content note. Native form
 * controls (radio groups, checkboxes, sliders) so keyboards, touch and
 * screen readers all get what they expect.
 */
import { t, type Locale } from '../i18n/i18n.ts';
import { h } from './dom.ts';
import { TEXT_SIZES, TEXT_SPEEDS, type Settings } from './settings.ts';

export interface SettingsApi {
  settings: Settings;
  update(patch: Partial<Settings>): void;
  toggleSound(): Promise<void>;
  showNote(): void;
}

let uid = 0;

function radios<T extends string | number>(name: string, legend: string, options: Array<{ value: T; label: string; lang?: string }>, current: T, onPick: (v: T) => void): HTMLElement {
  const group = `set-${name}-${++uid}`;
  return h(
    'fieldset',
    { class: 'set__group' },
    h('legend', { class: 'set__legend' }, legend),
    h(
      'div',
      { class: 'set__options' },
      ...options.map((o) => {
        const input = h('input', {
          type: 'radio',
          name: group,
          value: String(o.value),
          checked: o.value === current,
          dataset: { focusKey: `${name}:${o.value}` },
          onchange: () => onPick(o.value),
        });
        return h('label', { class: 'set__option', lang: o.lang }, input, h('span', {}, o.label));
      }),
    ),
  );
}

function checkbox(name: string, label: string, hint: string, checked: boolean, onToggle: (v: boolean) => void): HTMLElement {
  const id = `set-${name}-${++uid}`;
  const hintId = `${id}-hint`;
  return h(
    'div',
    { class: 'set__check' },
    h('input', {
      type: 'checkbox',
      id,
      checked,
      'aria-describedby': hintId,
      dataset: { focusKey: name },
      onchange: (e: Event) => onToggle((e.target as HTMLInputElement).checked),
    }),
    h('label', { for: id }, label),
    h('p', { class: 'set__hint', id: hintId }, hint),
  );
}

function slider(name: string, label: string, value: number, disabled: boolean, onSet: (v: number) => void): HTMLElement {
  const id = `set-${name}-${++uid}`;
  const output = h('output', { class: 'set__value', for: id }, `${Math.round(value * 100)}%`);
  const input = h('input', {
    type: 'range',
    id,
    min: '0',
    max: '100',
    step: '5',
    value: String(Math.round(value * 100)),
    disabled,
    dataset: { focusKey: name },
    oninput: (e: Event) => (output.textContent = `${(e.target as HTMLInputElement).value}%`),
    onchange: (e: Event) => onSet(Number((e.target as HTMLInputElement).value) / 100),
  });
  return h('div', { class: 'set__slider' }, h('label', { for: id }, label), input, output);
}

export function settingsPanel(api: SettingsApi): HTMLElement {
  const s = api.settings;
  return h(
    'div',
    { class: 'set' },
    h('h2', { id: 'overlay-title', class: 'set__title', tabindex: '-1' }, t('ui.settings')),
    radios<Locale>(
      'locale',
      t('ui.language'),
      [
        { value: 'en', label: 'English', lang: 'en-GB' },
        { value: 'zh-Hant-TW', label: '繁體中文', lang: 'zh-Hant-TW' },
      ],
      s.locale,
      (locale) => api.update({ locale }),
    ),
    radios(
      'textSize',
      t('settings.textSize'),
      TEXT_SIZES.map((v) => ({ value: v, label: t(`settings.textSize.${v}`) })),
      s.textSize,
      (textSize) => api.update({ textSize }),
    ),
    radios(
      'textSpeed',
      t('settings.textSpeed'),
      TEXT_SPEEDS.map((v) => ({ value: v, label: t(`settings.textSpeed.${v}`) })),
      s.textSpeed,
      (textSpeed) => api.update({ textSpeed }),
    ),
    h(
      'fieldset',
      { class: 'set__group' },
      h('legend', { class: 'set__legend' }, t('settings.comfort')),
      checkbox('reduceMotion', t('settings.motion'), t('settings.motion.hint'), s.reduceMotion, (reduceMotion) => api.update({ reduceMotion })),
      checkbox('flicker', t('settings.flicker'), t('settings.flicker.hint'), s.flicker, (flicker) => api.update({ flicker })),
      checkbox('highContrast', t('settings.contrast'), t('settings.contrast.hint'), s.highContrast, (highContrast) => api.update({ highContrast })),
    ),
    h(
      'fieldset',
      { class: 'set__group' },
      h('legend', { class: 'set__legend' }, t('settings.sound')),
      h(
        'button',
        { type: 'button', class: 'set__sound', 'aria-pressed': String(s.audio), dataset: { focusKey: 'sound' }, onclick: () => void api.toggleSound() },
        t(s.audio ? 'ui.sound.on' : 'ui.sound.off'),
      ),
      h('p', { class: 'set__hint' }, t('settings.sound.hint')),
      slider('master', t('settings.volume.master'), s.master, !s.audio, (master) => api.update({ master })),
      slider('ambience', t('settings.volume.ambience'), s.ambience, !s.audio, (ambience) => api.update({ ambience })),
      slider('effects', t('settings.volume.effects'), s.effects, !s.audio, (effects) => api.update({ effects })),
    ),
    h('button', { type: 'button', class: 'menu__btn', dataset: { focusKey: 'note' }, onclick: () => api.showNote() }, t('note.reread')),
  );
}

/** The content note shown on first launch and from the menu. */
export function contentNote(api: SettingsApi, onClose: () => void): HTMLElement {
  return h(
    'div',
    { class: 'note' },
    h('h2', { id: 'overlay-title', class: 'note__title', tabindex: '-1' }, t('note.title')),
    h('p', {}, t('note.body.1')),
    h('p', {}, t('note.body.2')),
    h('p', {}, t('note.body.3')),
    h(
      'div',
      { class: 'note__quick' },
      checkbox('flicker', t('settings.flicker'), t('settings.flicker.hint'), api.settings.flicker, (flicker) => api.update({ flicker })),
      checkbox('reduceMotion', t('settings.motion'), t('settings.motion.hint'), api.settings.reduceMotion, (reduceMotion) => api.update({ reduceMotion })),
    ),
    h('button', { type: 'button', class: 'title__btn title__btn--primary note__go', dataset: { focusKey: 'note-go' }, onclick: onClose }, t('note.continue')),
  );
}
