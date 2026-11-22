/**
 * B.05 Cold room and solvent store, 02:47. Cold blue light on insulated
 * panels; the −80 °C freezer along one wall like a white chest in an attic,
 * its display reading −80 and frost at the seals; the yellow solvent
 * cabinets with their yellow diamonds and brown bottles behind glass; a squat
 * steel dewar breathing a thin white plume; a stack of Tom's boxes.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, ellipse, glow, group, hash, label, line, path, poly, rect, seeded, svg } from '../svg.ts';

/** Furniture is drawn standing on y 690 and lifted 30 to the floor line, inside the play crop. */
const FLOOR = 690;
const LIFT = 30;
const FROST = '#eef7fb';

function room(dim: boolean): string {
  const seams = Array.from({ length: 13 }, (_, i) => line(120 + i * 120, 120, 120 + i * 120, FLOOR - LIFT, '#0d1720', 2, { opacity: 0.6 }));
  // A caged strip light, cold rather than green.
  const light = group(
    `cold-light${dim ? ' dr-flicker' : ''}`,
    glow(700, 80, 340, 110, C.screen, 0.16),
    rect(520, 36, 360, 16, '#1b2733', { rx: 3 }),
    rect(530, 40, 340, 7, '#dff2fb', { opacity: 0.92, rx: 3 }),
    ...Array.from({ length: 9 }, (_, i) => line(540 + i * 40, 34, 540 + i * 40, 54, '#2a3846', 2)),
  );
  return [
    group(
      'layer-bg',
      `<defs><linearGradient id="cold-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1823"/><stop offset="1" stop-color="#162636"/></linearGradient></defs>`,
      rect(0, 0, 1600, 700, 'url(#cold-wall)'),
      ...seams,
      rect(0, 120, 1600, 3, '#1b2a39'),
      // Basement services overhead.
      rect(0, 70, 1600, 14, '#121c26'),
      rect(0, 90, 1600, 8, '#101922'),
      rect(0, FLOOR - LIFT, 1600, 210 + LIFT, '#0b141c'),
      rect(0, FLOOR - LIFT - 2, 1600, 4, '#1d2e3e'),
      // Cold settling on the floor.
      glow(560, FLOOR - LIFT + 10, 420, 26, '#cfe6f2', 0.07),
    ),
    light,
    glow(700, 300, 520, 220, C.screen, 0.05),
  ].join('');
}

function door(): string {
  return group(
    'door',
    rect(48, 290, 150, 400, '#16212c'),
    rect(58, 300, 130, 390, '#26343f'),
    rect(92, 330, 62, 46, '#0f1a24', { stroke: '#3b4c5d', 'stroke-width': 3 }),
    rect(150, 480, 30, 12, '#8794a0', { rx: 4 }),
    rect(166, 470, 10, 32, '#5d6a74', { rx: 3 }),
  );
}

