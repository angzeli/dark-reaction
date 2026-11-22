/**
 * Registry of illustrations by art id. Location art ids match
 * `LocationDef.art`; ending art ids match `EndingDef.art`.
 */
import type { SceneArt } from '../types.ts';
import { cold } from './cold.ts';
import { endingClocking } from './endings/clocking.ts';
import { endingDark } from './endings/dark.ts';
import { endingFire } from './endings/fire.ts';
import { endingHonest } from './endings/honest.ts';
import { endingInfinite } from './endings/infinite.ts';
import { endingPerfect } from './endings/perfect.ts';
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
  'ending.perfect': endingPerfect,
  'ending.honest': endingHonest,
  'ending.clocking': endingClocking,
  'ending.infinite': endingInfinite,
  'ending.dark': endingDark,
  'ending.fire': endingFire,
};

export function hasScene(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, id);
}
