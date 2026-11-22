/**
 * 4.14 Glovebox room, 02:47. The box has the small room to itself, like a
 * patient on a ward: a long steel body, a window you can look into but
 * never quite through, two black gloves hanging limp from their ports, the
 * O₂ meter on top (its digits follow the loop clock and turn amber, then
 * red, as the reading climbs), the main antechamber on its side, the taped
 * mini-antechamber and the laminated SOP on the wall.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import { O2_LIMIT, o2At } from '../../content/lab.ts';
import type { ArtContext } from '../types.ts';
import { C, circle, ellipse, glow, group, halo, hash, label, line, path, poly, rect, seeded, svg, tube } from '../svg.ts';

/** Meter colours and thresholds, matching the antechamber puzzle's readout. */
const METER = { green: C.tube, amber: '#e8c36a', red: '#ff7b6b' } as const;
const AMBER_FROM = 8;
const FROST = '#eef7fb';

function meterLevel(ppm: number): keyof typeof METER {
  return ppm > O2_LIMIT ? 'red' : ppm > AMBER_FROM ? 'amber' : 'green';
}

function room(): string {
  return group(
    'layer-bg',
    `<defs><linearGradient id="gb-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1622"/><stop offset="1" stop-color="#14263a"/></linearGradient>
      <linearGradient id="gb-glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#132432"/><stop offset="1" stop-color="#0a141c"/></linearGradient></defs>`,
    // A small room: back wall, side walls closing in, floor.
    poly([[0, 0], [1600, 0], [1470, 36], [130, 36]], '#09121b'),
    rect(130, 36, 1340, 654, 'url(#gb-wall)'),
    poly([[0, 0], [130, 36], [130, 690], [0, 790]], '#0b1620'),
    poly([[1600, 0], [1470, 36], [1470, 690], [1600, 790]], '#0b1620'),
    poly([[130, 690], [1470, 690], [1600, 790], [1600, 900], [0, 900], [0, 790]], C.floor),
    rect(130, 688, 1340, 4, '#1b2b3c'),
    // A wall rail, as on a ward.
    rect(130, 468, 1340, 7, '#17283a'),
    rect(130, 468, 1340, 2, '#22364b'),
  );
}

/** Pipes from the box to the ceiling, and the gas line along the wall. */
function services(): string {
  return group(
    'services',
    rect(470, 36, 14, 232, '#1d2a37'),
    rect(512, 36, 14, 232, '#1d2a37'),
    rect(466, 120, 22, 8, '#2a3846'),
    rect(508, 150, 22, 8, '#2a3846'),
    rect(1092, 36, 12, 266, '#1b2734'),
    rect(1088, 210, 20, 7, '#2a3846'),
    rect(130, 222, 1340, 5, '#16222e'),
  );
}

function sop(): string {
  // The laminated SOP beside the box, with Y.C.'s pencil at the bottom.
  const x = 214;
  const y = 252;
  const lines = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => rect(x + 9, y + 26 + i * 8.5, i % 3 === 2 ? 44 : 60, 2.4, '#4a4f55', { opacity: 0.5 }));
  return `<g class="sop" transform="rotate(-1.5 ${x + 40} ${y + 56})">${[
    rect(x - 3, y - 3, 86, 119, '#d9e4e6', { opacity: 0.12, rx: 4 }),
    rect(x, y, 80, 113, '#e3dccb', { opacity: 0.68 }),
    rect(x + 9, y + 9, 50, 7, '#2a3440', { opacity: 0.6 }),
    ...lines,
    path(`M${x + 12} ${y + 101} q6 -6 12 0 t12 0 l8 -9`, 'none', { stroke: '#5b5f66', 'stroke-width': 1.3, opacity: 0.8 }),
    line(x + 46, y + 89, x + 70, y + 95, '#5b5f66', 1.1, { opacity: 0.7 }),
    // Lamination sheen.
    poly([[x + 52, y], [x + 80, y], [x + 80, y + 22], [x + 26, y + 113], [x, y + 113], [x, y + 92]], '#ffffff', { opacity: 0.06 }),
    rect(x + 28, y - 6, 24, 10, '#d8cfb4', { opacity: 0.5 }),
  ].join('')}</g>`;
}

function logbook(): string {
  return group(
    'logbook',
    rect(206, 420, 98, 6, '#26323e'),
    rect(212, 426, 6, 12, '#1d2832'),
    rect(292, 426, 6, 12, '#1d2832'),
    rect(216, 404, 74, 16, '#1e3550', { rx: 2 }),
    rect(216, 404, 74, 3, '#2d4a68', { rx: 1 }),
    line(232, 400, 276, 397, '#b0b8c0', 2, { 'stroke-linecap': 'round', opacity: 0.7 }),
  );
}

