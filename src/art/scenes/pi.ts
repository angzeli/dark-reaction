/**
 * 4.01 Prof. Ridley's office, after the porter's clean. Warmer than the rest
 * of the floor, lit only by the street lamp through the rain and the
 * radiator's glow: the copper desk lamp (off: through the frosted door it is
 * just a shape), the email on the blotter, books lying flat on books standing
 * up, the framed 2020 paper with Figure 3 and its brass plate, the 2018 group
 * photo, the wall clock, the document box on the floor behind the desk,
 * hoover tracks in the carpet, rain on the window and the frosted door with
 * its push bar.
 *
 * The locked door (`details: ['door']`, the scene `pi.door`) has its own
 * picture (#123): the corridor side of that frosted door, close up, with the
 * shapes of the lamp and the chair through the glass, Dan's printed sign, the
 * brass plate and the badge reader. During the porter's clean it stands off
 * its latch, and the reader is green.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import { PI_OPEN } from '../../content/world.ts';
import type { ArtContext } from '../types.ts';
import { C, circle, clockHands, glow, group, halo, hash, label, line, path, poly, rain, rect, seeded, svg, tube } from '../svg.ts';

const FLOOR = 648;

function room(): string {
  // Hoover tracks: lanes of carpet pile lying one way, then the other.
  const lanes = Array.from({ length: 7 }, (_, i) => {
    const y = FLOOR + 6 + i * 36;
    return poly([[0, y + 10], [1600, y - 22], [1600, y + 8], [0, y + 40]], '#ffffff', { opacity: i % 2 ? 0.01 : 0.026 });
  });
  return group(
    'layer-bg',
    `<defs><linearGradient id="pi-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15151c"/><stop offset="1" stop-color="#231e1f"/></linearGradient>
      <linearGradient id="pi-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a121b"/><stop offset="0.7" stop-color="#1b1f27"/><stop offset="1" stop-color="#3d2b19"/></linearGradient></defs>`,
    rect(0, 0, 1600, FLOOR + 2, 'url(#pi-wall)'),
    rect(0, FLOOR, 1600, 900 - FLOOR, '#1a1715'),
    ...lanes,
    rect(0, FLOOR - 2, 1600, 5, '#2a2520'),
  );
}

function door(): string {
  return group(
    'door',
    `<clipPath id="pi-frost"><rect x="162" y="296" width="106" height="150"/></clipPath>`,
    rect(132, 262, 166, FLOOR - 262, '#1b1d24'),
    rect(142, 272, 146, FLOOR - 272, '#2b231d'),
    // Frosted glass, the corridor light behind it, and the back of Dan's sign.
    rect(162, 296, 106, 150, '#7f929e', { opacity: 0.22 }),
    `<g clip-path="url(#pi-frost)">${glow(215, 380, 70, 90, C.screen, 0.22)}</g>`,
    rect(184, 330, 62, 38, '#4b5761', { opacity: 0.5 }),
    rect(158, 292, 114, 4, '#3a3029'),
    rect(158, 446, 114, 4, '#3a3029'),
    // The push bar that lets you out at any time.
    rect(150, 474, 130, 22, '#2a3846', { rx: 4 }),
    rect(156, 481, 118, 8, '#8794a0', { rx: 4 }),
  );
}

function windowPane(dim: boolean): string {
  const x = 330;
  const y = 200;
  const w = 260;
  const h = 320;
  const opposite = [
    poly([[x, y + h], [x, 380], [400, 380], [400, 350], [470, 350], [470, y + h]], '#0f161f'),
    poly([[470, y + h], [470, 410], [x + w, 410], [x + w, y + h]], '#0c131b'),
  ].join('');
  const lit = [[352, 400], [380, 430], [420, 372], [444, 402], [492, 436], [540, 428], [560, 470]]
    .map(([lx, ly]) => rect(lx!, ly!, 9, 6, C.sodium, { opacity: 0.4 }))
    .join('');
  return group(
    'window',
    rect(x, y, w, h, 'url(#pi-night)'),
    opposite,
    lit,
    glow(x + w / 2 + 40, y + h, 160, 60, C.sodium, 0.35),
    rain('pi-window', x, y, w, h, dim ? 1.6 : 1.1),
    rect(x - 8, y - 8, w + 16, 8, '#2d2721'),
    rect(x - 8, y - 8, 8, h + 8, '#2d2721'),
    rect(x + w, y - 8, 8, h + 8, '#2d2721'),
    rect(x + w / 2 - 3, y, 6, h, '#2d2721'),
    rect(x, y + 100, w, 5, '#2d2721'),
    rect(x - 12, y + h, w + 24, 12, '#3a322b'),
    // Journals waiting on the sill.
    ...[0, 1, 2].map((i) => rect(x + 196 - i * 3, y + h - 8 - i * 7, 50, 7, ['#4a3a2e', '#3a4652', '#5e4330'][i]!, { opacity: 0.9 })),
    // The radiator nobody told about the budget.
    glow(x + w / 2, y + h + 50, 150, 44, C.copper, 0.12),
    rect(x + 20, 552, w - 40, 76, '#5b544b', { rx: 4 }),
    ...Array.from({ length: 21 }, (_, i) => line(x + 30 + i * 10, 558, x + 30 + i * 10, 622, '#423c35', 2)),
    rect(x + 14, 624, 10, 24, '#3a342e'),
  );
}

/** Books standing up, and more books lying flat on top of them. */
function bookcase(): string {
  const rnd = seeded(hash('pi-books'));
  const spines = ['#4a3a2e', '#5e4330', '#3a4652', '#4f5a3c', '#6b4a33', '#2f3a44', '#6e5f4a', '#46333a'];
  const pick = () => spines[Math.floor(rnd() * spines.length)]!;
  const x0 = 630;
  const x1 = 780;
  const shelves = [220, 304, 392, 480, 568];
  const books: string[] = [];
  for (let s = 0; s < shelves.length - 1; s++) {
    const top = shelves[s]! + 8;
    const bottom = shelves[s + 1]!;
    const gap = bottom - top;
    let x = x0 + 2;
    let tallest = 0;
    while (x < x1 - 40) {
      const w = 8 + Math.floor(rnd() * 9);
      const h = Math.floor(gap * (0.55 + rnd() * 0.2));
      books.push(rect(x, bottom - h, w - 1, h, pick(), { opacity: 0.9 }));
      tallest = Math.max(tallest, h);
      x += w;
    }
    // The flat ones: two or three across the tops of the standing row.
    let y = bottom - tallest;
    const flats = 2 + Math.floor(rnd() * 2);
    for (let f = 0; f < flats && y - 10 > top; f++) {
      const w = 60 + Math.floor(rnd() * 50);
      const h = 7 + Math.floor(rnd() * 4);
      const fx = x0 + 6 + Math.floor(rnd() * (x1 - x0 - w - 12));
      y -= h;
      books.push(rect(fx, y, w, h - 1, pick(), { opacity: 0.95 }), rect(fx, y, w, 1.5, '#d9d0bb', { opacity: 0.18 }));
    }
    // One leaning in the gap at the end of the row.
    books.push(rect(x + 4, bottom - gap * 0.6, 9, gap * 0.6, pick(), { opacity: 0.85, transform: `rotate(-14 ${x + 8} ${bottom})` }));
  }
  return group(
    'bookcase',
    rect(620, 210, 170, FLOOR - 210, '#241d17'),
    rect(630, 220, 150, FLOOR - 224, '#17120e'),
    ...books,
    ...shelves.map((y) => rect(624, y, 162, 8, '#2f261e')),
    rect(630, 576, 150, FLOOR - 580, '#211a14'),
    line(705, 580, 705, FLOOR - 4, '#17120e', 2),
  );
}

