/**
 * Ending: Dark Reaction (the true ending). The NMR suite after 03:33 with
 * every light out except the console, alive on its UPS: green on black, the
 * spectrum from her tube. Solvent, the grease, the bump at 6.9 that is always
 * there, and at 8.41 a small, honest peak with its two carbon-13 satellites,
 * standing in real noise. The magnet is only a shape in the dark, catching a
 * little of the green. Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../../types.ts';
import { C, circle, ellipse, glow, group, halo, hash, label, line, path, poly, rect, seeded, svg } from '../../svg.ts';

const GREEN = C.tube;
const SCREEN = { x: 640, y: 190, w: 720, h: 440 };
/** The trace's frame on screen: 10 ppm at the left edge to 0 at the right, baseline at y. */
const TRACE = { left: 680, right: 1320, base: 560 };
const ppmX = (ppm: number) => TRACE.left + ((10 - ppm) / 10) * (TRACE.right - TRACE.left);

/** Lorentzian line shape: height h, half-width w (in drawing units). */
const peak = (x: number, center: number, h: number, w: number) => h / (1 + ((x - center) / w) ** 2);

function spectrum(): string {
  const rnd = seeded(hash('dark-noise'));
  const peaks = [
    { ppm: 8.41, h: 46, w: 1.6 },
    { ppm: 8.41 + 0.245, h: 9, w: 1.3 }, // carbon-13 satellites, either side, like a pair of commas
    { ppm: 8.41 - 0.245, h: 9, w: 1.3 },
    { ppm: 7.16, h: 230, w: 1.4 }, // the solvent's residual peak
    { ppm: 6.9, h: 24, w: 3.5 }, // the bump that is always there
    { ppm: 1.26, h: 92, w: 2.2 }, // grease
  ].map((p) => ({ ...p, x: ppmX(p.ppm) }));
  const pts: string[] = [];
  for (let x = TRACE.left; x <= TRACE.right; x += 1.25) {
    let y = TRACE.base + (rnd() - 0.5) * 7;
    for (const p of peaks) y -= peak(x, p.x, p.h, p.w);
    pts.push(`${pts.length ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(1)}`);
  }
  const ticks = Array.from({ length: 11 }, (_, i) => line(ppmX(10 - i), TRACE.base + 22, ppmX(10 - i), TRACE.base + 30, GREEN, 2, { opacity: 0.5 }));
  const x841 = ppmX(8.41);
  return group(
    'spectrum',
    line(TRACE.left, TRACE.base + 22, TRACE.right, TRACE.base + 22, GREEN, 1.5, { opacity: 0.5 }),
    ...ticks,
    path(pts.join(''), 'none', { stroke: GREEN, 'stroke-width': 2.2, 'stroke-linejoin': 'round', opacity: 0.95 }),
    // Exactly where her reference said: a small caret, and the number.
    path(`M${x841 - 9} ${TRACE.base - 104} l9 12 l9 -12`, 'none', { stroke: GREEN, 'stroke-width': 2.5 }),
    label(x841 - 24, TRACE.base - 114, '8.41', 18, GREEN),
  );
}

function consoleOnUps(): string {
  const { x, y, w, h } = SCREEN;
  return group(
    'console',
    // The only light in the building, breathing a little on its battery.
    group('dr-breathe', glow(x + w / 2, y + h / 2, 470, 300, GREEN, 0.09), glow(x + w / 2, y + h / 2 + 40, 300, 200, GREEN, 0.09)),
    rect(x - 16, y - 16, w + 32, h + 32, '#0b1014', { rx: 8 }),
    rect(x, y, w, h, '#030806'),
    rect(x, y, w, 34, '#071a10'),
    label(x + 18, y + 23, 'PROTON_DARK · 13', 16, GREEN, { opacity: 0.75 }),
    label(x + w - 80, y + 23, '03:34', 16, GREEN, { opacity: 0.9 }),
    spectrum(),
    // The desk, the keyboard, the edge of the screen's light on them.
    rect(x - 120, y + h + 72, w + 240, 16, '#0a0f12'),
    rect(x - 120, y + h + 72, w + 240, 2, GREEN, { opacity: 0.25 }),
    rect(x + w / 2 - 20, y + h + 16, 40, 58, '#070a0c'),
    poly([[x + 180, y + h + 64], [x + w - 180, y + h + 64], [x + w - 170, y + h + 76], [x + 170, y + h + 76]], '#0d1316'),
  );
}

/** The UPS under the desk: on battery, and saying so. */
function ups(): string {
  return group(
    'ups',
    rect(1400, 680, 110, 150, '#080c0f', { rx: 4 }),
    rect(1400, 680, 110, 2, GREEN, { opacity: 0.2 }),
    group('dr-blink', halo(1428, 708, 10, '#e8c36a', 0.6), circle(1428, 708, 3.5, '#e8c36a')),
    circle(1450, 708, 3, GREEN, { opacity: 0.8 }),
  );
}

/** The magnet: only a shape, its near flank catching a little of the green. */
function magnet(): string {
  return group(
    'magnet',
    rect(180, 320, 300, 330, '#06090b', { rx: 22 }),
    ellipse(330, 322, 150, 16, '#080c0e'),
    path('M480 342 v290', 'none', { stroke: GREEN, 'stroke-width': 3, opacity: 0.22 }),
    path('M472 336 q 8 2 8 10', 'none', { stroke: GREEN, 'stroke-width': 2, opacity: 0.2 }),
    rect(250, 250, 160, 18, '#06090b', { rx: 6 }),
    rect(310, 266, 40, 56, '#06090b'),
    poly([[226, 650], [248, 650], [240, 780], [218, 780]], '#05080a'),
    poly([[412, 650], [434, 650], [444, 780], [422, 780]], '#05080a'),
    line(444, 700, 444, 780, GREEN, 2, { opacity: 0.12 }),
  );
}

export function endingDark(ctx: ArtContext): string {
  const room = group(
    'layer-bg',
    rect(0, 0, 1600, 900, '#020405'),
    // The floor, faintly green where the screen reaches it.
    rect(0, 780, 1600, 120, '#030607'),
    glow(1000, 800, 520, 50, GREEN, 0.06),
  );
  // The chair, pushed back, between you and the screen.
  const chair = group('chair', rect(540, 560, 150, 210, '#040607', { rx: 18 }), rect(600, 770, 20, 80, '#040607'), path('M540 860 l70 -18 l70 18', 'none', { stroke: '#040607', 'stroke-width': 10 }));
  return svg('ending.dark', [room, magnet(), consoleOnUps(), ups(), chair].join(''), { dark: ctx.dark ?? false });
}
