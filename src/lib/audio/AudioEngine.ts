import { musicEngine } from "@/lib/audio/MusicEngine";
import type { TrickId } from "@/lib/tricks/types";

/**
 * Procedural audio via Web Audio API — no external assets, 100% FOSS.
 * Requires a user gesture to unlock the AudioContext.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private oceanOsc: OscillatorNode | null = null;
  private oceanNoise: AudioBufferSourceNode | null = null;
  private unlocked = false;

  async unlock() {
    if (this.unlocked) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.45;
    this.master.connect(this.ctx.destination);

    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.startAmbience();
    musicEngine.init(this.ctx, this.master);
    this.unlocked = true;
  }

  updateMusic(speed: number, combo: number, inTube: boolean, dt: number) {
    if (!this.unlocked) return;
    musicEngine.update(speed, combo, inTube, dt);
  }

  private startAmbience() {
    if (!this.ctx || !this.master) return;

    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.98 + white * 0.15;
      data[i] = last;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 420;

    const oceanGain = this.ctx.createGain();
    oceanGain.gain.value = 0.12;

    noise.connect(lowpass);
    lowpass.connect(oceanGain);
    oceanGain.connect(this.master);
    noise.start();
    this.oceanNoise = noise;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(oceanGain.gain);
    lfo.start();
  }

  playCarve(intensity: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180 + intensity * 120, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    filter.type = "bandpass";
    filter.frequency.value = 400 + intensity * 300;
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06 * intensity, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playSplash(intensity: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 800;

    const gain = this.ctx.createGain();
    gain.gain.value = 0.08 * intensity;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t);
  }

  playTrickLand() {
    this.playSplash(0.6);
    this.playCarve(0.4);
  }

  playTrick(id: TrickId, combo: number) {
    const boost = 1 + Math.min(combo, 12) * 0.04;
    switch (id) {
      case "carve_left":
      case "carve_right":
        this.playCarve(0.35 * boost);
        break;
      case "pumping":
        this.playPump(boost);
        break;
      case "bottom_turn":
        this.playCarve(0.55 * boost);
        this.playTone(140, 0.12, 0.05 * boost);
        break;
      case "cutback":
        this.playSwoosh(0.7 * boost, true);
        break;
      case "snap":
        this.playSwoosh(0.65 * boost, true);
        this.playTone(200, 0.08, 0.05 * boost);
        break;
      case "floater":
        this.playSplash(0.45 * boost);
        this.playTone(320, 0.1, 0.04 * boost);
        break;
      case "aerial":
        this.playRise(0.85 * boost);
        this.playSplash(0.75 * boost);
        break;
      case "tube_ride":
        this.playTubeRush(0.9 * boost);
        this.playSplash(0.55 * boost);
        break;
      default:
        this.playTrickLand();
    }
  }

  playTubeRush(intensity: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(55, t);
    osc.frequency.exponentialRampToValueAtTime(95, t + 0.35);

    filter.type = "lowpass";
    filter.frequency.value = 280;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.07 * intensity, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  private playPump(intensity: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const at = t + i * 0.09;
      osc.type = "triangle";
      osc.frequency.setValueAtTime(200 - i * 30, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.05 * intensity, at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(at);
      osc.stop(at + 0.1);
    }
  }

  private playTone(freq: number, duration: number, volume: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private playSwoosh(intensity: number, reverse: boolean) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    if (reverse) {
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.22);
    } else {
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.22);
    }

    filter.type = "bandpass";
    filter.frequency.value = 350;
    filter.Q.value = 1.5;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.055 * intensity, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  private playRise(intensity: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.28);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06 * intensity, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  playWipeout() {
    if (!this.ctx || !this.master) return;
    this.playSplash(1.2);
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.5);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  setMasterVolume(v: number) {
    if (this.master) this.master.gain.value = v;
  }
}

export const audioEngine = new AudioEngine();