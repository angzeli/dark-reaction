/**
 * Your lanyard (docs/HUMOUR.md §4.4): round your neck at every 02:47 (`CONTENT.onLoopStart`). You can
 * take it off where nobody needs to see it, in the Research Write-Up Room and in the toilets, and put it
 * back on there. Taking it off even once rules out *Visible at All Times* for the playthrough.
 */
import type { ChoiceDef } from '../engine/types.ts';

export const LANYARD = 'item.lanyard';

/** The two choices, for the scene whose id prefix is given (`office`, `stairs.toilets`). */
export function lanyard(prefix: string): ChoiceDef[] {
  return [
    {
      id: `${prefix}.lanyard.off`,
      label: 'lanyard.off',
      if: { item: LANYARD },
      effects: [{ take: LANYARD }, { lflag: 'lanyard.off' }, { flag: 'lanyard.offEver' }, { anomaly: 'lanyard.off' }],
      text: [{ key: 'fun.lanyard.off' }],
    },
    { id: `${prefix}.lanyard.on`, label: 'lanyard.on', if: { lflag: 'lanyard.off' }, effects: [{ give: LANYARD }, { unlflag: 'lanyard.off' }], text: [{ key: 'lanyard.on.r' }] },
  ];
}
