/**
 * Ending: Fire Alarm (secret). The car park at the assembly point, in full
 * dark and steady rain. The Vellacott Building is lit from top to bottom,
 * every window, because the rules say it must be; two fire engines stand
 * with their blue lights going round on the wet tarmac; under the assembly
 * point sign a small figure in a foil blanket holds a cup of tea, the
 * porter's tartan flask on the ground beside them. Nothing is burning. It is
 * a false alarm, and everyone is being very patient about it.
 * Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../../types.ts';
import { C, circle, glow, group, halo, hash, line, path, poly, rain, rect, seeded, stillRain, svg } from '../../svg.ts';

const BLUE = '#5fa8ff';
const TARMAC = 600;

/** The Vellacott Building, every window lit. */
function building(): string {
  const x = 380;
  const w = 640;
  const top = 150;
  const floors = 5;
  const fh = 74;
  const rnd = seeded(hash('fire-windows'));
  const windows: string[] = [];
  for (let f = 0; f < floors; f++) {
    for (let i = 0; i < 12; i++) {
      const warm = rnd() < 0.7;
      windows.push(rect(x + 24 + i * 50, top + 26 + f * fh, 32, 40, warm ? '#f2e2b8' : '#dfeef5', { opacity: (0.7 + rnd() * 0.25).toFixed(2) }));
    }
  }
  const ground = top + floors * fh + 20;
  return group(
    'vellacott',
    glow(x + w / 2, top + 200, 460, 260, '#f2e2b8', 0.16),
    rect(x, top, w, ground - top + 30, '#141b23'),
    // The plant units on the roof, and the propped roof door.
    rect(x + 60, top - 34, 90, 34, '#141b23'),
    rect(x + 420, top - 26, 120, 26, '#141b23'),
    ...windows,
    // The main entrance, held wide open by the alarm, light pouring out.
    rect(x + w / 2 - 70, ground - 40, 140, 70, '#fff3d6', { opacity: 0.9 }),
    rect(x + w / 2 - 4, ground - 40, 8, 70, '#141b23'),
    rect(x + w / 2 - 48, ground - 70, 96, 22, '#2f9a5a', { opacity: 0.85 }),
    poly([[x + w / 2 - 70, ground + 30], [x + w / 2 + 70, ground + 30], [x + w / 2 + 150, ground + 110], [x + w / 2 - 150, ground + 110]], '#fff3d6', { opacity: 0.1 }),
  );
}

/** Windows of light lying in the wet car park. */
function reflections(): string {
  const rnd = seeded(hash('fire-wet'));
  return Array.from({ length: 30 }, () => {
    const x = 400 + rnd() * 600;
    return rect(x, TARMAC + 10 + rnd() * 40, 6 + rnd() * 10, 60 + rnd() * 120, '#f2e2b8', { opacity: (0.05 + rnd() * 0.08).toFixed(2) });
  }).join('');
}

/** A fire engine, side on, its blue lights going round. */
function engine(x: number, facing: 1 | -1, delay: string): string {
  const w = 470;
  const y = 470;
  const cab = facing > 0 ? x + w - 140 : x;
  const lights = [cab + 24, cab + 112];
  return group(
    'engine',
    // The blue light on the tarmac, going round with the beacons.
    `<g class="dr-blink" style="animation-delay:${delay}">${glow(x + w / 2, TARMAC + 110, 330, 46, BLUE, 0.22)}${glow(lights[0]!, y - 12, 60, 40, BLUE, 0.35)}</g>`,
    // Body, lockers, the ladder on the roof.
    rect(x, y, w, 170, '#4a1a17', { rx: 10 }),
    rect(x, y + 120, w, 50, '#3a1513'),
    ...[0, 1, 2].map((i) => rect((facing > 0 ? x + 20 : x + 160) + i * 96, y + 24, 84, 90, '#5c221d', { rx: 4 })),
    rect(facing > 0 ? x + 20 : x + 160, y + 100, 290, 6, '#d8cfb9', { opacity: 0.5 }),
    rect(x + 30, y - 22, w - 60, 10, '#7d8992'),
    ...Array.from({ length: 12 }, (_, i) => rect(x + 40 + i * 33, y - 30, 4, 22, '#7d8992')),
    rect(x + 30, y - 34, w - 60, 8, '#7d8992'),
    // The cab, its windscreen dark.
    rect(cab, y - 4, 140, 130, '#521c18', { rx: 14 }),
    rect(facing > 0 ? cab + 60 : cab + 14, y + 14, 66, 52, '#0c1218', { rx: 6 }),
    // Beacons.
    rect(cab + 10, y - 20, 120, 16, '#1b2733', { rx: 6 }),
    `<g class="dr-blink" style="animation-delay:${delay}">${lights.map((lx) => halo(lx, y - 12, 14, BLUE, 0.8) + rect(lx - 10, y - 18, 20, 12, '#cfe6ff', { rx: 4 })).join('')}</g>`,
    // Wheels.
    circle(x + 90, y + 170, 36, '#0a0d10'),
    circle(x + 90, y + 170, 14, '#3b4c5d'),
    circle(x + w - 90, y + 170, 36, '#0a0d10'),
    circle(x + w - 90, y + 170, 14, '#3b4c5d'),
  );
}

