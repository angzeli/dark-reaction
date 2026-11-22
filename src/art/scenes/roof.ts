/**
 * The roof, 02:47. The door propped open with a fire extinguisher; rain as a
 * whole weather; London in every direction, orange at the edges and dark in
 * the middle where the river is; cranes keeping watch with their red lights;
 * the plant units on their frame, and under them a deckchair nobody admits
 * to owning, a carrier bag with a lunchbox in it underneath.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, ellipse, glow, group, halo, hash, line, path, poly, rain, rect, seeded, stillRain, svg } from '../svg.ts';

/** Top of the parapet: the city stands behind it, the roof in front. */
const HORIZON = 540;
const DECK = 640;
const RIVER = { from: 690, to: 850 };

function sky(): string {
  return group(
    'layer-bg',
    `<defs><linearGradient id="roof-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05090f"/><stop offset="0.42" stop-color="#10161f"/><stop offset="0.75" stop-color="#221f1f"/><stop offset="1" stop-color="#3a2a1d"/></linearGradient></defs>`,
    rect(0, 0, 1600, HORIZON + 30, 'url(#roof-sky)'),
    // Low cloud, lit orange from underneath where the city is; dark over the river.
    glow(360, 440, 300, 130, C.sodium, 0.26),
    glow(1180, 440, 300, 130, C.sodium, 0.26),
    glow(380, 230, 380, 60, '#3a2d24', 0.35),
    glow(1180, 200, 420, 70, '#3a2d24', 0.3),
  );
}

/** London, procedurally: tall and lit either side, low and dark where the river runs. */
function city(): string {
  const rnd = seeded(hash('roof-city'));
  const blocks: string[] = [];
  const windows: string[] = [];
  let x = -10;
  while (x < 1610) {
    const w = 22 + Math.floor(rnd() * 54);
    const centre = x + w / 2;
    const river = centre > RIVER.from && centre < RIVER.to;
    const near = Math.min(Math.abs(centre - RIVER.from), Math.abs(centre - RIVER.to));
    const h = river ? 10 + rnd() * 14 : 50 + Math.min(near, 300) * 0.32 + rnd() * 90;
    const shade = ['#0a0f15', '#0c121a', '#0e151e'][Math.floor(rnd() * 3)]!;
    blocks.push(rect(x, HORIZON + 20 - h, w, h, shade));
    if (!river) {
      const lit = Math.floor((w * h) / 700);
      for (let i = 0; i < lit; i++) {
        if (rnd() < 0.5) continue;
        const wx = x + 3 + rnd() * (w - 8);
        const wy = HORIZON + 24 - h + rnd() * (h - 30);
        windows.push(rect(wx, wy, 3, 3, rnd() < 0.8 ? C.sodium : '#cfe6f2', { opacity: (0.3 + rnd() * 0.4).toFixed(2) }));
      }
    }
    x += w;
  }
  const reflections = Array.from({ length: 10 }, () => {
    const rx = RIVER.from + 10 + rnd() * (RIVER.to - RIVER.from - 20);
    return rect(rx, HORIZON - 6 + rnd() * 6, 2, 6 + rnd() * 8, C.sodium, { opacity: (0.25 + rnd() * 0.25).toFixed(2) });
  });
  return group(
    'city',
    // A glass spire on the far side of the river.
    poly([[960, HORIZON], [990, 300], [1020, HORIZON]], '#0c131b'),
    group('dr-blink', halo(990, 300, 10, C.red, 0.55), circle(990, 300, 2.6, C.red)),
    ...blocks,
    ...windows,
    // And a dome on the near bank, standing above its neighbours.
    rect(598, 452, 92, 108, '#0a0f15'),
    path('M604 452 a40 36 0 0 1 80 0 z', '#0b1118'),
    rect(640, 404, 8, 16, '#0b1118'),
    circle(644, 402, 3, '#0b1118'),
    ...[612, 630, 648, 666].map((dx) => rect(dx, 470, 4, 12, C.sodium, { opacity: 0.35 })),
    rect(RIVER.from - 10, HORIZON - 8, RIVER.to - RIVER.from + 20, 30, '#05080c'),
    ...reflections,
  );
}

