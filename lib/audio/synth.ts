const PENTATONIC = [261.6256, 293.6648, 329.6276, 391.9954, 440, 523.2511];

/**
 * Harfa / lira złożona z sinusów. Bez próbek.
 * AudioContext powstaje dopiero w geście użytkownika.
 */
export class HarpSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted = false;

  get isMuted(): boolean {
    return this.muted;
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

  victoryChord(): void {
    const ctx = this.ensure();
    if (ctx.state !== "running") void ctx.resume();
    const start = ctx.currentTime + 0.02;
    const chord = [261.6256, 329.6276, 391.9954, 440, 523.2511];
    chord.forEach((frequency, index) => {
      this.pluckAt(frequency, start + index * 0.045, 0.16, 1.45);
    });
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

    const ctx = this.ctx;
    const fundamental = ctx.createOscillator();
    fundamental.type = "sine";
    fundamental.frequency.setValueAtTime(frequency, when);

    const overtone = ctx.createOscillator();
    overtone.type = "sine";
    overtone.frequency.setValueAtTime(frequency * 2.003, when);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.28, when);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 0.65;
    filter.frequency.setValueAtTime(2800, when);
    filter.frequency.exponentialRampToValueAtTime(880, when + Math.min(0.45, decay));

    const gain = ctx.createGain();
    const peak = Math.max(0.001, velocity);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(peak, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + decay);

    fundamental.connect(gain);
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    gain.connect(filter);
    filter.connect(this.master);

    const stopAt = when + decay + 0.05;
    fundamental.start(when);
    overtone.start(when);
    fundamental.stop(stopAt);
    overtone.stop(stopAt);
  }
}
