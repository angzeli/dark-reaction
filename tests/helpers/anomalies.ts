/**
 * Triggering an anomaly the way a player would, for tests/anomalies.test.ts: place a game where the
 * registry entry's setup says, then make the choice, let the event fire or let 03:33 come. Kinds found
 * outside the engine (the console, the keyboard, the clock, a panel) are triggered by their own modules,
 * which register themselves here as they arrive (#205, #208, #209).
 */
import { Game } from '../../src/engine/engine.ts';
import type { AnomalyDef, AnomalySetup, Content } from '../../src/engine/types.ts';
import { HIDDEN, respond } from '../../src/puzzles/console/logic.ts';
import { CONTENT } from '../../src/content/index.ts';
import { Gallery } from '../../src/save/gallery.ts';
import { memoryStorage } from '../../src/save/storage.ts';
import { keepOutside, PANEL_ANOMALIES } from '../../src/ui/eggs.ts';

/** A game at 02:47 of loop 1, then moved to where the setup says. */
export function placed(content: Content, setup: AnomalySetup): Game {
  const g = new Game(content);
  while (g.takeCard());
  const s = g.state;
  if (setup.loop !== undefined) s.loop = setup.loop;
  if (setup.act !== undefined) {
    s.act = setup.act;
    s.actLoop = s.loop;
  }
  if (setup.minute !== undefined) {
    s.minute = setup.minute;
    s.firedEvents = content.events.filter((e) => e.minute < setup.minute!).map((e) => e.id);
  }
  if (setup.scene) {
    const def = g.index.scenes.get(setup.scene);
    if (!def) throw new Error(`setup: no scene "${setup.scene}"`);
    s.scene = def.id;
    s.location = def.location;
  }
  for (const id of setup.known ?? []) if (!s.known.some((k) => k.id === id)) s.known.push({ id, loop: 1, minute: 0 });
  s.inventory.push(...(setup.inventory ?? []));
  s.flags.push(...(setup.flags ?? []));
  s.lflags.push(...(setup.lflags ?? []));
  s.usedLoop.push(...(setup.usedLoop ?? []));
  s.solved.push(...(setup.solved ?? []));
  s.display = g.sceneText(s.scene);
  return g;
}

export interface Triggered {
  /** Whether the entry's id is now recorded. */
  found: boolean;
  /** The keys on screen (or printed) when it was found. */
  shown: string[];
}

/** Triggers for the kinds found outside the engine, keyed by kind. */
export const OUTSIDE: Partial<Record<AnomalyDef['trigger']['kind'], (a: AnomalyDef) => Triggered>> = {
  // Typed at the console, in Act I: its answer is the anomaly (the view calls discover with it).
  command: (a) => {
    if (a.trigger.kind !== 'command') throw new Error('not a command');
    const reply = respond(a.trigger.command, '02:51', 1);
    const key = reply && typeof reply === 'object' ? reply.key : '';
    return { found: HIDDEN[key] === a.id, shown: key ? [key] : [] };
  },
  // Opened on the title screen: the gallery keeps the find, and its achievement.
  panel: (a) => {
    if (a.trigger.kind !== 'panel') throw new Error('not a panel');
    const gallery = new Gallery(memoryStorage());
    const id = PANEL_ANOMALIES[a.trigger.panel];
    if (id) keepOutside(CONTENT, gallery, id);
    const data = gallery.data();
    return { found: data.anomalies.includes(a.id) && (!a.achievement || a.achievement in data.achievements), shown: [...a.keys] };
  },
};

export function trigger(content: Content, a: AnomalyDef): Triggered {
  const tr = a.trigger;
  if (tr.kind === 'choice') {
    const g = placed(content, tr.setup);
    const offered = g.choices().some((c) => c.id === tr.choice);
    if (!offered) throw new Error(`"${a.id}": choice "${tr.choice}" isn't offered in its setup`);
    g.choose(tr.choice);
    return { found: g.state.anomalies.includes(a.id), shown: g.state.display.map((p) => p.key) };
  }
  if (tr.kind === 'event') {
    const g = placed(content, tr.setup);
    const ev = content.events.find((e) => e.id === tr.event)!;
    g.state.firedEvents = g.state.firedEvents.filter((id) => id !== ev.id);
    if (g.state.minute >= ev.minute) throw new Error(`"${a.id}": the setup starts after its event`);
    g.choose('meta:wait');
    while (!g.state.firedEvents.includes(ev.id) && !g.busy) {
      if (g.state.menu !== 'wait') g.choose('meta:wait');
      g.choose('wait:1');
    }
    return { found: g.state.anomalies.includes(a.id), shown: g.state.display.map((p) => p.key) };
  }
  if (tr.kind === 'lightsout') {
    const g = placed(content, tr.setup);
    while (!g.busy && g.state.minute < 46) {
      if (g.state.menu !== 'wait') g.choose(g.scene.hub ? 'meta:wait' : 'meta:back');
      else g.choose('wait:10');
    }
    while (g.takeCard());
    return { found: g.state.anomalies.includes(a.id), shown: g.state.display.map((p) => p.key) };
  }
  const outside = OUTSIDE[tr.kind];
  if (!outside) throw new Error(`"${a.id}": nothing triggers a "${tr.kind}" anomaly yet`);
  return outside(a);
}
