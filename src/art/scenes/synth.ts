/**
 * 4.12 Synthesis lab, 02:47. Three fume hoods lit like empty aquariums and
 * breathing in unison; the Kraken, an eight-port Schlenk line on its
 * lattice, backlit against them (port 4 is a bare joint: nothing has ever
 * hung there); the rotavap; the periodic table poster; tonight's fraction
 * rack; Tom's shelf. Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../types.ts';
import { C, circle, ellipse, glow, group, hash, label, line, path, poly, rect, seeded, svg, tube } from '../svg.ts';

/** Glass reads against the lit hoods and the dark wall alike: a dark rim under a pale edge. */
const GLASS = { fill: '#bfe3ec', edge: '#d3ecf2', rim: '#050d14' };

function glass(d: string, fillOpacity = 0.1): string {
  return (
    path(d, 'none', { stroke: GLASS.rim, 'stroke-width': 4.5, 'stroke-opacity': 0.5, 'stroke-linejoin': 'round' }) +
    path(d, GLASS.fill, { 'fill-opacity': fillOpacity, stroke: GLASS.edge, 'stroke-width': 1.6, 'stroke-opacity': 0.62, 'stroke-linejoin': 'round' })
  );
}

/** Rounded rectangle as a path. */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;

/** A tube of width `w` from one point to another, as a closed path. */
function tubePath(x1: number, y1: number, x2: number, y2: number, w: number): string {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / len) * (w / 2);
  const ny = ((x2 - x1) / len) * (w / 2);
  const p = (x: number, y: number) => `${x.toFixed(1)} ${y.toFixed(1)}`;
  return `M${p(x1 + nx, y1 + ny)}L${p(x2 + nx, y2 + ny)}L${p(x2 - nx, y2 - ny)}L${p(x1 - nx, y1 - ny)}z`;
}

/** Neck and bulb of a round-bottomed flask hanging from (x, top); `open` leaves the mouth unstroked. */
function flaskPath(x: number, top: number, neck: number, r: number, open = false): string {
  const half = 6;
  const cy = top + neck + r;
  const yJoin = cy - Math.sqrt(r * r - half * half);
  return `M${x - half} ${top}V${yJoin.toFixed(1)}A${r} ${r} 0 1 0 ${x + half} ${yJoin.toFixed(1)}V${top}${open ? '' : 'z'}`;
}

const highlight = (x1: number, y1: number, x2: number, y2: number, opacity = 0.4) =>
  line(x1, y1, x2, y2, '#ffffff', 1.4, { opacity, 'stroke-linecap': 'round' });

// ── Fume hoods ─────────────────────────────────────────────────────────────

const HOODS = [350, 590, 830];
const HOOD_W = 240;

function hoodBody(x0: number): string {
  return [
    rect(x0 + 92, -60, 56, 210, '#121c26'),
    rect(x0 + 92, -60, 6, 210, '#18242f'),
    rect(x0 + 86, 136, 68, 14, '#1b2733'),
    rect(x0, 150, HOOD_W, 540, '#1a2632'),
    rect(x0, 150, 14, 540, '#1f2d3a'),
    rect(x0 + HOOD_W - 14, 150, 14, 540, '#16212c'),
    // Fascia and its airflow monitor.
    rect(x0, 150, HOOD_W, 48, '#1f2c39'),
    rect(x0 + 146, 161, 70, 26, '#0a1015', { rx: 3 }),
    circle(x0 + 158, 174, 3.2, C.tube, { opacity: 0.9 }),
    label(x0 + 168, 178, '0.48', 10, C.tube, { opacity: 0.75 }),
    // Solvent cabinet underneath.
    rect(x0 + 10, 528, 220, 162, '#131d27'),
    rect(x0 + 16, 536, 101, 148, '#17222d'),
    rect(x0 + 123, 536, 101, 148, '#17222d'),
    poly([[x0 + 66, 552], [x0 + 74, 560], [x0 + 66, 568], [x0 + 58, 560]], '#b89a3a', { opacity: 0.45 }),
    poly([[x0 + 174, 552], [x0 + 182, 560], [x0 + 174, 568], [x0 + 166, 560]], C.red, { opacity: 0.45 }),
  ].join('');
}

