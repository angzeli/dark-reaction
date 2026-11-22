import { describe, expect, it } from 'vitest';
import { hasScene, SCENES } from '../src/art/scenes/index.ts';
import { hash, rain, seeded } from '../src/art/svg.ts';
import type { ArtContext } from '../src/art/types.ts';
import { ENDINGS, EPILOGUES } from '../src/content/endings.ts';
import { o2At } from '../src/content/lab.ts';
import { LOCATIONS } from '../src/content/world.ts';

const contexts: ArtContext[] = [
  { act: 1, minute: 0 },
  { act: 2, minute: 28 },
  { act: 3, minute: 46, dark: true },
];

/** Scene motion the reduce-motion and flicker settings can stop (src/styles/art.css), and the stage's own classes. */
const MOTION = new Set(['dr-rain', 'dr-drop', 'dr-flicker', 'dr-blink', 'dr-breathe']);
const STAGE = new Set(['dr-scene', 'dr-scene--dark', 'dr-tube', 'dr-dither']);

describe('scenes', () => {
  for (const [id, scene] of Object.entries(SCENES)) {
    it(`${id} renders a decorative SVG for every act, deterministically`, () => {
      for (const ctx of contexts) {
        const a = scene(ctx);
        expect(a.startsWith('<svg')).toBe(true);
        expect(a).toContain(`data-art="${id}"`);
        expect(a).toContain('viewBox="0 0 1600 900"');
        expect(a).toContain('aria-hidden="true"');
        expect(a).not.toMatch(/NaN|undefined|Infinity/);
        expect(scene(ctx)).toBe(a);
      }
    });

    it(`${id} defines each id once and every id it refers to`, () => {
      for (const ctx of contexts) {
        const a = scene(ctx);
        const ids = [...a.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
        expect(new Set(ids).size).toBe(ids.length);
        for (const [, ref] of a.matchAll(/(?:url\(#|href="#)([^)"]+)/g)) expect(ids).toContain(ref);
      }
    });

    it(`${id} keeps its wide glows big enough for their blur (small lights get a halo)`, () => {
      for (const ctx of contexts) {
        for (const [el] of scene(ctx).matchAll(/<ellipse [^>]*filter="url\(#dr-blur-lg\)"[^>]*>/g)) {
          const r = (k: string) => Number(el.match(new RegExp(` ${k}="([\\d.]+)"`))?.[1]);
          expect(Math.min(r('rx'), r('ry')), el).toBeGreaterThanOrEqual(20);
        }
      }
    });

    it(`${id} moves only through classes the settings can stop`, () => {
      const a = scene(contexts[0]!);
      expect(a).not.toMatch(/<animate|<set\b/);
      const classes = [...a.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1]!.split(/\s+/)).filter((c) => c.startsWith('dr-'));
      for (const c of classes) expect(MOTION.has(c) || STAGE.has(c), c).toBe(true);
    });
  }

  it('every room has its illustration', () => {
    for (const loc of LOCATIONS) expect(hasScene(loc.art), loc.art).toBe(true);
  });

  it('every ending has its illustration, including the two whose triggers come later', () => {
    for (const id of Object.keys(EPILOGUES)) expect(hasScene(`ending.${id}`), id).toBe(true);
    for (const ending of ENDINGS) expect(hasScene(ending.art), ending.art).toBe(true);
  });

  it('Infinite Loop holds perfectly still, whatever the settings', () => {
    for (const ctx of contexts) expect(SCENES['ending.infinite']!(ctx)).not.toMatch(/class="[^"]*\bdr-(rain|drop|flicker|blink|breathe)\b/);
  });

  it('the wall clocks in the office and in Dan’s office follow the loop clock', () => {
    for (const id of ['office', 'pi']) expect(SCENES[id]!({ act: 1, minute: 0 }), id).not.toBe(SCENES[id]!({ act: 1, minute: 13 }));
  });

  it('rain on the roof still shows with motion off: some streaks are not animated', () => {
    const a = SCENES['roof']!({ act: 2, minute: 0 });
    const streaks = [...a.matchAll(/<line [^>]*stroke="#9fb7c9"[^>]*>/g)].map((m) => m[0]);
    expect(streaks.some((l) => l.includes('dr-rain'))).toBe(true);
    expect(streaks.filter((l) => !l.includes('dr-rain')).length).toBeGreaterThan(100);
  });

  it('the Kraken has eight ports numbered left to right; port 4 is bare until Act III brings her flask', () => {
    const ports = (act: 1 | 2 | 3) =>
      [...SCENES['synth']!({ act, minute: 0 }).matchAll(/<g class="kraken-port" data-port="(\d+)" data-holds="(\w+)">(.*?)<\/g>/g)].map(([, n, holds, body]) => {
        const tag = body!.match(/<text x="([\d.]+)"[^>]*>(\d+)<\/text>/)!;
        return { n: Number(n), holds, x: Number(tag[1]), label: Number(tag[2]) };
      });
    for (const act of [1, 2, 3] as const) {
      const p = ports(act);
      expect(p.map((q) => q.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(p.map((q) => q.label)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      for (let i = 1; i < p.length; i++) expect(p[i]!.x).toBeGreaterThan(p[i - 1]!.x);
    }
    for (const act of [1, 2] as const) {
      expect(ports(act).filter((q) => q.holds === 'none').map((q) => q.n)).toEqual([4]);
      expect(SCENES['synth']!({ act, minute: 0 })).not.toContain('synth-port4-foil');
    }
    const act3 = ports(3);
    expect(act3.find((q) => q.n === 4)?.holds).toBe('dark');
    expect(act3.filter((q) => q.holds === 'none')).toEqual([]);
    expect(act3.filter((q) => q.n !== 4).map((q) => q.holds)).toEqual(ports(1).filter((q) => q.n !== 4).map((q) => q.holds));
    expect(SCENES['synth']!({ act: 3, minute: 0 })).toContain('clip-path="url(#synth-port4-foil)"');
  });

  it('the glovebox meter reads the O₂ model, from green through amber to red', () => {
    const meter = (minute: number) => {
      const m = SCENES['glovebox']!({ act: 1, minute }).match(/class="gb-o2" data-level="(\w+)"[^>]*>([\d.]+)</);
      return { level: m?.[1], ppm: m?.[2] };
    };
    expect(meter(0)).toEqual({ level: 'green', ppm: o2At(0).toFixed(1) });
    expect(meter(31)).toEqual({ level: 'green', ppm: '8.0' });
    expect(meter(32)).toEqual({ level: 'amber', ppm: '8.2' });
    expect(meter(41)).toEqual({ level: 'amber', ppm: '10.0' });
    expect(meter(42)).toEqual({ level: 'red', ppm: '10.2' });
  });
});

describe('helpers', () => {
  it('seeded randomness is repeatable and in [0, 1)', () => {
    const a = seeded(hash('x'));
    const b = seeded(hash('x'));
    for (let i = 0; i < 100; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('rain is clipped to its pane and scales with area', () => {
    const small = rain('p', 0, 0, 100, 100);
    const big = rain('q', 0, 0, 600, 400);
    expect(small).toContain('clip-path="url(#clip-p)"');
    expect((big.match(/dr-rain/g) ?? []).length).toBeGreaterThan((small.match(/dr-rain/g) ?? []).length);
  });
});