function crane(mastX: number, top: number, jibFrom: number, jibTo: number, hookX: number, delay: string): string {
  const steel = '#151c25';
  const lattice: string[] = [];
  for (let y = top + 10; y < HORIZON; y += 22) lattice.push(line(mastX - 7, y, mastX + 7, y + 11, steel, 1.5));
  for (let x = jibFrom + 8; x < jibTo - 8; x += 18) lattice.push(line(x, top + 2, x + 9, top + 10, steel, 1.2));
  return group(
    'crane',
    rect(mastX - 8, top, 3, HORIZON - top, steel),
    rect(mastX + 5, top, 3, HORIZON - top, steel),
    ...lattice,
    line(jibFrom, top, jibTo, top, steel, 3),
    line(jibFrom + 20, top + 12, jibTo, top + 12, steel, 2),
    rect(jibFrom, top - 4, 46, 22, '#10161d'),
    rect(mastX - 12, top - 22, 24, 22, steel),
    line(mastX, top - 22, jibFrom + 30, top - 2, steel, 1.5),
    line(mastX, top - 22, jibTo - 40, top, steel, 1.5),
    line(hookX, top + 12, hookX, top + 100, steel, 1.5),
    rect(hookX - 6, top + 100, 12, 10, steel),
    `<g class="dr-blink" style="animation-delay:${delay}">${halo(jibTo, top, 12, C.red, 0.55)}${circle(jibTo, top, 3, C.red)}${halo(mastX, top - 24, 10, C.red, 0.5)}${circle(mastX, top - 24, 2.6, C.red)}</g>`,
  );
}

function parapet(): string {
  const posts = Array.from({ length: 16 }, (_, i) => rect(40 + i * 104, HORIZON - 46, 4, 46, '#232c36'));
  return group(
    'parapet',
    ...posts,
    rect(0, HORIZON - 48, 1600, 4, '#2a3440'),
    rect(0, HORIZON - 24, 1600, 2, '#232c36'),
    rect(0, HORIZON, 1600, 40, '#151b22'),
    rect(0, HORIZON, 1600, 4, '#3a4652', { opacity: 0.6 }),
  );
}

function deck(): string {
  const rnd = seeded(hash('roof-deck'));
  const puddles: string[] = [];
  for (let i = 0; i < 8; i++) {
    const px = 430 + rnd() * 640;
    const py = 612 + rnd() * 240;
    const rx = 40 + rnd() * 80;
    puddles.push(ellipse(px, py, rx, rx * 0.1, '#1a222d', { opacity: 0.85 }), ellipse(px, py, rx * 0.7, rx * 0.05, C.sodium, { opacity: 0.14 }));
    for (let r = 0; r < 2; r++) puddles.push(ellipse(px + (rnd() - 0.5) * rx, py, 6 + r * 6, 1.2 + r, 'none', { stroke: '#9fb7c9', 'stroke-width': 1, opacity: 0.22 }));
  }
  return group(
    'deck',
    rect(0, HORIZON + 40, 1600, 900 - HORIZON - 40, '#0c1117'),
    rect(0, HORIZON + 40, 1600, 40, '#111820', { opacity: 0.8 }),
    ...Array.from({ length: 6 }, (_, i) => line(0, 640 + i * 46, 1600, 640 + i * 46, '#0a0e13', 2, { opacity: 0.6 })),
    ...puddles,
  );
}

function headHouse(): string {
  return group(
    'door',
    rect(110, 260, 260, DECK - 260, '#141b23'),
    rect(104, 254, 272, 10, '#1d2630'),
    rect(300, 222, 16, 34, '#1a222c'),
    rect(294, 216, 28, 8, '#232c36'),
    // Inside: the stairwell, a green running man over the top step.
    rect(170, 380, 120, DECK - 380, '#05080b'),
    glow(230, 400, 60, 40, C.tube, 0.22),
    rect(208, 390, 44, 14, '#2f9a5a', { opacity: 0.7 }),
    ...[0, 1, 2].map((i) => line(176, 566 + i * 24, 284, 566 + i * 24, '#10171e', 3)),
    // The bulkhead lamp, and its light on the wet roof.
    poly([[170, DECK], [290, DECK], [390, 780], [90, 780]], '#f2e2b8', { opacity: 0.05 }),
    rect(215, 344, 30, 18, '#2a3440', { rx: 6 }),
    rect(220, 350, 20, 8, '#f2e2b8', { opacity: 0.85, rx: 3 }),
    halo(230, 354, 16, '#f2e2b8', 0.5),
    glow(230, 370, 110, 80, '#f2e2b8', 0.12),
    // The door, swung out, and the fire extinguisher holding it there.
    poly([[290, 380], [360, 396], [360, 662], [290, DECK]], '#2b3a3c'),
    poly([[296, 390], [354, 403], [354, 652], [296, 632]], '#33454a'),
    line(300, 514, 350, 526, '#8794a0', 5, { 'stroke-linecap': 'round' }),
    rect(364, 598, 26, 64, '#b0403a', { rx: 8 }),
    rect(367, 608, 6, 44, '#d0685e', { opacity: 0.5, rx: 3 }),
    rect(364, 620, 26, 14, '#e6ecef', { opacity: 0.55 }),
    rect(370, 586, 14, 14, '#1a1a1a', { rx: 2 }),
    path('M384 592 q14 6 10 30', 'none', { stroke: '#111', 'stroke-width': 3 }),
  );
}

