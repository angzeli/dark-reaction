/**
 * B12 NMR suite, 02:47. A basement room with no windows: the 400 MHz
 * magnet, a pale drum on its legs with the autosampler carousel on top
 * (holder 13 is the empty one) and its ladder folded against its side; the
 * helium compressor behind it with its LED keeping time; the printer; the
 * console, the brightest thing in the basement; Ian's laminated signs.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, ellipse, glow, group, halo, hash, line, path, poly, rect, seeded, svg, tube } from '../svg.ts';

/** A laminated A4 sign: a header bar, lines of capitals, a sheen. */
function sign(x: number, y: number, w: number, h: number, opts: { tilt?: number; header?: string; rows?: number } = {}): string {
  const { tilt = 0, header = C.red, rows = 5 } = opts;
  const lines = Array.from({ length: rows }, (_, i) => rect(x + 7, y + 22 + i * 8, i % 2 ? w * 0.5 : w * 0.74, 2.6, '#3d434a', { opacity: 0.55 }));
  return `<g transform="rotate(${tilt} ${x + w / 2} ${y + h / 2})">${[
    rect(x - 2, y - 2, w + 4, h + 4, '#d9e4e6', { opacity: 0.1, rx: 3 }),
    rect(x, y, w, h, '#e3dccb', { opacity: 0.5 }),
    rect(x + 5, y + 6, w - 10, 10, header, { opacity: 0.7 }),
    ...lines,
    poly([[x + w * 0.6, y], [x + w, y], [x + w, y + h * 0.2], [x + w * 0.3, y + h], [x, y + h], [x, y + h * 0.82]], '#ffffff', { opacity: 0.06 }),
  ].join('')}</g>`;
}

function room(dim: boolean): string {
  const joints = Array.from({ length: 13 }, (_, i) => line(0, 168 + i * 40, 1600, 168 + i * 40, '#0a1520', 1.5, { opacity: 0.5 }));
  return [
    group(
      'layer-bg',
      `<defs><linearGradient id="nmr-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#09121b"/><stop offset="1" stop-color="#11202e"/></linearGradient>
        <linearGradient id="nmr-magnet" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#303b45"/><stop offset="0.4" stop-color="#4a5762"/><stop offset="0.8" stop-color="#687680"/><stop offset="1" stop-color="#5a6873"/></linearGradient></defs>`,
      rect(0, 0, 1600, 700, 'url(#nmr-wall)'),
      ...joints,
      rect(0, 690, 1600, 210, C.floor),
      rect(0, 688, 1600, 4, '#1b2b3c'),
      // Services along the ceiling.
      rect(0, 86, 1600, 16, '#141e28'),
      rect(0, 108, 1600, 9, '#121b25'),
      rect(0, 130, 1600, 6, '#18232f'),
      ...[180, 520, 860, 1200, 1540].map((x) => rect(x, 102, 4, 30, '#18232f')),
      // The 5-gauss line on the floor.
      ellipse(660, 752, 340, 36, 'none', { stroke: '#b89a3a', 'stroke-width': 4, 'stroke-dasharray': '22 14', opacity: 0.2 }),
    ),
    group('layer-light', tube(330, 46, 300, { on: !dim }), tube(1000, 46, 300, { on: false })),
  ].join('');
}

function door(): string {
  return group(
    'door',
    rect(64, 318, 142, 372, '#16212c'),
    rect(74, 328, 122, 362, '#1a2734'),
    rect(104, 360, 52, 96, '#0d1822'),
    line(104, 408, 156, 408, '#1a2734', 2),
    rect(176, 506, 8, 30, '#3b4c5d', { rx: 2 }),
    // The running man, forever on his way out.
    rect(96, 282, 78, 24, '#0e2a1c', { rx: 2 }),
    glow(135, 294, 66, 44, C.tube, 0.22),
    rect(104, 288, 62, 12, C.tube, { opacity: 0.5 }),
    // Ian's number, by the door.
    sign(222, 404, 52, 66, { tilt: 2, header: '#2a3440', rows: 4 }),
  );
}