/** A glove port: flange, bolts, the black hole of the sleeve. */
function gloveport(cx: number, cy: number): string {
  const bolts = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return circle(cx + Math.cos(a) * 41, cy + Math.sin(a) * 41, 2.2, '#5a6d7e');
  });
  return [circle(cx, cy, 47, '#3a4b5b'), circle(cx, cy, 47, 'none', { stroke: '#4d6173', 'stroke-width': 2 }), ...bolts, circle(cx, cy, 35, '#040609')].join('');
}

/**
 * A glove hanging limp from its port: the sleeve sags out of the port and
 * down the front of the box, and the hand hangs below it, fingers down.
 */
function glove(cx: number, cy: number, lean: number): string {
  const wx = cx + lean;
  const wy = cy + 128;
  // Fingers left to right: [left edge, right edge, length below the knuckles].
  const fingers: Array<[number, number, number]> = [
    [-20, -10, 30],
    [-9, 1, 36],
    [2, 12, 33],
    [13, 21, 24],
  ];
  const knuckle = wy + 46;
  const hand = fingers
    .map(([l, r, len], i) => {
      const tip = knuckle + len;
      const notch = i === 0 ? '' : `L${wx + l} ${knuckle + 4}`;
      return `${notch}L${wx + l} ${tip - 5}Q${wx + l} ${tip} ${wx + (l + r) / 2} ${tip}Q${wx + r} ${tip} ${wx + r} ${tip - 5}L${wx + r} ${knuckle + 4}`;
    })
    .join('');
  const d = [
    `M${cx - 34} ${cy}`,
    `C${cx - 40} ${cy + 50} ${wx - 28} ${cy + 96} ${wx - 22} ${wy}`,
    `C${wx - 24} ${wy + 12} ${wx - 28} ${wy + 22} ${wx - 27} ${wy + 30}`,
    // The thumb, folded in against the palm.
    `L${wx - 33} ${wy + 50}Q${wx - 35} ${wy + 58} ${wx - 28} ${wy + 56}L${wx - 20} ${knuckle}`,
    hand,
    `C${wx + 24} ${wy + 30} ${wx + 25} ${wy + 14} ${wx + 22} ${wy}`,
    `C${wx + 28} ${cy + 96} ${cx + 38} ${cy + 50} ${cx + 34} ${cy}`,
    'Z',
  ].join('');
  return (
    path(d, '#06080b') +
    path(`M${cx - 30} ${cy + 24}C${cx - 32} ${cy + 64} ${wx - 25} ${cy + 100} ${wx - 19} ${wy - 2}`, 'none', {
      stroke: '#2c3a47',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      opacity: 0.8,
    }) +
    path(`M${wx - 18} ${wy + 10}q18 5 36 0`, 'none', { stroke: '#1c252e', 'stroke-width': 1.5, opacity: 0.8 })
  );
}

function windowInside(): string {
  // What you can almost see: a shelf of bottles, a balance, a rack of vials.
  const s = '#1f3242';
  return group(
    'inside',
    rect(452, 400, 656, 4, s, { opacity: 0.8 }),
    ...[480, 506, 526, 556, 580].map((x, i) => rect(x, 400 - (22 + (i % 3) * 8), 16 + (i % 2) * 6, 22 + (i % 3) * 8, s, { rx: 3, opacity: 0.8 })),
    rect(980, 452, 92, 64, s, { opacity: 0.75 }),
    rect(990, 420, 72, 34, 'none', { stroke: s, 'stroke-width': 3, opacity: 0.8 }),
    rect(756, 494, 86, 18, s, { opacity: 0.8 }),
    ...[0, 1, 2, 3, 4, 5].map((i) => rect(762 + i * 13, 476, 7, 20, s, { opacity: 0.8 })),
  );
}