/**
 * In Act III (pi.hub.act3) the frame hangs very slightly crooked, as if taken
 * down and put back in a hurry: it turns about its nail, the brass plate
 * screwed to the wall below stays level, and a paler ghost of the wall where
 * the frame always hung shows along the edges it has swung away from.
 */
function framedPaper(crooked: boolean): string {
  const x = 824;
  const y = 250;
  const ink = '#2c2a28';
  // Figure 3: a single clean peak, its satellites placed as if with a ruler.
  const fx = 962;
  const base = y + 96;
  const figure = path(
    `M${fx} ${base}h44l2 -3l2 3h6l3 -70l3 70h6l2 -3l2 3h44`,
    'none',
    { stroke: ink, 'stroke-width': 1.4, 'stroke-linejoin': 'round', opacity: 0.85 },
  );
  const text = (cx: number, cy: number, n: number, w: number) =>
    Array.from({ length: n }, (_, i) => rect(cx, cy + i * 6, i % 5 === 4 ? w * 0.6 : w, 2, ink, { opacity: 0.35 }));
  const light = glow(x + 138, y + 60, 200, 90, C.copper, 0.06);
  const frame = [
    rect(x, y, 276, 128, '#1c1611'),
    rect(x, y, 276, 2, '#6a5642', { opacity: 0.8 }),
    rect(x + 10, y + 10, 256, 108, '#b8b0a0', { opacity: 0.55 }),
    rect(x + 20, y + 18, 104, 92, '#e2dccb', { opacity: 0.62 }),
    rect(x + 28, y + 24, 80, 5, ink, { opacity: 0.6 }),
    rect(x + 28, y + 32, 56, 3, ink, { opacity: 0.4 }),
    ...text(x + 28, y + 42, 10, 40),
    ...text(x + 74, y + 42, 10, 40),
    rect(x + 132, y + 18, 124, 92, '#e2dccb', { opacity: 0.62 }),
    line(fx, base + 4, fx + 112, base + 4, ink, 1, { opacity: 0.5 }),
    figure,
  ];
  const plate = [rect(x + 110, y + 132, 56, 10, '#b8954f', { opacity: 0.85 }), rect(x + 110, y + 132, 56, 2, '#e0c88a', { opacity: 0.6 })];
  if (!crooked) return group('framed-paper', light, ...frame, ...plate);
  return `<g class="framed-paper" data-detail="paper-crooked">${[
    light,
    rect(x, y, 276, 128, '#433b35', { opacity: 0.5, stroke: '#5a5047', 'stroke-width': 1.5, 'stroke-opacity': 0.5 }),
    `<g transform="rotate(1.8 ${x + 138} ${y + 2})">${frame.join('')}</g>`,
    ...plate,
  ].join('')}</g>`;
}