function hoodInterior(x0: number): string {
  const x = x0 + 14;
  const w = HOOD_W - 28;
  return [
    rect(x, 198, w, 316, 'url(#synth-hood)'),
    // Back baffles: the slots the air leaves by.
    rect(x + 14, 284, w - 28, 6, '#0f211e', { opacity: 0.55 }),
    rect(x + 14, 390, w - 28, 6, '#0f211e', { opacity: 0.55 }),
    rect(x + 14, 470, w - 28, 6, '#0f211e', { opacity: 0.6 }),
    line(x + 70, 214, x + 70, 500, '#0f211e', 1.5, { opacity: 0.3 }),
    line(x + w - 70, 214, x + w - 70, 500, '#0f211e', 1.5, { opacity: 0.3 }),
    rect(x, 496, w, 18, '#1d3331'),
    // The hood light behind its diffuser.
    rect(x + 10, 203, w - 20, 7, '#e4f8ec', { opacity: 0.92, rx: 2 }),
    glow(x0 + HOOD_W / 2, 236, 110, 60, C.tube, 0.32),
  ].join('');
}

function hoodFront(x0: number): string {
  const x = x0 + 14;
  const w = HOOD_W - 28;
  return [
    // The sash, all the way down: glass with a little sheen.
    rect(x, 198, w, 300, '#e8f6f0', { opacity: 0.035 }),
    line(x + 30, 480, x + 120, 222, '#ffffff', 10, { opacity: 0.035 }),
    line(x + 74, 486, x + 158, 246, '#ffffff', 4, { opacity: 0.05 }),
    rect(x0 + 12, 196, HOOD_W - 24, 7, '#3a4b5b'),
    rect(x0 + 12, 196, 6, 316, '#2c3b49'),
    rect(x0 + HOOD_W - 18, 196, 6, 316, '#2c3b49'),
    rect(x0 + 12, 494, HOOD_W - 24, 20, '#364a5b'),
    rect(x0 + 44, 500, HOOD_W - 88, 6, '#6a7f92', { rx: 3 }),
    rect(x0 + 8, 514, HOOD_W - 16, 13, '#44586a', { rx: 5 }),
  ].join('');
}

// ── The Kraken ─────────────────────────────────────────────────────────────

/** What hangs on each port, 1 to 8. Port 4 is bare until Act III brings its flask. */
type Holds = 'flask' | 'schlenk' | 'tube' | 'stopper' | 'none' | 'dark';
interface PortDef {
  holds: Holds;
  r?: number;
  clip?: string;
}
const PORTS: ReadonlyArray<PortDef> = [
  { holds: 'flask', r: 24, clip: '#b89a3a' },
  { holds: 'stopper' },
  { holds: 'stopper' },
  { holds: 'none' },
  { holds: 'flask', r: 18, clip: '#4f78a0' },
  { holds: 'schlenk', r: 22, clip: '#b89a3a' },
  { holds: 'tube' },
  { holds: 'flask', r: 30, clip: '#5f8f5a' },
];
/** Act III: her flask, on the joint where nothing has ever been (synth.port4). */
const PORT_4_ACT_3: PortDef = { holds: 'dark', r: 20, clip: '#b89a3a' };
const portsFor = (act: number): ReadonlyArray<PortDef> => (act === 3 ? PORTS.map((p, i) => (i === 3 ? PORT_4_ACT_3 : p)) : PORTS);
const portX = (i: number) => 470 + 80 * i;
const VAC_Y = 274; // top of the vacuum manifold (16 high)
const GAS_Y = 305; // top of the nitrogen manifold (14 high)
const JOINT_Y = 386; // top of each port's ground-glass joint

