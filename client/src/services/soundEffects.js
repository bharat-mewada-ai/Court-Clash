/**
 * Web Audio API procedural sound synthesizer for Court Clash.
 * Generates instant, crisp courtroom sound effects without any external MP3 network dependencies:
 * - Gavel Strike (deep resonant wooden hit)
 * - Dramatic Objection chime
 * - Turn switch bell
 * - Verdict fanfare celebration
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.muted = false;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== "undefined") {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // 1. Resonant Wooden Gavel Strike
  playGavelStrike() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Strike 1: Primary deep wood impact
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(140, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain1.gain.setValueAtTime(0.9, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);

    // Strike 2: Rebound click (wood block transient)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(450, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.15);

    gain2.gain.setValueAtTime(0.6, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now);
    osc2.stop(now + 0.15);
  }

  // 2. Dramatic Rising Objection Stinger
  playObjection() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(587.33, now + 0.18); // D5 dramatic strike

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // 3. Subtle Turn Bell
  playTurnDing() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5 chime
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // 4. Grand Verdict Celebration Fanfare
  playVerdictFanfare() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major chord

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.35, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.8);
    });
  }
}

export const soundEffects = new SoundService();