function photo(): string {
  // The Ridley group, summer 2018, squinting on the front steps.
  const people = Array.from({ length: 8 }, (_, i) => {
    const px = 1206 + i * 14 + (i === 7 ? 6 : 0);
    return rect(px, 362, 9, 20, '#2b2a2c', { rx: 3, opacity: 0.85 }) + circle(px + 4.5, 358, 4, '#3a3634', { opacity: 0.85 });
  });
  return group(
    'photo',
    rect(1190, 300, 140, 100, '#121212'),
    rect(1196, 306, 128, 88, '#6c7278', { opacity: 0.45 }),
    rect(1196, 306, 128, 30, '#8a929a', { opacity: 0.35 }),
    ...[0, 1, 2].map((i) => rect(1196, 378 + i * 6, 128, 3, '#4a4d52', { opacity: 0.5 })),
    ...people,
  );
}

function cabinet(): string {
  // A filing cabinet, and a plant on it that has been waiting for Boston too.
  const leaf = (d: string) => path(d, 'none', { stroke: '#4f5a3c', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.9 });
  return group(
    'cabinet',
    rect(1350, 470, 96, FLOOR - 470, '#2a2c31'),
    ...[0, 1, 2].map((i) => rect(1356, 478 + i * 56, 84, 50, '#30333a') + rect(1386, 492 + i * 56, 24, 5, '#8794a0', { rx: 2 })),
    path('M1380 470 l4 -26 h28 l4 26 z', '#6b4a33'),
    leaf('M1398 446 C 1396 420, 1380 410, 1368 418'),
    leaf('M1400 446 C 1404 416, 1420 408, 1432 420 S 1440 444, 1436 452'),
    leaf('M1396 446 C 1392 430, 1372 432, 1364 452'),
    leaf('M1402 446 C 1404 426, 1398 404, 1406 392'),
  );
}