function compressor(): string {
  const slats = Array.from({ length: 10 }, (_, i) => line(318, 566 + i * 10, 454, 566 + i * 10, '#0f161d', 2));
  return group(
    'compressor',
    rect(300, 470, 172, 220, '#18222c', { rx: 6 }),
    rect(300, 470, 172, 6, '#26333f', { rx: 3 }),
    rect(318, 488, 84, 40, '#0d1419', { rx: 3 }),
    rect(326, 498, 40, 10, C.tube, { opacity: 0.25 }),
    ...slats,
    // Tom's Post-it, from years ago.
    rect(412, 534, 34, 30, '#c9b458', { opacity: 0.55, transform: 'rotate(6 429 549)' }),
    // The LED keeps time with the cryocooler.
    group('dr-blink', halo(446, 500, 12, C.tube, 0.55), circle(446, 500, 4, C.tube)),
  );
}

/** Braided helium lines from the compressor up to the cold head on the magnet. */
function heliumLines(): string {
  const hose = (d: string) =>
    path(d, 'none', { stroke: '#2f3a45', 'stroke-width': 8, 'stroke-linecap': 'round' }) +
    path(d, 'none', { stroke: '#5b6b7a', 'stroke-width': 1.5, 'stroke-dasharray': '3 4', opacity: 0.6 });
  return group('helium', hose('M436 474 C 438 396, 500 330, 572 308'), hose('M456 474 C 460 408, 512 344, 572 324'));
}

/**
 * The autosampler on top of the magnet: a ring of spinners and tubes, the
 * front row left to right with one holder empty (13, the booked one).
 */
function carousel(cx: number, cy: number): string {
  const rnd = seeded(hash('nmr-carousel'));
  const caps = ['#c9d3da', '#c9d3da', '#4f78a0', '#c9d3da', '#b89a3a'];
  const holder = (x: number, y: number, h: number, back: boolean) =>
    rect(x - 2.5, y - 4, 5, 5, '#141a20') +
    line(x, y - 4, x, y - 4 - h, '#cfe6ee', 1.6, { opacity: back ? 0.25 : 0.45 }) +
    rect(x - 2, y - 8 - h, 4, 4, caps[Math.floor(rnd() * caps.length)]!, { opacity: back ? 0.35 : 0.7 });
  const back: string[] = [];
  const front: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i + 0.5) * (Math.PI / 12);
    back.push(holder(cx + Math.cos(a) * 60, cy - Math.sin(a) * 7, 13 + Math.floor(rnd() * 3), true));
  }
  const n = 15;
  const empty = 9;
  for (let i = 0; i < n; i++) {
    const a = Math.PI - (i + 0.5) * (Math.PI / n);
    const x = cx + Math.cos(a) * 66;
    const y = cy + Math.sin(a) * 9 + 3;
    front.push(i === empty ? ellipse(x, y - 2, 3, 1.4, '#05090d') : holder(x, y, 14 + Math.floor(rnd() * 3), false));
  }
  return [
    rect(cx - 22, cy + 8, 44, 50, '#2f3a44', { rx: 3 }),
    rect(cx - 22, cy + 8, 6, 50, '#38444f'),
    ellipse(cx, cy + 9, 78, 13, '#232d36'),
    rect(cx - 78, cy, 156, 9, '#232d36'),
    ellipse(cx, cy, 78, 13, '#3c4853'),
    ellipse(cx, cy, 58, 8, '#323d47'),
    ...back,
    ...front,
    group('dr-blink', circle(cx + 30, cy + 30, 2.2, C.tube)),
  ].join('');
}

