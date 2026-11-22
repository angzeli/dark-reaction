/**
 * Ending: Honest Noise. The write-up office some time after 03:34, still in
 * full November dark. Your monitor is still lit: the portal, a grey and noisy
 * spectrum with nothing in it, and "Submission received". A mug of tea
 * steams on the windowsill. Below, in the drizzle, the bus shelter is full
 * of light and nobody. Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../../types.ts';
import { C, circle, glow, group, hash, label, line, path, poly, rain, rect, seeded, stillRain, svg, tube } from '../../svg.ts';

const WIN = { x: 170, y: 90, w: 800, h: 560 };

/** What the window looks down on: the street, the lamp, the lit and empty shelter. */
function view(): string {
  const { x, y, w, h } = WIN;
  const street = y + h - 150;
  const rnd = seeded(hash('honest-windows'));
  const lit = Array.from({ length: 12 }, () => rect(x + 20 + rnd() * (w - 60), y + 200 + rnd() * 140, 10, 7, C.sodium, { opacity: 0.25 + rnd() * 0.25 }));
  return group(
    'view',
    `<clipPath id="honest-pane"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`,
    `<g clip-path="url(#honest-pane)">${[
      rect(x, y, w, h, 'url(#honest-sky)'),
      // Across the road: dark buildings, a few windows still lit.
      poly([[x, street], [x, y + 190], [x + 170, y + 190], [x + 170, y + 160], [x + 330, y + 160], [x + 330, street]], '#0c131b'),
      poly([[x + 330, street], [x + 330, y + 210], [x + 520, y + 210], [x + 520, street]], '#0a1118'),
      poly([[x + 520, street], [x + 520, y + 175], [x + 640, y + 175], [x + 640, y + 140], [x + w, y + 140], [x + w, street]], '#0d151d'),
      ...lit,
      // The road and the pavement, wet.
      rect(x, street, w, 150, '#11161d'),
      rect(x, street + 70, w, 6, '#1f2830'),
      glow(x + 300, street + 110, 260, 40, C.sodium, 0.22),
      // The street lamp.
      line(x + 280, street + 90, x + 280, y + 250, '#1e2a36', 6),
      path(`M${x + 280} ${y + 250} q 0 -24 36 -24 h 20`, 'none', { stroke: '#1e2a36', 'stroke-width': 6 }),
      rect(x + 330, y + 220, 36, 10, '#1e2a36', { rx: 3 }),
      glow(x + 348, y + 236, 90, 60, C.sodium, 0.45),
      // The bus shelter: full of light, and nobody in it.
      glow(x + 600, street + 70, 230, 90, '#f2e8c8', 0.35),
      rect(x + 456, street - 16, 298, 12, '#2a3540'),
      // The stop's flag on its pole.
      line(x + 440, street + 86, x + 440, street - 70, '#2a3540', 4),
      circle(x + 440, street - 80, 13, '#e8e8e8', { stroke: C.red, 'stroke-width': 5 }),
      rect(x + 424, street - 83, 32, 6, '#3f5f9a'),
      rect(x + 480, street - 2, 250, 86, '#f4ead0', { opacity: 0.85 }),
      rect(x + 480, street - 2, 250, 86, 'none', { stroke: '#2a3540', 'stroke-width': 4 }),
      line(x + 563, street - 2, x + 563, street + 84, '#2a3540', 3),
      line(x + 646, street - 2, x + 646, street + 84, '#2a3540', 3),
      rect(x + 496, street + 52, 150, 6, '#3d4853'),
      rect(x + 690, street + 4, 34, 74, '#cfe6f2', { opacity: 0.9 }),
      line(x + 470, street + 84, x + 740, street + 84, '#2a3540', 4),
      // Its light lying on the wet pavement.
      poly([[x + 480, street + 86], [x + 730, street + 86], [x + 780, street + 150], [x + 430, street + 150]], '#f4ead0', { opacity: 0.12 }),
      // The rain has thinned to a drizzle.
      stillRain('honest-drizzle', x, y, w, h, 60),
      rain('honest-window', x, y, w, h, 0.5),
    ].join('')}</g>`,
  );
}

function windowFrame(): string {
  const { x, y, w, h } = WIN;
  const frame = '#24313f';
  return group(
    'frame',
    rect(x - 12, y - 12, w + 24, 12, frame),
    rect(x - 12, y - 12, 12, h + 12, frame),
    rect(x + w, y - 12, 12, h + 12, frame),
    rect(x + w / 2 - 5, y, 10, h, frame),
    rect(x, y + 180, w, 8, frame),
    // The sill, deep enough for a mug.
    rect(x - 30, y + h, w + 60, 22, '#3b4c5d'),
    rect(x - 30, y + h + 22, w + 60, 10, '#1b2733'),
  );
}