/** Between the framed paper and the photo, low enough to stay whole in the play screen's crop (#152). */
function wallClock(minute: number): string {
  return group('clock', circle(1145, 286, 30, '#0c141c', { stroke: '#4a4038', 'stroke-width': 4 }), clockHands(1145, 286, minute), circle(1145, 286, 3, '#c9d3da'));
}

function desk(): string {
  return group(
    'desk',
    // Behind the desk: the document box, and Dan's chair.
    rect(948, 596, 104, 10, '#5a4e3c', { rx: 2 }),
    rect(952, 604, 96, 42, '#4b4031'),
    rect(970, 598, 60, 7, '#ddd6c4', { opacity: 0.8 }),
    label(974, 604, 'Y.C. LIN', 5.5, '#3a2a22'),
    rect(988, 618, 24, 7, '#2c241b', { rx: 3 }),
    rect(918, 424, 92, 128, '#16110e', { rx: 12 }),
    rect(926, 432, 6, 110, '#2a211b', { rx: 3 }),
    // The desk itself, its edge catching the street lamp.
    poly([[812, 538], [1158, 538], [1178, 562], [792, 562]], '#3a2c20'),
    rect(812, 538, 346, 2, C.sodium, { opacity: 0.22 }),
    rect(792, 562, 386, 12, '#2a2018'),
    rect(800, 574, 84, FLOOR - 574, '#241b14'),
    rect(1086, 574, 84, FLOOR - 574, '#241b14'),
    ...[0, 1, 2].map((i) => rect(1092, 584 + i * 22, 72, 2, '#17110c') + rect(1120, 592 + i * 22, 16, 3, '#6b5440', { rx: 1.5 })),
    // The blotter, and the email lying on it as if put down a minute ago.
    poly([[870, 543], [1012, 543], [1020, 557], [862, 557]], '#1f2e26'),
    poly([[906, 545], [958, 544], [963, 555], [903, 556]], '#e8e2d2', { opacity: 0.9 }),
    ...[0, 1, 2].map((i) => line(912 + i, 548 + i * 2.5, 946, 548 + i * 2.5, '#6b6458', 0.8, { opacity: 0.7 })),
    // The monitor, off, with Ian's sticky note.
    rect(1056, 526, 12, 14, '#111418'),
    rect(1036, 536, 52, 5, '#111418'),
    rect(1010, 444, 112, 84, '#15181d', { rx: 4 }),
    rect(1016, 450, 100, 72, '#0b0f13'),
    line(1024, 516, 1060, 456, '#ffffff', 6, { opacity: 0.03 }),
    rect(1102, 452, 22, 22, '#d8c04a', { opacity: 0.85, transform: 'rotate(6 1113 463)' }),
    // Papers, a pen pot.
    rect(1132, 528, 34, 12, '#cfc8b8', { opacity: 0.4 }),
    rect(1136, 520, 30, 8, '#cfc8b8', { opacity: 0.35 }),
    rect(1170, 518, 12, 22, '#3a3530'),
  );
}

function lamp(): string {
  // The copper desk lamp, switched off: a shape, catching a little street light.
  return group(
    'lamp',
    path('M826 548 a20 6 0 0 1 40 0 z', C.copperDim),
    line(846, 546, 872, 470, C.copperDim, 6, { 'stroke-linecap': 'round' }),
    line(872, 470, 900, 452, C.copperDim, 6, { 'stroke-linecap': 'round' }),
    path('M884 444 l40 6 l-6 26 l-40 -10 z', C.copper, { opacity: 0.8 }),
    path('M884 444 l40 6', 'none', { stroke: C.sodium, 'stroke-width': 2, opacity: 0.5 }),
  );
}