function magnet(): string {
  const cx = 660;
  const top = 340;
  return group(
    'magnet',
    // Legs, on their dampers.
    poly([[572, 590], [590, 590], [582, 680], [564, 680]], '#2b3742'),
    poly([[730, 590], [748, 590], [756, 680], [738, 680]], '#33404c'),
    rect(551, 676, 42, 14, '#1f2933', { rx: 3 }),
    rect(727, 676, 42, 14, '#232e38', { rx: 3 }),
    // The probe underneath, and its cable to the console.
    rect(606, 596, 108, 28, '#3d4954', { rx: 6 }),
    rect(642, 622, 36, 40, '#28323c', { rx: 4 }),
    path('M678 650 C 720 666, 760 678, 900 684 L 1000 686', 'none', { stroke: '#121920', 'stroke-width': 5 }),
    // The cryostat: a pale drum taller than you, lit from the console's side.
    rect(548, top, 224, 262, 'url(#nmr-magnet)', { rx: 18 }),
    ellipse(cx, top + 1, 111, 13, '#66747f'),
    ellipse(cx, top + 1, 111, 13, 'none', { stroke: '#7d8b95', 'stroke-width': 1.5, opacity: 0.6 }),
    rect(548, top + 44, 224, 3, '#252f38', { opacity: 0.4 }),
    rect(548, top + 214, 224, 3, '#252f38', { opacity: 0.4 }),
    rect(624, top + 108, 72, 20, '#242e37', { rx: 2 }),
    rect(632, top + 115, 34, 5, '#7d8b95', { opacity: 0.45 }),
    // The field warning every magnet wears.
    poly([[720, top + 72], [736, top + 100], [704, top + 100]], '#c9a227', { opacity: 0.75, stroke: '#1a1a14', 'stroke-width': 2, 'stroke-linejoin': 'round' }),
    rect(718, top + 82, 4, 10, '#1a1a14'),
    // Turret, and the cold head the helium lines feed.
    rect(744, top - 30, 16, 32, '#5f6d78'),
    rect(741, top - 35, 22, 7, '#74828c', { rx: 2 }),
    rect(568, top - 50, 34, 52, '#4c5964', { rx: 4 }),
    ellipse(585, top - 50, 17, 5, '#5f6d78'),
    carousel(cx + 6, top - 66),
  );
}

function ladder(): string {
  // Folded, leaning against the magnet's side.
  const y0 = 690;
  const y1 = 382;
  const rail = (foot: number, head: number, dy: number) => line(foot, y0, head, y1 + dy, '#76838f', 6, { 'stroke-linecap': 'round' });
  const rungs = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 1) / 7;
    return line(478 + 60 * t, y0 + (y1 - y0) * t, 500 + 54 * t, y0 + (y1 + 4 - y0) * t, '#6c7884', 4);
  });
  return group('ladder', rail(478, 538, 0), rail(500, 554, 4), ...rungs, rect(534, y1 - 8, 26, 10, '#87949e', { rx: 2, transform: `rotate(10 547 ${y1 - 3})` }));
}

function printer(): string {
  return group(
    'printer',
    rect(826, 600, 128, 10, '#1c2733'),
    rect(834, 610, 8, 80, '#121b25'),
    rect(938, 610, 8, 80, '#121b25'),
    rect(838, 548, 106, 52, '#26313c', { rx: 5 }),
    rect(838, 548, 106, 5, '#33414e', { rx: 2 }),
    rect(852, 538, 78, 12, '#d8d2c0', { opacity: 0.55, transform: 'rotate(-3 891 544)' }),
    rect(846, 584, 90, 8, '#1b242e', { rx: 2 }),
    circle(930, 566, 2.4, C.tube, { opacity: 0.8 }),
  );
}

