/**
 * 4.08 Write-up office, 02:47. Rain on the big window, sodium light from
 * the street, two tubes (one of them dying), your monitor with the NMR
 * queue open, hot desk 7 buried in boxes, the kettle on the windowsill,
 * the sofa.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, clockHands, glow, group, label, line, path, poly, rain, rect, svg, tube } from '../svg.ts';

/** Colder and whiter than any tube should be. */
const TOO_WHITE = '#f4f9ff';

/**
 * Act III (office.hub.act3): the dying tube has stopped flickering and simply
 * burns, steady and too white. No motion class, so it holds still whatever
 * the settings. The tube itself sits above the play screen's crop, so its
 * cold light is laid down the wall too.
 */
function steadyTube(x: number, y: number, w: number): string {
  return `<g class="dr-tube office-tube-steady" data-detail="tube-steady">${[
    glow(x + w / 2 + 10, 300, 470, 250, TOO_WHITE, 0.085),
    rect(x - 6, y - 4, w + 12, 14, C.steel),
    glow(x + w / 2, y + 34, w * 0.8, 100, TOO_WHITE, 0.22),
    rect(x, y, w, 7, TOO_WHITE, { rx: 3 }),
  ].join('')}</g>`;
}

/** The same light catching the top edges under it: the clock's rim, the monitor, the desk, the notice board, the counter. */
const whiteEdges = () =>
  group(
    'office-white-edges',
    path('M1145.5 275.6 A42 42 0 0 1 1224.5 275.6', 'none', { stroke: TOO_WHITE, 'stroke-width': 2, opacity: 0.3 }),
    rect(1009, 395, 252, 2, TOO_WHITE, { opacity: 0.3, rx: 1 }),
    rect(940, 600, 450, 2, TOO_WHITE, { opacity: 0.2 }),
    rect(1390, 250, 170, 2, TOO_WHITE, { opacity: 0.22 }),
    rect(1395, 560, 190, 2, TOO_WHITE, { opacity: 0.16 }),
  );

