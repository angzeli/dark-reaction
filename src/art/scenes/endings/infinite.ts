/**
 * Ending: Infinite Loop. Your desk in the Research Write-Up Room: the notebook open,
 * every page in your handwriting; the wall clock stopped at 03:33; on hot
 * desk 7 two mugs now, hers with 晨 on it and yours; the monitor showing the
 * page of j's. The room has started to come loose: it is drawn twice, the
 * second time a little out of register, like a double exposure. Entirely
 * still: no flicker, no rain, no motion of any kind, so it holds the same
 * with every setting. Part of the creative content (CC BY-NC-SA 4.0).
 */
import type { ArtContext } from '../../types.ts';
import { C, circle, clockHands, glow, group, hash, line, path, poly, rect, seeded, svg, tube } from '../../svg.ts';

/**
 * 晨, as an outline: the glyph from Noto Serif TC (SIL OFL 1.1, credited in CREDITS.md) in a
 * 1000-unit em box, so her mug reads the same in the gallery's still <img>, where page fonts
 * don't reach.
 */
const CHEN =
  'M293 880Q316 876 356.5 866Q397 856 448 842.5Q499 829 552 815L556 830Q521 848 457.5 880.5Q394 913 323 947L293 880ZM357 640L372 649L372 877L315 902L338 873Q354 905 343.5 929Q333 953 322 959L270 882Q295 867 301.5 859Q308 851 308 840L308 640L357 640ZM502 632Q531 685 577.5 727Q624 769 684 799Q744 829 814 849.5Q884 870 959 882L959 893Q916 901 903 950Q805 925 724.5 885Q644 845 583.5 785Q523 725 486 642L502 632ZM865 720Q859 727 851 729Q843 731 828 726Q795 745 743.5 767.5Q692 790 645 808L632 795Q660 777 689 754.5Q718 732 745 709Q772 686 788 669L865 720ZM153 415L153 392L231 425L218 425L218 561Q218 606 213.5 657.5Q209 709 193 763Q177 817 143.5 867.5Q110 918 54 960L41 947Q92 889 115.5 824Q139 759 146 692Q153 625 153 561L153 425L153 415ZM857 579Q857 579 871 589Q885 599 904 614.5Q923 630 939 644Q936 660 913 660L182 660L173 631L812 631L857 579ZM756 479Q756 479 769.5 488.5Q783 498 801 512Q819 526 834 541Q831 557 809 557L183 557L175 527L716 527L756 479ZM832 371Q832 371 840 377.5Q848 384 860.5 394Q873 404 887.5 416Q902 428 914 439Q910 455 887 455L172 455L172 425L788 425L832 371ZM276 376Q276 379 268 384.5Q260 390 248 393.5Q236 397 222 397L212 397L212 90L212 57L212 57L282 90L782 90L782 119L276 119L276 376ZM733 90L770 49L851 112Q846 118 834.5 123Q823 128 808 131L808 362Q808 365 798.5 369.5Q789 374 776.5 378Q764 382 753 382L743 382L743 90L733 90ZM776 316L776 345L235 345L235 316L776 316ZM779 201L779 231L237 231L237 201L779 201Z';

/** The loop's last minute, on every clock. */
const STOPPED = 46; // 03:33

function wall(): string {
  return [
    rect(0, 0, 1600, 900, '#0f1c29'),
    rect(0, 0, 1600, 640, '#0b1622', { opacity: 0.5 }),
    rect(0, 640, 1600, 260, C.floor),
    tube(560, 40, 480, { on: true }),
  ].join('');
}

function clock(): string {
  const cx = 360;
  const cy = 210;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return line(cx + Math.cos(a) * 52, cy + Math.sin(a) * 52, cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, '#8a98a3', 3);
  });
  return group(
    'clock',
    circle(cx, cy, 74, '#0c141c', { stroke: '#3b4c5d', 'stroke-width': 7 }),
    ...ticks,
    `<g transform="translate(${cx} ${cy}) scale(1.7) translate(${-cx} ${-cy})">${clockHands(cx, cy, STOPPED)}</g>`,
    circle(cx, cy, 5, '#c9d3da'),
  );
}