function screen(): string {
  // A spectrum that is mostly noise, and the queue down the side.
  const rnd = seeded(hash('nmr-screen'));
  const pts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const x = 1060 + i * 2;
    const peak = i === 22 ? 18 : i === 47 ? 30 : i === 48 ? 12 : 0;
    const y = 536 - peak - rnd() * 4;
    pts.push(`${i === 0 ? 'M' : 'L'}${x} ${y.toFixed(1)}`);
  }
  const rows = Array.from({ length: 7 }, (_, i) =>
    rect(1214, 440 + i * 12, i === 4 ? 36 : 28 + Math.floor(rnd() * 8), 4, C.tube, { opacity: i === 4 ? 0.9 : 0.3 }),
  );
  return [
    rect(1052, 420, 206, 136, '#050b07'),
    rect(1052, 420, 206, 12, '#0d1f14'),
    rect(1058, 424, 50, 4, C.tube, { opacity: 0.5 }),
    path(pts.join(''), 'none', { stroke: C.tube, 'stroke-width': 1.4, opacity: 0.85 }),
    line(1060, 540, 1204, 540, C.tube, 1, { opacity: 0.25 }),
    rect(1210, 436, 1, 112, C.tube, { opacity: 0.2 }),
    ...rows,
    rect(1210, 486, 46, 10, C.tube, { opacity: 0.12 }),
  ].join('');
}

function consoleDesk(): string {
  return group(
    'console',
    group('dr-breathe', glow(1155, 480, 320, 210, C.tube, 0.14), glow(1155, 488, 160, 115, C.tube, 0.18)),
    poly([[1000, 692], [1310, 692], [1420, 900], [900, 900]], C.tube, { opacity: 0.035 }),
    // Ian's signs above the console.
    sign(1004, 246, 74, 100, { tilt: -1.5 }),
    sign(1094, 258, 74, 96, { tilt: 1, header: '#b89a3a', rows: 6 }),
    sign(1184, 250, 60, 80, { tilt: -0.5, header: '#2a3440', rows: 4 }),
    // Desk, monitor, keyboard.
    rect(970, 600, 360, 14, '#1c2937'),
    rect(970, 600, 360, 3, '#2d4052'),
    rect(980, 614, 12, 76, '#121b25'),
    rect(1308, 614, 12, 76, '#121b25'),
    rect(1144, 566, 22, 34, '#10161d'),
    rect(1110, 596, 90, 6, '#10161d'),
    rect(1040, 408, 230, 160, '#0e1319', { rx: 6 }),
    screen(),
    rect(1076, 604, 150, 9, '#141d27', { rx: 3 }),
    ellipse(1256, 607, 10, 5, '#141d27'),
    // Ian's quick-reference card, taped to the bezel.
    rect(1236, 432, 30, 42, '#ded6c0', { opacity: 0.7, transform: 'rotate(4 1251 453)' }),
    rect(1240, 438, 20, 3, '#3d434a', { opacity: 0.5, transform: 'rotate(4 1251 453)' }),
    // The chair, pushed back. Still warm.
    rect(1104, 566, 112, 144, '#0d141c', { rx: 14 }),
    rect(1120, 700, 80, 14, '#0a1016'),
    rect(1154, 714, 12, 60, '#0a1016'),
    path('M1104 790 l56 -16 l56 16', 'none', { stroke: '#0a1016', 'stroke-width': 8 }),
  );
}

function rack(): string {
  // The spectrometer's electronics, a few lights on.
  const leds = [0, 1, 2, 3, 4, 5].map((i) => circle(1366 + (i % 2) * 14, 400 + Math.floor(i / 2) * 16, 2, i === 3 ? '#e8c36a' : C.tube, { opacity: 0.7 }));
  const vents = [0, 1, 2, 3, 4, 5, 6].map((i) => line(1360, 470 + i * 26, 1432, 470 + i * 26, '#0c1218', 2));
  return group('rack', rect(1346, 330, 100, 360, '#121a22', { rx: 4 }), rect(1356, 384, 80, 56, '#0b1117', { rx: 3 }), ...leds, ...vents);
}

export function nmr(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  // Ian's field warning, over the compressor.
  const warning = sign(330, 268, 72, 90, { tilt: -1, header: '#c9a227', rows: 5 });
  return svg(
    'nmr',
    [room(dim), door(), warning, compressor(), heliumLines(), magnet(), ladder(), printer(), rack(), consoleDesk()].join(''),
    { dark: ctx.dark ?? false },
  );
}