function port(i: number, { holds, r = 22, clip }: PortDef): string {
  const x = portX(i);
  const n = i + 1;
  const parts: string[] = [
    // Stem down from the vacuum line, through the tap, to the joint.
    glass(rr(x - 5, VAC_Y + 14, 10, 52, 4), 0.12),
    glass(rr(x - 17, 338, 34, 14, 7), 0.16),
    rect(x + 15, 334, 7, 22, '#d6dde2', { opacity: 0.55, rx: 2 }),
    glass(rr(x - 5, 352, 10, JOINT_Y - 350, 4), 0.12),
    // The ground-glass joint: frosted, and open at the bottom when bare.
    poly([[x - 8, JOINT_Y], [x + 8, JOINT_Y], [x + 6.5, JOINT_Y + 20], [x - 6.5, JOINT_Y + 20]], '#dfeaee', {
      opacity: 0.42,
      stroke: GLASS.rim,
      'stroke-opacity': 0.4,
      'stroke-width': 2,
    }),
    // Its number, on a strip of masking tape on the nitrogen line.
    rect(x + 7, GAS_Y + 1, 15, 15, '#d8cfb4', { opacity: 0.88, rx: 1 }),
    label(x + 10.5, GAS_Y + 12.5, String(n), 11, '#2a2118'),
  ];
  if (n === 3) parts.push(rect(x - 7, 360, 14, 9, '#16191d', { opacity: 0.85 })); // tape over the crack
  const top = JOINT_Y + 20;
  if (holds === 'none') {
    parts.push(ellipse(x, top, 6, 2.2, '#04080c', { opacity: 0.8 }));
  } else if (holds === 'stopper') {
    parts.push(glass(rr(x - 6, top - 2, 12, 10, 3), 0.25), glass(rr(x - 11, top + 7, 22, 7, 3.5), 0.3));
  } else if (holds === 'tube') {
    parts.push(
      glass(`M${x - 7} ${top}V${top + 88}a7 7 0 0 0 14 0V${top}z`, 0.12),
      glass(rr(x + 6, top + 14, 20, 7, 3), 0.14),
      rect(x + 22, top + 10, 5, 15, '#d6dde2', { opacity: 0.5, rx: 2 }),
      highlight(x - 3, top + 8, x - 3, top + 80, 0.35),
    );
  } else if (holds === 'dark') {
    // Wrapped in foil to the neck, its tap closed, a paper label in tidy pencil.
    const foil = flaskPath(x, top + 12, 10, r);
    const cy = top + 22 + r;
    const rnd = seeded(hash('synth-port4-foil'));
    const crinkles = Array.from({ length: 8 }, (_, k) => {
      const fx = x - r + rnd() * r * 2;
      const fy = top + 14 + rnd() * (r * 2 + 6);
      return poly([[fx, fy], [fx + 5 + rnd() * 6, fy + 3], [fx + 2, fy + 8 + rnd() * 8]], k % 2 ? '#e6ecef' : '#6f7b84', { opacity: 0.5 });
    });
    parts.push(
      glass(flaskPath(x, top, 22, r), 0.1),
      `<clipPath id="synth-port4-foil"><path d="${foil}"/></clipPath>`,
      path(foil, '#a9b3ba', { stroke: GLASS.rim, 'stroke-width': 2, 'stroke-opacity': 0.5 }),
      `<g clip-path="url(#synth-port4-foil)">${crinkles.join('')}</g>`,
      highlight(x - r * 0.6, cy + r * 0.1, x - r * 0.4, cy - r * 0.45, 0.5),
      // The sidearm, its key turned across it: closed.
      glass(rr(x + 5, top + 4, 22, 7, 3), 0.14),
      rect(x + 19, top - 2, 5, 19, '#d6dde2', { opacity: 0.8, rx: 2 }),
      `<g transform="rotate(-7 ${x} ${cy + 3})">${rect(x - 13, cy - 5, 26, 15, '#e8e0c8')}${line(x - 9, cy, x + 8, cy, '#7a7f86', 1.2)}${line(x - 9, cy + 5, x + 4, cy + 5, '#7a7f86', 1.2)}</g>`,
    );
    if (clip) parts.push(rect(x - 9, top - 6, 18, 6, clip, { opacity: 0.65, rx: 2 }));
  } else {
    parts.push(glass(flaskPath(x, top, 22, r), 0.11), highlight(x - r * 0.55, top + 22 + r * 0.6, x - r * 0.35, top + 22 + r * 0.25, 0.45));
    if (holds === 'schlenk') parts.push(glass(rr(x + 5, top + 6, 22, 7, 3), 0.14), rect(x + 22, top + 2, 5, 15, '#d6dde2', { opacity: 0.5, rx: 2 }));
    if (clip) parts.push(rect(x - 9, top - 6, 18, 6, clip, { opacity: 0.65, rx: 2 }));
  }
  return `<g class="kraken-port" data-port="${n}" data-holds="${holds}">${parts.join('')}</g>`;
}

