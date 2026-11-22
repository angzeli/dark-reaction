/**
 * Ending: Clocking Off. The top deck of a night bus, looking back through
 * the rear window: rain on the glass, the street running away in sodium
 * orange, and between the wet buildings the Vellacott Building, a dark block
 * with one lit floor, the fourth. Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../../types.ts';
import { C, ellipse, glow, group, halo, hash, line, path, poly, rain, rect, seeded, stillRain, svg } from '../../svg.ts';

const WIN = { x: 170, y: 110, w: 1260, h: 560 };
/** Where the street runs to, and the pavement's line at the near edge of the window. */
const VP = { x: 800, y: 512 };
const GROUND = 730;

/** Buildings along one side of the street, smaller as they go, all running to the vanishing point. */
function side(dir: -1 | 1): string {
  const rnd = seeded(hash(`clocking-side-${dir}`));
  const near = dir < 0 ? WIN.x - 60 : WIN.x + WIN.w + 60;
  const span = Math.abs(near - VP.x);
  const ground = (xx: number) => VP.y + ((GROUND - VP.y) * Math.abs(xx - VP.x)) / span;
  const out: string[] = [];
  let xa = near;
  for (let i = 0; i < 7; i++) {
    const xb = xa + (VP.x - xa) * (0.26 + rnd() * 0.14);
    const height = 240 + rnd() * 300;
    const top = (xx: number) => VP.y - (height * Math.abs(xx - VP.x)) / span;
    out.push(poly([[xa, ground(xa)], [xa, top(xa)], [xb, top(xb)], [xb, ground(xb)]], ['#0b1118', '#0d141c', '#0a1016'][i % 3]!));
    // A few lit windows, warm, smaller with distance.
    for (let k = 0; k < 5; k++) {
      if (rnd() < 0.5) continue;
      const wx = xa + (xb - xa) * (0.15 + rnd() * 0.7);
      const scale = Math.abs(wx - VP.x) / span;
      const wy = top(wx) + (ground(wx) - top(wx)) * (0.12 + rnd() * 0.55);
      out.push(rect(wx, wy, Math.max(3, 16 * scale), Math.max(2, 11 * scale), C.sodium, { opacity: (0.3 + rnd() * 0.3).toFixed(2) }));
    }
    xa = xb;
  }
  return out.join('');
}

/** Street lamps on both kerbs, smaller as they go, with their light lying on the wet road. */
function lamps(): string {
  const out: string[] = [];
  for (const dir of [-1, 1] as const) {
    for (let i = 0; i < 5; i++) {
      const t = 1 - 0.72 ** (i + 1);
      const kerb = dir < 0 ? WIN.x + 120 : WIN.x + WIN.w - 120;
      const x = kerb + (VP.x - kerb) * t;
      const base = GROUND + (VP.y - GROUND) * t;
      const height = 300 * (1 - t);
      const head = base - height;
      const s = 1 - t;
      out.push(
        line(x, base, x, head, '#1a222c', Math.max(2, 7 * s)),
        line(x, head, x - dir * 26 * s, head, '#1a222c', Math.max(2, 6 * s)),
        halo(x - dir * 26 * s, head + 4 * s, Math.max(6, 18 * s), C.sodium, 0.7),
        // Its reflection, a long smear on the wet road.
        rect(x - dir * 26 * s - 5 * s, VP.y + (base - VP.y) * 0.6, Math.max(2.5, 11 * s), (base - VP.y) * 0.45 + 50 * s, C.sodium, { opacity: 0.32 }),
      );
    }
  }
  return out.join('');
}

/** The Vellacott Building, dark, with only its fourth floor lit. */
function vellacott(): string {
  const x = 708;
  const w = 190;
  const top = 250;
  const floor = 46;
  const lit = Array.from({ length: 8 }, (_, i) => rect(x + 12 + i * 22, top + 22, 14, 22, '#f2e2b8', { opacity: 0.85 }));
  const dark = Array.from({ length: 4 }, (_, f) =>
    Array.from({ length: 8 }, (_, i) => rect(x + 12 + i * 22, top + 22 + (f + 1) * floor, 14, 22, '#141c25', { opacity: 0.9 })).join(''),
  );
  return group(
    'vellacott',
    glow(x + w / 2, top + 34, 140, 40, '#f2e2b8', 0.18),
    rect(x, top, w, VP.y - top + 4, '#090e14'),
    // The plant units on its roof.
    rect(x + 24, top - 22, 52, 22, '#090e14'),
    rect(x + 112, top - 16, 60, 16, '#090e14'),
    ...lit,
    ...dark,
  );
}

