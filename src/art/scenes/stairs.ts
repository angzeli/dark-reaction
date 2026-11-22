/**
 * Stairwell and ground-floor lobby, 02:47. Concrete flights and their echo;
 * sodium light from the tall landing window lying in orange bars across the
 * steps; a green running man over every door; the porter's empty desk with
 * its radio, tartan flask, crossword and name plate, the access-log terminal
 * glowing; the glass main entrance with the rain beyond it; fire exit B with
 * its push bar and ALARMED sticker; the red call point at shoulder height.
 * Nobody is there. Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, glow, group, halo, label, line, path, poly, rain, rect, svg, tube } from '../svg.ts';

const FLOOR = 690;
const RISE = 24;
const GO = 27;
const STEPS = 10;
/** Foot of the first flight; it climbs left to the half-landing. */
const FOOT = 800;
const LANDING_Y = FLOOR - STEPS * RISE; // 450
const LANDING_X = FOOT - STEPS * GO; // 530, where the second flight starts back up to the right
const LANDING_LEFT = 410;

/**
 * A green running-man sign: the panel, its glow, a white figure making for a
 * door. Gone out (Act III, stairs.hub.act3), it is a dull green box with no
 * glow, the figure barely there.
 */
function exitSign(x: number, y: number, lit = true): string {
  const w = 88;
  const h = 26;
  const ink = lit ? '#e8f6ee' : '#6f8a7a';
  const parts = [
    lit ? glow(x + w / 2, y + h / 2, 70, 44, C.tube, 0.22) : '',
    rect(x, y, w, h, '#0c1d14', { rx: 2 }),
    rect(x + 3, y + 3, w - 6, h - 6, lit ? '#2f9a5a' : '#1c3a29', { opacity: 0.85 }),
    circle(x + 17, y + 8, 2.2, ink),
    path(`M${x + 16} ${y + 11} l-3 5 l-4 3 M${x + 13} ${y + 16} l4 4 M${x + 16} ${y + 12} l5 1 M${x + 15} ${y + 12} l-4 2`, 'none', {
      stroke: ink,
      'stroke-width': 1.6,
      'stroke-linecap': 'round',
    }),
    path(`M${x + 30} ${y + 13} h20 m-5 -4 l5 4 l-5 4`, 'none', { stroke: ink, 'stroke-width': 1.6 }),
    rect(x + w - 26, y + 6, 12, 15, 'none', { stroke: ink, 'stroke-width': 1.5 }),
  ];
  if (lit) return parts.join('');
  // A little of the street's sodium catches the dead panel's lower edge.
  return `<g class="exit-sign" data-detail="exit-out" opacity="0.55">${parts.join('')}${rect(x + 3, y + h - 5, w - 6, 2, C.sodium, { opacity: 0.18 })}</g>`;
}

/**
 * Act III: with the tube and the signs down here out, a faint green spill
 * shows on the wall where the flight turns out of sight, from the running men
 * on the floors above that are still lit.
 */
const signsAbove = () =>
  `<g class="exit-above" data-detail="exit-above">${glow(LANDING_X + STEPS * GO + 60, LANDING_Y - STEPS * RISE - 30, 120, 60, C.tube, 0.1)}</g>`;

/** The first flight and the half-landing: one concrete mass, steps climbing to the left. */
function flightOnePoints(): Array<[number, number]> {
  const pts: Array<[number, number]> = [[FOOT, FLOOR]];
  for (let i = 0; i < STEPS; i++) {
    pts.push([FOOT - i * GO, FLOOR - (i + 1) * RISE], [FOOT - (i + 1) * GO, FLOOR - (i + 1) * RISE]);
  }
  pts.push([LANDING_LEFT, LANDING_Y], [LANDING_LEFT, FLOOR]);
  return pts;
}

/** The second flight, climbing back to the right from the landing, and the soffit under it. */
function flightTwoPoints(): Array<[number, number]> {
  const pts: Array<[number, number]> = [[LANDING_X, LANDING_Y]];
  for (let j = 0; j < STEPS; j++) {
    pts.push([LANDING_X + j * GO, LANDING_Y - (j + 1) * RISE], [LANDING_X + (j + 1) * GO, LANDING_Y - (j + 1) * RISE]);
  }
  const topX = LANDING_X + STEPS * GO;
  const topY = LANDING_Y - STEPS * RISE;
  const soffit = (x: number) => topY + 42 + (topX + 50 - x) * (RISE / GO);
  pts.push([topX + 50, topY], [topX + 50, topY + 42], [LANDING_X - 20, soffit(LANDING_X - 20)]);
  return pts;
}