/** You, at the assembly point, in a foil blanket you don't need, with tea. */
function you(): string {
  const x = 930;
  const feet = 826;
  const head = { y: feet - 206, r: 23 };
  const neck = head.y + head.r;
  // The blanket: round the shoulders and down to the knees, open at the front for the tea.
  const foil = [
    `M${x - 18} ${neck}`,
    `C${x - 52} ${neck + 4} ${x - 62} ${neck + 26} ${x - 64} ${neck + 52}`,
    `L${x - 84} ${feet - 46}`,
    `Q${x} ${feet - 30} ${x + 84} ${feet - 46}`,
    `L${x + 64} ${neck + 52}`,
    `C${x + 62} ${neck + 26} ${x + 52} ${neck + 4} ${x + 18} ${neck}`,
    'Z',
  ].join('');
  const rnd = seeded(hash('fire-foil'));
  // Crinkles in the foil, catching the building's light or the blue.
  const facets = Array.from({ length: 10 }, (_, i) => {
    const fx = x - 66 + rnd() * 120;
    const fy = neck + 30 + rnd() * 120;
    return poly([[fx, fy], [fx + 4 + rnd() * 6, fy + 3], [fx + 2, fy + 20 + rnd() * 16]], ['#dfeeff', '#f4ead0', '#7f8c96'][i % 3]!, { opacity: 0.32 });
  });
  return group(
    'you',
    // The assembly point sign: green, white figures gathering.
    line(1060, feet, 1060, 540, '#3b4c5d', 6),
    rect(1014, 468, 92, 74, '#2f8a4a'),
    ...[0, 1, 2].map((i) => circle(1034 + i * 26, 490, 6, '#e8f6ee') + rect(1030 + i * 26, 498, 8, 24, '#e8f6ee', { rx: 3 })),
    // Legs, and the head: a silhouette against the building's light behind it.
    rect(x - 34, feet - 50, 24, 50, '#1c2228'),
    rect(x + 10, feet - 50, 24, 50, '#1c2228'),
    halo(x - 4, head.y - 4, head.r + 12, '#f2e2b8', 0.35),
    circle(x, head.y, head.r, '#1c2228'),
    // The foil.
    `<clipPath id="fire-foil"><path d="${foil}"/></clipPath>`,
    path(foil, '#aeb8bf'),
    `<g clip-path="url(#fire-foil)">${facets.join('')}</g>`,
    path(`M${x - 64} ${neck + 52} L${x - 84} ${feet - 46}`, 'none', { stroke: '#cfe6ff', 'stroke-width': 3, opacity: 0.6 }),
    path(`M${x + 64} ${neck + 52} L${x + 84} ${feet - 46}`, 'none', { stroke: '#f2e2b8', 'stroke-width': 3, opacity: 0.55 }),
    // Hands round the tea, at the chest, and its steam.
    rect(x - 24, neck + 62, 48, 16, '#0c1014', { rx: 7 }),
    rect(x - 14, neck + 44, 28, 30, '#efe9dc', { rx: 3 }),
    group(
      'dr-breathe',
      path(`M${x - 4} ${neck + 38} C ${x - 14} ${neck + 14}, ${x + 12} ${neck - 4}, ${x + 2} ${neck - 34}`, 'none', {
        stroke: '#e8edf0',
        'stroke-width': 4,
        'stroke-linecap': 'round',
        opacity: 0.4,
        filter: 'url(#dr-blur-sm)',
      }),
    ),
    // Femi's tartan flask, on the wet ground beside you.
    rect(x + 104, feet - 66, 30, 66, '#3a2a26', { rx: 4 }),
    ...[0, 1, 2, 3].map((i) => rect(x + 104, feet - 58 + i * 14, 30, 4, '#7a3a34', { opacity: 0.85 })),
    ...[0, 1].map((i) => rect(x + 111 + i * 12, feet - 66, 3, 66, '#3e5a46', { opacity: 0.85 })),
    rect(x + 102, feet - 76, 34, 12, '#4a4f55', { rx: 3 }),
  );
}

export function endingFire(ctx: ArtContext): string {
  const defs = `<defs><linearGradient id="fire-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04070c"/><stop offset="0.7" stop-color="#121722"/><stop offset="1" stop-color="#2e261e"/></linearGradient></defs>`;
  const ground = group(
    'layer-bg',
    defs,
    rect(0, 0, 1600, TARMAC + 10, 'url(#fire-sky)'),
    rect(0, TARMAC, 1600, 300, '#0d1116'),
    // Parking bays, worn.
    ...Array.from({ length: 9 }, (_, i) => line(80 + i * 180, TARMAC + 160, 40 + i * 190, 900, '#c9c2b0', 3, { opacity: 0.12 })),
    // A sodium lamp at the edge of the car park.
    line(150, TARMAC + 40, 150, 260, '#1b2733', 6),
    rect(150, 254, 46, 10, '#1b2733', { rx: 3 }),
    glow(172, 270, 90, 60, C.sodium, 0.32),
    glow(190, TARMAC + 90, 220, 40, C.sodium, 0.2),
  );
  return svg(
    'ending.fire',
    [
      ground,
      building(),
      reflections(),
      engine(20, 1, '0s'),
      engine(1110, -1, '-1.2s'),
      you(),
      stillRain('fire-still', 0, 0, 1600, 900, 300),
      rain('fire-rain', 0, 0, 1600, 900, 0.45, { drops: false }),
    ].join(''),
    { dark: ctx.dark ?? false },
  );
}
