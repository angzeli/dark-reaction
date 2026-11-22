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
    text: [
      { key: 'office.hub.act1', if: { act: 1 } },
      { key: 'office.hub.act2', if: { act: 2 } },
      { key: 'office.hub.act3', if: { act: 3 } },
    ],
    choices: [
      { id: 'office.monitor', label: 'office.monitor', to: 'office.monitor' },
      {
        // Act II: her honest raw data, from the cryovial in rack one.
        id: 'office.microsd',
        label: 'office.microsd',
        cost: 3,
        once: 'loop',
        if: { item: 'item.microsd' },
        effects: [{ fragment: 'yc.raw' }, { learn: 'nb.raw' }],
        text: [{ key: 'office.microsd.r.1' }, { key: 'office.microsd.r.2' }, { key: 'office.microsd.r.3' }],
      },
      { id: 'office.process', label: 'office.process', if: { item: 'item.spectrum.own' }, to: 'office.process' },
      {
        // 03:25: the night's spectrum, by email, if you were here to hear it arrive.
        id: 'office.print',
        label: 'office.print',
        cost: 1,
        if: { all: [{ lflag: 'perfect.mail' }, { not: { item: 'item.printout' } }] },
        effects: [{ give: 'item.printout' }, { chase: 'printout' }, { learn: 'nb.printout' }],
        tags: ['chase'],
        text: [{ key: 'office.print.r' }, { key: 'perfect.describe', params: (st) => ({ n: 46 - st.minute }) }],
      },
      {
        // P9: the printout beside your own spectrum and Figure 3.
        id: 'office.compare',
        label: 'office.compare',
        cost: 1,
        if: { all: [{ act: 3 }, { item: 'item.printout' }, { not: { solved: 'fabrication' } }] },
        text: [{ key: 'office.compare.r' }],
        effects: [{ puzzle: 'fabrication' }],
      },
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
      { id: 'office.submit.own', label: 'office.submit.own', if: { item: 'item.spectrum.own' }, to: 'office.declare.own' },
      { id: 'office.submit.printout', label: 'office.submit.printout', if: { item: 'item.printout' }, to: 'office.declare.printout' },
    ],
  },
  {
    // Your own spectrum, from the 400: what you do to it is up to you.
    id: 'office.process',
    location: 'office',
    text: [{ key: 'office.process.text' }],
    choices: [
      {
        id: 'office.process.honest',
        label: 'office.process.honest',
        cost: 1,
        if: { not: { know: 'nb.ownspectrum' } },
        effects: [{ learn: 'nb.ownspectrum' }],
        tags: ['honest'],
        text: [{ key: 'office.process.honest.r' }],
      },
      {
        id: 'office.baseline.fudge',
        label: 'office.baseline.fudge',
        cost: 1,
        if: { not: { know: 'fudge.baseline' } },
        effects: [{ fudge: 'fudge.baseline' }],
        tags: ['fudge'],
        text: [{ key: 'office.baseline.fudge.r' }],
      },
      {
        id: 'office.integral.fudge',
        label: 'office.integral.fudge',
        cost: 1,
        if: { not: { know: 'fudge.integral' } },
        effects: [{ fudge: 'fudge.integral' }],
        tags: ['fudge'],
        text: [{ key: 'office.integral.fudge.r' }],
      },
      {
        id: 'office.reprocess',
        label: 'office.reprocess',
        cost: 3,
        once: 'loop',
        effects: [{ chase: 'reprocess' }],
        tags: ['chase'],
        text: [{ key: 'office.reprocess.r' }],
      },
      {
        id: 'office.stare',
        label: 'office.stare',
        cost: 5,
        once: 'loop',
        effects: [{ chase: 'stare' }],
        tags: ['chase'],
        text: [{ key: 'office.stare.r' }],
      },
    ],
  },
  {
    // The portal's last page, with your spectrum attached. Uploading it ends the night.
    id: 'office.declare.own',
    location: 'office',
    backFirst: true,
    text: [
      { key: 'office.declare.own.text' },
      { key: 'office.declare.blocked', if: { uncorrectedGte: 1 } },
      { key: 'office.declare.clear', if: { not: { uncorrectedGte: 1 } } },
    ],
    choices: [
      {
        id: 'office.upload.own',
        label: 'office.upload',
        if: { all: [{ actGte: 2 }, { not: { uncorrectedGte: 1 } }] },
        effects: [{ ending: 'honest' }],
        tags: ['ending', 'honest'],
      },
    ],
  },
  {
    id: 'office.declare.printout',
    location: 'office',
    backFirst: true,
    text: [
      { key: 'office.declare.printout.text' },
      { key: 'office.declare.blocked', if: { uncorrectedGte: 1 } },
      { key: 'office.declare.clear', if: { not: { uncorrectedGte: 1 } } },
    ],
    choices: [
      {
        id: 'office.upload.printout',
        label: 'office.upload',
        if: { all: [{ actGte: 2 }, { not: { uncorrectedGte: 1 } }] },
        effects: [{ ending: 'perfect' }],
        tags: ['ending'],
      },
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