function stair(): string {
  const one = flightOnePoints();
  const nosings: string[] = [];
  for (let i = 0; i < STEPS; i++) {
    const x = FOOT - i * GO;
    const y = FLOOR - (i + 1) * RISE;
    nosings.push(rect(x - 12, y - 1, 12, 3, '#c9b458', { opacity: 0.32 }), line(x, y, x, y + RISE, '#0d151d', 1.5, { opacity: 0.6 }));
  }
  const twoNosings: string[] = [];
  for (let j = 0; j < STEPS; j++) {
    const x = LANDING_X + (j + 1) * GO;
    const y = LANDING_Y - (j + 1) * RISE;
    twoNosings.push(rect(x - GO, y - 1, 12, 3, '#c9b458', { opacity: 0.25 }));
  }
  // Handrails run parallel to the nosings, a hand's height above them.
  const railOne = (x: number) => FLOOR - 80 - (FOOT - x) * (RISE / GO);
  const railTwo = (x: number) => LANDING_Y - 80 - (x - LANDING_X) * (RISE / GO);
  const balusters: string[] = [];
  for (let x = FOOT - 20; x > LANDING_X; x -= 54) balusters.push(line(x, railOne(x), x, railOne(x) + 80, '#3e4c59', 2));
  for (let x = LANDING_X + 34; x < FOOT; x += 54) balusters.push(line(x, railTwo(x), x, railTwo(x) + 80, '#34414d', 2));

  // Sodium light through the landing window lies in bars across the steps: slanted
  // bands, clipped to a strip that follows the treads and risers.
  const profile = one.slice(0, 1 + 2 * STEPS);
  const strip = [...profile, ...profile.slice().reverse().map(([x, y]): [number, number] => [x - 10, y + 30])];
  const along = Math.hypot(GO, RISE);
  const [ux, uy] = [GO / along, RISE / along];
  const bars = [0.22, 0.47, 0.72].map((t) => {
    const px = LANDING_X + t * (FOOT - LANDING_X);
    const py = LANDING_Y + t * (FLOOR - LANDING_Y);
    const corner = (s1: number, s2: number): [number, number] => [px + s1 * 13 * ux + s2 * 70 * uy, py + s1 * 13 * uy - s2 * 70 * ux];
    return poly([corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)], C.sodium, { opacity: 0.55 });
  });
  // Board marks from the formwork, on the flank of the concrete.
  const formwork = Array.from({ length: 6 }, (_, i) => line(LANDING_LEFT, 500 + i * 32, FOOT, 500 + i * 32, '#202a34', 1.5, { opacity: 0.5 }));
  return group(
    'stair',
    `<clipPath id="stairs-flight"><polygon points="${one.map((p) => p.join(',')).join(' ')}"/></clipPath>`,
    `<clipPath id="stairs-treads"><polygon points="${strip.map((p) => p.join(',')).join(' ')}"/></clipPath>`,
    poly(flightTwoPoints(), '#222d38'),
    ...twoNosings,
    line(LANDING_X, railTwo(LANDING_X), FOOT, railTwo(FOOT), '#5b6b7a', 4, { 'stroke-linecap': 'round' }),
    poly(one, '#26313c'),
    `<g clip-path="url(#stairs-flight)">${formwork.join('')}</g>`,
    ...nosings,
    `<g clip-path="url(#stairs-treads)"><g filter="url(#dr-blur-sm)">${bars.join('')}</g></g>`,
    ...balusters,
    line(FOOT + 10, railOne(FOOT + 10), LANDING_X, railOne(LANDING_X), '#6c7c8a', 4, { 'stroke-linecap': 'round' }),
  );
}

function landingWindow(): string {
  const x = 425;
  const y = 160;
  const w = 90;
  const h = 276;
  return group(
    'landing-window',
    rect(x, y, w, h, 'url(#stairs-night)'),
    glow(x + w - 10, y + h - 30, 70, 60, C.sodium, 0.4),
    rain('stairs-window', x, y, w, h, 0.8),
    rect(x - 8, y - 8, w + 16, 8, C.steel),
    rect(x - 8, y + h, w + 16, 12, C.steelLit),
    rect(x - 8, y - 8, 8, h + 20, C.steel),
    rect(x + w, y - 8, 8, h + 20, C.steel),
    rect(x + w / 2 - 3, y, 6, h, C.steel),
    rect(x, y + 90, w, 5, C.steel),
    rect(x, y + 182, w, 5, C.steel),
    // The light coming in sideways, very faintly, on its way to the steps.
    poly([[x + w, y + 150], [x + w, y + h], [LANDING_X + 250, FLOOR - 40], [LANDING_X + 90, LANDING_Y + 20]], C.sodium, { opacity: 0.03 }),
    glow(LANDING_X + 40, LANDING_Y - 30, 90, 50, C.sodium, 0.12),
  );
}

