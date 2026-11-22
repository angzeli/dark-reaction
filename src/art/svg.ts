/**
 * Small helpers for authoring scene illustrations as SVG markup strings.
 * Scenes live in a 1600 × 900 viewBox. Everything here returns strings so
 * scenes stay plain functions of their context and can be tested without a
 * DOM.
 */

export const W = 1600;
export const H = 900;

/** The palette (docs/DESIGN.md §17). */
export const C = {
  night0: '#070e16',
  night1: '#0b1622',
  night2: '#122233',
  night3: '#1d3346',
  wall: '#0f1c29',
  wallLit: '#15263a',
  floor: '#0a131d',
  steel: '#2a3846',
  steelLit: '#3b4c5d',
  tube: '#9fe3b5',
  tubeDim: '#4f7d66',
  screen: '#a9d4e8',
  copper: '#b07a4f',
  copperDim: '#5e4330',
  sodium: '#e0913a',
  paper: '#efe5cf',
  red: '#b0403a',
  shadow: '#04080d',
} as const;

type Attrs = Record<string, string | number | undefined>;

export function attrs(a: Attrs): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}="${v}"`)
    .join(' ');
}

export const rect = (x: number, y: number, w: number, h: number, fill: string, extra: Attrs = {}) =>
  `<rect ${attrs({ x, y, width: w, height: h, fill, ...extra })}/>`;

export const poly = (points: Array<[number, number]>, fill: string, extra: Attrs = {}) =>
  `<polygon ${attrs({ points: points.map((p) => p.join(',')).join(' '), fill, ...extra })}/>`;

export const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, width = 2, extra: Attrs = {}) =>
  `<line ${attrs({ x1, y1, x2, y2, stroke, 'stroke-width': width, ...extra })}/>`;

export const circle = (cx: number, cy: number, r: number, fill: string, extra: Attrs = {}) =>
  `<circle ${attrs({ cx, cy, r, fill, ...extra })}/>`;

export const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra: Attrs = {}) =>
  `<ellipse ${attrs({ cx, cy, rx, ry, fill, ...extra })}/>`;

export const path = (d: string, fill: string, extra: Attrs = {}) => `<path ${attrs({ d, fill, ...extra })}/>`;

export const group = (cls: string, ...children: string[]) => `<g class="${cls}">${children.join('')}</g>`;

/** Mono lettering for signs and screens (IBM Plex Mono is self-hosted). */
export const label = (x: number, y: number, text: string, size: number, fill: string, extra: Attrs = {}) =>
  `<text ${attrs({ x, y, fill, 'font-size': size, 'font-family': 'IBM Plex Mono, monospace', ...extra })}>${escapeXml(text)}</text>`;

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * A soft glow behind a light source (blurred ellipse), for pools of light.
 * Its blur is wide, and SVG clips a blur to twice the shape's size, so keep
 * both radii at 20 or more; a small light gets a `halo` instead.
 */
export const glow = (cx: number, cy: number, rx: number, ry: number, color: string, opacity = 0.35, cls = '') =>
  `<ellipse ${attrs({ cx, cy, rx, ry, fill: color, opacity, filter: 'url(#dr-blur-lg)', class: cls || undefined })}/>`;

/** A small soft halo round a point light: an LED, a warning lamp, a lit dial. */
export const halo = (cx: number, cy: number, r: number, color: string, opacity = 0.5) =>
  `<circle ${attrs({ cx, cy, r, fill: color, opacity, filter: 'url(#dr-blur-sm)' })}/>`;

/**
 * A ceiling fluorescent tube with its pool of light. `flicker` adds the
 * irregular stutter animation (disabled by the "disable flicker" setting).
 */
export function tube(x: number, y: number, w: number, opts: { flicker?: boolean; on?: boolean } = {}): string {
  const on = opts.on ?? true;
  const cls = `dr-tube${opts.flicker ? ' dr-flicker' : ''}`;
  return group(
    cls,
    rect(x - 6, y - 4, w + 12, 14, C.steel),
    on ? glow(x + w / 2, y + 30, w * 0.75, 90, C.tube, 0.16) : '',
    rect(x, y, w, 7, on ? C.tube : C.tubeDim, { rx: 3, opacity: on ? 0.95 : 0.5 }),
  );
}

/**
 * Rain on a window pane: falling streaks clipped to the pane plus a few
 * drops sliding down the glass (`drops: false` for rain in the open air).
 * Animated with CSS (paused by reduce motion). Deterministic: the same pane
 * always gets the same rain.
 */
export function rain(id: string, x: number, y: number, w: number, h: number, density = 1, opts: { drops?: boolean } = {}): string {
  const rnd = seeded(hash(id));
  const streaks: string[] = [];
  const n = Math.round((w * h) / 9000 * density);
  for (let i = 0; i < n; i++) {
    const sx = x + rnd() * w;
    const len = 18 + rnd() * 30;
    const delay = (rnd() * -2).toFixed(2);
    const dur = (0.55 + rnd() * 0.5).toFixed(2);
    streaks.push(
      `<line class="dr-rain" x1="${sx.toFixed(1)}" y1="${(y - 60).toFixed(1)}" x2="${(sx - 6).toFixed(1)}" y2="${(y - 60 + len).toFixed(1)}" stroke="#9fb7c9" stroke-width="1.2" opacity="${(0.18 + rnd() * 0.25).toFixed(2)}" style="--fall:${h + 80}px;animation-duration:${dur}s;animation-delay:${delay}s"/>`,
    );
  }
  const drops: string[] = [];
  const m = opts.drops === false ? 0 : Math.round((w * h) / 26000 * density);
  for (let i = 0; i < m; i++) {
    const dx = x + rnd() * w;
    const dy = y + rnd() * h * 0.7;
    const delay = (rnd() * -14).toFixed(2);
    const dur = (7 + rnd() * 9).toFixed(2);
    drops.push(
      `<ellipse class="dr-drop" cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" rx="${(1.5 + rnd() * 1.8).toFixed(1)}" ry="${(2.2 + rnd() * 2.4).toFixed(1)}" fill="#cfe2ee" opacity="${(0.25 + rnd() * 0.3).toFixed(2)}" style="--slide:${(h * (0.25 + rnd() * 0.5)).toFixed(0)}px;animation-duration:${dur}s;animation-delay:${delay}s"/>`,
    );
  }
  return `<clipPath id="clip-${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><g clip-path="url(#clip-${id})">${streaks.join('')}${drops.join('')}</g>`;
}

