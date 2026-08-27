/**
 * Exact port of MorseRunner's Blackman-Harris keyed envelope.
 * The generated signal remains in the public-domain timing domain;
 * implementation is written from scratch for this project.
 */
export class MorseKeyer {
  private table = new Map<string, string>();
  private rampOn!: Float32Array;
  private rampOff!: Float32Array;
  private rampLen = 0;

  wpm = 30;
  sampleRate: number;
  riseTime = 0.005;

  constructor(sampleRate: number, wpm = 30) {
    this.sampleRate = sampleRate;
    this.wpm = wpm;
    this.loadTable();
    this.makeRamp();
  }

  private loadTable() {
    const pairs: Array<[string, string]> = [
      ['1', '.----'], ['2', '..---'], ['3', '...--'], ['4', '....-'], ['5', '.....'],
      ['6', '-....'], ['7', '--...'], ['8', '---..'], ['9', '----.'], ['0', '-----'],
      ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'], ['F', '..-.'],
      ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'], ['K', '-.-'], ['L', '.-..'],
      ['M', '--'], ['N', '-.'], ['O', '---'], ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'],
      ['S', '...'], ['T', '-'], ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'],
      ['Y', '-.--'], ['Z', '--..'], ['/', '-..-.'], ['.', '.-.-.-'], [',', '--..--'],
      ['?', '..--..'], ['=', '-...-'], ['\\', '...-.'],
    ];
    for (const [char, code] of pairs) this.table.set(char, code + ' ');
  }

  private blackmanHarrisKernel(x: number) {
    return 0.35875 - 0.48829 * Math.cos(2 * Math.PI * x)
      + 0.14128 * Math.cos(4 * Math.PI * x) - 0.01168 * Math.cos(6 * Math.PI * x);
  }

  private makeRamp() {
    this.rampLen = Math.max(1, Math.round(2.7 * this.riseTime * this.sampleRate));
    const integrated = new Float32Array(this.rampLen);
    let acc = 0;
    for (let i = 0; i < this.rampLen; i++) {
      acc += this.blackmanHarrisKernel(i / this.rampLen);
      integrated[i] = acc;
    }
    for (let i = 0; i < this.rampLen; i++) integrated[i] /= acc;
    this.rampOn = integrated;
    this.rampOff = new Float32Array(this.rampLen);
    for (let i = 0; i < this.rampLen; i++) this.rampOff[this.rampLen - 1 - i] = this.rampOn[i];
  }

  encode(text: string): string {
    let out = '';
    for (const raw of text.toUpperCase()) {
      const ch = raw === '_' ? ' ' : raw;
      out += this.table.get(ch) ?? ' ';
    }
    if (out) out = out.slice(0, -1) + '~';
    return out;
  }

  envelope(morse: string, blockSize: number): Float32Array {
    let units = 0;
    for (const ch of morse) {
      if (ch === '.') units += 2;
      else if (ch === '-') units += 4;
      else if (ch === ' ') units += 2;
      else if (ch === '~') units += 1;
    }
    const samplesPerUnit = Math.max(1, Math.round((0.1 * this.sampleRate * 12) / this.wpm));
    const trueLen = units * samplesPerUnit + this.rampLen;
    const len = blockSize * Math.ceil(trueLen / blockSize);
    const out = new Float32Array(len);
    let p = 0;

    const rampOn = () => { out.set(this.rampOn.subarray(0, Math.min(this.rampLen, out.length - p)), p); p += this.rampLen; };
    const on = (dur: number) => {
      const end = Math.min(p + dur * samplesPerUnit - this.rampLen, out.length);
      for (; p < end; p++) out[p] = 1;
    };
    const rampOff = () => { out.set(this.rampOff.subarray(0, Math.min(this.rampLen, out.length - p)), p); p += this.rampLen; };
    const off = (dur: number) => { p += dur * samplesPerUnit - this.rampLen; };

    for (const ch of morse) {
      if (ch === '.') { rampOn(); on(1); rampOff(); off(1); }
      else if (ch === '-') { rampOn(); on(3); rampOff(); off(1); }
      else if (ch === ' ') off(2);
      else if (ch === '~') off(1);
    }
    return out;
  }

  textEnvelope(text: string, blockSize: number) {
    return this.envelope(this.encode(text), blockSize);
  }
}
