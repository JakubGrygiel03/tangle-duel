import type { SoundPackId } from "@/lib/engine/economy";

const PENTATONIC = [261.6256, 293.6648, 329.6276, 391.9954, 440, 523.2511];

type Timbre = {
  overtoneRatio: number;
  overtoneGain: number;
  filterStart: number;
  filterEnd: number;
  attack: number;
  decayScale: number;
  wave: OscillatorType;
};

const TIMBRES: Record<SoundPackId, Timbre> = {
  harp: {
    overtoneRatio: 2.003,
    overtoneGain: 0.28,
    filterStart: 2800,
    filterEnd: 880,
    attack: 0.012,
    decayScale: 1,
    wave: "sine",
  },
  chimes: {
    overtoneRatio: 2.76,
    overtoneGain: 0.42,
    filterStart: 4200,
    filterEnd: 1600,
    attack: 0.004,
    decayScale: 1.35,
    wave: "sine",
  },
  lute: {
    overtoneRatio: 2.01,
    overtoneGain: 0.18,
    filterStart: 1800,
    filterEnd: 620,
    attack: 0.018,
    decayScale: 1.15,
    wave: "triangle",
  },
  glass: {
    overtoneRatio: 3.01,
    overtoneGain: 0.22,
    filterStart: 5200,
    filterEnd: 2100,
    attack: 0.006,
    decayScale: 0.85,
    wave: "sine",
  },
};

/**
 * Harfa / lira złożona z sinusów. Bez próbek.
 * AudioContext powstaje dopiero w geście użytkownika.
 */
export class HarpSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;
  private pack: SoundPackId = "harp";

  get isMuted(): boolean {
    return this.muted;
  }

  setPack(pack: SoundPackId): void {
    this.pack = pack;
  }

  unlock(): void {
    const ctx = this.ensure();
    if (ctx.state !== "running") void ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0.0001 : 0.22, now, 0.02);
  }

  touchNode(index: number): void {
    const freq = PENTATONIC[index % PENTATONIC.length] ?? 523.25;
    this.pluck(freq * 2, 0.11, 0.32);
  }

  /** Krótki szarp na cyfrze odliczania: 3 niżej, 1 wyżej. */
  countTick(step: 3 | 2 | 1): void {
    const freq = step === 3 ? 523.2511 : step === 2 ? 659.2551 : 783.9909;
    this.pluck(freq, 0.07, 0.22);
  }

  victoryChord(): void {
    const ctx = this.ensure();
    if (ctx.state !== "running") void ctx.resume();
    const start = ctx.currentTime + 0.02;
    const chord = [261.6256, 329.6276, 391.9954, 440, 523.2511];
    chord.forEach((frequency, index) => {
      this.pluckAt(frequency, start + index * 0.045, 0.16, 1.45);
    });
  }

  /** Pełniejszy akord przy odkryciu konstelacji. */
  constellationChord(): void {
    const ctx = this.ensure();
    if (ctx.state !== "running") void ctx.resume();
    const start = ctx.currentTime + 0.02;
    const chord = [196.0, 246.94, 293.66, 369.99, 493.88, 587.33];
    chord.forEach((frequency, index) => {
      this.pluckAt(frequency, start + index * 0.055, 0.14, 1.8);
    });
  }

  /** Delikatny „ping” zbierania kryształów. */
  crystalChime(): void {
    this.pluck(880, 0.08, 0.4);
    this.pluck(1318.5, 0.05, 0.55);
  }

  async close(): Promise<void> {
    const ctx = this.ctx;
    this.ctx = null;
    this.master = null;
    if (ctx && ctx.state !== "closed") await ctx.close();
  }

  private ensure(): AudioContext {
    if (this.ctx && this.master) return this.ctx;

    const ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0.0001 : 0.22;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 10;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;

    master.connect(compressor);
    compressor.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  private pluck(frequency: number, velocity: number, decay: number): void {
    if (this.muted) return;
    const ctx = this.ensure();
    this.pluckAt(frequency, ctx.currentTime, velocity, decay);
  }

  private pluckAt(frequency: number, when: number, velocity: number, decay: number): void {
    if (this.muted || !this.ctx || !this.master) return;

    const timbre = TIMBRES[this.pack];
    const ctx = this.ctx;
    const fundamental = ctx.createOscillator();
    fundamental.type = timbre.wave;
    fundamental.frequency.setValueAtTime(frequency, when);

    const overtone = ctx.createOscillator();
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * timbre.overtoneRatio, when);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(timbre.overtoneGain, when);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.65;
    filter.frequency.setValueAtTime(timbre.filterStart, when);
    const decayTime = decay * timbre.decayScale;
    filter.frequency.exponentialRampToValueAtTime(
      timbre.filterEnd,
      when + Math.min(0.45, decayTime),
    );

    const gain = ctx.createGain();
    const peak = Math.max(0.001, velocity);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + timbre.attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + decayTime);

    fundamental.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(filter);
    filter.connect(this.master);

    const stopAt = when + decayTime + 0.05;
    fundamental.start(when);
    overtone.start(when);
    fundamental.stop(stopAt);
    overtone.stop(stopAt);
  }
}