function deckchair(): string {
  // Front on: the sling of striped canvas between its rails, the legs splayed.
  const top = 580;
  const bottom = 620;
  const slices = 7;
  const stripes = Array.from({ length: slices }, (_, i) => {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const xt = (t: number) => 1162 + t * 60;
    const xb = (t: number) => 1156 + t * 72;
    return poly([[xt(t0), top], [xt(t1), top], [xb(t1), bottom], [xb(t0), bottom]], i % 2 ? '#a89a84' : '#7a3a34', { opacity: 0.85 });
  });
  return [
    ...stripes,
    rect(1156, bottom - 10, 72, 10, '#000000', { opacity: 0.25 }),
    // Under it, the carrier bag with her lunchbox in it.
    path('M1176 640 q-4 -14 8 -17 q10 -6 22 0 q13 2 9 17 z', '#cfd5d8', { opacity: 0.6 }),
    rect(1184, 630, 22, 5, '#3f6a8a', { opacity: 0.75 }),
    line(1158, top - 2, 1226, top - 2, '#5e4330', 5, { 'stroke-linecap': 'round' }),
    line(1160, top - 2, 1150, DECK, '#5e4330', 4, { 'stroke-linecap': 'round' }),
    line(1224, top - 2, 1236, DECK, '#5e4330', 4, { 'stroke-linecap': 'round' }),
    line(1164, 604, 1160, DECK, '#4a3426', 4, { 'stroke-linecap': 'round' }),
    line(1220, 604, 1226, DECK, '#4a3426', 4, { 'stroke-linecap': 'round' }),
  ].join('');
}

function plant(): string {
  const louvres = (x: number, y: number, w: number, h: number) =>
    Array.from({ length: Math.floor(h / 10) - 1 }, (_, i) => line(x + 10, y + 10 + i * 10, x + w - 10, y + 10 + i * 10, '#121920', 2));
  const fan = (cx: number, cy: number) =>
    ellipse(cx, cy, 54, 11, '#232c36') + ellipse(cx, cy, 44, 8, '#0b1015') + line(cx - 42, cy, cx + 42, cy, '#232c36', 2) + line(cx, cy - 8, cx, cy + 8, '#232c36', 2);
  return group(
    'plant',
    // The frame, and the dry patch of roof beneath it.
    rect(1100, 568, 336, 72, '#0e141a'),
    ...[1104, 1262, 1420].map((x) => rect(x, 560, 10, DECK - 560, '#1d2630')),
    rect(1096, 556, 344, 12, '#1d2630'),
    // Two units, humming.
    rect(1102, 400, 162, 156, '#1c242d'),
    ...louvres(1102, 400, 162, 156),
    fan(1183, 400),
    rect(1272, 428, 162, 128, '#19212a'),
    ...louvres(1272, 428, 162, 128),
    fan(1353, 428),
    rect(1230, 540, 20, 10, '#0c1015'),
    circle(1240, 545, 2.2, C.tube, { opacity: 0.85 }),
    path('M1112 556 v-30 h-26 v114', 'none', { stroke: '#232c36', 'stroke-width': 10 }),
    deckchair(),
  );
}

/**
 * Rain as a whole weather: a faint still layer that always shows, and a
 * falling one over it. The falling layer is kept sparse because every
 * animated streak costs a repaint of the whole picture beneath it.
 */
function weather(dim: boolean): string {
  // Act III: the rain has thinned to a fine mist that hangs rather than falls (roof.hub.act3).
  if (dim) {
    return group(
      'weather',
      rect(0, 0, 1600, 900, '#c9d6e0', { opacity: '0.06', 'data-detail': 'mist' }),
      stillRain('roof-weather', 0, 0, 1600, 900, 60),
      rain('roof-rain', 0, 0, 1600, 900, 0.1, { drops: false }),
    );
  }
  return group('weather', stillRain('roof-weather', 0, 0, 1600, 900, 320), rain('roof-rain', 0, 0, 1600, 900, 0.45, { drops: false }));
}

export function roof(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  return svg(
    'roof',
    [
      sky(),
      crane(560, 330, 440, 760, 700, '0s'),
      crane(1010, 360, 900, 1160, 940, '-1.1s'),
      city(),
      parapet(),
      deck(),
      headHouse(),
      plant(),
      weather(dim),
    ].join(''),
    { dark: ctx.dark ?? false },
  );
}