/** The vacuum hose down to the pump: a tentacle that disappears behind the bench. */
const krakenHose = () =>
  path('M330 381 C 314 384, 312 404, 315 440 L 316 640', 'none', { stroke: '#1b1517', 'stroke-width': 10, 'stroke-linecap': 'round' }) +
  path('M326 386 C 316 392, 314 410, 316 440', 'none', { stroke: '#4a3c3c', 'stroke-width': 2, opacity: 0.45 });

function kraken(act: number): string {
  const left = 352;
  const right = 1092;
  return group(
    'kraken',
    // Lattice.
    rect(396, 230, 7, 360, '#243140'),
    rect(1100, 230, 7, 360, '#243140'),
    rect(396, 234, 711, 6, '#243140'),
    // Cold trap down into its dewar.
    glass(rr(352, VAC_Y + 4, 12, 80, 5), 0.12),
    glass(rr(342, 352, 32, 92, 11), 0.14),
    glass(rr(322, 377, 24, 9, 4), 0.14),
    rect(328, 430, 66, 160, '#273644', { rx: 6 }),
    rect(337, 440, 6, 140, '#465b6e', { opacity: 0.5 }),
    ellipse(361, 431, 33, 7, '#3b4c5d'),
    ellipse(361, 431, 25, 4.5, '#081017'),
    // The two manifolds.
    glass(rr(left, VAC_Y, right - left, 16, 8), 0.13),
    highlight(left + 10, VAC_Y + 4, right - 10, VAC_Y + 4, 0.42),
    glass(rr(420, GAS_Y, 712, 14, 7), 0.12),
    highlight(430, GAS_Y + 3.5, 1122, GAS_Y + 3.5, 0.35),
    // Clamps holding them to the lattice.
    rect(392, VAC_Y - 2, 18, 20, '#151e27', { rx: 2 }),
    rect(1096, GAS_Y - 2, 18, 18, '#151e27', { rx: 2 }),
    // Someone's tape, never taken off.
    rect(400, VAC_Y - 1, 64, 18, '#d8cfb4', { opacity: 0.85, transform: `rotate(-2 432 ${VAC_Y + 8})` }),
    label(404, VAC_Y + 12, 'THE KRAKEN', 8, '#33281d', { transform: `rotate(-2 432 ${VAC_Y + 8})` }),
    // Oil bubbler at the far end of the nitrogen line.
    glass(rr(1124, GAS_Y + 8, 10, 46, 4), 0.12),
    glass(rr(1114, 352, 30, 72, 11), 0.14),
    rect(1118, 396, 22, 24, C.copper, { opacity: 0.32, rx: 6 }),
    glass(rr(1135, 340, 8, 18, 3), 0.12),
    ...portsFor(act).map((p, i) => port(i, p)),
  );
}

// ── Rotavap, poster, shelf, rack ───────────────────────────────────────────

function rotavap(): string {
  // The drive head tilts at 28°; the vapour duct leaves its lower end for the flask.
  const a = (28 * Math.PI) / 180;
  const hx = 1336;
  const hy = 458;
  const endX = hx - 48 * Math.cos(a);
  const endY = hy + 48 * Math.sin(a);
  const neckX = endX - 46 * Math.cos(a);
  const neckY = endY + 46 * Math.sin(a);
  const coil = Array.from({ length: 7 }, (_, i) => `${i === 0 ? 'M' : 'L'}${i % 2 ? 1338 : 1322} ${384 + i * 9}`).join('');
  return group(
    'rotavap',
    // Condenser above, receiving flask below.
    glass(rr(1318, 374, 24, 96, 10), 0.12),
    path(coil, 'none', { stroke: GLASS.edge, 'stroke-width': 1.4, opacity: 0.55 }),
    rect(1315, 368, 30, 8, '#2a3846', { rx: 2 }),
    path('M1342 380 C 1372 372, 1414 392, 1416 456', 'none', { stroke: '#141a20', 'stroke-width': 5 }),
    glass(flaskPath(1330, 474, 18, 22), 0.11),
    // Lift post and drive head.
    rect(1388, 400, 14, 188, '#2a3846'),
    rect(1362, 576, 66, 12, '#1d2935'),
    rect(1368, 444, 24, 14, '#2a3846'),
    `<g transform="rotate(-28 ${hx} ${hy})">${rect(hx - 48, hy - 18, 96, 36, '#34444f', { rx: 8 })}${rect(hx - 30, hy - 10, 24, 8, C.tube, { opacity: 0.4 })}${group('dr-blink', circle(hx + 4, hy - 6, 2.6, C.tube))}</g>`,
    // Vapour duct and the evaporating flask, half in the bath.
    rect(1160, 530, 130, 10, '#1a232c', { rx: 4 }),
    glass(tubePath(endX, endY, neckX, neckY, 11), 0.14),
    // The flask hangs off the duct along its axis (62° from straight down).
    `<g transform="rotate(62 ${neckX.toFixed(1)} ${neckY.toFixed(1)})">${glass(flaskPath(neckX, neckY, 8, 30, true), 0.11)}</g>`,
    // A steel bath on its copper base, the water just catching the light.
    rect(1160, 536, 130, 34, '#2f3c48', { rx: 4 }),
    rect(1160, 536, 130, 3, '#9fc4d4', { opacity: 0.3 }),
    rect(1166, 543, 6, 24, '#45586a', { opacity: 0.6 }),
    rect(1154, 568, 142, 20, C.copperDim, { rx: 4 }),
    rect(1154, 568, 142, 2, C.copper, { opacity: 0.5 }),
    circle(1174, 578, 5, '#2c2018'),
    rect(1188, 574, 22, 8, '#1b120c'),
    rect(1191, 576, 12, 4, C.copper, { opacity: 0.6 }),
  );
}

