import type { SceneDef } from '../../engine/types.ts';
import { o2At } from '../lab.ts';

export const gloveboxScenes: SceneDef[] = [
  {
    id: 'glovebox.hub',
    location: 'glovebox',
    hub: true,
    text: [{ key: 'glovebox.hub.act1', params: (s) => ({ ppm: o2At(s.minute).toFixed(1) }) }],
    choices: [],
  },
];
