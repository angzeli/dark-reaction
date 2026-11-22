/** What an illustration may depend on. Kept small so scenes stay pure functions. */
export interface ArtContext {
  act: 1 | 2 | 3;
  /** Loop minute (0 = 02:47), for clocks and light. */
  minute: number;
  /** Lights out: the room as it is in the dark. */
  dark?: boolean;
  /** Scene-specific details that are present (e.g. 'flask.port4'). */
  details?: readonly string[];
}

export type SceneArt = (ctx: ArtContext) => string;
