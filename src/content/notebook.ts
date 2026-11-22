/** Notebook entries: what you find out, and what you write down. docs/DESIGN.md §6. */
import type { NotebookDef } from '../engine/types.ts';

const entry = (id: string, section: NotebookDef['section'], kind?: NotebookDef['kind']): NotebookDef => ({
  id,
  section,
  title: `${id}.title`,
  body: `${id}.body`,
  ...(kind ? { kind } : {}),
});

export const NOTEBOOK: NotebookDef[] = [
  // Act I: tonight
  entry('nb.portal', 'tonight'),
  entry('nb.tlc', 'tonight'),
  entry('nb.sop', 'tonight'),
  entry('nb.purge', 'tonight'),
  entry('nb.logbook', 'tonight'),
  entry('fudge.logbook', 'tonight', 'fudge'),
  entry('nb.queue.locked', 'tonight'),
  // Act I: people
  entry('nb.dan', 'people'),
  entry('nb.priya', 'people'),
  entry('nb.tom', 'people'),
  entry('nb.ian', 'people'),
  entry('nb.mug', 'people'),
  entry('nb.drawer', 'people'),
  // Act I: data
  entry('nb.paper', 'data'),
  entry('nb.yield', 'data'),
  entry('fudge.yield', 'data', 'fudge'),
  // Act I: anomalies
  entry('nb.booking', 'anomalies'),
  entry('nb.queue.0333', 'anomalies'),
  entry('nb.holder13', 'anomalies'),
  entry('nb.mini', 'anomalies'),
  entry('nb.reset', 'anomalies'),
  // Pages in your handwriting that you don't remember writing (docs/DESIGN.md §14)
  entry('ph.tea', 'tonight', 'phantom'),
  entry('ph.three', 'tonight', 'phantom'),
  entry('ph.all', 'anomalies', 'phantom'),
  entry('ph.strike', 'tonight', 'phantom'),
];
