import { describe, expect, it } from 'vitest';
import { SCENES } from '../src/art/scenes/index.ts';
import { hash, rain, seeded } from '../src/art/svg.ts';
import type { ArtContext } from '../src/art/types.ts';

const contexts: ArtContext[] = [
  { act: 1, minute: 0 },
  { act: 2, minute: 28 },
  { act: 3, minute: 46, dark: true },
];

describe('scenes', () => {
  for (const [id, scene] of Object.entries(SCENES)) {
    it(`${id} renders a decorative SVG for every act, deterministically`, () => {
      for (const ctx of contexts) {
        const a = scene(ctx);
        expect(a.startsWith('<svg')).toBe(true);
        expect(a).toContain(`data-art="${id}"`);
        expect(a).toContain('aria-hidden="true"');
        expect(a).not.toMatch(/NaN|undefined/);
        expect(scene(ctx)).toBe(a);
      }
    });
  }

  it('the office clock follows the loop clock', () => {
    expect(SCENES['office']!({ act: 1, minute: 0 })).not.toBe(SCENES['office']!({ act: 1, minute: 13 }));
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
