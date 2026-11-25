/**
 * 4.01 Prof. Ridley's office: locked except while the porter cleans it
 * (Mondays 03:15–03:18); the push-bar lets you out at any time. The framed
 * paper, her last email, her box, the 2018 photo, Ian's priority code.
 * docs/DESIGN.md §9.
 */
import type { Cond, SceneDef } from '../../engine/types.ts';
import { CALM_UNTIL_ACT3, UNEASY_THEN_DREAD } from '../tone.ts';
import { PI_OPEN } from '../world.ts';

/** The porter's Monday clean: the door stands unlocked (03:15–03:18). */
const cleaning: Cond = { all: [{ minuteGte: PI_OPEN.from }, { minuteLt: PI_OPEN.to }] };

export const piScenes: SceneDef[] = [
  {
    // Outside the door: locked except during the porter's Monday clean (03:15–03:18).
    id: 'pi.door',
    location: 'pi',
    tone: CALM_UNTIL_ACT3,
    hub: true,
    // Its own picture: this side of the frosted door, not the room behind it (#123).
    art: ['door'],
    text: [{ key: 'pi.door.text' }],
    choices: [
      // Waiting at the door through 03:15 has to open it too, not only arriving then (playtest).
      { id: 'pi.enter', label: 'pi.enter', if: cleaning, to: 'pi.hub' },
      { id: 'pi.knock', label: 'pi.knock', cost: 1, once: 'loop', if: { not: cleaning }, text: [{ key: 'pi.knock.r' }] },
    ],
  },
  {
    id: 'pi.hub',
    location: 'pi',
    tone: UNEASY_THEN_DREAD,
    hub: true,
    text: [
      { key: 'pi.hub.text', if: { not: { act: 3 } } },
      { key: 'pi.hub.act3', if: { act: 3 } },
    ],
    choices: [
      { id: 'pi.paper', label: 'pi.paper', cost: 1, once: 'loop', effects: [{ learn: 'nb.framed' }], text: [{ key: 'pi.paper.r' }] },
      {
        id: 'pi.email',
        label: 'pi.email',
        cost: 1,
        once: 'loop',
        effects: [{ fragment: 'yc.email' }, { learn: 'nb.email' }],
        text: [{ key: 'pi.email.r.1' }, { key: 'pi.email.r.2' }],
      },
      { id: 'pi.box', label: 'pi.box', cost: 1, effects: [{ fragment: 'yc.box' }], to: 'pi.box' },
      {
        // P7: the last page of her notebook.
        id: 'pi.notebook',
        label: 'pi.notebook',
        cost: 1,
        if: { not: { solved: 'cipher' } },
        text: [{ key: 'pi.notebook.r' }],
        effects: [{ puzzle: 'cipher' }],
      },
      {
        id: 'pi.photo',
        label: 'pi.photo',
        cost: 1,
        once: 'loop',
        effects: [{ fragment: 'yc.photo' }, { learn: 'nb.photo' }],
        // Once you know the building keeps whoever is inside at 03:33, you look at the windows too.
        text: [{ key: 'pi.photo.r' }, { key: 'pi.photo.keeps', if: { know: 'nb.keeps' } }],
      },
      { id: 'pi.books', label: 'pi.books', cost: 1, once: 'loop', text: [{ key: 'pi.books.r' }] },
      // Act III: the framed paper hangs crooked and won't stay straight (#69, drawn in #64).
      { id: 'pi.frame', label: 'pi.frame', cost: 1, once: 'loop', if: { act: 3 }, effects: [{ learn: 'nb.frame' }], text: [{ key: 'pi.frame.r' }] },
      { id: 'pi.sticky', label: 'pi.sticky', cost: 1, once: 'loop', effects: [{ learn: 'nb.priority' }], text: [{ key: 'pi.sticky.r' }] },
    ],
  },
  {
    // Inside the office the door may already have locked behind you, so this
    // scene leads back to the room itself rather than to the entry scene.
    id: 'pi.box',
    location: 'pi',
    tone: 'dread',
    noBack: true,
    text: [{ key: 'pi.box.text' }],
    choices: [
      { id: 'pi.tin', label: 'pi.tin', cost: 1, once: 'loop', text: [{ key: 'pi.tin.r' }] },
      { id: 'pi.cardigan', label: 'pi.cardigan', cost: 1, once: 'loop', text: [{ key: 'pi.cardigan.r' }] },
      { id: 'pi.drafts', label: 'pi.drafts', cost: 1, once: 'loop', effects: [{ learn: 'nb.drafts' }], text: [{ key: 'pi.drafts.r' }] },
      { id: 'pi.box.close', label: 'pi.box.close', to: 'pi.hub' },
    ],
  },
];
