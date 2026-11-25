/**
 * The console answers to more than help admits (docs/HUMOUR.md §5, #205): eighteen hidden commands, each
 * an anomaly, in both languages; none listed by help; quiet in Act III; and a solved console you can log
 * back into.
 */
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../src/content/index.ts';
import { Game } from '../src/engine/engine.ts';
import { t } from '../src/i18n/i18n.ts';
import { consoleLogic, HIDDEN, respond } from '../src/puzzles/console/logic.ts';

const out = (command: string, act: 1 | 2 | 3 = 1) => {
  const r = respond(command, '02:51', act);
  return r && typeof r === 'object' ? r : null;
};
const commands = CONTENT.anomalies.filter((a) => a.trigger.kind === 'command');

describe('the hidden commands', () => {
  it('are eighteen, every one answered in both languages and recorded as its own anomaly', () => {
    expect(commands).toHaveLength(18);
    for (const a of commands) {
      const r = out((a.trigger as { command: string }).command)!;
      expect(HIDDEN[r.key], a.id).toBe(a.id);
      for (const l of ['en', 'zh-Hant-TW'] as const) expect(t(r.key, r.params, l)).not.toMatch(/\[\[|\{clock\}/);
    }
  });

  it('are not in help', () => {
    for (const l of ['en', 'zh-Hant-TW'] as const) {
      const words = t('console.out.help', undefined, l).split(/[\s·]+/);
      for (const a of commands) expect(words, a.id).not.toContain((a.trigger as { command: string }).command.split(' ')[0]);
    }
  });

  it('answer as the software would, with the console’s own clock', () => {
    expect(t('console.out.g16', out('g16')!.params)).toBe(' Normal termination of Gaussian 16 at Mon Nov 23 02:51:00 2026.');
    expect(t('console.out.shuttle', out('shuttle')!.params)).toBe('Last service: 18:15. It is 02:51.');
    expect(t('console.out.shuttle', out('shuttle')!.params, 'zh-Hant-TW')).toBe('末班車：18:15。現在是 02:51。');
    expect(t('console.out.vasp')).toContain('ZBRENT: fatal error in bracketing');
    expect(t('console.out.orca')).toContain('error termination in SCF');
    expect(t('console.out.coffee')).toContain('No rule to make target ‘coffee’');
    expect(t('console.out.sudo')).toContain('reported to your PI');
    expect(t('console.out.top')).toMatch(/ar4217\s+100\.0\s+46:00\s+you/);
    expect(t('console.out.uptime', out('uptime')!.params)).toContain('up 1247 days');
  });

  it('take the obvious variants, and know which thesis is the real one', () => {
    for (const [typed, key] of [
      ['  SUDO  rm -rf  ', 'console.out.sudo'],
      ['rm -rf /*', 'console.out.rm'],
      ['mpirun -np 8 vasp_std', 'console.out.vasp'],
      ['orca input.inp', 'console.out.orca'],
      ['g16 < opt.gjf', 'console.out.g16'],
      ['htop', 'console.out.top'],
      ['ls -la', 'console.out.ls'],
      ['ping dan', 'console.out.ping'],
      ['git blame figure3.tex', 'console.out.blame'],
      ['cat thesis_final_v7_FINAL_actually.docx', 'console.out.thesis'],
      ['cat thesis_final_v2.docx', 'console.out.superseded'],
    ] as const) {
      expect(out(typed)?.key, typed).toBe(key);
    }
    expect(out('ping google.com')?.key).toBe('console.out.unknown');
  });

  it('go quiet in Act III: command not found, and nothing is found', () => {
    for (const a of commands) expect(out((a.trigger as { command: string }).command, 3)?.key).toBe('console.out.unknown');
    // The puzzle's own commands still work.
    expect(out('queue --all', 3)?.key).toBe('console.out.queue.all');
  });

  it('the console remembers the act it was opened in', () => {
    let s = consoleLogic.init({ minute: 4, act: 3, data: undefined });
    s = consoleLogic.apply(s, 'xyzzy');
    expect(s.lines.at(-1)).toEqual({ out: { key: 'console.out.unknown', params: { command: 'xyzzy' } } });
    let u = consoleLogic.init({ minute: 4, act: 2, data: undefined });
    u = consoleLogic.apply(u, 'xyzzy');
    expect(u.lines.at(-1)).toEqual({ out: { key: 'console.out.xyzzy' } });
  });
});

describe('logging back in to a solved console', () => {
  function atNmr(act: 1 | 2 | 3, solved: boolean): Game {
    const g = new Game(CONTENT);
    while (g.takeCard());
    g.state.act = act;
    if (solved) g.state.solved.push('console');
    g.choose('meta:travel');
    g.choose('go:nmr');
    return g;
  }

  it('is offered once the console is solved, in Acts I–II, and opens it', () => {
    expect(atNmr(1, false).choices().map((c) => c.id)).not.toContain('nmr.terminal');
    expect(atNmr(3, true).choices().map((c) => c.id)).not.toContain('nmr.terminal');
    const g = atNmr(2, true);
    g.choose('nmr.terminal');
    expect(g.state.puzzle).toBe('console');
  });

  it('closes on a log-out, not on the first night’s discovery, even if you read holder 13 again', () => {
    const g = atNmr(2, true);
    g.choose('nmr.terminal');
    g.completePuzzle({ solved: true, minutes: 2 });
    const keys = g.state.display.map((p) => p.key);
    expect(keys).toContain('puzzle.console.left');
    expect(keys).not.toContain('puzzle.console.solved');
  });
});
