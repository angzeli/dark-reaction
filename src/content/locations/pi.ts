import type { SceneDef } from '../../engine/types.ts';

export const piScenes: SceneDef[] = [
  {
    // Outside the door: locked except during the porter's Monday clean (03:15–03:18).
    id: 'pi.door',
    location: 'pi',
    hub: true,
    text: [{ key: 'pi.door.text' }],
    choices: [],
  },
  {
    id: 'pi.hub',
    location: 'pi',
    hub: true,
    text: [{ key: 'pi.hub.text' }],
    choices: [],
  },
];
