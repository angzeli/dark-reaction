/**
 * Ending: Perfect Spectrum. A copy of the printout pinned to the lab
 * noticeboard, Tom's biro crown over its one tall peak and FINALLY beside
 * it. One peak with nothing either side of it, on a baseline as flat as a
 * held breath: no solvent peak, no carbon-13 satellites. Everything else on
 * the board is a little crooked and a little faded; the printout is square,
 * bright and pinned at all four corners. Warm, and slightly too neat.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../../types.ts';
import { C, circle, glow, group, hash, label, line, path, poly, rect, seeded, svg } from '../../svg.ts';

const BOARD = { x: 150, y: 90, w: 1300, h: 720 };
const SHEET = { x: 470, y: 200, w: 660, h: 460 };
const BIRO = '#2f4a8f';

function pin(x: number, y: number, colour: string): string {
  return circle(x + 2, y + 4, 8, '#000000', { opacity: 0.3 }) + circle(x, y, 8, colour) + circle(x - 2.5, y - 2.5, 2.4, '#ffffff', { opacity: 0.55 });
}

function board(): string {
  const rnd = seeded(hash('perfect-cork'));
  const flecks = Array.from({ length: 420 }, () =>
    circle(BOARD.x + rnd() * BOARD.w, BOARD.y + rnd() * BOARD.h, 1 + rnd() * 2, rnd() < 0.5 ? '#3f2e20' : '#7a5c40', { opacity: 0.35 }),
  );
  return group(
    'board',
    rect(BOARD.x - 22, BOARD.y - 22, BOARD.w + 44, BOARD.h + 44, '#2b2119'),
    rect(BOARD.x - 22, BOARD.y - 22, BOARD.w + 44, 6, '#45362a'),
    rect(BOARD.x, BOARD.y, BOARD.w, BOARD.h, '#5a4330'),
    ...flecks,
    // Old pinholes where notices used to be.
    ...Array.from({ length: 30 }, () => circle(BOARD.x + rnd() * BOARD.w, BOARD.y + rnd() * BOARD.h, 1.6, '#2a1d12', { opacity: 0.6 })),
  );
}

/** The board's ordinary mess: every notice a little crooked and a little faded. */
function notices(): string {
  const sheet = (x: number, y: number, w: number, h: number, tilt: number, body: string[], pinColour: string, fill = '#cfc6b2') =>
    `<g transform="rotate(${tilt} ${x + w / 2} ${y + h / 2})">${[
      rect(x + 4, y + 6, w, h, '#000000', { opacity: 0.25 }),
      rect(x, y, w, h, fill, { opacity: 0.62 }),
      ...body,
      pin(x + w / 2, y + 12, pinColour),
    ].join('')}</g>`;
  const lines = (x: number, y: number, n: number, w: number, step = 13) =>
    Array.from({ length: n }, (_, i) => rect(x, y + i * step, i % 4 === 3 ? w * 0.55 : w, 3, '#3d434a', { opacity: 0.45 }));
  return group(
    'notices',
    // The fire procedure, its green header gone pale.
    sheet(196, 130, 210, 290, -3, [rect(208, 146, 186, 30, '#3f7a52', { opacity: 0.7 }), ...lines(212, 196, 12, 170)], C.red),
    // A seminar poster from last term.
    sheet(198, 470, 230, 300, 4, [rect(212, 488, 202, 120, '#4a5a6e', { opacity: 0.6 }), rect(212, 622, 160, 12, '#3d434a', { opacity: 0.6 }), ...lines(212, 650, 7, 190)], '#3f6a8a', '#d8cfb9'),
    // The rota, ticked in three colours.
    sheet(1170, 128, 250, 250, 2.5, [
      ...Array.from({ length: 7 }, (_, i) => line(1182, 160 + i * 30, 1408, 160 + i * 30, '#3d434a', 1.5, { opacity: 0.5 })),
      ...Array.from({ length: 4 }, (_, i) => line(1240 + i * 50, 150, 1240 + i * 50, 362, '#3d434a', 1.5, { opacity: 0.5 })),
      ...[0, 1, 2, 3, 4, 5].map((i) => path(`M${1252 + (i % 3) * 50} ${172 + i * 30} l6 7 l12 -14`, 'none', { stroke: [BIRO, C.red, '#2f6a3a'][i % 3]!, 'stroke-width': 3 })),
    ], '#b89a3a'),
    // A postcard of somewhere warm, and Post-its.
    sheet(1196, 430, 210, 140, -5, [rect(1206, 440, 190, 120, '#6b7f8a', { opacity: 0.7 }), rect(1206, 500, 190, 60, '#8a7a5a', { opacity: 0.6 })], C.red, '#e8e2d2'),
    sheet(1220, 612, 86, 86, 7, [...lines(1230, 632, 4, 64, 14)], '#3f6a8a', '#d8c04a'),
    sheet(1318, 640, 86, 86, -4, [...lines(1328, 660, 4, 60, 14)], C.red, '#9fc4a8'),
  );
}