function freezer(): string {
  const rnd = seeded(hash('cold-frost'));
  const crystals: string[] = [];
  for (let x = 238; x < 814; x += 7 + rnd() * 9) {
    crystals.push(circle(x, 497 + (rnd() - 0.5) * 3, 1.2 + rnd() * 2.2, FROST, { opacity: 0.5 + rnd() * 0.4 }));
  }
  const bloom = (cx: number, cy: number) =>
    Array.from({ length: 9 }, () => circle(cx + (rnd() - 0.5) * 26, cy + (rnd() - 0.5) * 12, 1 + rnd() * 2.5, FROST, { opacity: 0.4 + rnd() * 0.4 })).join('');
  return group(
    'freezer',
    ellipse(526, FLOOR, 320, 10, C.shadow, { opacity: 0.5 }),
    // The white chest, the lid, frost along the seal.
    rect(232, 494, 586, 190, '#8a98a3', { rx: 6 }),
    rect(232, 494, 586, 10, '#7a8893'),
    rect(232, 664, 586, 20, '#6f7c86', { rx: 4 }),
    rect(224, 470, 602, 28, '#a2b0ba', { rx: 6 }),
    rect(228, 470, 594, 4, '#c3d0d8', { rx: 2 }),
    ...crystals,
    bloom(236, 500),
    bloom(812, 500),
    rect(300, 508, 300, 8, '#5d6a74', { rx: 4 }),
    // Someone's inventory, taped to the front.
    rect(276, 548, 50, 64, '#e2dccb', { opacity: 0.55, transform: 'rotate(-2 301 580)' }),
    ...[0, 1, 2, 3, 4].map((i) => rect(282, 558 + i * 9, 36, 2.4, '#3d434a', { opacity: 0.5, transform: 'rotate(-2 301 580)' })),
    // The vent and the castors.
    rect(380, 630, 170, 30, '#7a8792', { rx: 3 }),
    ...[0, 1, 2, 3].map((i) => line(388, 637 + i * 6, 542, 637 + i * 6, '#5d6a74', 2)),
    circle(262, 686, 5, '#1b2631'),
    circle(788, 686, 5, '#1b2631'),
    // The panel: −80, reassurance or a threat.
    rect(660, 516, 140, 62, '#1a2229', { rx: 4 }),
    rect(670, 526, 88, 40, '#140808', { rx: 2 }),
    glow(714, 546, 44, 20, '#ff7b6b', 0.25),
    `<text x="714" y="556" fill="#ff7b6b" font-size="24" font-family="IBM Plex Mono, monospace" text-anchor="middle" letter-spacing="1">−80</text>`,
    group('dr-blink', circle(778, 534, 2.6, C.tube)),
    circle(778, 556, 5, '#2f3a44', { stroke: '#5d6a74', 'stroke-width': 1.5 }),
  );
}

function dewar(): string {
  const rnd = seeded(hash('cold-dewar'));
  const lace = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI;
    return circle(880 - Math.cos(a) * 16, 596 + Math.sin(a) * 5 + rnd() * 2, 1.4 + rnd() * 1.4, FROST, { opacity: 0.75 });
  });
  return group(
    'dewar',
    ellipse(880, FLOOR, 46, 7, C.shadow, { opacity: 0.5 }),
    // Its breath: a thin white plume, rising and thinning.
    group(
      'dr-breathe',
      path('M880 576 C 872 548, 892 528, 884 500 S 870 456, 890 424', 'none', {
        stroke: '#f2f8fb',
        'stroke-width': 10,
        'stroke-linecap': 'round',
        opacity: 0.12,
        filter: 'url(#dr-blur-sm)',
      }),
      path('M880 576 C 874 552, 890 532, 884 506 S 874 470, 886 440', 'none', {
        stroke: '#f2f8fb',
        'stroke-width': 3,
        'stroke-linecap': 'round',
        opacity: 0.22,
      }),
    ),
    rect(846, 604, 68, 82, '#56636e', { rx: 12 }),
    rect(852, 610, 7, 70, '#8a98a3', { opacity: 0.55, rx: 3 }),
    rect(866, 588, 28, 20, '#66747f', { rx: 4 }),
    rect(862, 578, 36, 11, '#3b4c5d', { rx: 3 }),
    ...lace,
  );
}

