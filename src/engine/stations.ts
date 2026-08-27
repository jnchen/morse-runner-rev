import type { StationEvent } from '../types';
import { DxOperator } from './dx-operator';
import { rndGaussLim, rndUShaped } from './random';
import type { ContestEngine } from './contest';
import type { CallHistoryRecord } from './call-history';
import { Station, NEVER, type StationContext } from './station';

export class DxStation extends Station {
  oper: DxOperator;

  constructor(ctx: StationContext, engine: ContestEngine, pickCall: () => string, record?: CallHistoryRecord | null) {
    super(ctx, engine);
    const picked = record ?? null;
    this.myCall = picked?.call ?? pickCall();
    this.exch1 = picked?.exch1 ?? '599';
    this.exch2 = picked?.exch2 ?? String(this.nr);
    this.hisCall = ctx.myCall;
    this.oper = new DxOperator(ctx);
    this.oper.call = this.myCall;
    this.oper.skills = 1 + Math.floor(Math.random() * 3);
    this.oper.setState('needPrevEnd');
    this.nrWithError = ctx.lidsEnabled && Math.random() < 0.1;
    this.wpm = this.oper.getWpm();
    this.nr = this.oper.getNr();
    if (!record) {
      this.exch1 = '599';
      this.exch2 = String(this.nr);
    } else if (picked?.exch2 === undefined) {
      this.exch2 = String(this.nr);
    }
    this.rst = ctx.lidsEnabled && Math.random() < 0.03 ? 559 + 10 * Math.floor(Math.random() * 4) : 599;
    this.makeQsb();
    this.amplitude = 9000 + 18000 * (1 + rndUShaped());
    this.setPitch(Math.round(rndGaussLim(0, 300)));
    this.timeout = NEVER;
    this.state = 'copying';
  }

  addToMix(re: Float32Array, im: Float32Array) {
    if (this.state === 'sending' && this.envelope) this.modulateInto(re, im);
  }

  processEvent(event: StationEvent) {
    if (this.oper.state === 'done' || this.oper.state === 'failed') return;
    if (event === 'msgSent') {
      this.timeout = this.engine.me.state === 'sending' ? NEVER : this.oper.getReplyTimeout();
    } else if (event === 'timeout') {
      if (this.state === 'listening') {
        this.oper.msgReceived(new Set(['none']));
        if ((this.oper.state as string) === 'failed') return this.engine.removeStation(this);
        this.state = 'preparing';
      }
      if (this.state === 'preparing') {
        for (let i = 0; i < this.oper.repeatCount; i++) this.send(this.oper.getReply());
      }
    } else if (event === 'meFinished') {
      if (this.state !== 'sending') {
        const heard = this.state === 'copying'
          ? this.engine.me.messages
          : (['cq', 'tu', 'nil'].some((m) => this.engine.me.messages.has(m as never)) ? this.engine.me.messages : new Set(['garbage' as never]));
        this.oper.msgReceived(heard);
        if ((this.oper.state as string) === 'failed') return this.engine.removeStation(this);
        this.timeout = this.oper.getSendDelay();
        this.state = 'preparing';
      }
    } else if (event === 'meStarted') {
      if (this.state !== 'sending') {
        this.state = 'copying';
        this.timeout = NEVER;
      }
    }
  }
}

export class QrnStation extends Station {
  constructor(ctx: StationContext, engine: ContestEngine) {
    super(ctx, engine);
    const seconds = Math.random();
    const length = Math.max(ctx.blockSize, Math.ceil(seconds * ctx.sampleRate));
    this.envelope = new Float32Array(length);
    const amp = 1e5 * Math.pow(10, 2 * Math.random());
    for (let i = 0; i < length; i++) if (Math.random() < 0.01) this.envelope[i] = (Math.random() - 0.5) * amp;
    this.state = 'sending';
  }
  addToMix(re: Float32Array, im: Float32Array) { if (this.envelope) this.modulateInto(re, im); }
  processEvent(e: StationEvent) { if (e === 'msgSent') this.engine.removeStation(this); }
}

export class QrmStation extends Station {
  private patience: number;
  constructor(ctx: StationContext, engine: ContestEngine, pickCall: () => string, record?: CallHistoryRecord | null) {
    super(ctx, engine);
    this.patience = 1 + Math.floor(Math.random() * 5);
    const picked = record ?? null;
    this.myCall = picked?.call ?? pickCall();
    this.exch1 = picked?.exch1 ?? '599';
    this.exch2 = picked?.exch2 ?? String(this.nr);
    this.hisCall = ctx.myCall;
    this.amplitude = 5000 + 25000 * Math.random();
    this.setPitch(Math.round(rndGaussLim(0, 300)));
    this.wpm = 30 + Math.floor(Math.random() * 20);
    const replies = ['qrl', 'qrl2', 'longCq', 'longCq', 'longCq', 'qsy'] as const;
    this.send(replies[Math.floor(Math.random() * replies.length)]);
  }
  addToMix(re: Float32Array, im: Float32Array) { if (this.envelope) this.modulateInto(re, im); }
  processEvent(e: StationEvent) {
    if (e === 'msgSent') {
      this.patience--;
      if (this.patience <= 0) this.engine.removeStation(this);
      else this.timeout = Math.max(1, Math.round(rndGaussLim(this.engine.secondsToBlocks(4), 2)));
    } else if (e === 'timeout') this.send('longCq');
  }
}




