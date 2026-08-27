import type { StationEvent } from '../types';
import type { ContestEngine } from './contest';
import { Station, type StationContext } from './station';

/** User station. Supports queued message pieces and live callsign correction. */
export interface MyStationInit {
  exch1: string;
  exch2: string;
}

export class MyStation extends Station {
  private pieces: string[] = [];
  callsFromKeyer = false;

  constructor(ctx: StationContext, engine: ContestEngine) {
    super(ctx, engine);
    this.init({ exch1: '', exch2: '' });
  }

  init({ exch1, exch2 }: MyStationInit = { exch1: '', exch2: '' }) {
    this.myCall = this.ctx.myCall;
    this.nr = 1;
    this.rst = 599;
    this.exch1 = exch1 || '599';
    this.exch2 = exch2 || String(this.nr);
    this.setPitch(0);
    this.wpm = this.ctx.myWpm;
    this.amplitude = 30000;
  }

  addToMix(re: Float32Array, im: Float32Array) {
    if (this.state === 'sending' && this.envelope) {
      const block = this.getBlock();
      const gain = Math.pow(10, (this.ctx.selfMonVolume - 0.75) * 4);
      for (let i = 0; i < block.length; i++) {
        const v = block[i] * this.amplitude * gain;
        re[i] += v;
        im[i] += v;
      }
    }
  }

  processEvent(event: StationEvent) {
    if (event === 'msgSent') this.engine.onMeFinishedSending();
  }

  abort() {
    this.envelope = null;
    this.messages = new Set(['garbage']);
    this.msgText = '';
    this.pieces = [];
    this.state = 'listening';
    this.processEvent('msgSent');
  }

  sendText(text: string) {
    this.addPieces(text);
    if (this.state !== 'sending') {
      this.sendNextPiece();
      this.engine.onMeStartedSending();
    }
  }

  private addPieces(text: string) {
    let s = text;
    for (;;) {
      const pos = s.indexOf('<his>');
      if (pos < 0) break;
      this.pieces.push(s.slice(0, pos), '@');
      s = s.slice(pos + 5);
    }
    this.pieces.push(s);
    this.pieces = this.pieces.filter(Boolean);
  }

  private sendNextPiece() {
    this.msgText = '';
    const piece = this.pieces[0];
    if (piece === '@') {
      if (this.callsFromKeyer && !['hst', 'wpx'].includes(this.ctx.runMode)) super.sendText(' ');
      else super.sendText(this.hisCall);
    } else super.sendText(piece);
  }

  tick() {
    const wasSending = this.state === 'sending';
    // Consume the finished piece without emitting a message-complete event.
    if (wasSending && !this.envelope && this.pieces.length > 1) {
      this.pieces.shift();
      this.sendNextPiece();
    } else {
      super.tick();
      if (!this.envelope && this.pieces.length) {
        this.pieces.shift();
        if (this.pieces.length) this.sendNextPiece();
      }
    }
  }

  updateCallInMessage(call: string): boolean {
    if (!call) return false;
    this.hisCall = call;
    let result = this.pieces[0] === '@';
    if (result) {
      const keyer = this.ctx.keyer;
      const oldWpm = keyer.wpm;
      keyer.wpm = this.wpm;
      const env = keyer.textEnvelope(call, this.ctx.blockSize);
      for (let i = 0; i < env.length; i++) env[i] *= this.amplitude;
      keyer.wpm = oldWpm;
      result = env.length >= this.sendPos && this.envelope !== null && this.envelope.subarray(0, this.sendPos).every((v, i) => v === env[i]);
      if (result) this.envelope = env;
    }
    if (!result && this.pieces.slice(1).includes('@')) return true;
    return result;
  }
}


