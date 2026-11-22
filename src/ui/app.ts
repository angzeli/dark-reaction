/**
 * The application shell: title screen, the play screen (HUD, illustration,
 * narrative, choices), the notebook, the menu (save, load, export,
 * import), transition cards and the ending screen. Plain DOM, rendered
 * from engine state; the engine never sees the DOM.
 */
import { audio } from '../audio/audio.ts';
import type { AmbienceId } from '../audio/presets/ambience.ts';
import { playLightsOut } from '../art/lightsout.ts';
import { SCENES } from '../art/scenes/index.ts';
import { createStage, type Stage } from '../art/stage.ts';
import { clockLabel, LOOP_LENGTH } from '../engine/clock.ts';
import { Game, newGameState, uncorrectedFudges } from '../engine/engine.ts';
import type { Act, Card, Content, EndingId, GameState, NotebookDef, NotebookSection, Paragraph } from '../engine/types.ts';
import { getLocale, onLocaleChange, t, type Locale } from '../i18n/i18n.ts';
import { mountPuzzleFrame, type FrameHandle } from '../puzzles/frame.ts';
import type { PuzzleModule } from '../puzzles/types.ts';
import { downloadText, pickTextFile, saveFilename } from '../save/file.ts';
import { ENDING_ORDER, Gallery } from '../save/gallery.ts';
import { SaveStore, SLOTS, type ReadResult, type SlotId } from '../save/saves.ts';
import type { KV } from '../save/storage.ts';
import { h, inline, trapFocus } from './dom.ts';
import { reveal, type Reveal } from './reveal.ts';
import { applySettings, loadSettings, revealDelay, saveSettings, type Settings } from './settings.ts';
import { contentNote, settingsPanel, type SettingsApi } from './settings-panel.ts';

type Overlay = 'none' | 'notebook' | 'menu' | 'settings' | 'note' | 'conflict' | 'gallery';
type MenuPanel = 'main' | 'save' | 'load' | 'newgame';

const SECTIONS: NotebookSection[] = ['tonight', 'people', 'places', 'data', 'anomalies'];
const NUMERALS: Record<Act, string> = { 1: 'I', 2: 'II', 3: 'III' };

