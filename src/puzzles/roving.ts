/**
 * Roving focus for controls laid out on a grid (the freezer box, the
 * periodic table) or in a line (the radio groups in the door log and the
 * cipher): one Tab stop, and the arrow keys move to the nearest control in
 * that direction, skipping gaps. `step` is pure, so it is tested without a
 * DOM; `bindRoving` wires it to a container's keydown.
 */

export interface Spot {
  row: number;
  col: number;
}

const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

/**
 * Where `key` moves from `spots[from]`, or null if it doesn't move. In a
 * `linear` group (a row of radios) the arrows step through the list and
 * wrap, as radio groups do; on a grid they stop at the edges. Up and down
 * go to the nearest row in that direction that has anything in it, then to
 * the nearest column (the lower one on a tie).
 */
export function step(spots: readonly Spot[], from: number, key: string, linear = false): number | null {
  const here = spots[from];
  if (!here || !ARROWS.has(key)) return null;
  const n = spots.length;
  if (linear) {
    if (key === 'ArrowRight' || key === 'ArrowDown') return (from + 1) % n;
    if (key === 'ArrowLeft' || key === 'ArrowUp') return (from - 1 + n) % n;
    return key === 'Home' ? 0 : n - 1;
  }
  const indices = spots.map((_, i) => i);
  const sameRow = indices.filter((i) => spots[i]!.row === here.row);
  const byCol = (a: number, b: number) => spots[a]!.col - spots[b]!.col;
  switch (key) {
    case 'ArrowRight':
      return sameRow.filter((i) => spots[i]!.col > here.col).sort(byCol)[0] ?? null;
    case 'ArrowLeft':
      return sameRow.filter((i) => spots[i]!.col < here.col).sort(byCol).pop() ?? null;
    case 'Home':
      return sameRow.sort(byCol)[0] ?? null;
    case 'End':
      return sameRow.sort(byCol).pop() ?? null;
    default: {
      const down = key === 'ArrowDown';
      const ahead = indices.filter((i) => (down ? spots[i]!.row > here.row : spots[i]!.row < here.row));
      if (ahead.length === 0) return null;
      const rowGap = (i: number) => Math.abs(spots[i]!.row - here.row);
      const nearest = Math.min(...ahead.map(rowGap));
      const row = ahead.filter((i) => rowGap(i) === nearest);
      const colGap = (i: number) => Math.abs(spots[i]!.col - here.col);
      return row.sort((a, b) => colGap(a) - colGap(b) || byCol(a, b))[0] ?? null;
    }
  }
}

export interface RovingOptions {
  /** The controls, in the same order as `spots`. */
  items(): HTMLElement[];
  spots(): readonly Spot[];
  linear?: boolean;
  /** Move to item `index` (select it, or just focus it). */
  onMove(index: number): void;
}

/** Handle the arrow keys (and Home/End) for a group of controls inside `container`. */
export function bindRoving(container: HTMLElement, opts: RovingOptions): void {
  // Marks the group, so a keyboard walk (e2e/input-modes.spec.ts) knows the arrows move inside it.
  container.dataset['roving'] = opts.linear ? 'line' : 'grid';
  container.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || !ARROWS.has(e.key)) return;
    const items = opts.items();
    const from = items.findIndex((el) => el === e.target || el.contains(e.target as Node));
    if (from < 0) return;
    e.preventDefault();
    const to = step(opts.spots(), from, e.key, opts.linear);
    if (to !== null && to !== from) opts.onMove(to);
  });
}

/** Give exactly one control in a roving group the Tab stop. */
export function setTabStop(items: readonly HTMLElement[], index: number): void {
  items.forEach((el, i) => el.setAttribute('tabindex', i === index ? '0' : '-1'));
}
