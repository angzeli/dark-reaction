/**
 * 4.08 Research Write-Up Room: where every loop starts. Your monitor (the queue,
 * Dan's email, the portal, the data), the kettle and the sofa (rest), the
 * window, hot desk 7 (Y.C.'s mug and drawer), your phone. docs/DESIGN.md §9.
 */
import type { SceneDef } from '../../engine/types.ts';
import { lanyard } from '../lanyard.ts';
import { squid } from '../squid.ts';
import { CALM_UNTIL_ACT3 } from '../tone.ts';

export const officeScenes: SceneDef[] = [
  {
    id: 'office.hub',
    location: 'office',
    tone: CALM_UNTIL_ACT3,
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
        // Its countdown starts from the minute it's in your hand: printing it is that minute (#147).
        id: 'office.print',
        label: 'office.print',
        cost: 1,
        if: { all: [{ lflag: 'perfect.mail' }, { not: { item: 'item.printout' } }] },
        effects: [{ give: 'item.printout' }, { chase: 'printout' }, { learn: 'nb.printout' }],
        tags: ['chase'],
        text: [{ key: 'office.print.r' }, { key: 'perfect.describe', params: (st) => ({ n: 46 - (st.minute + 1) }) }],
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
      {
        id: 'office.window',
        once: 'loop',
        label: 'office.window',
        cost: 1,
        text: [
          { key: 'office.window.r', if: { not: { act: 3 } } },
          { key: 'office.window.act3', if: { act: 3 } },
        ],
      },
      { id: 'office.postit', once: 'loop', label: 'office.postit', cost: 1, text: [{ key: 'office.postit.r' }] },
      // Act III: the tube over hot desk 7 has stopped flickering (#69, drawn in #64).
      { id: 'office.ceiling', once: 'loop', label: 'office.ceiling', cost: 1, if: { act: 3 }, text: [{ key: 'office.ceiling.r' }] },
      { id: 'office.desk7', label: 'office.desk7', cost: 1, to: 'office.desk7' },
      {
        id: 'office.phone',
        once: 'loop',
        label: 'office.phone',
        cost: 1,
        effects: [{ learn: 'nb.priya' }],
        text: [{ key: 'office.phone.r' }, { key: 'office.phone.act3', if: { act: 3 } }],
      },
      // v1.1.0: the room's small things are one look away, so the hub keeps its number keys (#204).
      { id: 'office.around', label: 'office.around', to: 'office.around' },
    ],
  },
  {
    // The Research Write-Up Room, looked at properly (docs/HUMOUR.md §4.2, §4.4): the door plate, and
    // your lanyard, which you can take off here.
    id: 'office.around',
    location: 'office',
    tone: CALM_UNTIL_ACT3,
    text: [{ key: 'office.around.text' }],
    choices: [
      { id: 'office.plate', label: 'office.plate', cost: 1, once: 'loop', if: { not: { act: 3 } }, effects: [{ anomaly: 'plate' }], text: [{ key: 'fun.plate' }] },
      // A COSHH assessment for a pencil (docs/HUMOUR.md §8): the form takes longer than the pencil.
      { id: 'office.pencil', label: 'office.pencil', cost: 2, once: 'loop', if: { not: { act: 3 } }, effects: [{ anomaly: 'coshh' }], text: [{ key: 'fun.pencil' }] },
      ...lanyard('office'),
      squid('office'),
    ],
  },
  {
    id: 'office.monitor',
    location: 'office',
    tone: CALM_UNTIL_ACT3,
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
      // Your own chapter 4 (docs/HUMOUR.md §8): every photocatalysis paper you've rolled your eyes at.
      { id: 'office.thesis', label: 'office.thesis', cost: 1, once: 'loop', if: { not: { act: 3 } }, text: [{ key: 'fun.thesis' }] },
    ],
  },
  {
    // Your own spectrum, from the 400: what you do to it is up to you.
    id: 'office.process',
    location: 'office',
    tone: 'uneasy',
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
    tone: 'dread',
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
    tone: 'dread',
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
    tone: 'uneasy',
    // From Act II the picture shows the top box open; the page says so too (#129).
    text: [{ key: 'office.desk7.text' }, { key: 'office.desk7.open', if: { actGte: 2 } }],
    choices: [
      {
        id: 'office.mug',
        once: 'loop',
        label: 'office.mug',
        cost: 1,
        effects: [{ fragment: 'yc.mug' }, { learn: 'nb.mug' }],
        // Once you have found her rain log, you know where the ring came from.
        text: [{ key: 'office.mug.r' }, { key: 'office.mug.rain', if: { know: 'nb.rainlog' } }],
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
