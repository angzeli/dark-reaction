/**
 * Procedural audio. Nothing is created until the player opts in: the
 * AudioContext is built inside `enable()`, which the UI only calls from a
 * click or key press. Every sound is synthesised from noise buffers and
 * oscillators; there are no samples and no network requests.
 *
 * Graph: sources → (ambience | effects) bus → master → destination,
 *        with a shared convolution reverb fed by per-layer sends.
 */
import { AMBIENCE, type AmbienceId, type Layer, type Lfo, type NoiseColour } from './presets/ambience.ts';
import { CUES, type CueId, type CueKit, type NoiseSpec, type ToneSpec } from './presets/cues.ts';

export interface Volumes {
  master: number;
  ambience: number;
  effects: number;
}

const CROSSFADE = 1.2;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

interface Playing {
  id: AmbienceId;
  out: GainNode;
  stop: () => void;
}

function hasWebAudio(): boolean {
  return typeof window !== 'undefined' && (typeof window.AudioContext !== 'undefined' || 'webkitAudioContext' in window);
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private ambienceBus!: GainNode;
  private effectsBus!: GainNode;
  private reverb!: ConvolverNode;
  private reverbIn!: GainNode;
  private noise = new Map<NoiseColour, AudioBuffer>();
  private current: Playing | null = null;
  private wanted: AmbienceId | null = null;
  private volumes: Volumes = { master: 0.8, ambience: 0.8, effects: 0.8 };

  get supported(): boolean {
    return hasWebAudio();
  }

  get enabled(): boolean {
    return this.ctx !== null && this.ctx.state !== 'closed';
  }

  /** Must be called from a user gesture. Returns false if Web Audio is unavailable. */
  async enable(): Promise<boolean> {
    if (this.ctx) {
      await this.ctx.resume().catch(() => undefined);
      return true;
    }
    if (!hasWebAudio()) return false;
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor({ latencyHint: 'playback' });
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.ambienceBus = ctx.createGain();
    this.effectsBus = ctx.createGain();
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(2.8, 2.4);
    this.reverbIn = ctx.createGain();
    this.reverbIn.gain.value = 0.9;
    this.reverbIn.connect(this.reverb).connect(this.master);
    this.ambienceBus.connect(this.master);
    this.effectsBus.connect(this.master);
    this.master.connect(ctx.destination);
    for (const colour of ['white', 'pink', 'brown'] as const) this.noise.set(colour, this.makeNoise(colour, 6));
    this.applyVolumes(0);
    await ctx.resume().catch(() => undefined);
    if (this.wanted) this.setAmbience(this.wanted);
    return true;
  }

  /** Stop everything and release the context. */
  disable(): void {
    this.current?.stop();
    this.current = null;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.noise.clear();
  }

  setVolumes(volumes: Volumes): void {
    this.volumes = { master: clamp01(volumes.master), ambience: clamp01(volumes.ambience), effects: clamp01(volumes.effects) };
    this.applyVolumes(0.15);
  }

  /** Pause while the tab is hidden; resume when it returns. */
  setHidden(hidden: boolean): void {
    if (!this.ctx) return;
    if (hidden) void this.ctx.suspend().catch(() => undefined);
    else void this.ctx.resume().catch(() => undefined);
  }

  /** Crossfade to a location's ambience (or silence). Remembered even while disabled. */
  setAmbience(id: AmbienceId | null): void {
    this.wanted = id;
    const ctx = this.ctx;
    if (!ctx) return;
    if (this.current?.id === id) {
      this.current.out.gain.cancelScheduledValues(ctx.currentTime);
      this.current.out.gain.setTargetAtTime(1, ctx.currentTime, 0.2);
      return;
    }
    const old = this.current;
    if (old) {
      old.out.gain.cancelScheduledValues(ctx.currentTime);
      old.out.gain.setTargetAtTime(0, ctx.currentTime, CROSSFADE / 4);
      setTimeout(() => old.stop(), CROSSFADE * 2000);
    }
    this.current = id ? this.buildAmbience(id) : null;
  }

  cue(id: CueId, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx) return;
    CUES[id](this.kit(ctx.currentTime + 0.02 + delay));
  }

  /** Play a chirp at each time (seconds from now), for the cryocooler puzzle. */
  playChirps(times: readonly number[]): void {
    for (const t of times) this.cue('chirp', t);
  }

  // ── Building blocks ──────────────────────────────────────────────────────

  private applyVolumes(ramp: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const set = (node: GainNode, v: number) => node.gain.setTargetAtTime(v, ctx.currentTime, Math.max(0.001, ramp));
    // Perceptual curve: squared.
    set(this.master, this.volumes.master ** 2);
    set(this.ambienceBus, this.volumes.ambience ** 2);
    set(this.effectsBus, this.volumes.effects ** 2);
  }

  private makeNoise(colour: NoiseColour, seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (colour === 'white') data[i] = white * 0.5;
      else if (colour === 'pink') {
        // Paul Kellet's refined pink filter.
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    // Crossfade the loop point so the buffer loops without a click.
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const w = i / fade;
      data[length - fade + i] = data[length - fade + i]! * (1 - w) + data[i]! * w;
    }
    return buffer;
  }

  private impulse(seconds: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** decay;
    }
    return buffer;
  }

  private lfo(param: AudioParam, base: number, lfo: Lfo, stops: Array<() => void>): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.frequency.value = lfo.rate;
    const depth = ctx.createGain();
    depth.gain.value = base * lfo.depth;
    osc.connect(depth).connect(param);
    osc.start();
    stops.push(() => osc.stop());
  }

  private send(node: AudioNode, amount: number | undefined): void {
    if (!amount) return;
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = amount;
    node.connect(g).connect(this.reverbIn);
  }

  private noiseSource(colour: NoiseColour): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise.get(colour)!;
    src.loop = true;
    // Start somewhere different each time so layers of the same colour don't phase.
    src.loopStart = 0;
    return src;
  }

  private buildAmbience(id: AmbienceId): Playing {
    const ctx = this.ctx!;
    const out = ctx.createGain();
    out.gain.value = 0;
    out.connect(this.ambienceBus);
    out.gain.setTargetAtTime(1, ctx.currentTime, CROSSFADE / 3);
    const stops: Array<() => void> = [];
    const timers: number[] = [];
    for (const layer of AMBIENCE[id]) this.buildLayer(layer, out, stops, timers);
    return {
      id,
      out,
      stop: () => {
        for (const stop of stops) {
          try {
            stop();
          } catch {
            /* already stopped */
          }
        }
        for (const timer of timers) clearInterval(timer);
        out.disconnect();
      },
    };
  }

  private buildLayer(layer: Layer, out: GainNode, stops: Array<() => void>, timers: number[]): void {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = layer.gain;
    gain.connect(out);
    if ('reverb' in layer) this.send(gain, layer.reverb);

    switch (layer.kind) {
      case 'noise': {
        const src = this.noiseSource(layer.colour);
        const filter = ctx.createBiquadFilter();
        filter.type = layer.filter;
        filter.frequency.value = layer.freq;
        if (layer.q) filter.Q.value = layer.q;
        src.connect(filter).connect(gain);
        if (layer.gainLfo) this.lfo(gain.gain, layer.gain, layer.gainLfo, stops);
        if (layer.freqLfo) this.lfo(filter.frequency, layer.freq, layer.freqLfo, stops);
        src.start(ctx.currentTime, Math.random() * 5);
        stops.push(() => src.stop());
        return;
      }
      case 'tone': {
        const osc = ctx.createOscillator();
        osc.type = layer.wave;
        osc.frequency.value = layer.freq;
        if (layer.detune) osc.detune.value = layer.detune;
        let node: AudioNode = osc;
        if (layer.lowpass) {
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = layer.lowpass;
          node = node.connect(lp);
        }
        node.connect(gain);
        if (layer.gainLfo) this.lfo(gain.gain, layer.gain, layer.gainLfo, stops);
        osc.start();
        stops.push(() => osc.stop());
        return;
      }
      case 'pulse': {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = layer.freq;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = layer.lowpass ?? 200;
        osc.connect(lp).connect(gain);
        this.lfo(gain.gain, layer.gain, { rate: 1 / layer.period, depth: 0.8 }, stops);
        osc.start();
        stops.push(() => osc.stop());
        return;
      }
      case 'radio': {
        // Band-limited noise with a syllable-rate envelope: speech you can't make out.
        const src = this.noiseSource('pink');
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 1100;
        bp.Q.value = 1.4;
        const env = ctx.createGain();
        env.gain.value = 0;
        src.connect(bp).connect(env).connect(gain);
        src.start();
        stops.push(() => src.stop());
        const speak = () => {
          const t = ctx.currentTime;
          for (let i = 0; i < 8; i++) {
            const at = t + i * 0.19 + Math.random() * 0.05;
            env.gain.setTargetAtTime(Math.random() < 0.2 ? 0.1 : 0.6 + Math.random() * 0.4, at, 0.03);
          }
          env.gain.setTargetAtTime(0.05, t + 1.6, 0.2);
        };
        speak();
        timers.push(window.setInterval(speak, 2200));
        return;
      }
      case 'chirp': {
        const tick = () => {
          const at = ctx.currentTime + 0.05 + (layer.jitter ? Math.random() * layer.jitter : 0);
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.frequency.setValueAtTime(layer.from, at);
          osc.frequency.exponentialRampToValueAtTime(layer.to, at + layer.duration);
          env.gain.setValueAtTime(0, at);
          env.gain.linearRampToValueAtTime(1, at + Math.min(0.004, layer.duration / 3));
          env.gain.exponentialRampToValueAtTime(0.0001, at + layer.duration);
          osc.connect(env).connect(gain);
          osc.start(at);
          osc.stop(at + layer.duration + 0.02);
        };
        timers.push(window.setInterval(tick, layer.interval * 1000));
        return;
      }
      case 'drops': {
        const drop = () => {
          const at = ctx.currentTime + Math.random() * 0.2;
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          const f = layer.low + Math.random() * (layer.high - layer.low);
          osc.frequency.setValueAtTime(f, at);
          osc.frequency.exponentialRampToValueAtTime(f * 0.6, at + 0.03);
          env.gain.setValueAtTime(0.3 + Math.random() * 0.7, at);
          env.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
          osc.connect(env).connect(gain);
          osc.start(at);
          osc.stop(at + 0.05);
        };
        const tick = () => {
          // Poisson-ish: a few drops per 200 ms on average.
          const n = Math.round(layer.rate * 0.2 * (0.5 + Math.random()));
          for (let i = 0; i < n; i++) drop();
        };
        timers.push(window.setInterval(tick, 200));
        return;
      }
    }
  }

  private kit(t0: number): CueKit {
    const ctx = this.ctx!;
    const envelope = (g: GainNode, start: number, duration: number, peak: number, attack = 0.01, release = 0.1) => {
      const a = Math.min(attack, duration / 2);
      const r = Math.min(release, duration - a);
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(peak, start + a);
      g.gain.setValueAtTime(peak, start + duration - r);
      g.gain.linearRampToValueAtTime(0, start + duration);
    };
    return {
      tone: (s: ToneSpec) => {
        const start = t0 + s.start;
        const osc = ctx.createOscillator();
        osc.type = s.wave ?? 'sine';
        osc.frequency.setValueAtTime(s.freq, start);
        if (s.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, s.to), start + s.duration);
        const g = ctx.createGain();
        envelope(g, start, s.duration, s.gain, s.attack, s.release);
        let node: AudioNode = osc;
        if (s.lowpass) {
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.value = s.lowpass;
          node = node.connect(lp);
        }
        node.connect(g).connect(this.effectsBus);
        this.send(g, s.reverb);
        osc.start(start);
        osc.stop(start + s.duration + 0.05);
      },
      noise: (s: NoiseSpec) => {
        const start = t0 + s.start;
        const src = this.noiseSource(s.colour);
        const filter = ctx.createBiquadFilter();
        filter.type = s.filter;
        filter.frequency.setValueAtTime(s.freq, start);
        if (s.to) filter.frequency.exponentialRampToValueAtTime(s.to, start + s.duration);
        if (s.q) filter.Q.value = s.q;
        const g = ctx.createGain();
        envelope(g, start, s.duration, s.gain, s.attack, s.release);
        src.connect(filter).connect(g).connect(this.effectsBus);
        this.send(g, s.reverb);
        src.start(start, Math.random() * 4);
        src.stop(start + s.duration + 0.05);
      },
      duckAmbience: (level, seconds, at = 0) => {
        const current = this.current;
        if (!current) return;
        const start = t0 + at;
        current.out.gain.cancelScheduledValues(start);
        current.out.gain.setTargetAtTime(level, start, Math.max(0.01, seconds / 3));
      },
    };
  }
}

/** The single engine the UI talks to. */
export const audio = new AudioEngine();
