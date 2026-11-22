/**
 * 4.01 Prof. Ridley's office, after the porter's clean. Warmer than the rest
 * of the floor, lit only by the street lamp through the rain and the
 * radiator's glow: the copper desk lamp (off: through the frosted door it is
 * just a shape), the email on the blotter, books lying flat on books standing
 * up, the framed 2020 paper with Figure 3 and its brass plate, the 2018 group
 * photo, the wall clock, the document box on the floor behind the desk,
 * hoover tracks in the carpet, rain on the window and the frosted door with
 * its push bar (the same picture serves the locked door).
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, clockHands, glow, group, hash, label, line, path, poly, rain, rect, seeded, svg } from '../svg.ts';

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

function wallClock(minute: number): string {
  return group('clock', circle(1260, 238, 30, '#0c141c', { stroke: '#4a4038', 'stroke-width': 4 }), clockHands(1260, 238, minute), circle(1260, 238, 3, '#c9d3da'));
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

export function pi(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  return svg(
    'pi',
    [room(), glow(700, 560, 420, 160, C.copper, 0.07), door(), windowPane(dim), streetLight(), bookcase(), framedPaper(dim), photo(), wallClock(ctx.minute), cabinet(), desk(), lamp()].join(''),
    { dark: ctx.dark ?? false },
  );
}