/** The spectrum: one tall clean peak, and nothing else at all. */
function printout(): string {
  const { x, y, w, h } = SHEET;
  const left = x + 50;
  const right = x + w - 40;
  const base = y + h - 92;
  const px = x + 296; // 8.41 ppm on its axis
  const top = y + 92;
  // A Lorentzian, sampled: tall, narrow, symmetrical, perfect.
  const pts: string[] = [];
  for (let i = -40; i <= 40; i++) {
    const dx = i * 1.5;
    const yv = base - (base - top) / (1 + (dx / 3.2) ** 2);
    pts.push(`${i === -40 ? 'M' : 'L'}${(px + dx).toFixed(1)} ${yv.toFixed(1)}`);
  }
  const ticks = Array.from({ length: 11 }, (_, i) => line(left + i * ((right - left) / 10), base + 18, left + i * ((right - left) / 10), base + 26, '#2c2a28', 2));
  return group(
    'printout',
    glow(x + w / 2, y + h / 2, 420, 300, '#f2c27a', 0.14),
    rect(x + 5, y + 8, w, h, '#000000', { opacity: 0.3 }),
    rect(x, y, w, h, '#f1ebdd'),
    // Header: experiment, holder, and a timestamp nobody asks about.
    rect(x + 36, y + 30, 230, 10, '#2c2a28', { opacity: 0.7 }),
    rect(x + 36, y + 50, 150, 6, '#2c2a28', { opacity: 0.4 }),
    label(x + w - 150, y + 44, '03:33:00', 16, '#2c2a28', { opacity: 0.6 }),
    // The baseline, as flat as a held breath, and the peak.
    line(left, base, px - 60, base, '#1d1c1b', 3),
    path(pts.join(''), 'none', { stroke: '#1d1c1b', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
    line(px + 60, base, right, base, '#1d1c1b', 3),
    // The ppm axis.
    line(left, base + 18, right, base + 18, '#2c2a28', 2),
    ...ticks,
    rect(px - 20, base + 40, 40, 6, '#2c2a28', { opacity: 0.45 }),
    // Four pins, one in each corner, exactly.
    pin(x + 16, y + 16, '#c9a227'),
    pin(x + w - 16, y + 16, '#c9a227'),
    pin(x + 16, y + h - 16, '#c9a227'),
    pin(x + w - 16, y + h - 16, '#c9a227'),
  );
}

/** Tom, in blue biro: a small crown on the peak, and the word. */
function toms(): string {
  const cx = SHEET.x + 296;
  const cy = SHEET.y + 70;
  const crown = `M${cx - 30} ${cy + 8} L${cx - 34} ${cy - 22} L${cx - 15} ${cy - 6} L${cx} ${cy - 30} L${cx + 15} ${cy - 6} L${cx + 34} ${cy - 22} L${cx + 30} ${cy + 8} Z`;
  return group(
    'tom',
    path(crown, 'none', { stroke: BIRO, 'stroke-width': 4, 'stroke-linejoin': 'round', opacity: 0.9 }),
    circle(cx - 34, cy - 26, 4, BIRO, { opacity: 0.9 }),
    circle(cx, cy - 34, 4, BIRO, { opacity: 0.9 }),
    circle(cx + 34, cy - 26, 4, BIRO, { opacity: 0.9 }),
    `<text x="${cx + 60}" y="${cy + 66}" fill="${BIRO}" font-size="46" font-family="Source Serif 4, serif" font-style="italic" font-weight="600" letter-spacing="2" opacity="0.92" transform="rotate(-8 ${cx + 60} ${cy + 66})">FINALLY</text>`,
    path(`M${cx + 64} ${cy + 80} q 110 -22 222 -34`, 'none', { stroke: BIRO, 'stroke-width': 3.5, 'stroke-linecap': 'round', opacity: 0.85 }),
  );
}

export function endingPerfect(ctx: ArtContext): string {
  const wall = group(
    'layer-bg',
    rect(0, 0, 1600, 900, '#1d1916'),
    // Warm light from above, a little too kind.
    glow(800, 300, 760, 420, '#f2c27a', 0.1),
    poly([[0, 900], [1600, 900], [1600, 850], [0, 850]], '#141110'),
  );
  return svg('ending.perfect', [wall, board(), notices(), printout(), toms()].join(''), { dark: ctx.dark ?? false });
}