function exitB(signLit: boolean): string {
  return group(
    'exit-b',
    rect(196, 330, 150, 360, '#16212c'),
    rect(206, 340, 130, 350, '#1d2b33'),
    rect(212, 346, 118, 338, '#213139'),
    exitSign(227, 292, signLit),
    // ALARMED — RELEASED BY SECURITY ONLY
    rect(240, 420, 62, 24, '#b89a3a', { opacity: 0.82 }),
    rect(240, 420, 62, 6, C.red, { opacity: 0.8 }),
    label(244, 438, 'ALARMED', 8, '#1a1a14'),
    // The push bar.
    rect(214, 532, 116, 26, '#2a3846', { rx: 4 }),
    rect(220, 540, 104, 10, '#8794a0', { rx: 4 }),
    rect(208, 528, 14, 34, '#3b4c5d', { rx: 2 }),
    rect(322, 528, 14, 34, '#3b4c5d', { rx: 2 }),
  );
}

function callPoint(): string {
  // Shoulder height: FIRE — BREAK GLASS — PRESS HERE.
  return group(
    'callpoint',
    rect(360, 400, 36, 38, '#b8362d', { rx: 3 }),
    rect(368, 410, 20, 20, '#e6ecef', { opacity: 0.78 }),
    circle(378, 420, 3.2, '#b8362d', { opacity: 0.8 }),
    label(366, 408, 'FIRE', 6, '#f3e6e4'),
    rect(362, 444, 32, 8, '#d9d2c0', { opacity: 0.55 }),
  );
}

function desk(): string {
  const x = 826;
  return group(
    'porter',
    glow(980, 470, 140, 90, C.screen, 0.12),
    // On the wall behind: the building directory.
    rect(862, 300, 170, 92, '#0d151d', { rx: 2 }),
    ...[0, 1, 2, 3, 4, 5].map((i) => rect(874, 314 + i * 12, i % 2 ? 96 : 120, 3, '#9aa8b2', { opacity: 0.35 })),
    // The radio, its dial lit, talking to nobody.
    line(856, 488, 838, 432, '#56636e', 2),
    rect(846, 486, 62, 42, '#2b2621', { rx: 5 }),
    ...[0, 1, 2, 3].map((i) => line(852, 494 + i * 7, 878, 494 + i * 7, '#191512', 2)),
    group('dr-breathe', rect(884, 494, 18, 8, '#e8b25e', { opacity: 0.7 }), halo(893, 498, 10, C.sodium, 0.45)),
    // The tartan flask.
    rect(916, 470, 20, 58, '#3a2a26', { rx: 3 }),
    ...[0, 1, 2, 3].map((i) => rect(916, 478 + i * 12, 20, 3, '#6f4a3a', { opacity: 0.8 })),
    ...[0, 1].map((i) => rect(921 + i * 8, 470, 2, 58, '#3e5a46', { opacity: 0.8 })),
    rect(914, 462, 24, 10, '#4a4f55', { rx: 3 }),
    // The access-log terminal, logged in and patient.
    rect(946, 438, 86, 70, '#0e1319', { rx: 4 }),
    rect(952, 444, 74, 56, '#0e2a2a'),
    ...[0, 1, 2, 3, 4].map((i) => rect(956, 450 + i * 9, i === 2 ? 52 : 40 + ((i * 7) % 20), 3, C.screen, { opacity: i === 2 ? 0.7 : 0.4 })),
    group('dr-blink', rect(958, 492, 6, 4, C.screen)),
    rect(982, 508, 14, 20, '#0e1319'),
    // The empty chair.
    rect(1032, 480, 40, 52, '#0f161d', { rx: 8 }),
    // The counter, the crossword on it, the name plate and the rota.
    rect(x, 528, 244, 14, '#2a3846'),
    rect(x, 528, 244, 3, '#3e5163'),
    rect(x + 10, 542, 224, 148, '#1b2632'),
    rect(x + 10, 542, 224, 6, '#141d27'),
    `<g transform="rotate(-4 1048 524)">${rect(1022, 518, 52, 10, '#d8d2c0', { opacity: 0.7 })}${[0, 1, 2, 3].map((i) => rect(1048 + i * 5, 520, 3, 3, '#3d434a', { opacity: 0.6 })).join('')}</g>`,
    rect(906, 560, 84, 18, '#11171d', { rx: 2 }),
    label(912, 572, 'F. ADEYEMI', 8, '#c9d1d6', { opacity: 0.8 }),
    rect(1004, 566, 38, 50, '#dcd7c8', { opacity: 0.6, transform: 'rotate(3 1023 591)' }),
    ...[0, 1, 2, 3].map((i) => rect(1008, 574 + i * 9, 26, 2.4, '#3d434a', { opacity: 0.5, transform: 'rotate(3 1023 591)' })),
  );
}