function box(ppm: number): string {
  const level = meterLevel(ppm);
  const colour = METER[level];
  const reading = ppm.toFixed(1);
  const bezelBolts = Array.from({ length: 13 }, (_, i) => 452 + i * 54).flatMap((x) => [circle(x, 327, 2.4, '#3b4c5d'), circle(x, 529, 2.4, '#3b4c5d')]);
  return [
    // Stand and the pump beneath it.
    rect(426, 556, 14, 134, '#1d2935'),
    rect(1122, 556, 14, 134, '#1d2935'),
    rect(426, 640, 710, 8, '#18232e'),
    rect(418, 684, 30, 6, '#141d27'),
    rect(1114, 684, 30, 6, '#141d27'),
    rect(690, 622, 170, 68, '#141c24', { rx: 6 }),
    rect(700, 632, 64, 48, '#1a242e', { rx: 4 }),
    ...[0, 1, 2, 3, 4].map((i) => line(778, 636 + i * 9, 846, 636 + i * 9, '#0f151b', 2)),
    circle(842, 630, 2.6, C.tube, { opacity: 0.8 }),
    // The long steel body.
    rect(398, 298, 764, 264, '#2a3846', { rx: 10 }),
    rect(398, 298, 764, 6, '#43576b', { rx: 3 }),
    rect(398, 548, 764, 14, '#1f2a36', { rx: 4 }),
    rect(424, 318, 712, 218, '#1b2733', { rx: 18 }),
    ...bezelBolts,
    rect(440, 334, 680, 186, 'url(#gb-glass)', { rx: 12 }),
    windowInside(),
    // Reflections: the ceiling tube smeared across the top, a sheen down the glass.
    rect(560, 344, 300, 4, '#cfe6f2', { opacity: 0.13, rx: 2 }),
    line(520, 512, 640, 342, '#ffffff', 16, { opacity: 0.025 }),
    line(980, 512, 1080, 360, '#ffffff', 8, { opacity: 0.03 }),
    // The blower housing on top, and the meter.
    rect(440, 262, 150, 38, '#222f3c', { rx: 4 }),
    ...[0, 1, 2].map((i) => line(452, 272 + i * 9, 578, 272 + i * 9, '#18222c', 2)),
    rect(790, 290, 20, 10, '#1b2631'),
    rect(696, 238, 208, 56, '#121a22', { rx: 6, stroke: '#2c3a48', 'stroke-width': 2 }),
    rect(708, 248, 184, 36, '#060c09', { rx: 3 }),
    group('dr-breathe', glow(800, 266, 110, 46, colour, 0.28)),
    label(716, 262, 'O₂', 10, colour, { opacity: 0.6 }),
    label(866, 279, 'ppm', 9, colour, { opacity: 0.55 }),
    `<text class="gb-o2" data-level="${level}" x="800" y="278" fill="${colour}" font-size="30" font-family="IBM Plex Mono, monospace" text-anchor="middle" letter-spacing="2">${reading}</text>`,
    // Regeneration overdue: a small amber light that won't stop.
    group('dr-blink', circle(886, 256, 2.8, METER.amber), halo(886, 256, 9, METER.amber, 0.5)),
  ].join('');
}

function antechamber(): string {
  return group(
    'antechamber',
    rect(1236, 500, 12, 190, '#1d2935'),
    rect(1226, 684, 32, 6, '#141d27'),
    rect(1160, 400, 182, 100, '#33434f'),
    rect(1160, 406, 182, 10, '#4b5e70', { opacity: 0.7 }),
    rect(1160, 482, 182, 18, '#25313c'),
    rect(1156, 390, 14, 120, '#3d4f61', { rx: 3 }),
    rect(1334, 388, 16, 124, '#3d4f61', { rx: 3 }),
    // The outer door and its wheel.
    ellipse(1352, 450, 14, 60, '#2e3c49'),
    ellipse(1358, 450, 7, 32, 'none', { stroke: '#6d8193', 'stroke-width': 3 }),
    line(1358, 418, 1358, 482, '#6d8193', 2),
    circle(1360, 450, 4, '#8a9aa8'),
    // Valves and the gauge on top.
    rect(1194, 376, 12, 24, '#3d4f61'),
    circle(1200, 372, 8, C.red, { opacity: 0.75 }),
    rect(1230, 376, 12, 24, '#3d4f61'),
    circle(1236, 372, 8, '#3f6a8a', { opacity: 0.85 }),
    rect(1283, 370, 7, 30, '#3d4f61'),
    circle(1286, 356, 18, '#c9d1d6', { opacity: 0.72 }),
    circle(1286, 356, 18, 'none', { stroke: '#2a3846', 'stroke-width': 3 }),
    line(1286, 356, 1274, 348, '#1b1f24', 2, { 'stroke-linecap': 'round' }),
    path('M1200 364 C 1200 320, 1260 300, 1320 300 L 1470 300', 'none', { stroke: '#151b21', 'stroke-width': 6 }),
  );
}

