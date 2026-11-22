/**
 * Registry of illustrations by art id. Location art ids match
 * `LocationDef.art`; ending art ids match `EndingDef.art`.
 */
import type { SceneArt } from '../types.ts';
import { cold } from './cold.ts';
import { glovebox } from './glovebox.ts';
import { nmr } from './nmr.ts';
import { office } from './office.ts';
import { pi } from './pi.ts';
import { roof } from './roof.ts';
import { stairs } from './stairs.ts';
import { synth } from './synth.ts';

export const SCENES: Record<string, SceneArt> = {
  office,
  synth,
  glovebox,
  nmr,
  stairs,
  pi,
  cold,
  roof,
};

export function hasScene(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, id);
}
