/**
 * Small content fixes from the playtest QA pass (docs/qa/PLAYTEST-REPORT.md).
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import { t } from '../src/i18n/i18n.ts';

const choice = (id: string) => CONTENT.scenes.flatMap((s) => s.choices).find((c) => c.id === id);
const scene = (id: string) => CONTENT.scenes.find((s) => s.id === id)!;

describe('playtest content polish', () => {
  it('the console’s booking doesn’t count minutes from 02:47: it reads true at 03:28 too (#115)', () => {
    for (const locale of ['en', 'zh-Hant-TW'] as const) {
      const text = t('puzzle.console.solved', undefined, locale);
      expect(text).not.toMatch(/forty|四十/);
    }
  });

  it('every Act III choice in the glovebox room can be shown: the glovebox is always solved by then (#121)', () => {
    expect(choice('glovebox.mini.shut')).toBeUndefined();
    for (const c of scene('glovebox.hub').choices) {
      const json = JSON.stringify(c.if ?? {});
      expect(json.includes('"act":3') && json.includes('{"not":{"solved":"glovebox"}}'), c.id).toBe(false);
    }
  });

  it('the late purge says it’s late before you choose it (#122)', () => {
    expect(choice('glovebox.purge.late')!.label).not.toBe(choice('glovebox.purge')!.label);
  });

  it('from Act II, hot desk 7 says what the picture shows: the top box open (#129)', () => {
    const g = new Game(CONTENT);
    while (g.takeCard());
    g.state.act = 2;
    expect(g.sceneText('office.desk7').map((p) => p.key)).toContain('office.desk7.open');
    g.state.act = 1;
    expect(g.sceneText('office.desk7').map((p) => p.key)).not.toContain('office.desk7.open');
  });
});
