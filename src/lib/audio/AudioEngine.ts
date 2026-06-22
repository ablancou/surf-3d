import { musicEngine } from "@/lib/audio/MusicEngine";

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