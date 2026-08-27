import type { CallCheckResult, OperatorState, StationMessage } from '../types';
import type { ContestEngine } from './contest';
import { rndGaussLim, rndRayleigh } from './random';
import type { StationContext } from './station';

const FULL_PATIENCE = 5;

export class DxOperator {
  call = '';
  skills = 1;
  patience = FULL_PATIENCE;
  repeatCount = 1;
  state: OperatorState = 'needPrevEnd';
  constructor(private ctx: StationContext) {}

  private get engine(): ContestEngine { return this.ctx.engine; }

  getSendDelay(): number {
    if (this.state === 'needPrevEnd') return Number.MAX_SAFE_INTEGER;
    if (this.ctx.runMode === 'hst') return this.engine.secondsToBlocks(0.05 + 0.5 * Math.random() * 10 / this.ctx.myWpm);
    return this.engine.secondsToBlocks(0.1 + 0.5 * Math.random());
  }

  getWpm(): number {
    return this.ctx.runMode === 'hst' ? this.ctx.myWpm : Math.round(this.ctx.myWpm * 0.5 * (1 + Math.random()));
  }

  getNr(): number {
    return 1 + Math.round(Math.random() * this.ctx.engine.minute * this.skills);
  }

  getReplyTimeout(): number {
    const base = this.ctx.runMode === 'hst'
      ? this.engine.secondsToBlocks(60 / this.ctx.myWpm)
      : this.engine.secondsToBlocks(6 - this.skills);
    return Math.max(1, Math.round(rndGaussLim(base, base / 2)));
  }

  setState(state: OperatorState) {
    this.state = state;
    if (state === 'needQso') this.patience = Math.max(1, Math.round(rndRayleigh(4)));
    else this.patience = FULL_PATIENCE;
    this.repeatCount = state === 'needQso' && this.ctx.runMode !== 'single' && this.ctx.runMode !== 'hst' && Math.random() < 0.1 ? 2 : 1;
  }

  private decPatience() {
    if (this.state === 'done') return;
    this.patience--;
    if (this.patience < 1) this.state = 'failed';
  }

  private isMyCall(): CallCheckResult {
    const c = this.engine.me.hisCall;
    const c0 = this.call;
    if (c.replace(/\?/g, '').length < 2) return 'no';

    const wX = 2, wY = 2, wD = 2;
    const m: number[][] = Array.from({ length: c.length + 1 }, () => new Array(c0.length + 1).fill(0));
    for (let x = 1; x <= c.length; x++) m[x][0] = m[x - 1][0] + wX;
    for (let x = 1; x <= c.length; x++) {
      for (let y = 1; y <= c0.length; y++) {
        let t = m[x][y - 1];
        if (x < c.length && c[x - 1] !== '?') t += wY;
        let l = m[x - 1][y];
        if (c[x - 1] !== '?') l += wX;
        let d = m[x - 1][y - 1];
        if (!(c[x - 1] === c0[y - 1] || c[x - 1] === '?')) d += wD;
        m[x][y] = Math.min(t, d, l);
      }
    }
    const penalty = m[c.length][c0.length];
    let result: CallCheckResult = penalty === 0 ? 'yes' : penalty <= 2 ? 'almost' : 'no';
    if (!this.ctx.lidsEnabled && c.length === 2 && result === 'almost') result = 'no';
    if (result === 'yes' && (c.length !== c0.length || c.includes('?'))) result = 'almost';
    if (this.ctx.lidsEnabled && c.length > 3) {
      if (result === 'yes' && Math.random() < 0.01) result = 'almost';
      if (result === 'almost' && Math.random() < 0.04) result = 'yes';
    }
    return result;
  }

  msgReceived(messages: Set<StationMessage>) {
    if (messages.has('cq')) {
      if (this.state === 'needPrevEnd' || this.state === 'needQso') {
        if (this.state === 'needPrevEnd') this.setState('needQso');
        else this.decPatience();
      } else if (this.state === 'needEnd') this.state = 'done';
      else this.state = 'failed';
      return;
    }
    if (messages.has('nil')) {
      if (this.state === 'needPrevEnd') this.setState('needQso');
      else if (this.state === 'needQso') this.decPatience();
      else this.state = 'failed';
      return;
    }
    if (messages.has('hisCall')) {
      const check = this.isMyCall();
      if (check === 'yes') {
        if (this.state === 'needPrevEnd' || this.state === 'needQso') this.setState('needNr');
        else if (this.state === 'needCallNr') this.setState('needNr');
        else if (this.state === 'needCall') this.setState('needEnd');
      } else if (check === 'almost') {
        if (this.state === 'needPrevEnd' || this.state === 'needQso') this.setState('needCallNr');
        else if (this.state === 'needNr') this.setState('needCallNr');
        else if (this.state === 'needEnd') this.setState('needCall');
      } else if (check === 'no') {
        if (this.state === 'needQso') this.state = 'needPrevEnd';
        else if (['needNr', 'needCall', 'needCallNr'].includes(this.state)) this.state = 'failed';
        else if (this.state === 'needEnd') this.state = 'done';
      }
    }
    if (messages.has('b4')) {
      if (['needPrevEnd', 'needQso'].includes(this.state)) this.setState('needQso');
      else if (['needNr', 'needEnd'].includes(this.state)) this.setState('failed');
    }
    if (messages.has('nr')) {
      if (this.state === 'needQso') this.state = 'needPrevEnd';
      else if (this.state === 'needNr' && (Math.random() < 0.9 || this.ctx.runMode === 'hst')) this.setState('needEnd');
      else if (this.state === 'needCallNr' && (Math.random() < 0.9 || this.ctx.runMode === 'hst')) this.setState('needCall');
    }
    if (messages.has('tu') && this.state === 'needEnd') this.setState('done');
    if (!this.ctx.lidsEnabled && messages.size === 1 && messages.has('garbage')) this.state = 'needPrevEnd';
    if (this.state !== 'needPrevEnd') this.decPatience();
  }

  getReply(): StationMessage {
    switch (this.state) {
      case 'needQso': return 'myCall';
      case 'needNr':
        return this.patience === FULL_PATIENCE - 1 || Math.random() < 0.3 ? 'nrQm' : 'agn';
      case 'needCall':
        if (this.ctx.runMode === 'hst' || Math.random() > 0.5) return 'deMyCallNr1';
        return Math.random() > 0.25 ? 'deMyCallNr2' : 'myCallNr2';
      case 'needCallNr':
        return this.ctx.runMode === 'hst' || Math.random() > 0.5 ? 'deMyCall1' : 'deMyCall2';
      case 'needEnd':
        if (this.patience < FULL_PATIENCE - 1) return 'nr';
        return this.ctx.runMode === 'hst' || Math.random() < 0.9 ? 'rNr' : 'rNr2';
      default: return 'none';
    }
  }
}