function glass(): string {
  const { x, y, w, h } = WIN;
  const rnd = seeded(hash('clocking-beads'));
  // Rain on the glass: runs that wander down it, each with a drop at its head.
  const runs = Array.from({ length: 26 }, () => {
    const rx = x + 30 + rnd() * (w - 60);
    const ry = y + rnd() * h * 0.6;
    const len = 60 + rnd() * 160;
    const wob = (rnd() - 0.5) * 14;
    const d = `M${rx.toFixed(1)} ${ry.toFixed(1)} q ${wob.toFixed(1)} ${(len / 2).toFixed(1)} ${(wob / 3).toFixed(1)} ${len.toFixed(1)}`;
    return (
      path(d, 'none', { stroke: '#cfe2ee', 'stroke-width': 1.6, opacity: (0.12 + rnd() * 0.12).toFixed(2) }) +
      ellipse(rx + wob / 3, ry + len + 3, 3, 4.5, '#e6f0f5', { opacity: (0.3 + rnd() * 0.2).toFixed(2) })
    );
  });
  return [stillRain('clocking-still', x, y, w, h, 90), ...runs, rain('clocking-glass', x, y, w, h, 0.9)].join('');
}

export function endingClocking(ctx: ArtContext): string {
  const { x, y, w, h } = WIN;
  const defs = `<defs><linearGradient id="clocking-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05090f"/><stop offset="0.6" stop-color="#151820"/><stop offset="1" stop-color="#4a3220"/></linearGradient>
    <clipPath id="clocking-pane"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="70"/></clipPath></defs>`;
  const outside = `<g clip-path="url(#clocking-pane)">${[
    rect(x, y, w, h, 'url(#clocking-sky)'),
    glow(VP.x, VP.y - 30, 420, 90, C.sodium, 0.2),
    vellacott(),
    side(-1),
    side(1),
    // The pavements, and the road, wet, running back the way you came.
    rect(x, VP.y, w, h, '#0c1016'),
    poly([[x + 90, GROUND], [x + w - 90, GROUND], [VP.x + 24, VP.y], [VP.x - 24, VP.y]], '#10151c'),
    poly([[VP.x - 3, VP.y], [VP.x + 3, VP.y], [VP.x + 40, y + h], [VP.x - 40, y + h]], '#d8cfb9', { opacity: 0.08 }),
    // The wet road holding the sodium light.
    glow(VP.x, 640, 360, 70, C.sodium, 0.16),
    glow(VP.x, 560, 180, 30, C.sodium, 0.2),
    lamps(),
    glass(),
  ].join('')}</g>`;
  // The top deck: its ceiling light, the frame round the rear window, the last row of seats.
  const deck = group(
    'deck',
    rect(0, 0, 1600, 900, '#0d1218'),
    rect(0, 0, 1600, 70, '#151c23'),
    rect(300, 26, 1000, 12, '#cfe6dc', { opacity: 0.55, rx: 6 }),
    glow(800, 40, 520, 60, '#cfe6dc', 0.08),
  );
  const frame = group(
    'frame',
    `<rect x="${x - 18}" y="${y - 18}" width="${w + 36}" height="${h + 36}" rx="84" fill="none" stroke="#1d262f" stroke-width="22"/>`,
    `<rect x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="74" fill="none" stroke="#3a4652" stroke-width="3" opacity="0.6"/>`,
  );
  // The last row's seat backs, each with its grab rail.
  const seat = (sx: number) =>
    `<rect x="${sx}" y="748" width="470" height="200" rx="40" fill="#1a1f2e"/>` +
    rect(sx + 20, 768, 430, 8, '#2b3350', { opacity: 0.8 }) +
    rect(sx + 40, 714, 390, 12, '#8794a0', { rx: 6 }) +
    rect(sx + 52, 722, 10, 30, '#6c7884') +
    rect(sx + 408, 722, 10, 30, '#6c7884');
  // The stop-request bell, on the right-hand rail.
  const seats = group('seats', seat(240), seat(890), rect(1236, 706, 26, 14, C.red, { rx: 4, opacity: 0.85 }));
  return svg('ending.clocking', [defs, deck, outside, frame, seats].join(''), { dark: ctx.dark ?? false });
}