function periodicTable(x: number, y: number): string {
  const pitch = 14;
  const size = 12;
  const cells: string[] = [];
  const fill = (row: number, col: number) =>
    row === 1 && col === 1 ? '#8f9aa2' : col <= 2 ? '#9c7a5e' : col === 18 ? '#7d7690' : col >= 13 ? '#6c8a72' : '#5f7686';
  for (let row = 1; row <= 7; row++) {
    for (let col = 1; col <= 18; col++) {
      const present = row === 1 ? col === 1 || col === 18 : row <= 3 ? col <= 2 || col >= 13 : true;
      if (present) cells.push(rect(x + (col - 1) * pitch, y + (row - 1) * pitch, size, size, fill(row, col), { opacity: 0.5 }));
    }
  }
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 15; col++) cells.push(rect(x + (col + 2.5) * pitch, y + 7 * pitch + 8 + row * pitch, size, size, '#8f8160', { opacity: 0.45 }));
  }
  return cells.join('');
}

function poster(): string {
  const x = 1110;
  const y = 200;
  return group(
    'poster',
    rect(x, y, 276, 178, '#bfb7a3', { opacity: 0.36 }),
    rect(x + 12, y + 10, 150, 7, '#25303b', { opacity: 0.45 }),
    periodicTable(x + 12, y + 26),
    rect(x - 6, y - 5, 30, 12, '#d8cfb4', { opacity: 0.45, transform: `rotate(-20 ${x + 9} ${y + 1})` }),
    rect(x + 252, y - 5, 30, 12, '#d8cfb4', { opacity: 0.45, transform: `rotate(20 ${x + 267} ${y + 1})` }),
    // The bottom right corner has started to lift.
    poly([[x + 276, y + 160], [x + 276, y + 178], [x + 258, y + 178]], '#111f2e'),
    poly([[x + 276, y + 160], [x + 256, y + 172], [x + 258, y + 178]], '#d8cfb9', { opacity: 0.3 }),
  );
}

function shelf(): string {
  const bottles = [
    [158, 26, 54, C.copperDim],
    [190, 22, 42, '#6b4a33'],
    [218, 30, 60, C.copperDim],
    [256, 24, 48, '#7d868c'],
    [288, 28, 38, '#6b4a33'],
  ] as const;
  return group(
    'shelf',
    ...bottles.map(([x, w, h, fill]) =>
      rect(x, 352 - h, w, h, fill, { rx: 4, opacity: 0.85 }) + rect(x + 3, 352 - h * 0.62, w - 6, h * 0.34, '#d9d0bb', { opacity: 0.35 }),
    ),
    rect(148, 352, 192, 8, '#26323e'),
    rect(160, 360, 6, 16, '#1d2832'),
    rect(322, 360, 6, 16, '#1d2832'),
    // Tom's label on the shelf edge.
    rect(232, 353, 58, 12, C.paper, { opacity: 0.55 }),
    label(237, 362, 'TOM’S', 8, '#3a2a22'),
  );
}