/** Tea, made properly, steaming on the sill. */
function tea(): string {
  const x = 330;
  const sill = WIN.y + WIN.h;
  return group(
    'tea',
    path(`M${x} ${sill} v-62 h56 v62 z`, '#d9d2c4'),
    rect(x, sill - 62, 56, 8, '#ece6da'),
    path(`M${x + 56} ${sill - 50} q 26 2 0 30`, 'none', { stroke: '#d9d2c4', 'stroke-width': 8 }),
    rect(x + 8, sill - 52, 6, 46, '#ffffff', { opacity: 0.25 }),
    group(
      'dr-breathe',
      path(`M${x + 22} ${sill - 70} C ${x + 10} ${sill - 100}, ${x + 40} ${sill - 120}, ${x + 26} ${sill - 156} S ${x + 30} ${sill - 200}, ${x + 44} ${sill - 220}`, 'none', {
        stroke: '#e8edf0',
        'stroke-width': 5,
        'stroke-linecap': 'round',
        opacity: 0.35,
        filter: 'url(#dr-blur-sm)',
      }),
      path(`M${x + 36} ${sill - 72} C ${x + 46} ${sill - 104}, ${x + 22} ${sill - 126}, ${x + 38} ${sill - 160}`, 'none', {
        stroke: '#e8edf0',
        'stroke-width': 3,
        'stroke-linecap': 'round',
        opacity: 0.25,
        filter: 'url(#dr-blur-sm)',
      }),
    ),
  );
}

/** Your monitor, still lit: the portal, grey noise, and the receipt. */
function monitor(): string {
  const rnd = seeded(hash('honest-noise'));
  const sx = 1110;
  const sy = 330;
  const pts = Array.from({ length: 61 }, (_, i) => `${i ? 'L' : 'M'}${sx + 34 + i * 4} ${(sy + 150 + (rnd() - 0.5) * 16).toFixed(1)}`).join('');
  return group(
    'monitor',
    glow(sx + 150, sy + 110, 260, 180, C.screen, 0.14),
    rect(sx - 14, sy - 14, 328, 228, '#0e1319', { rx: 6 }),
    rect(sx, sy, 300, 200, '#dfe6ea'),
    rect(sx, sy, 300, 24, '#3f5f7a'),
    rect(sx + 10, sy + 8, 80, 8, '#dfe6ea', { opacity: 0.7 }),
    // The receipt.
    rect(sx + 20, sy + 38, 260, 30, '#d4ead9'),
    path(`M${sx + 32} ${sy + 53} l7 8 l14 -16`, 'none', { stroke: '#2f6a3a', 'stroke-width': 4 }),
    label(sx + 62, sy + 59, 'Submission received', 15, '#24402c'),
    // The spectrum: grey, noisy, nothing in it.
    rect(sx + 20, sy + 84, 260, 100, '#f4f6f7', { stroke: '#b9c3ca', 'stroke-width': 2 }),
    path(pts, 'none', { stroke: '#7d8890', 'stroke-width': 2 }),
    line(sx + 30, sy + 168, sx + 272, sy + 168, '#9aa5ad', 1.5),
    // Stand, desk, keyboard.
    rect(sx + 136, sy + 214, 28, 46, '#10161d'),
    rect(sx + 100, sy + 256, 100, 8, '#10161d'),
  );
}

export function endingHonest(ctx: ArtContext): string {
  const defs = `<defs><linearGradient id="honest-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04070c"/><stop offset="0.55" stop-color="#0d131c"/><stop offset="1" stop-color="#2a2218"/></linearGradient></defs>`;
  const room = group(
    'layer-bg',
    defs,
    rect(0, 0, 1600, 900, '#0f1c29'),
    rect(0, 0, 1600, 900, '#0b1622', { opacity: 0.5 }),
    // Desk along the right, the chair pushed back.
    rect(1040, 594, 560, 16, '#1c2937'),
    rect(1040, 594, 560, 3, '#2d4052'),
    rect(1060, 610, 12, 290, '#121b25'),
    rect(1180, 610, 150, 10, '#141d27', { rx: 3 }),
    rect(1380, 470, 120, 250, '#0d141c', { rx: 14 }),
    // The floor, and the window's light on it.
    rect(0, 760, 1600, 140, C.floor),
    poly([[160, 760], [990, 760], [1120, 900], [80, 900]], C.sodium, { opacity: 0.05 }),
  );
  return svg(
    'ending.honest',
    [room, group('layer-light', tube(1100, 46, 360, { on: true })), view(), windowFrame(), tea(), monitor()].join(''),
    { dark: ctx.dark ?? false },
  );
}
