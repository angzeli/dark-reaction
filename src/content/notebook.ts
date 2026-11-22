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
  entry('nb.tlc', 'tonight'),
  entry('nb.purge', 'tonight'),
  entry('nb.queue.0333', 'anomalies'),
  entry('nb.holder13', 'anomalies'),
  entry('nb.queue.locked', 'tonight'),
];
