"use client";

/**
 * Lightweight synthesized sound engine using the Web Audio API.
 * No external audio assets are required — every effect and the background
 * "arcade" loop are generated procedurally, which keeps the game fully
 * self-contained and fast to load.
 */

type NoteStep = { freq: number; time: number; dur: number; type?: OscillatorType; gain?: number };

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private musicPlaying = false;
  public muted = false;
  public musicMuted = false;

  private ensureCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new Ctx();
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.5;
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  }

  /** Call on first user interaction to unlock audio on mobile/desktop browsers */
  unlock() {
    this.ensureCtx();
  }

  private tone(
    freq: number,
    duration: number,
    opts: { type?: OscillatorType; gain?: number; delay?: number; sweepTo?: number } = {},
    dest?: GainNode
  ) {
    const ctx = this.ensureCtx();
    if (!ctx || this.muted) return;
    const target = dest ?? this.sfxGain!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type ?? "sine";
    const startAt = ctx.currentTime + (opts.delay ?? 0);
    osc.frequency.setValueAtTime(freq, startAt);
    if (opts.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(opts.sweepTo, startAt + duration);
    }
    const peak = opts.gain ?? 0.3;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + Math.min(0.02, duration / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    osc.connect(gain);
    gain.connect(target);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  coinInsert() {
    this.tone(1400, 0.08, { type: "square", gain: 0.25 });
    this.tone(1900, 0.12, { type: "square", gain: 0.2, delay: 0.07 });
  }

  buttonPress() {
    this.tone(220, 0.08, { type: "square", gain: 0.2 });
  }

  joystickMove() {
    this.tone(180, 0.03, { type: "triangle", gain: 0.06 });
  }

  clawOpen() {
    this.tone(500, 0.15, { type: "sine", gain: 0.18, sweepTo: 700 });
  }

  clawClose() {
    this.tone(400, 0.12, { type: "sine", gain: 0.2, sweepTo: 250 });
  }

  clawDrop() {
    this.tone(300, 0.4, { type: "sawtooth", gain: 0.12, sweepTo: 90 });
  }

  clawRise() {
    this.tone(150, 0.4, { type: "sawtooth", gain: 0.12, sweepTo: 340 });
  }

  win() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone(f, 0.22, { type: "triangle", gain: 0.3, delay: i * 0.09 }));
  }

  jackpot() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0];
    notes.forEach((f, i) => this.tone(f, 0.3, { type: "square", gain: 0.28, delay: i * 0.08 }));
  }

  lose() {
    this.tone(300, 0.25, { type: "sawtooth", gain: 0.18, sweepTo: 120 });
  }

  outOfCoins() {
    this.tone(200, 0.3, { type: "square", gain: 0.15, sweepTo: 80 });
  }

  private playArpeggio(steps: NoteStep[], startTime: number) {
    const ctx = this.ensureCtx();
    if (!ctx || !this.musicGain) return;
    for (const s of steps) {
      this.tone(
        s.freq,
        s.dur,
        { type: s.type ?? "square", gain: s.gain ?? 0.08, delay: startTime - ctx.currentTime + s.time },
        this.musicGain
      );
    }
  }

  startMusic() {
    if (this.musicPlaying || this.musicMuted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.musicPlaying = true;

    const bassLine = [130.81, 130.81, 164.81, 146.83];
    const melody = [523.25, 587.33, 659.25, 587.33, 523.25, 659.25, 783.99, 659.25];

    const loop = () => {
      if (!this.musicPlaying) return;
      const now = ctx.currentTime;
      bassLine.forEach((f, i) => {
        this.playArpeggio([{ freq: f, time: i * 0.5, dur: 0.4, type: "triangle", gain: 0.12 }], now);
      });
      melody.forEach((f, i) => {
        this.playArpeggio([{ freq: f, time: i * 0.25, dur: 0.18, type: "square", gain: 0.05 }], now);
      });
      this.musicTimer = setTimeout(loop, 2000);
    };
    loop();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    if (this.musicMuted) this.stopMusic();
    else this.startMusic();
    return !this.musicMuted;
  }

  toggleSfx() {
    this.muted = !this.muted;
    return !this.muted;
  }
}

export const soundManager = new SoundManager();
