/** Three-pass cascaded moving-average QSB/fading model. */
export class QuickAverage {
  private re: Float64Array[];
  private im: Float64Array[];
  private idx = 0;
  private prevIdx: number;
  private scale: number;

  constructor(public points = 128, public passes = 3) {
    this.re = Array.from({ length: passes + 1 }, () => new Float64Array(points));
    this.im = Array.from({ length: passes + 1 }, () => new Float64Array(points));
    this.prevIdx = points - 1;
    this.scale = Math.pow(points, -passes);
  }

  reset() {
    this.re.forEach((a) => a.fill(0));
    this.im.forEach((a) => a.fill(0));
  }

  filter(re: number, im: number): { re: number; im: number } {
    let r = re;
    let v = re;
    for (let p = 1; p <= this.passes; p++) {
      v = r;
      r = this.re[p][this.prevIdx] - this.re[p - 1][this.idx] + v;
      this.re[p - 1][this.idx] = v;
    }
    this.re[this.passes][this.idx] = r;
    r *= this.scale;

    let i = im;
    v = im;
    for (let p = 1; p <= this.passes; p++) {
      v = i;
      i = this.im[p][this.prevIdx] - this.im[p - 1][this.idx] + v;
      this.im[p - 1][this.idx] = v;
    }
    this.im[this.passes][this.idx] = i;
    i *= this.scale;

    this.prevIdx = this.idx;
    this.idx = (this.idx + 1) % this.points;
    return { re: r, im: i };
  }
}

export class Qsb {
  private filt: QuickAverage;
  private gain = 1;
  qsbLevel = 1;

  constructor(public bandwidth = 0.1, sampleRate: number, private blockSize: number) {
    this.filt = new QuickAverage(Math.max(1, Math.ceil((0.37 * sampleRate) / ((blockSize / 4) * bandwidth))), 3);
    for (let i = 0; i < this.filt.points * 3; i++) this.newGain();
  }

  private newGain(): number {
    const x = this.filt.filter(Math.random() * 2 - 1, Math.random() * 2 - 1);
    const result = Math.sqrt((x.re * x.re + x.im * x.im) * 3 * this.filt.points);
    this.gain = result * this.qsbLevel + (1 - this.qsbLevel);
    return this.gain;
  }

  apply(arr: Float32Array) {
    const sub = Math.max(1, this.blockSize / 4 | 0);
    for (let b = 0; b < arr.length / sub; b++) {
      const next = this.newGain();
      const d = (next - this.gain) / sub;
      for (let i = 0; i < sub; i++) {
        const p = b * sub + i;
        if (p >= arr.length) break;
        arr[p] *= this.gain;
        this.gain += d;
      }
    }
  }
}