export function office(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  const wall = `<linearGradient id="office-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1622"/><stop offset="1" stop-color="#14263a"/></linearGradient>
    <linearGradient id="office-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1420"/><stop offset="0.7" stop-color="#1a2230"/><stop offset="1" stop-color="#3a2a18"/></linearGradient>`;

  const background = group(
    'layer-bg',
    `<defs>${wall}</defs>`,
    rect(0, 0, 1600, 700, 'url(#office-wall)'),
    rect(0, 690, 1600, 210, C.floor),
    rect(0, 688, 1600, 4, '#1b2b3c'),
  );

  // The window and the city behind it.
  const city = [
    poly([[90, 560], [90, 430], [150, 430], [150, 400], [210, 400], [210, 470], [260, 470], [260, 560]], '#101a25'),
    poly([[260, 560], [260, 380], [330, 380], [330, 350], [345, 350], [345, 380], [400, 380], [400, 560]], '#0d1620'),
    poly([[400, 560], [400, 455], [480, 455], [480, 420], [560, 420], [560, 560]], '#111c28'),
    poly([[560, 560], [560, 470], [650, 470], [650, 560]], '#0e1822'),
  ].join('');
  const litWindows = [
    [110, 450], [170, 420], [178, 440], [290, 400], [300, 430], [372, 395], [420, 470], [500, 440], [520, 470], [590, 490],
  ]
    .map(([x, y]) => rect(x!, y!, 10, 7, C.sodium, { opacity: 0.45 }))
    .join('');
  const crane = group(
    'crane',
    line(520, 200, 520, 420, '#1e2a36', 4),
    line(440, 205, 640, 205, '#1e2a36', 4),
    line(520, 205, 470, 260, '#1e2a36', 2),
    circle(640, 205, 3, C.red, { class: 'dr-blink', opacity: 0.8 }),
  );
  const windowPane = group(
    'layer-arch',
    rect(90, 150, 560, 410, 'url(#office-sky)'),
    crane,
    city,
    litWindows,
    glow(600, 560, 140, 80, C.sodium, 0.35),
    // In Act III the rain is quieter, as if it is listening (office.hub.act3).
    rain('office-window', 90, 150, 560, 410, dim ? 0.55 : 1),
    rect(82, 142, 576, 10, C.steel),
    rect(82, 558, 576, 16, C.steelLit),
    rect(82, 142, 10, 426, C.steel),
    rect(648, 142, 10, 426, C.steel),
    rect(272, 150, 8, 410, C.steel),
    rect(459, 150, 8, 410, C.steel),
    rect(90, 340, 560, 6, C.steel),
  );

  // Sodium light spilling across the floor.
  const spill = poly([[100, 692], [650, 692], [820, 900], [180, 900]], C.sodium, { opacity: 0.06 });

  const tubes = group('layer-light', tube(240, 46, 380, { on: true }), dim ? steadyTube(980, 46, 380) : tube(980, 46, 380, { flicker: true, on: true }));

  // Wall clock, showing the time in the loop; low enough to stay whole in the play screen's crop (#152).
  const clock = group(
    'clock',
    circle(1185, 290, 42, '#0c141c', { stroke: C.steelLit, 'stroke-width': 4 }),
    clockHands(1185, 290, ctx.minute),
    circle(1185, 290, 3, '#c9d3da'),
  );

  // Notice board by the kettle.
  const board = group(
    'board',
    rect(1390, 250, 170, 190, '#2a2118'),
    rect(1405, 268, 62, 80, '#cfc6b2', { opacity: 0.55, transform: 'rotate(-3 1436 308)' }),
    rect(1480, 262, 64, 54, '#d8cfb9', { opacity: 0.5 }),
    rect(1478, 330, 70, 92, '#cbbf9f', { opacity: 0.45, transform: 'rotate(4 1513 376)' }),
    circle(1436, 272, 4, C.red),
    circle(1512, 266, 4, C.copper),
  );

  // Hot desk 7: boxes, and a mug that isn't anyone's.
  const boxes = ctx.act >= 2
    ? rect(690, 470, 120, 80, '#463626') + poly([[690, 470], [670, 445], [750, 452], [750, 470]], '#55422e') + poly([[810, 470], [835, 448], [770, 452], [770, 470]], '#4d3b29')
    : rect(690, 470, 120, 80, '#463626') + rect(690, 505, 120, 5, '#8a7a5c', { opacity: 0.5 });
  const hotDesk = group(
    'hotdesk',
    rect(660, 600, 250, 14, '#1a2633'),
    rect(668, 614, 10, 90, '#121b25'),
    rect(892, 614, 10, 90, '#121b25'),
    rect(700, 550, 150, 50, '#3b2d20'),
    rect(700, 568, 150, 4, '#8a7a5c', { opacity: 0.45 }),
    boxes,
    path('M862 562 h26 v34 a6 6 0 0 1 -6 6 h-14 a6 6 0 0 1 -6 -6 z', '#c9c3b6', { opacity: 0.85 }),
    path('M888 570 q14 2 0 18', 'none', { stroke: '#c9c3b6', 'stroke-width': 4, opacity: 0.85 }),
    rect(862, 562, 6, 40, '#ffffff', { opacity: 0.12 }),
    poly([[666, 600], [676, 578], [686, 600]], '#cfc6b2', { opacity: 0.6 }),
    label(672, 597, '7', 11, '#2a2118'),
  );

  // Your desk and monitor with the queue on it.
  const screenLines = [
    label(1030, 440, 'NMR QUEUE · 400 MHz', 15, '#cfe6f2', { opacity: 0.85 }),
    label(1030, 470, '02:58  tom_h    COSY', 13, '#9cc0d4', { opacity: 0.6 }),
    label(1030, 492, '03:10  ian_o    TEST', 13, '#9cc0d4', { opacity: 0.6 }),
    rect(1024, 503, 222, 22, C.tube, { opacity: 0.18 }),
    label(1030, 519, '03:33  ar4217   PROTON_DARK', 13, C.tube),
  ].join('');
  const desk = group(
    'layer-props',
    glow(1135, 480, 260, 170, C.screen, 0.12),
    rect(940, 600, 450, 16, '#1c2937'),
    rect(940, 600, 450, 3, '#2d4052'),
    rect(950, 616, 12, 90, '#121b25'),
    rect(1368, 616, 12, 90, '#121b25'),
    rect(1118, 560, 34, 40, '#10161d'),
    rect(1080, 596, 110, 6, '#10161d'),
    rect(1005, 395, 260, 170, '#0e1319', { rx: 6 }),
    rect(1017, 407, 236, 146, '#16303f'),
    screenLines,
    circle(1252, 558, 2.5, C.tube, { opacity: 0.9 }),
    rect(1040, 604, 170, 10, '#141d27', { rx: 3 }),
    // Copper desk lamp, switched off.
    line(1320, 600, 1335, 510, C.copperDim, 6, { 'stroke-linecap': 'round' }),
    line(1335, 510, 1290, 470, C.copperDim, 6, { 'stroke-linecap': 'round' }),
    path('M1270 462 l40 -10 l8 22 l-44 6 z', C.copper, { opacity: 0.8 }),
  );

  // The counter over the fridge: two mugs and the tea caddy.
  const kitchen = group(
    'kitchen',
    rect(1395, 560, 190, 14, '#24313f'),
    rect(1400, 574, 180, 126, '#16202b'),
    rect(1408, 584, 80, 104, '#1b2733', { rx: 3 }),
    circle(1478, 640, 2, C.tube, { opacity: 0.6 }),
    path('M1446 560 v-28 h22 v28 z', '#6b5446'),
    path('M1474 560 v-22 h18 v22 z', '#3f5560'),
    rect(1506, 532, 40, 28, '#2b3540', { rx: 3 }),
  );

  // The kettle lives on the windowsill, against the street lamp.
  const kettle = group(
    'kettle',
    rect(566, 552, 64, 6, '#1c242c', { rx: 2 }),
    path('M570 552 v-42 q0 -10 10 -10 h34 q10 0 10 10 v42 z', '#2e3843'),
    path('M624 516 q20 0 18 22', 'none', { stroke: '#2e3843', 'stroke-width': 6 }),
    rect(582, 494, 28, 8, '#252e37', { rx: 3 }),
    path('M571 548 v-38 q0 -9 9 -9', 'none', { stroke: C.sodium, 'stroke-width': 1.5, opacity: 0.45 }),
    path('M626 574 q2 34 14 56 t8 26', 'none', { stroke: '#121a22', 'stroke-width': 3 }),
    rect(638, 654, 20, 14, '#1c2631', { rx: 2 }),
  );

  // Chair, and the sofa in the foreground, high enough that the play screen's
  // crop (y 240–660 at its tightest, #152) still shows its back and cushions.
  const chair = group(
    'chair',
    rect(1080, 560, 120, 150, '#0d141c', { rx: 14 }),
    rect(1098, 700, 84, 14, '#0a1016'),
    rect(1134, 714, 12, 60, '#0a1016'),
    path('M1084 790 l56 -16 l56 16', 'none', { stroke: '#0a1016', 'stroke-width': 8 }),
  );
  const sofa = group(
    'layer-fg',
    path('M20 900 v-256 q0 -40 40 -40 h360 q40 0 40 40 v256 z', '#161c1a'),
    path('M60 654 q0 -26 26 -26 h300 q26 0 26 26 v40 h-352 z', '#1d2522'),
    path('M300 629 q40 -12 90 4 l-6 30 q-44 -10 -84 0 z', '#2d3a44', { opacity: 0.9 }),
  );

  return svg(
    'office',
    [background, windowPane, kettle, spill, tubes, clock, board, hotDesk, desk, kitchen, dim ? whiteEdges() : '', chair, sofa].join(''),
    { dark: ctx.dark ?? false },
  );
}
