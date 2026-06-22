/**
 * Speed-reactive procedural surf music — Web Audio API, no samples.
 * BPM, filter, and intensity follow rider speed, combo, and tube state.
 */
export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;
  private padOscs: OscillatorNode[] = [];
  private kickGain: GainNode | null = null;
  private hatGain: GainNode | null = null;

  private bpm = 78;
  private targetBpm = 78;
  private nextBeat = 0;
  private beatCount = 0;
  private started = false;

  init(ctx: AudioContext, master: GainNode) {
    if (this.started) return;
    this.ctx = ctx;
    this.master = master;

    const musicBus = ctx.createGain();
    musicBus.gain.value = 0.22;
    musicBus.connect(master);

    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = 900;
    this.padFilter.Q.value = 0.7;

    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.08;

    const chords = [110, 138.59, 164.81];
    for (const freq of chords) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(this.padFilter!);
      osc.start();
      this.padOscs.push(osc);
    }

    this.padFilter.connect(this.padGain);
    this.padGain.connect(musicBus);

    this.kickGain = ctx.createGain();
    this.kickGain.gain.value = 0;
    this.kickGain.connect(musicBus);

    this.hatGain = ctx.createGain();
    this.hatGain.gain.value = 0;
    this.hatGain.connect(musicBus);

    this.nextBeat = ctx.currentTime + 0.5;
    this.started = true;
  }

  update(speed: number, combo: number, inTube: boolean, dt: number) {
    if (!this.ctx || !this.padFilter || !this.padGain) return;

    this.targetBpm = 68 + Math.min(speed, 14) * 5 + Math.min(combo, 20) * 1.2;
    this.bpm += (this.targetBpm - this.bpm) * Math.min(1, dt * 2);

    const tubeMuffle = inTube ? 0.45 : 1;
    const targetCutoff = (500 + speed * 80 + combo * 30) * tubeMuffle;
    this.padFilter.frequency.value += (targetCutoff - this.padFilter.frequency.value) * dt * 3;
    this.padGain.gain.value = (0.06 + combo * 0.004 + (inTube ? 0.04 : 0)) * (0.6 + Math.min(speed / 12, 0.4));

    const now = this.ctx.currentTime;
    const beatInterval = 60 / this.bpm;

    while (now >= this.nextBeat) {
      this.playKick(this.nextBeat, speed, inTube);
      if (this.beatCount % 2 === 0) this.playHat(this.nextBeat, combo);
      this.beatCount++;
      this.nextBeat += beatInterval;
    }
  }

  private playKick(time: number, speed: number, inTube: boolean) {
    if (!this.ctx || !this.kickGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const intensity = 0.12 + Math.min(speed / 20, 0.15) + (inTube ? 0.08 : 0);

    osc.type = "sine";
    osc.frequency.setValueAtTime(inTube ? 55 : 70, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + 0.12);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(intensity, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    osc.connect(gain);
    gain.connect(this.kickGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playHat(time: number, combo: number) {
    if (!this.ctx || !this.hatGain || combo < 2) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6000;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.02 + Math.min(combo * 0.003, 0.04);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.hatGain);
    src.start(time);
  }
}

export const musicEngine = new MusicEngine();