/** Clock hands at the loop's time (minute 0 is 02:47), for the wall clocks. */
export function clockHands(cx: number, cy: number, minute: number): string {
  const total = 2 * 60 + 47 + minute;
  const h = ((total / 60) % 12) / 12;
  const m = (total % 60) / 60;
  const hand = (frac: number, len: number, w: number) => {
    const a = frac * Math.PI * 2 - Math.PI / 2;
    return line(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len, '#c9d3da', w, { 'stroke-linecap': 'round' });
  };
  return hand(h, 20, 4) + hand(m, 30, 2.5);
}

/** Shared definitions every scene needs: blurs and the ordered-dither pattern. */
export function defs(): string {
  return `<defs>
    <filter id="dr-blur-lg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="28"/></filter>
    <filter id="dr-blur-sm" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
    <pattern id="dr-dither" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="1" height="1" fill="#fff"/><rect x="2" y="2" width="1" height="1" fill="#fff"/>
      <rect x="2" width="1" height="1" fill="#000"/><rect y="2" width="1" height="1" fill="#000"/>
    </pattern>
  </defs>`;
}

/** Wrap scene layers in a full SVG element with the dither overlay on top. */
export function svg(id: string, body: string, opts: { dark?: boolean } = {}): string {
  return `<svg class="dr-scene${opts.dark ? ' dr-scene--dark' : ''}" data-art="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${defs()}${body}<rect class="dr-dither" width="${W}" height="${H}" fill="url(#dr-dither)" opacity="0.05"/></svg>`;
}

/** Deterministic PRNG (mulberry32) so illustrations never change between renders. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