/** The page of j's: what was on the screen when you came to, every time. */
function monitor(): string {
  const x = 860;
  const y = 262;
  const rows = Array.from({ length: 12 }, (_, i) =>
    `<text x="${x + 22}" y="${y + 40 + i * 21}" fill="#cfe6f2" font-size="17" font-family="IBM Plex Mono, monospace" letter-spacing="1" opacity="${i === 11 ? 0.5 : 0.75}">${'j'.repeat(i === 11 ? 17 : 33)}</text>`,
  );
  return group(
    'monitor',
    glow(x + 220, y + 150, 300, 200, C.screen, 0.14),
    rect(x - 14, y - 14, 468, 308, '#0e1319', { rx: 6 }),
    rect(x, y, 440, 280, '#16303f'),
    ...rows,
    rect(x + 22 + 17 * 11.2, y + 264, 9, 16, '#cfe6f2', { opacity: 0.8 }),
    rect(x + 190, y + 294, 60, 44, '#10161d'),
    rect(x + 150, y + 334, 140, 8, '#10161d'),
  );
}

/** The notebook, open, every line of it in your hand. */
function notebook(): string {
  const rnd = seeded(hash('infinite-hand'));
  const scrawl = (x0: number, x1: number, y0: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const y = y0 + i * 15;
      let d = `M${x0} ${y}`;
      let x = x0;
      while (x < x1 - 10) {
        const step = 8 + rnd() * 10;
        d += ` q ${(step / 2).toFixed(1)} ${((rnd() - 0.5) * 9).toFixed(1)} ${step.toFixed(1)} 0`;
        x += step;
      }
      return path(d, 'none', { stroke: '#24324a', 'stroke-width': 1.6, opacity: (0.55 + rnd() * 0.3).toFixed(2) });
    });
  return group(
    'notebook',
    // The pages underneath, all used.
    poly([[566, 838], [1036, 838], [1060, 652], [544, 652]], '#cfc6b2'),
    poly([[562, 830], [1040, 830], [1062, 646], [540, 646]], '#ddd3bd'),
    // The open spread.
    poly([[570, 822], [800, 830], [800, 640], [552, 636]], '#efe5cf'),
    poly([[800, 830], [1032, 822], [1050, 636], [800, 640]], '#ebe1ca'),
    line(800, 640, 800, 830, '#b9ac90', 2),
    ...scrawl(580, 786, 660, 11),
    ...scrawl(816, 1026, 660, 11),
    // In the margin, smaller, crowded into the corner.
    path('M1000 790 q 8 -5 16 0 t 16 0', 'none', { stroke: '#24324a', 'stroke-width': 1.2, opacity: 0.6 }),
    path('M996 806 q 6 -4 12 0 t 12 0 t 12 0', 'none', { stroke: '#24324a', 'stroke-width': 1.2, opacity: 0.6 }),
  );
}

/** Hot desk 7: the boxes, her mug with 晨 on it, and yours beside it now. */
function hotDesk(): string {
  return group(
    'hotdesk',
    rect(70, 560, 380, 14, '#1a2633'),
    rect(80, 574, 10, 120, '#121b25'),
    rect(430, 574, 10, 120, '#121b25'),
    rect(96, 470, 170, 90, '#3b2d20'),
    rect(110, 400, 140, 70, '#463626'),
    // Hers.
    path('M300 560 v-62 h52 v62 z', '#d9d2c4'),
    path('M352 512 q 24 2 0 28', 'none', { stroke: '#d9d2c4', 'stroke-width': 7 }),
    path(CHEN, '#24324a', { transform: 'translate(311 514) scale(0.03)', opacity: 0.85 }),
    // Yours.
    path('M372 560 v-54 h46 v54 z', '#3f5f7a'),
    path('M418 518 q 20 2 0 24', 'none', { stroke: '#3f5f7a', 'stroke-width': 7 }),
  );
}

/** Your desk, seen from your chair: its top running towards you. */
function desk(): string {
  return group(
    'desk',
    poly([[500, 600], [1600, 600], [1600, 872], [430, 872]], '#16212c'),
    rect(500, 600, 1100, 3, '#2d4052'),
    rect(430, 872, 1170, 18, '#1c2937'),
    // The keyboard, where your cheek was.
    poly([[1126, 640], [1380, 640], [1396, 690], [1114, 690]], '#10171f'),
    ...Array.from({ length: 4 }, (_, i) => line(1130 + i * 2, 652 + i * 11, 1384 + i * 3, 652 + i * 11, '#1c2733', 2)),
  );
}

export function endingInfinite(ctx: ArtContext): string {
  const room = `<g id="infinite-room">${[wall(), clock(), hotDesk(), desk(), monitor(), notebook()].join('')}</g>`;
  // The room again, a little out of register: the loop starting to come loose.
  const ghost = `<use href="#infinite-room" x="22" y="-12" opacity="0.14"/><use href="#infinite-room" x="-12" y="8" opacity="0.07"/>`;
  return svg('ending.infinite', room + ghost, { dark: ctx.dark ?? false });
}