/** The street lamp through the rain: a long slant of sodium across the carpet and the desk. */
const streetLight = () =>
  poly([[352, 524], [586, 524], [1240, 900], [520, 900]], C.sodium, { opacity: 0.06 }) +
  poly([[600, 300], [600, 520], [1180, 560], [1180, 420]], C.sodium, { opacity: 0.025 });

/** The corridor side of the frosted door, close up (#123). */
function lockedDoor(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  const open = ctx.minute >= PI_OPEN.from && ctx.minute < PI_OPEN.to;
  const floor = 700;
  // The door: frame 560–1040, leaf 576–1024; the frosted pane at eye level.
  const gx = 650;
  const gy = 244;
  const gw = 300;
  const gh = 300;
  const wall = group(
    'layer-bg',
    `<defs><linearGradient id="pidoor-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1823"/><stop offset="1" stop-color="#172636"/></linearGradient>
      <clipPath id="pidoor-frost"><rect x="${gx}" y="${gy}" width="${gw}" height="${gh}"/></clipPath></defs>`,
    rect(0, 0, 1600, floor, 'url(#pidoor-wall)'),
    rect(0, floor, 1600, 900 - floor, '#0b131b'),
    rect(0, floor - 2, 1600, 4, '#1d2c3b'),
    // The corridor's tube, and its light on the floor.
    tube(700, 64, 200, { on: true }),
    glow(800, 160, 520, 120, C.tube, dim ? 0.05 : 0.08),
    poly([[380, floor], [1220, floor], [1380, 900], [220, 900]], C.tube, { opacity: dim ? 0.02 : 0.035 }),
  );
  // A noticeboard of seminar flyers nobody took down.
  const flyers = [
    [252, 316, 70, 92, '#d9d2bf', -3],
    [332, 304, 64, 84, '#c9d4cf', 2],
    [404, 322, 58, 78, '#e0c9a6', -1],
    [270, 420, 84, 40, '#cfc8d8', 1.5],
    [372, 414, 76, 54, '#d6d0b8', -2],
  ] as const;
  const board = group(
    'noticeboard',
    rect(232, 290, 248, 196, '#3b2f24'),
    rect(240, 298, 232, 180, '#5a4634'),
    ...flyers.map(([x, y, w, h, fill, r]) => rect(x, y, w, h, fill, { opacity: dim ? 0.35 : 0.5, transform: `rotate(${r} ${x + w / 2} ${y + h / 2})` })),
    ...flyers.map(([x, y, w]) => circle(x + w / 2, y + 6, 3, C.red, { opacity: 0.8 })),
  );
  // What the frosted glass lets through: the street lamp from the office window, the chair, the lamp.
  const through = `<g clip-path="url(#pidoor-frost)">${[
    rect(gx, gy, gw, gh, '#1c1915'),
    glow(gx + 90, gy + 230, 120, 90, C.sodium, dim ? 0.16 : 0.24),
    // The chair's back, nearer the door, and the lamp's arm and shade on the desk beyond.
    rect(gx + 46, gy + 150, 84, 150, '#0f0c0a', { rx: 22, opacity: 0.85, filter: 'url(#dr-blur-sm)' }),
    path(`M${gx + 196} ${gy + 236} L${gx + 214} ${gy + 162} L${gx + 236} ${gy + 148}`, 'none', { stroke: '#120e0b', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: 0.8, filter: 'url(#dr-blur-sm)' }),
    path(`M${gx + 226} ${gy + 138} l46 8 l-8 30 l-46 -12 z`, '#120e0b', { opacity: 0.8, filter: 'url(#dr-blur-sm)' }),
    rect(gx + 150, gy + 236, 150, 64, '#130f0c', { opacity: 0.7, filter: 'url(#dr-blur-sm)' }),
    // The frosting itself: pale, and lit from this side.
    rect(gx, gy, gw, gh, '#a7b6c0', { opacity: 0.2 }),
    glow(gx + gw / 2, gy + 40, 160, 60, C.tube, 0.08),
  ].join('')}</g>`;
  // Dan's sign, taped at eye level: BOSTON UNTIL 27 NOV — PLEASE EMAIL.
  const sx = 740;
  const sy = 270;
  const sign = `<g class="door-sign" data-detail="door-sign">${[
    rect(sx, sy, 120, 150, C.paper, { opacity: dim ? 0.82 : 0.92 }),
    label(sx + 60, sy + 42, 'BOSTON', 18, '#26201a', { 'text-anchor': 'middle', 'font-weight': 600 }),
    label(sx + 60, sy + 70, 'UNTIL', 12, '#26201a', { 'text-anchor': 'middle' }),
    label(sx + 60, sy + 90, '27 NOV', 15, '#26201a', { 'text-anchor': 'middle', 'font-weight': 600 }),
    line(sx + 40, sy + 106, sx + 80, sy + 106, '#26201a', 1.2),
    label(sx + 60, sy + 126, 'PLEASE EMAIL', 9, '#26201a', { 'text-anchor': 'middle' }),
    rect(sx - 8, sy - 6, 30, 12, '#e9e4cf', { opacity: 0.55, transform: `rotate(-24 ${sx + 7} ${sy})` }),
    rect(sx + 98, sy - 6, 30, 12, '#e9e4cf', { opacity: 0.55, transform: `rotate(24 ${sx + 113} ${sy})` }),
  ].join('')}</g>`;
  const leaf = group(
    'door',
    rect(560, 150, 480, floor - 150, '#1b1d24'),
    rect(576, 166, 448, floor - 166, '#33271d'),
    rect(588, 178, 424, floor - 190, '#3a2d21'),
    through,
    rect(gx - 10, gy - 10, gw + 20, 10, '#2a2119'),
    rect(gx - 10, gy + gh, gw + 20, 10, '#2a2119'),
    rect(gx - 10, gy, 10, gh, '#2a2119'),
    rect(gx + gw, gy, 10, gh, '#2a2119'),
    sign,
    // The lever handle, and the kick plate scuffed by trolleys.
    rect(966, 578, 14, 30, '#5e6b77', { rx: 4 }),
    rect(934, 584, 46, 10, '#8794a0', { rx: 5 }),
    rect(592, 640, 416, 52, '#2a2f36'),
    rect(592, 640, 416, 2, '#8794a0', { opacity: 0.3 }),
    // Off its latch during the clean: a dark inch down the leading edge.
    open ? rect(1018, 166, 8, floor - 166, '#070a0e', { 'data-detail': 'door-ajar' }) : '',
    // Under the door, the street lamp's sodium on the office carpet.
    rect(578, floor - 3, 444, 3, C.sodium, { opacity: open ? 0.5 : 0.28 }),
  );
  // Beside the door: the brass plate and the badge reader.
  const ledColour = open ? '#3fcf7a' : C.red;
  const plate = group(
    'plate',
    rect(1072, 300, 140, 46, '#7d6141'),
    rect(1076, 304, 132, 38, '#9a7a52'),
    label(1142, 320, 'PROF. D. RIDLEY', 10, '#2a1d12', { 'text-anchor': 'middle', 'font-weight': 600 }),
    label(1142, 336, '4.01', 10, '#2a1d12', { 'text-anchor': 'middle' }),
    rect(1084, 418, 26, 44, '#11171d', { rx: 3 }),
    rect(1089, 438, 16, 18, '#1b232b', { rx: 2 }),
    circle(1097, 428, 3, ledColour),
    halo(1097, 428, 8, ledColour, 0.45),
  );
  return svg('pi', [wall, board, leaf, plate].join(''), { dark: ctx.dark ?? false });
}

export function pi(ctx: ArtContext): string {
  if (ctx.details?.includes('door')) return lockedDoor(ctx);
  const dim = ctx.act === 3;
  return svg(
    'pi',
    [room(), glow(700, 560, 420, 160, C.copper, 0.07), door(), windowPane(dim), streetLight(), bookcase(), framedPaper(dim), photo(), wallClock(ctx.minute), cabinet(), desk(), lamp()].join(''),
    { dark: ctx.dark ?? false },
  );
}
