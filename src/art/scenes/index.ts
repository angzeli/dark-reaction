/**
 * Registry of illustrations by art id. Location art ids match
 * `LocationDef.art`; ending art ids match `EndingDef.art`.
 */
import type { SceneArt } from '../types.ts';
import { glovebox } from './glovebox.ts';
import { nmr } from './nmr.ts';
import { office } from './office.ts';
import { synth } from './synth.ts';

export const SCENES: Record<string, SceneArt> = {
  office,
  synth,
  glovebox,
  nmr,
};

export function hasScene(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, id);
}