/** A stored ISO date as the reader's language writes it (empty if unreadable). */
function longDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(getLocale() === 'zh-Hant-TW' ? 'zh-TW' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

export interface AppOptions {
  content: Content;
  puzzles: Record<string, PuzzleModule>;
  kv: KV;
}

export class App {
  readonly root: HTMLElement;
  private readonly content: Content;
  private readonly puzzles: Record<string, PuzzleModule>;
  private readonly kv: KV;
  private readonly saves: SaveStore;
  private readonly gallery: Gallery;
  settings: Settings;
  game: Game | null = null;

  private screen: 'title' | 'play' | 'ending' = 'title';
  private overlay: Overlay = 'none';
  /** Another tab saved this night; don't overwrite it until the player decides (#38). */
  private autosavePaused = false;
  private menuPanel: MenuPanel = 'main';
  private notebookSection: NotebookSection | 'loops' = 'tonight';
  private stage: Stage | null = null;
  /** Keeps `--hud-h` at the sticky HUD's height, so focus never scrolls under it (#43). */
  private hudObserver: ResizeObserver | null = null;
  private currentReveal: Reveal | null = null;
  private puzzleFrame: FrameHandle | null = null;
  private busy = false;
  private keyboardUsed = false;
  /** The loop and room the play screen last showed: arriving somewhere new starts at the top (#52). */
  private shownAt: string | null = null;
  private status = '';
  private untrap: (() => void) | null = null;
  private lastFocus: HTMLElement | null = null;

  constructor(root: HTMLElement, opts: AppOptions) {
    this.root = root;
    this.content = opts.content;
    this.puzzles = opts.puzzles;
    this.kv = opts.kv;
    this.saves = new SaveStore(opts.kv, { content: opts.content });
    this.gallery = new Gallery(opts.kv);
    this.settings = loadSettings(opts.kv);
    applySettings(this.settings);
    onLocaleChange(() => this.render());
    document.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('pointerdown', () => (this.keyboardUsed = false));
    document.addEventListener('visibilitychange', () => audio.setHidden(document.visibilityState === 'hidden'));
    window.addEventListener('storage', (e) => this.onStorage(e));
  }

  start(): void {
    this.screen = 'title';
    // The content note comes first, once, before anything else.
    if (!this.settings.contentNoteSeen) this.overlay = 'note';
    this.render();
  }

  // ── Settings ─────────────────────────────────────────────────────────────

  updateSettings(patch: Partial<Settings>): void {
    this.settings = { ...this.settings, ...patch };
    saveSettings(this.kv, this.settings);
    const localeChanged = patch.locale !== undefined && patch.locale !== getLocale();
    applySettings(this.settings);
    this.stage?.setMotion(!this.settings.reduceMotion);
    audio.setVolumes({ master: this.settings.master, ambience: this.settings.ambience, effects: this.settings.effects });
    if (!localeChanged) this.render();
  }

  setLocale(locale: Locale): void {
    this.updateSettings({ locale });
  }

  async toggleSound(): Promise<void> {
    if (this.settings.audio) {
      audio.disable();
      this.updateSettings({ audio: false });
      return;
    }
    const ok = await audio.enable();
    this.updateSettings({ audio: ok });
    if (ok) audio.setAmbience(this.ambienceFor());
  }

  private ambienceFor(): AmbienceId {
    if (this.screen !== 'play' || !this.game) return 'title';
    return this.content.locations.find((l) => l.id === this.game!.state.location)!.ambience as AmbienceId;
  }

  // ── Game lifecycle ───────────────────────────────────────────────────────

  newGame(): void {
    const state = newGameState(this.content, this.gallery.margins());
    this.enterGame(state);
  }

  continueGame(): boolean {
    const slot = this.saves.latest();
    return slot ? this.loadSlot(slot) : false;
  }

  loadSlot(slot: SlotId): boolean {
    const r = this.saves.read(slot);
    if (!r.ok) {
      this.flash(t(`save.reason.${r.reason}`));
      return false;
    }
    this.enterGame(r.envelope.state);
    this.flash(t('save.loaded', { slot: this.slotName(slot) }));
    return true;
  }

  private enterGame(state: GameState): void {
    // A saved scene that no longer exists falls back to its room.
    const game = new Game(this.content, state);
    if (!game.index.scenes.has(state.scene)) state.scene = game.entrySceneFor(state.location);
    this.game = game;
    this.screen = state.ending ? 'ending' : 'play';
    this.overlay = 'none';
    this.render({ reveal: true });
    void this.playCards();
  }

  quitToTitle(): void {
    this.closePuzzle();
    this.game = null;
    this.screen = 'title';
    this.overlay = 'none';
    this.render();
  }

  /** Run an engine action, autosave, play any transitions, re-render. */
  private async act(action: (g: Game) => void): Promise<void> {
    const game = this.game;
    if (!game || this.busy) return;
    const before = { location: game.state.location, ending: game.state.ending, phantoms: this.phantomCount() };
    action(game);
    if (game.state.ending && !before.ending) this.gallery.recordEnding(game.state.ending, game.state.solved);
    this.autosave();
    if (this.phantomCount() > before.phantoms && game.state.cards.length === 0) audio.cue('phantom');
    // When the lights are about to go out, the room stays as it was until the dark (#71); 02:47 is drawn at onBlack.
    if (game.state.cards[0]?.kind !== 'lightsout') this.render({ reveal: true });
    await this.playCards();
  }

  private phantomCount(): number {
    const g = this.game;
    if (!g) return 0;
    return g.state.known.filter((k) => g.index.notebook.get(k.id)?.kind === 'phantom').length;
  }

  private autosave(): void {
    if (!this.game || this.autosavePaused) return;
    this.saves.write('auto', this.game.state, getLocale());
  }

  /**
   * Another tab on this origin wrote the autosave. Storage events only reach
   * the other tabs, so this tab's game is now out of date: stop saving over
   * it and let the player choose (#38).
   */
  private onStorage(e: StorageEvent): void {
    if (e.key !== SaveStore.key('auto') || e.newValue === null) return;
    if (this.screen === 'title') {
      if (this.overlay === 'none') this.render(); // Continue may have appeared
      return;
    }
    if (this.screen !== 'play' || !this.game || this.autosavePaused) return;
    this.autosavePaused = true;
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.overlay = 'conflict';
    this.render();
  }

  private resolveConflict(choice: 'load' | 'keep'): void {
    this.autosavePaused = false;
    if (choice === 'load') {
      this.closePuzzle();
      this.loadSlot('auto');
      return;
    }
    this.overlay = 'none';
    this.autosave();
    this.render();
    if (this.lastFocus?.isConnected) this.lastFocus.focus();
  }

  private async playCards(): Promise<void> {
    const game = this.game;
    if (!game || this.busy) return;
    this.busy = true;
    try {
      for (let card = game.takeCard(); card; card = game.takeCard()) {
        this.autosave();
        await this.playCard(card);
      }
    } finally {
      this.busy = false;
    }
    if (game.state.ending) {
      this.screen = 'ending';
    }
    this.render({ reveal: true });
  }

  private async playCard(card: Card): Promise<void> {
    if (card.kind === 'lightsout') {
      this.showLastMinute(card.before);
      audio.cue('lightsout');
      const handle = playLightsOut(document.body, {
        reduceMotion: this.settings.reduceMotion,
        flicker: this.settings.flicker,
        dark: !!card.dark,
        caption: t('ui.loop', { n: card.loop + 1 }),
        onBlack: () => this.render(),
      });
      const skip = () => handle.skip();
      document.addEventListener('keydown', skip, { once: true });
      document.addEventListener('pointerdown', skip, { once: true });
      await handle.done;
      document.removeEventListener('keydown', skip);
      document.removeEventListener('pointerdown', skip);
      if (!card.dark) audio.cue('loopstart');
      return;
    }
    if (card.kind === 'act') {
      await this.showActCard(card.act);
      return;
    }
    if (card.kind === 'ending') {
      audio.setAmbience(null);
      audio.cue(`ending.${card.ending}` as `ending.${EndingId}`);
      this.screen = 'ending';
    }
  }

  /**
   * The minute before the dark, on the page that is still showing: what just happened (the
   * card's `before`), no choices, 03:33 on the clock. The room itself is left as it was.
   */
  private showLastMinute(before: Paragraph[]): void {
    if (this.screen !== 'play') return;
    this.closePuzzle();
    const narrative = this.root.querySelector<HTMLElement>('.narrative');
    narrative?.classList.remove('narrative--puzzle');
    const text = narrative?.querySelector('.narrative__text');
    if (text && before.length) {
      this.currentReveal?.complete();
      this.currentReveal = null;
      text.replaceChildren(...before.map((p) => this.paragraph(p)));
      for (const el of text.children) el.classList.add('rv-done');
      const live = narrative?.querySelector('[aria-live]');
      if (live) live.textContent = before.map((p) => t(p.key, p.params)).join(' ');
    }
    narrative?.querySelector('.choices')?.replaceChildren();
    const clock = this.root.querySelector('.hud__clock');
    if (clock) clock.textContent = clockLabel(LOOP_LENGTH);
  }

  private showActCard(act: Act): Promise<void> {
    return new Promise((resolve) => {
      const el = h(
        'div',
        { class: 'act-card', role: 'presentation' },
        h('span', { class: 'act-card__numeral' }, NUMERALS[act]),
        h('span', { class: 'act-card__title' }, t(`act.${act}.title`)),
      );
      document.body.appendChild(el);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.classList.add('act-card--out');
        window.setTimeout(() => {
          el.remove();
          resolve();
        }, this.settings.reduceMotion ? 0 : 500);
        document.removeEventListener('keydown', finish);
        document.removeEventListener('pointerdown', finish);
      };
      window.setTimeout(() => {
        document.addEventListener('keydown', finish, { once: true });
        document.addEventListener('pointerdown', finish, { once: true });
      }, 150);
      window.setTimeout(finish, this.settings.reduceMotion ? 1800 : 2800);
    });
  }

  // ── Input ────────────────────────────────────────────────────────────────

  private onKey(e: KeyboardEvent): void {
    this.keyboardUsed = true;
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (this.busy) return;
    const target = e.target as HTMLElement | null;
    const typing = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

    if (this.overlay !== 'none') {
      // The two-tab question has to be answered; it can't be waved away.
      if (e.key === 'Escape' && this.overlay !== 'conflict') {
        e.preventDefault();
        this.closeOverlay();
      }
      return;
    }
    if (this.screen === 'ending') {
      // As everywhere else, Space or Enter finishes the reveal; then the way back is one more press.
      if ((e.key === ' ' || e.key === 'Enter') && this.currentReveal?.running) {
        e.preventDefault();
        this.currentReveal.complete();
        (this.root.querySelector('.ending .title__btn') as HTMLElement | null)?.focus({ preventScroll: true });
      }
      return;
    }
    if (this.screen !== 'play' || !this.game || this.game.state.puzzle || typing) return;

    if (this.currentReveal?.running && (e.key === ' ' || e.key === 'Enter' || /^[0-9]$/.test(e.key))) {
      e.preventDefault();
      this.currentReveal.complete();
      return;
    }
    if (/^[1-9]$/.test(e.key)) {
      const choices = this.game.choices();
      const choice = choices[Number(e.key) - 1];
      if (choice) {
        e.preventDefault();
        void this.choose(choice.id);
      }
      return;
    }
    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      this.openOverlay('notebook');
    } else if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      this.openOverlay('menu');
    }
  }

  async choose(id: string): Promise<void> {
    await this.act((g) => g.choose(id));
  }

  private openOverlay(overlay: Overlay): void {
    this.lastFocus = document.activeElement as HTMLElement | null;
    this.overlay = overlay;
    this.menuPanel = 'main';
    this.render();
  }

  private closeOverlay(): void {
    const wasNote = this.overlay === 'note';
    this.overlay = 'none';
    if (wasNote && !this.settings.contentNoteSeen) this.updateSettings({ contentNoteSeen: true });
    else this.render();
    if (this.lastFocus?.isConnected) this.lastFocus.focus();
  }

  private settingsApi(): SettingsApi {
    return {
      settings: this.settings,
      update: (patch) => this.updateSettings(patch),
      toggleSound: () => this.toggleSound(),
      showNote: () => this.openOverlay('note'),
    };
  }

  private flash(message: string): void {
    this.status = message;
    const el = this.root.querySelector('.app__status');
    if (el) el.textContent = message;
  }

  private slotName(slot: SlotId): string {
    return slot === 'auto' ? t('save.slot.auto') : t('save.slot.n', { n: slot });
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  render(opts: { reveal?: boolean } = {}): void {
    // Re-rendering replaces the DOM; put focus back on the same control.
    const focusKey = (document.activeElement as HTMLElement | null)?.dataset?.['focusKey'];
    this.untrap?.();
    this.untrap = null;
    if (this.screen !== 'play') {
      // Arriving at the title or an ending starts at the top (#72); re-rendering it keeps the place.
      if (this.shownAt !== this.screen) window.scrollTo(0, 0);
      this.shownAt = this.screen;
      this.watchHud(null);
    }
    if (this.screen === 'title') this.renderTitle();
    else if (this.screen === 'ending') this.renderEnding();
    else this.renderPlay(opts.reveal ?? false);
    if (this.overlay !== 'none' && this.screen !== 'ending') this.renderOverlay();
    if (focusKey) this.root.querySelector<HTMLElement>(`[data-focus-key="${CSS.escape(focusKey)}"]`)?.focus({ preventScroll: true });
    audio.setAmbience(this.screen === 'ending' ? null : this.ambienceFor());
  }

  private shell(screen: string, ...children: HTMLElement[]): HTMLElement {
    this.puzzleFrame?.destroy();
    this.puzzleFrame = null;
    const status = h('p', { class: 'app__status', role: 'status', 'aria-live': 'polite' }, this.status);
    const app = h('div', { class: `app app--${screen}` }, ...children, status);
    this.root.replaceChildren(app);
    return app;
  }

  private mountStage(host: HTMLElement, art: string, ctx: { act: Act; minute: number; dark?: boolean }): void {
    this.stage?.destroy();
    this.stage = createStage(host, { motion: !this.settings.reduceMotion });
    this.stage.show(art, ctx);
  }

  private langToggle(): HTMLElement {
    const make = (locale: Locale, label: string, lang: string) =>
      h(
        'button',
        { type: 'button', class: 'toggle__opt', 'aria-pressed': String(getLocale() === locale), lang, onclick: () => this.setLocale(locale) },
        label,
      );
    return h(
      'div',
      { class: 'toggle', role: 'group', 'aria-label': t('ui.language') },
      make('en', 'English', 'en-GB'),
      make('zh-Hant-TW', '繁體中文', 'zh-Hant-TW'),
    );
  }

  private soundToggle(): HTMLElement {
    return h(
      'button',
      { type: 'button', class: 'toggle__opt toggle__opt--sound', 'aria-pressed': String(this.settings.audio), onclick: () => void this.toggleSound() },
      t(this.settings.audio ? 'ui.sound.on' : 'ui.sound.off'),
    );
  }

  private renderTitle(): void {
    const art = h('div', { class: 'title__art' });
    const latest = this.saves.latest();
    const buttons: HTMLElement[] = [];
    if (this.menuPanel === 'newgame') {
      buttons.push(
        h('p', { class: 'title__confirm' }, t('ui.newgame.confirm')),
        h('button', { type: 'button', class: 'title__btn', onclick: () => this.newGame() }, t('ui.newgame.yes')),
        h('button', { type: 'button', class: 'title__btn', onclick: () => ((this.menuPanel = 'main'), this.render()) }, t('ui.cancel')),
      );
    } else {
      if (latest) buttons.push(h('button', { type: 'button', class: 'title__btn title__btn--primary', onclick: () => this.continueGame() }, t('ui.continue')));
      buttons.push(
        h(
          'button',
          {
            type: 'button',
            class: `title__btn${latest ? '' : ' title__btn--primary'}`,
            onclick: () => (latest ? ((this.menuPanel = 'newgame'), this.render()) : this.newGame()),
          },
          t('ui.newgame'),
        ),
        h('button', { type: 'button', class: 'title__btn', dataset: { focusKey: 'title-gallery' }, onclick: () => this.openOverlay('gallery') }, t('ui.gallery')),
        h('button', { type: 'button', class: 'title__btn', onclick: () => void this.importSave() }, t('ui.import')),
        h('button', { type: 'button', class: 'title__btn', dataset: { focusKey: 'title-settings' }, onclick: () => this.openOverlay('settings') }, t('ui.settings')),
      );
    }
    const panel = h(
      'div',
      { class: 'title__panel' },
      h('h1', { class: 'title__name' }, h('span', { lang: 'en-GB' }, 'Dark Reaction'), ' ', h('span', { lang: 'zh-Hant-TW', class: 'title__zh' }, '《暗反應》')),
      h('p', { class: 'title__tagline' }, t('ui.tagline')),
      h('nav', { class: 'title__menu', 'aria-label': t('ui.menu') }, ...buttons),
      h('div', { class: 'title__toggles' }, this.langToggle(), this.soundToggle()),
    );
    this.shell('title', h('div', { class: 'title' }, art, panel));
    this.mountStage(art, 'office', { act: 1, minute: 0 });
    if (this.overlay === 'none') (panel.querySelector('button.title__btn') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  private paragraph(p: Paragraph): HTMLElement {
    const text = t(p.key, p.params);
    const el = h('p', { class: `para para--${p.style}` });
    el.innerHTML = inline(text);
    if (p.style === 'phantom') el.setAttribute('data-hand', 'yours');
    return el;
  }

  private renderPlay(withReveal: boolean): void {
    const game = this.game!;
    const s = game.state;
    const location = this.content.locations.find((l) => l.id === s.location)!;
    const decay = s.obsession >= this.content.obsession.decay2 ? 2 : s.obsession >= this.content.obsession.decay1 ? 1 : 0;

    const hud = h(
      'header',
      { class: 'hud' },
      h('p', { class: 'hud__place' }, t(location.name)),
      h(
        'p',
        { class: 'hud__time' },
        h('span', { class: 'sr-only' }, `${t('ui.time')} `),
        h('time', { class: 'hud__clock' }, clockLabel(s.minute)),
        h('span', { class: 'hud__loop' }, t('ui.loop', { n: s.loop })),
      ),
      h(
        'nav',
        { class: 'hud__actions', 'aria-label': t('ui.menu') },
        h('button', { type: 'button', class: 'hud__btn', 'aria-keyshortcuts': 'N', onclick: () => this.openOverlay('notebook') }, t('ui.notebook')),
        h('button', { type: 'button', class: 'hud__btn', 'aria-keyshortcuts': 'M Escape', onclick: () => this.openOverlay('menu') }, t('ui.menu')),
      ),
    );
    const art = h('div', { class: 'play__art' });
    const paras = s.display.length > 0 ? s.display : game.sceneText(s.scene);
    const text = h('div', { class: 'narrative__text' }, ...paras.map((p) => this.paragraph(p)));
    const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
    const choices = h('ol', { class: 'choices', 'aria-label': t('ui.choices') });
    const carrying = s.inventory.length
      ? h('p', { class: 'narrative__carry' }, t('ui.carrying', { items: s.inventory.map((i) => t(i)).join(t('ui.list.sep')) }))
      : null;
    const narrative = h('main', { class: 'narrative', id: 'narrative' }, text, carrying ?? '', choices, live);
    const app = this.shell('play', hud, art, narrative);
    this.watchHud(hud);
    app.dataset['decay'] = String(decay);
    // A new room, or 02:47 again: start at the top, with the picture and the first line in view.
    // Choosing within a room keeps the reader's place. Never smooth: it's a cut, not a pan.
    const where = `${s.loop}:${s.location}`;
    if (where !== this.shownAt) {
      this.shownAt = where;
      window.scrollTo(0, 0);
    }
    this.mountStage(art, location.art, { act: s.act, minute: s.minute, dark: s.darkRun });

    const drawChoices = () => {
      const list = game.choices();
      choices.replaceChildren(
        ...list.map((c, i) =>
          h(
            'li',
            {},
            h(
              'button',
              {
                type: 'button',
                class: `choice choice--${c.kind}`,
                dataset: { choice: c.id },
                'aria-keyshortcuts': i < 9 ? String(i + 1) : undefined,
                onclick: () => void this.choose(c.id),
              },
              h('span', { class: 'choice__n', 'aria-hidden': 'true' }, i < 9 ? String(i + 1) : ''),
              h('span', { class: 'choice__label' }, t(c.label, c.params)),
              c.cost > 0 ? h('span', { class: 'choice__cost' }, t('ui.cost', { n: c.cost })) : null,
            ),
          ),
        ),
      );
      if (this.keyboardUsed && this.overlay === 'none' && !s.puzzle) (choices.querySelector('button') as HTMLElement | null)?.focus({ preventScroll: true });
    };

    this.currentReveal?.complete();
    if (withReveal) {
      live.textContent = paras.map((p) => t(p.key, p.params)).join(' ');
      this.currentReveal = reveal([...text.children] as HTMLElement[], revealDelay(this.settings));
      text.addEventListener('click', () => this.currentReveal?.complete());
      void this.currentReveal.done.then(() => {
        if (this.game === game && this.screen === 'play') drawChoices();
      });
    } else {
      this.currentReveal = null;
      for (const el of text.children) el.classList.add('rv-done');
      drawChoices();
    }

    // Not while a card is still to play: a puzzle a card opens (the dark run) mounts once, after it.
    if (s.puzzle && !this.busy && s.cards.length === 0) this.openPuzzle(narrative);
  }

  /** Track the sticky HUD's height in `--hud-h` (it wraps on phones and grows with text size). */
  private watchHud(hud: HTMLElement | null): void {
    this.hudObserver?.disconnect();
    this.hudObserver = null;
    const root = document.documentElement;
    if (!hud) {
      root.style.removeProperty('--hud-h');
      return;
    }
    // Measured only once laid out. A synchronous measure here would force a layout mid-render,
    // before the picture and the choices are in, and the briefly short page would clamp the
    // scroll position to the top (undoing #52's "a choice keeps your place").
    const set = () => root.style.setProperty('--hud-h', `${Math.ceil(hud.getBoundingClientRect().height)}px`);
    if (typeof ResizeObserver === 'undefined') {
      requestAnimationFrame(set);
      return;
    }
    this.hudObserver = new ResizeObserver(set);
    this.hudObserver.observe(hud);
  }

  private openPuzzle(host: HTMLElement): void {
    const game = this.game!;
    const id = game.state.puzzle!;
    const module = this.puzzles[id];
    const def = game.index.puzzles.get(id)!;
    if (!module) {
      void this.act((g) => g.completePuzzle({ solved: false, minutes: 0 }));
      return;
    }
    host.classList.add('narrative--puzzle');
    this.puzzleFrame = mountPuzzleFrame(host, {
      puzzleId: id,
      view: module.view,
      hints: def.hints,
      hintsUsed: game.state.hints[id] ?? 0,
      startMinute: game.state.minute,
      act: game.state.act,
      reduceMotion: this.settings.reduceMotion,
      flicker: this.settings.flicker,
      has: (item) => game.state.inventory.includes(item),
      data: game.state.puzzleData[id],
      restoredMinutes:
        game.state.puzzleData[id] === undefined
          ? 0
          : module.logic.minutes(module.logic.init({ minute: game.state.minute, act: game.state.act, data: game.state.puzzleData[id] })),
      t,
      onHint: () => {
        const tier = game.useHint(id);
        this.autosave();
        return tier;
      },
      onFinish: (r) => {
        this.puzzleFrame = null;
        void this.act((g) => g.completePuzzle(r));
      },
      onSaveData: (data) => {
        game.state.puzzleData[id] = data;
        this.autosave();
      },
      cue: (cueId) => audio.cue(cueId),
      leaveKey: def.leave,
      onMinutes: (minute) => {
        const hud = this.root.querySelector('.hud__clock');
        if (hud) hud.textContent = clockLabel(minute);
      },
    });
  }

  private closePuzzle(): void {
    this.puzzleFrame?.destroy();
    this.puzzleFrame = null;
  }

  private renderEnding(): void {
    const game = this.game;
    const ending = game ? this.content.endings.find((e) => e.id === game.state.ending) : undefined;
    const art = h('div', { class: 'ending__art' });
    const body = h('div', { class: 'ending__text' }, ...(ending && game ? game.paragraphs(ending.epilogue, 'text').map((p) => this.paragraph(p)) : []));
    const back = h('button', { type: 'button', class: 'title__btn', onclick: () => this.quitToTitle() }, t('ending.return'));
    const title = h('h1', { class: 'ending__title', tabindex: '-1' }, ending ? t(ending.title) : '');
    // Infinite Loop: the clock has stopped (decorative; the epilogue says so).
    const stopped = ending?.id === 'infinite' ? h('p', { class: 'ending__clock', 'aria-hidden': 'true' }, '03:33') : null;
    // …and the same choice, made again, and again (decorative, still; the epilogue says it in words).
    const again =
      ending?.id === 'infinite'
        ? h('ol', { class: 'ending__again', 'aria-hidden': 'true' }, ...[1, 2, 3].map((n) => h('li', {}, h('span', { class: 'ending__again-n' }, String(n)), h('span', {}, t('nmr.rerun')))))
        : null;
    const article = h('article', { class: 'ending', dataset: { ending: ending?.id ?? '' } }, art, stopped, title, body, again, back);
    this.shell('ending', article);
    if (ending) this.mountStage(art, ending.art, { act: 3, minute: 46 });
    const r = reveal([...body.children] as HTMLElement[], revealDelay(this.settings));
    this.currentReveal = r;
    body.addEventListener('click', () => r.complete());
    // Start at the title, so a reader starts at the top and a stray Enter can't skip the epilogue.
    title.focus({ preventScroll: true });
  }

  // ── Overlays ─────────────────────────────────────────────────────────────

  private renderOverlay(): void {
    const panel =
      this.overlay === 'notebook'
        ? this.notebookPanel()
        : this.overlay === 'settings'
          ? settingsPanel(this.settingsApi())
          : this.overlay === 'note'
            ? contentNote(this.settingsApi(), () => this.closeOverlay())
            : this.overlay === 'conflict'
              ? this.conflictPanel()
              : this.overlay === 'gallery'
                ? this.galleryPanel()
                : this.menuPanelEl();
    const close = this.overlay === 'conflict' ? null : h('button', { type: 'button', class: 'overlay__close', onclick: () => this.closeOverlay() }, t('ui.close'));
    const dialog = h(
      'section',
      { class: `overlay overlay--${this.overlay}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'overlay-title' },
      h('div', { class: 'overlay__sheet' }, close, panel),
    );
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog && this.overlay !== 'conflict') this.closeOverlay();
    });
    this.root.querySelector('.app')!.appendChild(dialog);
    this.untrap = trapFocus(dialog);
    if (!dialog.contains(document.activeElement)) (dialog.querySelector('#overlay-title') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  /** 結局一覽: endings found show their title and picture; the rest, a silhouette and their clue. */
  private galleryPanel(): HTMLElement {
    const data = this.gallery.data();
    const found = ENDING_ORDER.filter((id) => data.endings[id]).length;
    const items = ENDING_ORDER.map((id) => {
      const entry = data.endings[id];
      const scene = SCENES[`ending.${id}`];
      // An image, not inline SVG: a still picture, and no clash between six scenes' ids.
      const art = h('div', { class: 'gal__art', 'aria-hidden': 'true' });
      if (scene) art.append(h('img', { class: 'gal__img', alt: '', src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(scene({ act: 3, minute: 46 }))}` }));
      return h(
        'li',
        { class: `gal__item${entry ? '' : ' gal__item--unfound'}`, dataset: { ending: id } },
        art,
        h('h3', { class: 'gal__title' }, entry ? t(`ending.${id}.title`) : t('gallery.unfound')),
        entry
          ? h('p', { class: 'gal__meta' }, t(longDate(entry.first) ? 'gallery.reached' : 'gallery.reached.undated', { n: entry.count, date: longDate(entry.first) }))
          : h('p', { class: 'gal__clue' }, t(`ending.${id}.clue`)),
      );
    });
    return h(
      'div',
      { class: 'gal' },
      h('h2', { id: 'overlay-title', class: 'gal__heading', tabindex: '-1' }, t('gallery.title')),
      h('p', { class: 'gal__count' }, t('gallery.count', { n: found, total: ENDING_ORDER.length })),
      h('ul', { class: 'gal__list' }, ...items),
    );
  }

  private conflictPanel(): HTMLElement {
    const btn = (label: string, onclick: () => void) => h('button', { type: 'button', class: 'menu__btn', onclick }, label);
    return h(
      'div',
      { class: 'menu conflict' },
      h('h2', { id: 'overlay-title', class: 'menu__title', tabindex: '-1' }, t('conflict.title')),
      h('p', { class: 'conflict__body' }, t('conflict.body')),
      btn(t('conflict.load'), () => this.resolveConflict('load')),
      btn(t('conflict.keep'), () => this.resolveConflict('keep')),
    );
  }

  private notebookPanel(): HTMLElement {
    const game = this.game!;
    const s = game.state;
    const tabs = h(
      'div',
      { class: 'nb__tabs', role: 'tablist', 'aria-label': t('ui.notebook') },
      ...[...SECTIONS, 'loops' as const].map((section) =>
        h(
          'button',
          {
            type: 'button',
            role: 'tab',
            class: 'nb__tab',
            'aria-selected': String(this.notebookSection === section),
            onclick: () => ((this.notebookSection = section), this.render()),
          },
          t(`nb.section.${section}`),
        ),
      ),
    );
    const entries = h('div', { class: 'nb__page', role: 'tabpanel' });
    if (this.notebookSection === 'loops') {
      const rows = s.loops.map((l) =>
        h('li', { class: 'nb__loop' }, t('nb.loops.row', { loop: l.loop, clock: clockLabel(l.minute), place: `@${this.content.locations.find((x) => x.id === l.location)!.name}` })),
      );
      entries.append(rows.length ? h('ol', { class: 'nb__loops' }, ...rows) : h('p', { class: 'nb__empty' }, t('nb.loops.none')));
    } else {
      const known = s.known
        .map((k) => ({ k, def: game.index.notebook.get(k.id) }))
        .filter((x): x is { k: GameState['known'][number]; def: NotebookDef } => !!x.def && x.def.section === this.notebookSection);
      for (const { k, def } of known) entries.append(this.notebookEntry(k, def));
      if (known.length === 0) entries.append(h('p', { class: 'nb__empty' }, t('ui.notebook.empty')));
    }
    const margins = s.margins
      .map((id) => game.index.puzzles.get(id)?.margin)
      .filter((m): m is string => !!m)
      .map((m) => h('li', { class: 'nb__margin' }, t(m)));
    return h(
      'div',
      { class: 'nb' },
      h('h2', { id: 'overlay-title', class: 'nb__title', tabindex: '-1' }, t('ui.notebook')),
      tabs,
      entries,
      margins.length ? h('aside', { class: 'nb__margins', 'aria-label': t('nb.margins.title') }, h('h3', {}, t('nb.margins.title')), h('ul', {}, ...margins)) : null,
      uncorrectedFudges(s) > 0 ? h('p', { class: 'nb__standing' }, t('nb.fudge.standing', { n: uncorrectedFudges(s) })) : null,
    );
  }

  private notebookEntry(k: GameState['known'][number], def: NotebookDef): HTMLElement {
    const game = this.game!;
    const fudge = def.kind === 'fudge' ? game.state.fudges.find((f) => f.id === def.id) : undefined;
    const body = h('div', { class: 'nb__body' });
    body.innerHTML = inline(t(def.body));
    const entry = h(
      'article',
      { class: `nb__entry nb__entry--${def.kind ?? 'normal'}${fudge?.corrected ? ' nb__entry--struck' : ''}` },
      h('h3', { class: 'nb__entry-title' }, t(def.title)),
      h('p', { class: 'nb__meta' }, t('nb.entry.meta', { loop: k.loop, clock: clockLabel(k.minute) })),
      body,
    );
    if (def.kind === 'phantom') entry.append(h('p', { class: 'nb__note' }, t('nb.phantom.note')));
    if (fudge && !fudge.corrected) {
      entry.append(
        h(
          'button',
          {
            type: 'button',
            class: 'nb__strike',
            onclick: () =>
              void this.act((g) => {
                g.correctFudge(def.id);
              }),
          },
          t('nb.fudge.strike'),
        ),
      );
    } else if (fudge?.corrected) {
      entry.append(h('p', { class: 'nb__note' }, t('nb.fudge.corrected')));
    }
    return entry;
  }

  private menuPanelEl(): HTMLElement {
    const title = h('h2', { id: 'overlay-title', class: 'menu__title', tabindex: '-1' }, t('ui.menu'));
    const btn = (label: string, onclick: () => void, extra: Record<string, unknown> = {}) =>
      h('button', { type: 'button', class: 'menu__btn', onclick, ...extra }, label);
    if (this.menuPanel === 'save' || this.menuPanel === 'load') {
      const saving = this.menuPanel === 'save';
      const slots = (saving ? SLOTS.filter((s) => s !== 'auto') : [...SLOTS]).map((slot) => this.slotRow(slot, saving));
      return h(
        'div',
        { class: 'menu' },
        title,
        h('h3', { class: 'menu__sub' }, t(saving ? 'ui.save' : 'ui.load')),
        h('ul', { class: 'slots' }, ...slots),
        btn(t('ui.back'), () => ((this.menuPanel = 'main'), this.render())),
      );
    }
    return h(
      'div',
      { class: 'menu' },
      title,
      btn(t('ui.resume'), () => this.closeOverlay()),
      btn(t('ui.notebook'), () => this.openOverlay('notebook')),
      btn(t('ui.gallery'), () => this.openOverlay('gallery')),
      btn(t('ui.save'), () => ((this.menuPanel = 'save'), this.render())),
      btn(t('ui.load'), () => ((this.menuPanel = 'load'), this.render())),
      btn(t('ui.settings'), () => this.openOverlay('settings')),
      btn(t('ui.export'), () => this.exportSave()),
      btn(t('ui.import'), () => void this.importSave()),
      h('div', { class: 'menu__toggles' }, this.langToggle(), this.soundToggle()),
      btn(t('note.reread'), () => this.openOverlay('note')),
      btn(t('ui.quit'), () => this.quitToTitle(), { class: 'menu__btn menu__btn--quiet' }),
    );
  }

  private slotRow(slot: SlotId, saving: boolean): HTMLElement {
    const r: ReadResult = this.saves.list().find((x) => x.slot === slot)!.result;
    const label = r.ok
      ? t('save.summary', {
          act: NUMERALS[r.envelope.summary.act as Act],
          loop: r.envelope.summary.loop,
          clock: clockLabel(r.envelope.summary.minute),
          place: `@${this.content.locations.find((l) => l.id === r.envelope.summary.location)!.name}`,
        })
      : t(r.reason === 'empty' ? 'save.empty' : `save.reason.${r.reason}`);
    const action = saving
      ? h(
          'button',
          {
            type: 'button',
            class: 'slot__btn',
            onclick: (e: Event) => {
              const b = e.currentTarget as HTMLButtonElement;
              if (r.ok && b.dataset['confirm'] !== '1') {
                b.dataset['confirm'] = '1';
                b.textContent = t('save.overwrite');
                return;
              }
              const ok = this.saves.write(slot, this.game!.state, getLocale());
              this.flash(ok ? t('save.saved', { slot: this.slotName(slot) }) : t('save.failed'));
              this.render();
            },
          },
          t('save.here'),
        )
      : h('button', { type: 'button', class: 'slot__btn', disabled: !r.ok, onclick: () => this.loadSlot(slot) }, t('save.load'));
    return h('li', { class: 'slot', dataset: { slot } }, h('span', { class: 'slot__name' }, this.slotName(slot)), h('span', { class: 'slot__label' }, label), action);
  }

  private exportSave(): void {
    if (!this.game) return;
    const s = this.game.state;
    const text = this.saves.exportText(s, getLocale());
    if (!text) {
      this.flash(t('save.failed'));
      return;
    }
    downloadText(saveFilename(s.loop, clockLabel(s.minute)), text);
    this.flash(t('save.exported'));
  }

  private async importSave(): Promise<void> {
    const picked = await pickTextFile();
    if (picked.kind === 'cancel') return;
    if (picked.kind === 'error') {
      this.flash(t(`save.file.${picked.reason}`));
      return;
    }
    const r = this.saves.importText(picked.text);
    if (!r.ok) {
      this.flash(t(`save.reason.${r.reason}`));
      return;
    }
    this.enterGame(r.envelope.state);
    this.flash(t('save.imported'));
  }
}
