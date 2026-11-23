import { createHash } from 'node:crypto';
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

describe('Act III rooms (#64)', () => {
  /**
   * SHA-256 of every Act I and II render of these rooms (minutes 0, 13, 28
   * and 46, lit and dark) as they were before Act III got its own details.
   * Act III may change these rooms; Acts I and II may not.
   */
  const ACTS_1_2: Record<string, string> = {
    // The solvent cabinets' signs became UK warning triangles in v1.0.1 (#146).
    cold: 'c0fc3c209e60f92194926919fea97a80c78ef8a6ab89a4020a9638554ceb945c',
    glovebox: '4b564883a42c6573afd14da47b0790c4dabe7f33c655870ac8626414ae9df393',
    office: '7b49bd97b5239d9343143eaf0337a2f3bb79c75d113107fefd3e27f952fe438e',
    pi: '0e2b469b8320eb4d6de048397010c9fbee2fc3fff5f50ef65564fd9a7accbeb3',
    roof: '2219ae82a2c13dc17b5e3dba27b2cd6b66f1c9ebf450542d6e392f4f9815ea08',
    stairs: '545a2afdf09841dfb68e58dbf325506588e6ff1712a195793c263850d4bfd9df',
  };
  /** What each room's Act III hub text describes, by the `data-detail` its picture carries. */
  const DETAILS: Record<string, string[]> = {
    cold: ['frost-feathers'],
    glovebox: ['mini-frost'],
    office: ['tube-steady'],
    pi: ['paper-crooked'],
    roof: ['mist'],
    stairs: ['exit-out', 'exit-out', 'exit-above'],
  };
  const details = (svg: string) => [...svg.matchAll(/data-detail="([^"]+)"/g)].map((m) => m[1]).sort();

  it('Acts I and II render byte for byte as they did before', () => {
    for (const [id, expected] of Object.entries(ACTS_1_2)) {
      const parts: string[] = [];
      for (const act of [1, 2] as const) for (const minute of [0, 13, 28, 46]) for (const dark of [false, true]) parts.push(SCENES[id]!({ act, minute, dark }));
      expect(createHash('sha256').update(parts.join('\n')).digest('hex'), id).toBe(expected);
    }
  });

  it('each room shows what its Act III text describes, and only in Act III', () => {
    for (const [id, expected] of Object.entries(DETAILS)) {
      for (const dark of [false, true]) {
        expect(details(SCENES[id]!({ act: 3, minute: 20, dark })), id).toEqual(expected.slice().sort());
        for (const act of [1, 2] as const) expect(details(SCENES[id]!({ act, minute: 20, dark })), `${id} act ${act}`).toEqual([]);
      }
    }
  });

  it('the office’s dying tube stops flickering in Act III: steady, too white, and nothing in the room flickers', () => {
    for (const act of [1, 2] as const) expect(SCENES['office']!({ act, minute: 0 })).toContain('dr-flicker');
    const a = SCENES['office']!({ act: 3, minute: 0 });
    expect(a).not.toContain('dr-flicker');
    expect(a).toMatch(/<g class="dr-tube office-tube-steady" data-detail="tube-steady">/);
  });

  it('the stairwell’s two running men are out in Act III and cast no glow', () => {
    const signs = (act: 1 | 2 | 3) => (SCENES['stairs']!({ act, minute: 0 }).match(/fill="#2f9a5a"/g) ?? []).length;
    expect(signs(1)).toBe(2);
    expect(signs(2)).toBe(2);
    expect(signs(3)).toBe(0);
    const dead = [...SCENES['stairs']!({ act: 3, minute: 0 }).matchAll(/<g class="exit-sign" data-detail="exit-out"[^>]*>(.*?)<\/g>/g)].map((m) => m[1]!);
    expect(dead).toHaveLength(2);
    for (const sign of dead) expect(sign).not.toContain('dr-blur-lg');
  });

  it('on the roof the rain thins to a mist in Act III: far fewer falling streaks', () => {
    const streaks = (act: 1 | 2 | 3) => (SCENES['roof']!({ act, minute: 0 }).match(/class="dr-rain"/g) ?? []).length;
    expect(streaks(3)).toBeLessThan(streaks(2) / 3);
  });

  it('Dan’s framed paper hangs very slightly crooked in Act III, its brass plate still level', () => {
    const crooked = SCENES['pi']!({ act: 3, minute: 0 }).match(
      /<g class="framed-paper" data-detail="paper-crooked">.*?<g transform="rotate\(([\d.]+) [\d.]+ [\d.]+\)">(.*?)<\/g>(.*?)<\/g>/,
    );
    expect(crooked).not.toBeNull();
    const [, angle, frame, wall] = crooked!;
    expect(Number(angle)).toBeGreaterThan(0.5);
    expect(Number(angle)).toBeLessThan(3);
    expect(frame).toContain('fill="#e2dccb"');
    expect(frame).not.toContain('fill="#b8954f"');
    expect(wall).toContain('fill="#b8954f"');
    for (const act of [1, 2] as const) {
      const level = SCENES['pi']!({ act, minute: 0 }).match(/<g class="framed-paper">(.*?)<\/g>/)?.[1];
      expect(level).toContain('fill="#e2dccb"');
      expect(level).not.toContain('rotate(');
    }
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