function fractionRack(): string {
  const back: string[] = [];
  const front: string[] = [];
  const tubeShape = (x: number, top: number, bottom: number) => `M${x} ${top}V${bottom - 3.5}a3.5 3.5 0 0 0 7 0V${top}z`;
  for (let j = 0; j < 12; j++) {
    const xb = 160 + 12 * j;
    back.push(
      rect(xb + 1, 552, 5, 28, '#d9ece4', { opacity: 0.12 }),
      path(tubeShape(xb, 506, 582), 'none', { stroke: GLASS.edge, 'stroke-width': 1.2, 'stroke-opacity': 0.32 }),
    );
    const xf = 166 + 12 * j;
    front.push(
      rect(xf + 1, 556, 5, 30, '#d9ece4', { opacity: 0.16 }),
      path(tubeShape(xf, 514, 588), 'none', { stroke: GLASS.edge, 'stroke-width': 1.3, 'stroke-opacity': 0.55 }),
    );
  }
  return group(
    'rack',
    glow(236, 560, 120, 50, C.tube, 0.07),
    ...back,
    rect(152, 540, 158, 7, '#34495b'),
    ...front,
    rect(152, 578, 158, 10, '#2a3a4a'),
    rect(152, 540, 5, 48, '#2a3a4a'),
    rect(305, 540, 5, 48, '#2a3a4a'),
    // Tonight's TLC plate leaning against the rack.
    `<g transform="rotate(-7 214 588)">${rect(206, 548, 18, 40, '#dcd7c8', { opacity: 0.75 })}${line(208, 582, 222, 582, '#6b6b6b', 0.8)}${circle(211, 568, 1.5, '#6f7592')}${circle(218, 561, 1.5, '#6f7592')}${circle(218, 552, 1.2, '#6f7592', { opacity: 0.6 })}</g>`,
  );
}

export function synth(ctx: ArtContext): string {
  const dim = ctx.act === 3;
  const grads = `<linearGradient id="synth-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1622"/><stop offset="1" stop-color="#13243a"/></linearGradient>
    <linearGradient id="synth-hood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46705f"/><stop offset="0.55" stop-color="#27453e"/><stop offset="1" stop-color="#172d2a"/></linearGradient>`;

  const background = group(
    'layer-bg',
    `<defs>${grads}</defs>`,
    rect(0, 0, 1600, 700, 'url(#synth-wall)'),
    rect(0, 690, 1600, 210, C.floor),
    rect(0, 688, 1600, 4, '#1b2b3c'),
  );

  const tubes = group('layer-light', tube(160, 46, 320, { on: true }), tube(1120, 46, 320, { flicker: true, on: !dim }));

  // The hoods breathe together: one group, one animation. In Act III they fall out of
  // step, the third lagging behind like a sleeper's second breath.
  const breathe = (xs: number[], style = '') =>
    `<g class="dr-breathe"${style}>${[...xs.map(hoodInterior), ...xs.map((x0) => glow(x0 + HOOD_W / 2, 380, 150, 230, C.tube, 0.09))].join('')}</g>`;
  const hoods = [
    group('hoods', ...HOODS.map(hoodBody)),
    dim ? breathe(HOODS.slice(0, 2)) + breathe(HOODS.slice(2), ' style="animation-delay:-4.4s"') : breathe(HOODS),
    group('hood-fronts', ...HOODS.map(hoodFront)),
  ].join('');

  const bench = group(
    'bench',
    rect(140, 588, 1320, 16, '#1e2b38'),
    rect(140, 588, 1320, 3, '#36544b'),
    rect(150, 604, 1300, 138, '#0d1720'),
    ...[280, 410, 540, 670, 800, 930, 1060, 1190, 1320].map((x) => line(x, 610, x, 736, '#091018', 2) + rect(x - 40, 614, 26, 4, '#1c2834', { rx: 2 })),
    rect(156, 742, 1288, 12, '#070d13'),
    glow(720, 600, 420, 26, C.tube, 0.1),
  );

  // The room is drawn 45 units high and shifted down, so the hoods' monitors and the
  // bench top both fall inside the play screen's wide crop.
  const room = `<g transform="translate(0 45)">${[shelf(), poster(), hoods, krakenHose(), bench, fractionRack(), kraken(ctx.act), rotavap()].join('')}</g>`;
  return svg('synth', [background, tubes, room].join(''), { dark: ctx.dark ?? false });
}