function cabinets(): string {
  const bottle = (x: number, y: number) => rect(x, y - 44, 22, 44, '#3a2416', { rx: 5 }) + rect(x + 7, y - 54, 8, 11, '#2a1a10') + rect(x + 3, y - 32, 16, 14, '#d9d0bb', { opacity: 0.45 });
  const one = (x: number, tag: string) => [
    rect(x, 300, 130, 390, '#706633'),
    rect(x, 300, 130, 6, '#857a3c'),
    rect(x + 8, 314, 55, 368, '#7b7036'),
    rect(x + 67, 314, 55, 368, '#7b7036'),
    // Glass in the upper doors, and the bottles behind it.
    rect(x + 14, 326, 43, 150, '#1b1c16'),
    rect(x + 73, 326, 43, 150, '#1b1c16'),
    rect(x + 14, 400, 102, 4, '#4a4428'),
    bottle(x + 18, 398),
    bottle(x + 78, 398),
    bottle(x + 18, 472),
    bottle(x + 90, 472),
    line(x + 16, 470, x + 56, 330, '#ffffff', 4, { opacity: 0.05 }),
    line(x + 75, 470, x + 115, 330, '#ffffff', 4, { opacity: 0.05 }),
    // Yellow warning diamonds.
    poly([[x + 65, 532], [x + 89, 556], [x + 65, 580], [x + 41, 556]], '#d4b13c', { stroke: '#1a1a14', 'stroke-width': 2 }),
    path(`M${x + 65} ${568} c-8 -4 -6 -12 0 -18 c0 8 8 8 4 18 z`, '#1a1a14'),
    rect(x + 58, 490, 4, 30, '#4a4428', { rx: 2 }),
    rect(x + 68, 490, 4, 30, '#4a4428', { rx: 2 }),
    rect(x + 24, 616, 82, 12, '#1a1a14', { opacity: 0.75 }),
    label(x + 30, 625, tag, 7, '#d4b13c'),
  ];
  return group('cabinets', ...one(940, 'FLAMMABLE'), ...one(1076, 'FLAMMABLE'));
}

/** On the wall: a shelf of ice buckets and cryoboxes, the temperature log, a face-shield sign. */
function wall(): string {
  const boxes = ['#3f6a8a', '#5f8f5a', C.red, '#b89a3a'];
  return group(
    'wall',
    rect(250, 404, 230, 8, '#2a3846'),
    rect(268, 412, 6, 16, '#1d2832'),
    rect(456, 412, 6, 16, '#1d2832'),
    rect(262, 358, 74, 46, '#c3ccd2', { opacity: 0.8, rx: 3 }),
    rect(262, 358, 74, 6, '#dbe3e8', { opacity: 0.8, rx: 2 }),
    rect(346, 370, 60, 34, '#b7c1c8', { opacity: 0.75, rx: 3 }),
    ...boxes.map((b, i) => rect(416 + (i % 2) * 28, 404 - 16 * (Math.floor(i / 2) + 1), 26, 15, b, { opacity: 0.7 })),
    // The temperature log, initialled every morning but not this one.
    rect(560, 372, 48, 66, '#4a3a2e', { rx: 3 }),
    rect(565, 382, 38, 52, '#e2dccb', { opacity: 0.6 }),
    rect(576, 368, 16, 8, '#8794a0', { rx: 2 }),
    ...[0, 1, 2, 3, 4].map((i) => rect(569, 390 + i * 8, 30, 2, '#3d434a', { opacity: 0.5 })),
    // Wear a face shield.
    circle(880, 392, 17, '#2f5f8f', { opacity: 0.9 }),
    path('M872 386 q8 -9 16 0 v10 q-8 6 -16 0 z', '#e6ecef', { opacity: 0.9 }),
    rect(866, 412, 28, 7, '#e6ecef', { opacity: 0.5 }),
  );
}

function tomsBoxes(): string {
  const box = (x: number, y: number, w: number, h: number, fill: string, tag: string) =>
    [
      rect(x, y, w, h, fill),
      rect(x, y, w, 6, '#6b5440', { opacity: 0.7 }),
      rect(x + w / 2 - 12, y, 24, h, '#7a6650', { opacity: 0.35 }),
      rect(x + 12, y + 16, 64, 16, '#e2dccb', { opacity: 0.7 }),
      label(x + 16, y + 27, tag, 7, '#3a2a22'),
    ].join('');
  return group(
    'toms-boxes',
    box(1236, 600, 152, 90, '#5a4630', 'TOM’S'),
    box(1250, 524, 132, 76, '#4f3d29', 'TOM’S'),
    box(1242, 452, 144, 72, '#5e4a33', 'THESIS'),
  );
}

export function cold(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  const lifted = `<g transform="translate(0 ${-LIFT})">${[door(), wall(), freezer(), cabinets(), dewar(), tomsBoxes()].join('')}</g>`;
  return svg('cold', room(dim) + lifted, { dark: ctx.dark ?? false });
}
