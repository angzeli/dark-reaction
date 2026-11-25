/**
 * Tone tags shared by several rooms (docs/HUMOUR.md §3). A room is calm until Act III, when every room
 * reads darker; B12 is where the dark run is set up, so its Act III is dread.
 */
import type { ToneTag } from '../engine/types.ts';

export const CALM_UNTIL_ACT3: ToneTag = { 1: 'calm', 2: 'calm', 3: 'uneasy' };
export const CALM_THEN_DREAD: ToneTag = { 1: 'calm', 2: 'calm', 3: 'dread' };
export const UNEASY_THEN_DREAD: ToneTag = { 1: 'uneasy', 2: 'uneasy', 3: 'dread' };
