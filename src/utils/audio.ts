/**
 * Web Audio API synthesizer for instantaneous, zero-latency sound effects.
 * Supports custom audio file URLs when provided, with guaranteed synthetic fallback.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export class SoundManager {
  private static enabled = true;
  private static volume = 0.7;

  static setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  static isEnabled(): boolean {
    return this.enabled;
  }

  static setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  static getVolume(): number {
    return this.volume;
  }

  // Play a custom audio URL or synthesize fallback
  private static playAudioUrl(url: string, fallback: () => void) {
    if (!this.enabled) return;
    try {
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.play().catch(() => {
        fallback();
      });
    } catch {
      fallback();
    }
  }

  // Bright, happy chime for correct answer
  static playCorrect(customUrl?: string) {
    if (!this.enabled) return;
    if (customUrl) {
      this.playAudioUrl(customUrl, () => this.synthCorrect());
      return;
    }
    this.synthCorrect();
  }

  private static synthCorrect() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // C5 - E5 - G5 - C6 rapid cheerful arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.35 * this.volume, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  }

  // Gentle low tone for incorrect answer
  static playWrong(customUrl?: string) {
    if (!this.enabled) return;
    if (customUrl) {
      this.playAudioUrl(customUrl, () => this.synthWrong());
      return;
    }
    this.synthWrong();
  }

  private static synthWrong() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.35);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    // subtle low pass filter to make it gentle, not harsh
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Soft click / tick for timer alert (last 5 seconds)
  static playTick() {
    if (!this.enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);

    gain.gain.setValueAtTime(0.08 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Ping sound when gesture is successfully held and recognized
  static playGestureLock() {
    if (!this.enabled) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5

    gain.gain.setValueAtTime(0.18 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Triumphant victory fanfare for completing the game
  static playVictory(customUrl?: string) {
    if (!this.enabled) return;
    if (customUrl) {
      this.playAudioUrl(customUrl, () => this.synthVictory());
      return;
    }
    this.synthVictory();
  }

  private static synthVictory() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Victory fanfare notes: C5, C5, C5, G4, A4, B4, C5 (held)
    const melody = [
      { f: 523.25, d: 0.15, gap: 0.18 },
      { f: 523.25, d: 0.15, gap: 0.18 },
      { f: 523.25, d: 0.15, gap: 0.18 },
      { f: 392.00, d: 0.14, gap: 0.16 },
      { f: 440.00, d: 0.14, gap: 0.16 },
      { f: 493.88, d: 0.14, gap: 0.16 },
      { f: 523.25, d: 0.60, gap: 0.65 },
      { f: 659.25, d: 0.60, gap: 0.65 },
      { f: 783.99, d: 0.80, gap: 0.85 },
    ];

    let offset = 0;
    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.3 * this.volume, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + note.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + note.d + 0.05);

      offset += note.gap;
    });
  }
}
