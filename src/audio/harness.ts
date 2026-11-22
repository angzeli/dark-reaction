/** Entry point for the audio e2e test (e2e/audio.spec.ts); not part of the game bundle. */
import { audio } from './audio.ts';
import { AMBIENCE } from './presets/ambience.ts';
import { CUES } from './presets/cues.ts';

export { audio };
export const AMBIENCE_IDS = Object.keys(AMBIENCE);
export const CUE_IDS = Object.keys(CUES);
