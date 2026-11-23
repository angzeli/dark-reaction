/**
 * Layer 2 of the playtest QA: the hands and eyes of an AI playtester. One
 * long-running server holds a real Chromium with a separate context (own
 * storage, viewport, touch, motion preference) for each player; each
 * command is a short CLI call, so an agent plays the way a person does:
 * look at the screen, decide, act, look again.
 *
 *   node scripts/qa/drive.ts serve --port 4300 --out qa-play       # once
 *   node scripts/qa/drive.ts <player> <command> [args…]             # per move
 *
 * Players are made on first use with `start`:
 *   start <url> [--viewport 390x844] [--touch] [--reduce-motion] [--lang zh-TW] [--at <target>]
 *   --at puts a save at one of Layer 3's screens (lib/targets.ts, e.g. act2-office, act3-nmr)
 *   in the autosave slot, so the player can Continue from deep in the game instead of 02:47
 *   of a new one (about 220 commands from a new game rarely gets far into Act II).
 * Commands:
 *   look                    screenshot of what is on screen now; prints the file and the
 *                           visible controls with their centres (a person can see them)
 *   read                    the visible text of the page (to read long passages)
 *   click <x> <y>           mouse click at a point          click-text <text>   on the control showing it
 *   tap <x> <y>             finger tap (touch players)       tap-text <text>
 *   key <Key> [times]       press a key (Enter, Tab, Shift+Tab, Escape, 1, n, ArrowDown, Space…)
 *   type <text>             type into whatever has focus
 *   ime <text> [--enter]    compose <text> with an input method; --enter presses Enter
 *                           while still composing, as a Chinese typist does to pick a candidate
 *   scroll <dy>             scroll the page (pixels; negative is up)
 *   wait <ms>               let time pass (≤ 10000)
 *   reload                  reload the page        resize <w>x<h>    change the window
 *   focus                   what has keyboard focus, and whether its focus ring shows
 *   a11y                    what a screen reader would be given (ARIA snapshot)
 * Every command is logged to <out>/<player>/log.jsonl for repro steps.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import { envelopeFor } from './lib/browser.ts';
import { targets } from './lib/targets.ts';

const args = process.argv.slice(2);
const PORT = Number(process.env.DR_DRIVE_PORT ?? 4300);

interface Player {
  context: BrowserContext;
  page: Page;
  shots: number;
  touch: boolean;
  errors: string[];
}

if (args[0] === 'serve') {
  const port = Number(args[args.indexOf('--port') + 1] || PORT);
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1]! : 'qa-play';
  void serve(port, out);
} else {
  void client(args);
}

async function client(argv: string[]): Promise<void> {
  const [player, command, ...rest] = argv;
  if (!player || !command) {
    console.error('usage: drive.ts <player> <command> [args…]  (or: drive.ts serve)');
    process.exit(2);
  }
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/`, { method: 'POST', body: JSON.stringify({ player, command, args: rest }) });
    const text = await r.text();
    console.log(text);
    process.exit(r.ok ? 0 : 1);
  } catch (e) {
    console.error(`no driver on port ${PORT}: ${(e as Error).message}`);
    process.exit(1);
  }
}

async function serve(port: number, out: string): Promise<void> {
  mkdirSync(out, { recursive: true });
  const browser: Browser = await chromium.launch();
  const players = new Map<string, Player>();

  const controls = async (page: Page) =>
    page.evaluate(() => {
      const out: string[] = [];
      const seen = new Set<Element>();
      for (const el of document.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="radio"], [role="tab"], [tabindex]:not([tabindex="-1"]), .choice')) {
        if (seen.has(el)) continue;
        seen.add(el);
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        if (r.width === 0 || r.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
        if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
        const name = (el.getAttribute('aria-label') ?? (el as HTMLElement).innerText ?? (el as HTMLInputElement).value ?? '').trim().replace(/\s+/g, ' ').slice(0, 60);
        out.push(`  (${Math.round(r.left + r.width / 2)}, ${Math.round(r.top + r.height / 2)}) ${el.tagName.toLowerCase()}${(el as HTMLInputElement).disabled ? ' [disabled]' : ''}: ${name || '(no name)'}`);
      }
      const below = document.documentElement.scrollHeight - (scrollY + innerHeight);
      if (below > 10) out.push(`  … the page continues ${Math.round(below)} px below (scroll to see it)`);
      if (scrollY > 10) out.push(`  … ${Math.round(scrollY)} px above`);
      return out.join('\n');
    });

  const run = async (name: string, command: string, a: string[]): Promise<string> => {
    if (command === 'start') {
      const url = a[0];
      if (!url) throw new Error('start <url> [--viewport WxH] [--touch] [--reduce-motion] [--lang zh-TW] [--at <target>]');
      const old = players.get(name);
      if (old) await old.context.close();
      const vp = (a.includes('--viewport') ? a[a.indexOf('--viewport') + 1]! : '1440x900').split('x').map(Number);
      const touch = a.includes('--touch');
      const lang = a.includes('--lang') ? a[a.indexOf('--lang') + 1]! : 'en-GB';
      const context = await browser.newContext({
        viewport: { width: vp[0]!, height: vp[1]! },
        hasTouch: touch,
        isMobile: touch,
        locale: lang,
        reducedMotion: a.includes('--reduce-motion') ? 'reduce' : 'no-preference',
        deviceScaleFactor: 1,
      });
      if (a.includes('--at')) {
        const at = a[a.indexOf('--at') + 1];
        const target = targets().find((x) => x.name === at);
        if (!target?.state) throw new Error(`no Layer 3 target "${at}" with a game in it: ${targets().filter((x) => x.state).map((x) => x.name).join(', ')}`);
        const save = envelopeFor(target.state);
        await context.addInitScript((env) => {
          if (!sessionStorage.getItem('dr-drive-seeded')) {
            localStorage.setItem('dark-reaction.save.auto', env);
            sessionStorage.setItem('dr-drive-seeded', '1');
          }
        }, save);
      }
      const page = await context.newPage();
      const p: Player = { context, page, shots: 0, touch, errors: [] };
      page.on('pageerror', (e) => p.errors.push(`page error: ${e.message}`));
      page.on('console', (m) => {
        if (m.type() === 'error') p.errors.push(`console error: ${m.text()}`);
      });
      players.set(name, p);
      mkdirSync(join(out, name), { recursive: true });
      await page.goto(url);
      await page.waitForTimeout(800);
      return `started ${name} at ${url} (${vp[0]}×${vp[1]}${touch ? ', touch' : ''}${a.includes('--reduce-motion') ? ', reduced motion' : ''}, browser language ${lang}${a.includes('--at') ? `, a save at ${a[a.indexOf('--at') + 1]} to Continue from` : ''})`;
    }
    const p = players.get(name);
    if (!p) throw new Error(`no player "${name}": start one first`);
    const page = p.page;
    const after = async () => {
      await page.waitForTimeout(350);
      const errs = p.errors.splice(0);
      return errs.length ? `\n${errs.map((e) => `  ! ${e}`).join('\n')}` : '';
    };
    const point = (i: number) => ({ x: Number(a[i]), y: Number(a[i + 1]) });
    const byText = async (text: string) => {
      const loc = page.getByText(text, { exact: false }).filter({ visible: true }).first();
      const box = await loc.boundingBox();
      if (!box) throw new Error(`nothing visible shows “${text}”`);
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    switch (command) {
      case 'look': {
        p.shots++;
        const file = join(out, name, `${String(p.shots).padStart(4, '0')}.png`);
        await page.screenshot({ path: file });
        return `screenshot: ${file}\nvisible controls (x, y):\n${await controls(page)}${await after()}`;
      }
      case 'read':
        return (await page.evaluate(() => document.body.innerText)).slice(0, 12000);
      case 'click': {
        const { x, y } = point(0);
        await page.mouse.click(x, y);
        return `clicked (${x}, ${y})${await after()}`;
      }
      case 'click-text': {
        const { x, y } = await byText(a.join(' '));
        await page.mouse.click(x, y);
        return `clicked “${a.join(' ')}” at (${Math.round(x)}, ${Math.round(y)})${await after()}`;
      }
      case 'tap':
      case 'tap-text': {
        if (!p.touch) throw new Error('this player has no touch screen');
        const { x, y } = command === 'tap' ? point(0) : await byText(a.join(' '));
        await page.touchscreen.tap(x, y);
        return `tapped (${Math.round(x)}, ${Math.round(y)})${await after()}`;
      }
      case 'key': {
        const times = Math.min(50, Number(a[1] ?? 1));
        for (let i = 0; i < times; i++) await page.keyboard.press(a[0]!);
        return `pressed ${a[0]}${times > 1 ? ` ×${times}` : ''}${await after()}`;
      }
      case 'type':
        await page.keyboard.type(a.join(' '), { delay: 20 });
        return `typed “${a.join(' ')}”${await after()}`;
      case 'ime': {
        const enter = a.includes('--enter');
        const text = a.filter((x) => x !== '--enter').join(' ');
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Input.imeSetComposition', { text, selectionStart: text.length, selectionEnd: text.length });
        if (enter) {
          // A real IME keeps the Enter for itself: the page sees keydown with isComposing (keyCode 229).
          await page.evaluate(() => {
            const el = document.activeElement ?? document.body;
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true, bubbles: true, cancelable: true }));
            el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 229, isComposing: true, bubbles: true }));
          });
        }
        await cdp.send('Input.insertText', { text });
        await cdp.detach();
        return `composed “${text}”${enter ? ' and pressed Enter mid-composition' : ''}${await after()}`;
      }
      case 'scroll': {
        await page.mouse.wheel(0, Number(a[0] ?? 400));
        return `scrolled ${a[0] ?? 400}${await after()}`;
      }
      case 'wait':
        await page.waitForTimeout(Math.min(10_000, Number(a[0] ?? 1000)));
        return `waited${await after()}`;
      case 'reload':
        await page.reload();
        await page.waitForTimeout(800);
        return `reloaded${await after()}`;
      case 'resize': {
        const [w, h] = (a[0] ?? '1440x900').split('x').map(Number);
        await page.setViewportSize({ width: w!, height: h! });
        return `resized to ${w}×${h}${await after()}`;
      }
      case 'focus':
        return page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return 'focus: nothing (the page itself)';
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          const ring = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? `outline ${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : cs.boxShadow !== 'none' ? `box-shadow ${cs.boxShadow}` : 'NO visible focus style';
          const onScreen = r.bottom > 0 && r.top < innerHeight;
          return `focus: ${el.tagName.toLowerCase()} “${(el.getAttribute('aria-label') ?? el.innerText ?? '').trim().slice(0, 60)}” at (${Math.round(r.left + r.width / 2)}, ${Math.round(r.top + r.height / 2)}), ${onScreen ? 'on screen' : 'OFF SCREEN'}; ${ring}`;
        });
      case 'a11y':
        return (await page.locator('body').ariaSnapshot()).slice(0, 12000);
      default:
        throw new Error(`unknown command "${command}"`);
    }
  };

  createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', async () => {
      let msg: { player: string; command: string; args: string[] };
      try {
        msg = JSON.parse(body);
      } catch {
        res.writeHead(400).end('bad request');
        return;
      }
      appendFileSync(join(out, 'all.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...msg }) + '\n');
      try {
        mkdirSync(join(out, msg.player), { recursive: true });
        appendFileSync(join(out, msg.player, 'log.jsonl'), JSON.stringify({ at: new Date().toISOString(), command: msg.command, args: msg.args }) + '\n');
        const result = await run(msg.player, msg.command, msg.args);
        res.writeHead(200).end(result);
      } catch (e) {
        res.writeHead(500).end(`error: ${(e as Error).message}`);
      }
    });
  }).listen(port, '127.0.0.1', () => console.log(`drive: listening on 127.0.0.1:${port}, writing to ${out}`));
}
