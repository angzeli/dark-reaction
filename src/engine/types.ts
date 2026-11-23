/**
 * Content schema and game state for Dark Reaction. Everything here is plain
 * data: content files describe the world with these types, and the engine
 * (engine.ts) interprets them. No DOM, no strings shown to the player: every
 * player-visible string is a locale key.
 */

// ── World ──────────────────────────────────────────────────────────────────

export type LocationId = 'office' | 'synth' | 'glovebox' | 'pi' | 'stairs' | 'nmr' | 'cold' | 'roof';
export type Act = 1 | 2 | 3;
export type EndingId = 'perfect' | 'honest' | 'clocking' | 'infinite' | 'dark' | 'fire';
export type NotebookSection = 'tonight' | 'people' | 'places' | 'data' | 'anomalies';
export type NotebookKind = 'normal' | 'phantom' | 'fudge';

/** Conditions are small, serialisable predicates over the game state. */
export type Cond =
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond }
  /** A persistent flag (survives the loop). */
  | { flag: string }
  /** A loop flag (cleared at 02:47). */
  | { lflag: string }
  /** A notebook entry is known. */
  | { know: string }
  | { item: string }
  /** A puzzle has been solved in any loop. */
  | { solved: string }
  | { act: Act }
  | { actGte: Act }
  | { loopGte: number }
  | { minuteGte: number }
  | { minuteLt: number }
  | { at: LocationId }
  /** Standing in this scene (a room can have more than one: outside a door, and inside it). */
  | { scene: string }
  | { obsessionGte: number }
  | { obsessionLt: number }
  /** Number of fudges still standing (not struck through) is at least n. */
  | { uncorrectedGte: number }
  /** At least one fudge has ever been made. */
  | { fudgedEver: true }
  | { fragment: string }
  | { fragmentsGte: number }
  /** At least n loops have started since the current act opened (0 in its first loop). */
  | { loopsInActGte: number }
  /** A choice has been used this loop / in any loop. */
  | { used: string }
  | { usedEver: string }
  | { always: true };

/** Effects change the state. They are applied in order. */
export type Effect =
  /** Write an entry into the notebook (knowledge; persists). */
  | { learn: string }
  | { flag: string }
  | { unflag: string }
  | { lflag: string }
  | { unlflag: string }
  | { give: string }
  | { take: string }
  /** A fragment of Y.C.'s story (connection track). */
  | { fragment: string }
  /** Bend a record. Writes the fudge's notebook entry and marks it standing. */
  | { fudge: string }
  /** A chase action: obsession +1, at most once per loop per id. */
  | { chase: string }
  /** A rest action: obsession −amount (default 1, floor 0), once per loop per id. */
  | { rest: string; amount?: number }
  /** Extra minutes on top of the choice's cost. */
  | { time: number }
  /** Walk somewhere (travel time is added automatically). */
  | { go: LocationId }
  /** Show another scene in the current location. */
  | { scene: string }
  /** Return to the current location's hub (or entry scene). */
  | { hub: true }
  | { puzzle: string }
  /** Mark a puzzle solved without playing it (later-loop shortcuts). */
  | { solve: string }
  | { ending: EndingId };

/** A paragraph reference; shown only if its condition holds. */
export interface TextRef {
  key: string;
  if?: Cond;
  /** Values for `{placeholders}`, computed when the text is shown. */
  params?: (state: GameState) => Record<string, string | number>;
  style?: ParagraphStyle;
}

export type ParagraphStyle = 'text' | 'result' | 'event' | 'phantom' | 'system';

export interface ChoiceDef {
  /** Globally unique, e.g. `office.kettle`. */
  id: string;
  label: string;
  /** Minutes this costs. */
  cost?: number;
  /** Shown only when this holds. */
  if?: Cond;
  /** Hidden after use, for the rest of the loop or for good. */
  once?: 'loop' | 'game';
  effects?: Effect[];
  /**
   * Result text shown after choosing (the scene's choices stay on screen).
   * Its conditions and params are evaluated before the choice's effects and
   * cost, so they describe the moment of choosing.
   */
  text?: TextRef[];
  /** Move to another scene afterwards (its text follows the result). */
  to?: string;
  /** Tags used by the validator and the bot. */
  tags?: Array<'chase' | 'rest' | 'fudge' | 'honest' | 'shortcut' | 'ending'>;
}

export interface SceneDef {
  id: string;
  location: LocationId;
  /** The location's hub: travel and wait options appear here. */
  hub?: boolean;
  text: TextRef[];
  choices: ChoiceDef[];
  onEnter?: Effect[];
  /** Non-hub scenes get an automatic "Back" unless this is set. */
  noBack?: boolean;
  /** List Back first instead of last, where the first choice would otherwise end the game (#61). */
  backFirst?: boolean;
}

export interface LocationDef {
  id: LocationId;
  name: string;
  hub: string;
  /** Scenes to show on arrival instead of the hub, first match wins (e.g. a locked door). */
  entry?: Array<{ if: Cond; scene: string }>;
  art: string;
  ambience: string;
}

export interface EdgeDef {
  a: LocationId;
  b: LocationId;
  minutes: number;
}

export interface NotebookDef {
  id: string;
  section: NotebookSection;
  kind?: NotebookKind;
  title: string;
  body: string;
  /** Pencilled margin note shown in a new game+ when this puzzle has been solved before. */
  marginFor?: string;
}