function entrance(signLit: boolean): string {
  const x = 1090;
  const y = 250;
  const w = 310;
  const h = FLOOR - y;
  const city = [
    poly([[x, 620], [x, 420], [1150, 420], [1150, 390], [1214, 390], [1214, 620]], '#0c141c'),
    poly([[1214, 620], [1214, 448], [1290, 448], [1290, 620]], '#0a1118'),
    poly([[1290, 620], [1290, 404], [x + w, 404], [x + w, 620]], '#0d151d'),
  ].join('');
  const lit = [
    [1108, 440], [1128, 470], [1176, 410], [1196, 452], [1236, 470], [1300, 430], [1340, 456], [1372, 420],
  ]
    .map(([lx, ly]) => rect(lx!, ly!, 9, 6, C.sodium, { opacity: 0.42 }))
    .join('');
  return group(
    'entrance',
    `<clipPath id="stairs-glass"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`,
    `<g clip-path="url(#stairs-glass)">${[
      rect(x, y, w, h, 'url(#stairs-street)'),
      city,
      lit,
      // The street: the bus shelter, the lamp, the wet road.
      rect(x, 620, w, 70, '#141820'),
      rect(1180, 566, 108, 72, '#1b2733', { opacity: 0.7 }),
      rect(1180, 562, 112, 6, '#2a3846'),
      rect(1276, 574, 12, 56, '#cfe6f2', { opacity: 0.3 }),
      line(1372, FLOOR, 1372, 380, '#1e2a36', 5),
      rect(1352, 374, 30, 8, '#1e2a36', { rx: 3 }),
      glow(1366, 390, 90, 70, C.sodium, 0.5),
      glow(1300, 660, 160, 30, C.sodium, 0.25),
    ].join('')}</g>`,
    rain('stairs-entrance', x, y, w, h, 1.2),
    // Frame, mullions and the two door leaves.
    rect(x - 6, y - 6, w + 12, 8, '#1a2430'),
    rect(x - 6, y - 6, 8, h + 6, '#1a2430'),
    rect(x + w - 2, y - 6, 8, h + 6, '#1a2430'),
    rect(x, 326, w, 7, '#1a2430'),
    rect(1156, y, 7, h, '#1a2430'),
    rect(1327, y, 7, h, '#1a2430'),
    rect(1240, 326, 6, h - 76, '#1a2430'),
    rect(1163, 662, 164, 28, '#1a2430'),
    rect(1226, 470, 6, 96, '#8794a0', { rx: 3 }),
    rect(1254, 470, 6, 96, '#8794a0', { rx: 3 }),
    // The badge reader that will say no.
    rect(1338, 466, 14, 26, '#11171d', { rx: 2 }),
    circle(1345, 473, 2.2, C.red),
    exitSign(1199, 282, signLit),
  );
}

export function stairs(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  const defs = `<defs><linearGradient id="stairs-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1620"/><stop offset="1" stop-color="#14222f"/></linearGradient>
    <linearGradient id="stairs-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a121b"/><stop offset="0.7" stop-color="#1c2028"/><stop offset="1" stop-color="#4a3218"/></linearGradient>
    <linearGradient id="stairs-street" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#09111a"/><stop offset="0.75" stop-color="#191d24"/><stop offset="1" stop-color="#3a2a18"/></linearGradient></defs>`;
  const marks = Array.from({ length: 13 }, (_, i) => line(0, 80 + i * 46, 1600, 80 + i * 46, '#0b141d', 1.5, { opacity: 0.35 }));
  const background = group(
    'layer-bg',
    defs,
    rect(0, 0, 1600, 700, 'url(#stairs-wall)'),
    ...marks,
    rect(0, FLOOR, 1600, 210, '#0b141c'),
    rect(0, FLOOR - 2, 1600, 4, '#1b2b3c'),
    // The entrance throws a little sodium across the floor.
    poly([[1096, FLOOR], [1396, FLOOR], [1520, 900], [1000, 900]], C.sodium, { opacity: 0.05 }),
  );
  return svg(
    'stairs',
    [
      background,
      group('layer-light', tube(860, 40, 300, { on: !dim })),
      dim ? signsAbove() : '',
      landingWindow(),
      exitB(!dim),
      callPoint(),
      stair(),
      desk(),
      entrance(!dim),
    ].join(''),
    { dark: ctx.dark ?? false },
  );
}
