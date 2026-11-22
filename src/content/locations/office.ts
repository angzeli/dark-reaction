/**
 * 4.08 Write-up office: where every loop starts. Your monitor (the queue,
 * Dan's email, the portal, the data), the kettle and the sofa (rest), the
 * window, hot desk 7 (Y.C.'s mug and drawer), your phone. docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';

export const officeScenes: SceneDef[] = [
  {
    id: 'office.hub',
    location: 'office',
    hub: true,
    text: [{ key: 'office.hub.act1' }],
    choices: [
      { id: 'office.monitor', label: 'office.monitor', to: 'office.monitor' },
      {
        id: 'office.tea',
        label: 'office.tea',
        cost: 4,
        once: 'loop',
        effects: [{ rest: 'tea' }],
        tags: ['rest'],
        text: [{ key: 'office.tea.r' }, { key: 'office.tea.r.told', if: { know: 'ph.tea' } }],
      },
      {
        id: 'office.sofa',
        label: 'office.sofa',
        cost: 10,
        once: 'loop',
        effects: [{ rest: 'sofa', amount: 2 }],
        tags: ['rest'],
        text: [{ key: 'office.sofa.r' }],
      },
      { id: 'office.window', once: 'loop', label: 'office.window', cost: 1, text: [{ key: 'office.window.r' }] },
      { id: 'office.desk7', label: 'office.desk7', cost: 1, to: 'office.desk7' },
      { id: 'office.phone', once: 'loop', label: 'office.phone', cost: 1, effects: [{ learn: 'nb.priya' }], text: [{ key: 'office.phone.r' }] },
    ],
  },
  {
    id: 'office.monitor',
    location: 'office',
    text: [{ key: 'office.monitor.text' }],
    choices: [
      { id: 'office.queue', once: 'loop', label: 'office.queue', cost: 1, effects: [{ learn: 'nb.booking' }], text: [{ key: 'office.queue.r' }] },
      {
        // Dan's email arrives at 02:50 (event `ev.mail`).
        id: 'office.email',
        once: 'loop',
        label: 'office.email',
        cost: 1,
        if: { minuteGte: 3 },
        effects: [{ learn: 'nb.dan' }],
        text: [{ key: 'office.email.r.1' }, { key: 'office.email.r.2' }, { key: 'office.email.r.3' }],
      },
      { id: 'office.portal', once: 'loop', label: 'office.portal', cost: 1, effects: [{ learn: 'nb.portal' }], text: [{ key: 'office.portal.r.1' }, { key: 'office.portal.r.2' }] },
      { id: 'office.data', once: 'loop', label: 'office.data', cost: 1, effects: [{ learn: 'nb.paper' }], text: [{ key: 'office.data.r' }] },
    ],
  },
  {
    id: 'office.desk7',
    location: 'office',
    text: [{ key: 'office.desk7.text' }],
    choices: [
      {
        id: 'office.mug',
        once: 'loop',
        label: 'office.mug',
        cost: 1,
        effects: [{ fragment: 'yc.mug' }, { learn: 'nb.mug' }],
        text: [{ key: 'office.mug.r' }],
      },
      {
        id: 'office.drawer',
        once: 'loop',
        label: 'office.drawer',
        cost: 1,
        effects: [{ fragment: 'yc.desk' }, { learn: 'nb.drawer' }],
        text: [{ key: 'office.drawer.r' }],
      },
    ],
  },
];