export interface PuzzleDef {
  id: string;
  /** Estimated first-time solve time in real minutes (for the playtime script). */
  par: number;
  hints: [string, string, string];
  onSolve: Effect[];
  /** Text shown when the puzzle is solved. */
  solvedText?: TextRef[];
  /** Text shown when the attempt fails outright (e.g. the sample oxidises). */
  failedText?: TextRef[];
  /** Applied when the attempt fails outright (not when the player steps away). */
  onFail?: Effect[];
  /** Text shown when the player steps away. */
  leftText?: TextRef[];
  /** Key for the leave button when stepping away means more than usual (default `puzzle.leave`). */
  leave?: string;
  /** Margin note key for new game+. */
  margin?: string;
}

/**
 * Something that happens once per loop when the clock reaches `minute` and
 * the condition holds. If the condition only becomes true later (you arrive
 * late), it fires then, unless `until` has passed. Events interrupt waits.
 * Allowed effects: anything except time, go, scene, hub and puzzle (events
 * never take over an action; puzzles open from choices and lights-out rules).
 */
export interface EventDef {
  id: string;
  minute: number;
  /** The event can no longer fire from this minute on. */
  until?: number;
  if?: Cond;
  effects?: Effect[];
  text: TextRef[];
}

/** A notebook page in your handwriting that you don't remember writing. */
export interface PhantomDef {
  /** The notebook entry it writes. */
  entry: string;
  when: Cond;
}

/** Checked at 03:33, in order. The first match decides what happens instead of (or before) the reset. */
export interface LightsOutRule {
  id: string;
  if: Cond;
  /** End the game. */
  ending?: EndingId;
  /** Open a puzzle in the dark (the reset waits for it). */
  puzzle?: string;
  /** Applied before the reset when no ending or puzzle is set. */
  effects?: Effect[];
  text?: TextRef[];
}

export interface ActDef {
  act: Act;
  /** Opens at the start of the next loop once this holds. */
  when: Cond;
  title: string;
}

export interface EndingDef {
  id: EndingId;
  title: string;
  clue: string;
  epilogue: TextRef[];
  art: string;
  cue: string;
}

export interface Content {
  start: { location: LocationId };
  locations: LocationDef[];
  edges: EdgeDef[];
  scenes: SceneDef[];
  notebook: NotebookDef[];
  puzzles: PuzzleDef[];
  events: EventDef[];
  phantoms: PhantomDef[];
  lightsOut: LightsOutRule[];
  acts: ActDef[];
  endings: EndingDef[];
  /** Loop-start text shown above the office hub (e.g. "You come to…"). */
  loopStart: TextRef[];
  /** Thresholds for the obsession track. */
  obsession: { decay1: number; decay2: number; infinite: number; infiniteFromLoop: number };
}

// ── State ──────────────────────────────────────────────────────────────────

export interface Paragraph {
  key: string;
  params?: Record<string, string | number>;
  style: ParagraphStyle;
}

export interface KnownEntry {
  id: string;
  loop: number;
  minute: number;
}

export interface FudgeRecord {
  id: string;
  corrected: boolean;
  loop: number;
}

export interface LoopRecord {
  loop: number;
  location: LocationId;
  /** Minute the loop ended (46 unless it ended early). */
  minute: number;
}

export type Menu = 'none' | 'travel' | 'wait';

/** A transition the UI must play before continuing (lights-out, act title, ending). */
export type Card =
  /** The lights go out at 03:33. `before` is what was on screen; `dark` means no reset follows (yet). */
  /** `hold`: a choice of the player's own ran into 03:33, and what it showed waits to be read (#127). */
  | { kind: 'lightsout'; loop: number; before: Paragraph[]; dark?: boolean; hold?: boolean }
  | { kind: 'act'; act: Act }
  | { kind: 'ending'; ending: EndingId };

export interface GameState {
  /** Schema version for saves; see src/save/. */
  v: number;
  loop: number;
  minute: number;
  act: Act;
  location: LocationId;
  scene: string;
  menu: Menu;
  inventory: string[];
  flags: string[];
  lflags: string[];
  known: KnownEntry[];
  solved: string[];
  hints: Record<string, number>;
  usedLoop: string[];
  usedEver: string[];
  firedEvents: string[];
  fudges: FudgeRecord[];
  fudgesEver: number;
  fragments: string[];
  obsession: number;
  chasedThisLoop: boolean;
  restedThisLoop: boolean;
  chaseUsed: string[];
  restUsed: string[];
  loops: LoopRecord[];
  /** Paragraphs on screen now. */
  display: Paragraph[];
  /** Transitions waiting for the UI, in order. */
  cards: Card[];
  puzzle: string | null;
  /** The loop in which the current act opened. */
  actLoop: number;
  /** Set while a puzzle opened by a lights-out rule runs in the dark. */
  darkRun: boolean;
  ending: EndingId | null;
  /** Puzzles solved in earlier playthroughs (new game+ margin notes). */
  margins: string[];
  /** Per-puzzle in-progress data owned by puzzle views. */
  puzzleData: Record<string, unknown>;
  /** Count of choices made (for stats and tests). */
  turns: number;
}

// ── Views for the UI ───────────────────────────────────────────────────────

export interface ChoiceView {
  id: string;
  label: string;
  params?: Record<string, string | number>;
  cost: number;
  kind: 'normal' | 'travel' | 'wait' | 'meta';
}

export interface Result {
  solved: boolean;
  /** In-game minutes the puzzle took. */
  minutes: number;
  /** The attempt failed outright (as opposed to the player stepping away). */
  failed?: boolean;
}
