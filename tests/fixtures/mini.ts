/**
 * A tiny world for engine tests: the real map, a handful of scenes, one
 * puzzle, one event, phantoms, acts, lights-out rules and endings. It is not
 * the game's content; it only exercises the rules.
 */
import type { Content } from '../../src/engine/types.ts';
import { EDGES, LOCATIONS } from '../../src/content/world.ts';

const simpleHub = (id: string, location: Content['locations'][number]['id']) => ({
  id,
  location,
  hub: true,
  text: [{ key: `${id}.text` }],
  choices: [],
});

export function miniContent(): Content {
  return {
    start: { location: 'office' },
    locations: LOCATIONS,
    edges: EDGES,
    loopStart: [{ key: 'loop.start' }],
    obsession: { decay1: 4, decay2: 7, infinite: 10, infiniteFromLoop: 4 },
    scenes: [
      {
        id: 'office.hub',
        location: 'office',
        hub: true,
        text: [{ key: 'office.hub.act1', if: { act: 1 } }, { key: 'office.hub.act2', if: { act: 2 } }],
        onEnter: [{ lflag: 'woke' }],
        choices: [
          { id: 'office.arm', label: 'c.arm', text: [{ key: 'r.arm' }], effects: [{ lflag: 'late.armed' }] },
          { id: 'office.armknock', label: 'c.armknock', text: [{ key: 'r.armknock' }], effects: [{ lflag: 'knock.armed' }] },
          { id: 'office.alarm', label: 'c.alarm', text: [{ key: 'r.alarm' }], effects: [{ lflag: 'alarm' }] },
          { id: 'office.slow', label: 'c.slow', effects: [{ puzzle: 'slow' }], text: [{ key: 'r.slow' }] },
          { id: 'office.walk', label: 'c.walk', cost: 2, text: [{ key: 'r.walk' }], effects: [{ go: 'nmr' }] },
          { id: 'office.kettle', label: 'c.kettle', cost: 4, once: 'loop', text: [{ key: 'r.kettle' }], effects: [{ rest: 'tea' }] },
          { id: 'office.sofa', label: 'c.sofa', cost: 10, text: [{ key: 'r.sofa' }], effects: [{ rest: 'sofa', amount: 2 }] },
          { id: 'office.rerun', label: 'c.rerun', cost: 1, text: [{ key: 'r.rerun' }], effects: [{ chase: 'rerun' }] },
          { id: 'office.reprocess', label: 'c.reprocess', cost: 1, text: [{ key: 'r.reprocess' }], effects: [{ chase: 'reprocess' }] },
          { id: 'office.mug', label: 'c.mug', cost: 1, once: 'game', text: [{ key: 'r.mug' }], effects: [{ fragment: 'yc.mug' }, { learn: 'nb.mug' }] },
          { id: 'office.pen', label: 'c.pen', cost: 0, text: [{ key: 'r.pen' }], effects: [{ give: 'item.pen' }, { lflag: 'has.pen' }] },
          { id: 'office.yield', label: 'c.yield', cost: 1, text: [{ key: 'r.yield' }], effects: [{ fudge: 'fudge.yield' }], tags: ['fudge'] },
          { id: 'office.computer', label: 'c.computer', to: 'office.computer' },
          { id: 'office.puzzle', label: 'c.puzzle', cost: 1, effects: [{ puzzle: 'demo' }], text: [{ key: 'r.puzzle' }] },
          { id: 'office.submit', label: 'c.submit', if: { item: 'item.pen' }, text: [{ key: 'r.submit' }], effects: [{ ending: 'honest' }] },
          { id: 'office.loaded', label: 'c.loaded', cost: 1, text: [{ key: 'r.loaded' }], effects: [{ lflag: 'tube.loaded' }] },
        ],
      },
      {
        id: 'office.computer',
        location: 'office',
        text: [{ key: 'office.computer.text', params: (s) => ({ minute: s.minute }) }],
        choices: [{ id: 'office.email', label: 'c.email', cost: 2, text: [{ key: 'r.email' }], effects: [{ learn: 'nb.email' }] }],
      },
      simpleHub('synth.hub', 'synth'),
      simpleHub('glovebox.hub', 'glovebox'),
      simpleHub('pi.hub', 'pi'),
      { id: 'pi.door', location: 'pi', hub: true, text: [{ key: 'pi.door.text' }], choices: [] },
      simpleHub('stairs.hub', 'stairs'),
      {
        id: 'nmr.hub',
        location: 'nmr',
        hub: true,
        text: [{ key: 'nmr.hub.text' }],
        choices: [{ id: 'nmr.printout', label: 'c.printout', if: { lflag: 'printed' }, effects: [{ give: 'item.printout' }], text: [{ key: 'r.printout' }] }],
      },
      simpleHub('cold.hub', 'cold'),
      simpleHub('roof.hub', 'roof'),
    ],
    notebook: [
      { id: 'nb.mug', section: 'people', title: 'nb.mug.title', body: 'nb.mug.body' },
      { id: 'nb.email', section: 'people', title: 'nb.email.title', body: 'nb.email.body' },
      { id: 'nb.demo', section: 'data', title: 'nb.demo.title', body: 'nb.demo.body' },
      { id: 'nb.late', section: 'data', title: 'nb.late.title', body: 'nb.late.body' },
      { id: 'ph.later', section: 'anomalies', kind: 'phantom', title: 'ph.later.title', body: 'ph.later.body' },
      { id: 'fudge.yield', section: 'data', kind: 'fudge', title: 'fudge.yield.title', body: 'fudge.yield.body' },
      { id: 'ph.tea', section: 'anomalies', kind: 'phantom', title: 'ph.tea.title', body: 'ph.tea.body' },
      { id: 'ph.pages', section: 'anomalies', kind: 'phantom', title: 'ph.pages.title', body: 'ph.pages.body' },
    ],
    puzzles: [
      {
        id: 'demo',
        par: 2,
        hints: ['p.demo.h1', 'p.demo.h2', 'p.demo.h3'],
        onSolve: [{ learn: 'nb.demo' }],
        onFail: [{ take: 'item.pen' }, { lflag: 'demo.ruined' }],
        solvedText: [{ key: 'p.demo.solved' }],
        failedText: [{ key: 'p.demo.failed' }],
        leftText: [{ key: 'p.demo.left' }],
      },
      { id: 'dark', par: 2, hints: ['p.dark.h1', 'p.dark.h2', 'p.dark.h3'], onSolve: [{ ending: 'dark' }] },
      { id: 'slow', par: 1, hints: ['p.slow.h1', 'p.slow.h2', 'p.slow.h3'], onSolve: [{ time: 7 }, { learn: 'nb.late' }] },
    ],
    events: [
      { id: 'ev.printer', minute: 38, if: { at: 'nmr' }, effects: [{ lflag: 'printed' }], text: [{ key: 'ev.printer.text' }] },
      { id: 'ev.late', minute: 44, if: { lflag: 'late.armed' }, effects: [{ learn: 'nb.late' }], text: [{ key: 'ev.late.text' }] },
      { id: 'ev.knock', minute: 20, if: { lflag: 'knock.armed' }, text: [{ key: 'ev.knock.text' }] },
      { id: 'ev.hoover', minute: 28, until: 31, if: { at: 'pi' }, text: [{ key: 'ev.hoover.text' }] },
    ],
    phantoms: [
      { entry: 'ph.tea', when: { loopGte: 2 } },
      { entry: 'ph.later', when: { all: [{ actGte: 2 }, { loopsInActGte: 1 }] } },
    ],
    lightsOut: [
      { id: 'lo.alarm', if: { lflag: 'alarm' }, effects: [{ ending: 'fire' }], text: [{ key: 'lo.alarm.text' }] },
      { id: 'lo.dark', if: { all: [{ lflag: 'tube.loaded' }, { know: 'nb.email' }] }, puzzle: 'dark', text: [{ key: 'lo.dark.text' }] },
      { id: 'lo.pages', if: { all: [{ lflag: 'tube.loaded' }, { uncorrectedGte: 1 }] }, effects: [{ learn: 'ph.pages' }], text: [{ key: 'lo.pages.text' }] },
    ],
    acts: [
      { act: 2, when: { know: 'nb.demo' }, title: 'act.2.title' },
      { act: 3, when: { know: 'nb.email' }, title: 'act.3.title' },
    ],
    endings: (['perfect', 'honest', 'clocking', 'infinite', 'dark', 'fire'] as const).map((id) => ({
      id,
      title: `ending.${id}.title`,
      clue: `ending.${id}.clue`,
      epilogue: [{ key: `ending.${id}.1` }],
      art: id,
      cue: id,
    })),
  };
}
