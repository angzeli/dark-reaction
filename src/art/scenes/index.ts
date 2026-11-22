/**
 * Registry of illustrations by art id. Location art ids match
 * `LocationDef.art`; ending art ids match `EndingDef.art`.
 */
import type { SceneArt } from '../types.ts';
import { office } from './office.ts';

export const SCENES: Record<string, SceneArt> = {
  office,
};

export function hasScene(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(SCENES, id);
}