/**
 * Act III (glovebox.hub.act3): frost on the mini-antechamber's little window,
 * though nothing in the room is cold, and behind it something small and
 * upright standing very still (her J. Young tube, waiting on its rack).
 * Dark glass on a dark body never showed before; the frost makes it.
 */
function frostedWindow(): string {
  const rnd = seeded(hash('gb-mini-frost'));
  const [x, y, w, h] = [334, 480, 44, 15];
  const rime = Array.from({ length: 22 }, () => {
    const a = rnd() * Math.PI * 2;
    const r = 0.9 + rnd() * 0.25;
    return circle(x + w / 2 + Math.cos(a) * (w / 2) * r, y + h / 2 + Math.sin(a) * (h / 2) * r, 0.7 + rnd() * 1.2, FROST, { opacity: (0.45 + rnd() * 0.45).toFixed(2) });
  });
  return `<g class="mini-window" data-detail="mini-frost">${[
    `<clipPath id="gb-mini-glass"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/></clipPath>`,
    halo(x + w / 2, y + h / 2, 20, FROST, 0.12),
    rect(x - 2, y - 2, w + 4, h + 4, '#1f2a34', { rx: 6 }),
    `<g clip-path="url(#gb-mini-glass)">${[
      rect(x, y, w, h, '#1f2e3a'),
      // The tube behind the frost: a thin upright, its tap a little wider.
      rect(x + 24.5, y + 3, 2.6, 12, '#020507'),
      rect(x + 23.3, y + 1, 5, 3.4, '#020507', { rx: 1 }),
      rect(x + 17, y + 12.5, 18, 2.5, '#05090d'),
      rect(x, y, w, h, FROST, { opacity: 0.36 }),
      rect(x, y, w, h * 0.4, FROST, { opacity: 0.16 }),
      rect(x + 7, y + 3, w - 14, h - 6, '#0c151d', { opacity: 0.12, rx: 4 }),
    ].join('')}</g>`,
    ...rime,
  ].join('')}</g>`;
}

function miniAntechamber(frosted: boolean): string {
  // Small, sealed, and taped shut in someone's careful hand.
  return group(
    'mini',
    rect(300, 450, 100, 48, '#33434f'),
    rect(300, 454, 100, 6, '#4b5e70', { opacity: 0.6 }),
    rect(392, 442, 10, 64, '#3d4f61', { rx: 2 }),
    ellipse(300, 474, 9, 28, '#2e3c49'),
    circle(296, 474, 3, '#8a9aa8'),
    rect(284, 466, 30, 9, '#d8cfb4', { opacity: 0.78, transform: 'rotate(-58 299 470)' }),
    rect(284, 470, 30, 9, '#d8cfb4', { opacity: 0.72, transform: 'rotate(52 299 474)' }),
    frosted ? frostedWindow() : '',
    rect(322, 462, 66, 15, '#e4dcc4', { opacity: 0.85, transform: 'rotate(-3 355 469)' }),
    label(326, 473, 'DO NOT OPEN', 7.5, '#6e2a22', { transform: 'rotate(-3 355 469)', 'font-style': 'italic' }),
  );
}

function cylinder(): string {
  // The nitrogen cylinder chained to the wall.
  return group(
    'cylinder',
    rect(1392, 300, 52, 388, '#2c3940', { rx: 22 }),
    rect(1392, 300, 52, 60, '#1a2227', { rx: 22 }),
    rect(1408, 270, 20, 34, '#4a5762', { rx: 3 }),
    rect(1400, 262, 36, 10, '#5d6c78', { rx: 3 }),
    rect(1386, 404, 64, 5, '#3b4c5d'),
  );
}

export function glovebox(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  const ppm = o2At(ctx.minute);
  const body = [
    room(),
    group('layer-light', tube(620, 52, 360, { on: true, flicker: dim })),
    services(),
    sop(),
    logbook(),
    cylinder(),
    // The tube's light on the wall behind, and the box's shadow on the floor.
    glow(800, 230, 560, 190, C.tube, 0.06),
    glow(780, 700, 420, 40, C.tube, 0.05),
    ellipse(780, 694, 420, 14, C.shadow, { opacity: 0.45 }),
    box(ppm),
    antechamber(),
    miniAntechamber(dim),
    gloveport(640, 456),
    gloveport(920, 456),
    glove(640, 456, -6),
    glove(920, 456, 5),
  ];
  return svg('glovebox', body.join(''), { dark: ctx.dark ?? false });
}
