import { MorseKeyer } from './morse-keyer';

export type ReviewPlayerEventHandler = () => void;

/** Small one-shot CW player for reviewing a logged exchange. */
export class CwReviewPlayer {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private stopTime = 0;
  onEnded: ReviewPlayerEventHandler | null = null;

  async play(text: string, options: { wpm?: number; frequency?: number; volume?: number } = {}) {
    this.stop();
    if (!text.trim()) return;

    const sampleRate = 11025;
    const wpm = options.wpm ?? 25;
    const frequency = options.frequency ?? 600;
    const envelope = new MorseKeyer(sampleRate, wpm).textEnvelope(text, 1);
    const context = new AudioContext({ sampleRate, latencyHint: 'interactive' });
    if (context.state === 'suspended') await context.resume();
    const gain = context.createGain();
    gain.gain.value = options.volume ?? 0.35;
    gain.connect(context.destination);

    const buffer = context.createBuffer(1, envelope.length, sampleRate);
    const channel = buffer.getChannelData(0);
    const increment = 2 * Math.PI * frequency / sampleRate;
    let phase = 0;
    for (let i = 0; i < envelope.length; i++) {
      channel[i] = Math.tanh(envelope[i] * Math.sin(phase) * 3);
      phase = (phase + increment) % (2 * Math.PI);
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.onended = () => {
      if (this.source !== source) return;
      this.stop();
      this.onEnded?.();
    };
    source.start();
    this.context = context;
    this.source = source;
    this.gain = gain;
    this.stopTime = context.currentTime + buffer.duration;
  }

  setVolume(volume: number) {
    if (this.context && this.gain) this.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.01);
  }

  stop() {
    if (this.source) {
      this.source.onended = null;
      try { this.source.stop(); } catch { /* already stopped */ }
    }
    this.source = null;
    this.gain = null;
    this.stopTime = 0;
    const context = this.context;
    this.context = null;
    void context?.close().catch(() => undefined);
  }

  get playing() {
    return !!this.source || (this.context?.state === 'running' && this.context.currentTime < this.stopTime);
  }
}