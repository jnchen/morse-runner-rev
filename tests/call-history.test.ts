import { describe, expect, it } from 'vitest';
import { CallHistory } from '../src/engine/call-history';

describe('CallHistory', () => {
  it('parses CQ WW fixed-column files', () => {
    const history = new CallHistory();
    history.load('cqww', '!!Order!!,Call,CQZone,Usertext,\n# comment\n2E0AQQ,14,\nBAD,,\n');
    expect(history.count).toBe(1);
    expect(history.pick()).toMatchObject({ call: '2E0AQQ', exch1: '599', exch2: '14' });
    expect(history.count).toBe(0);
  });

  it('parses CWOPS CWT files', () => {
    const history = new CallHistory();
    history.load('cwt', '!!Order!!,Call,Name,Exch1,UserText,\n2E0DCW,Gerald,G,London England\n');
    expect(history.pick()).toMatchObject({ call: '2E0DCW', exch1: 'GERALD', exch2: 'G' });
  });

  it('parses JARL files with no explicit header', () => {
    const history = new CallHistory();
    history.load('allja', '# Call, Exch1, UserText\n7J3AOZ,27M,Test\n');
    expect(history.pick()).toMatchObject({ call: '7J3AOZ', exch1: '599', exch2: '27M' });
  });

  it('parses ARRL Sweepstakes into check and section', () => {
    const history = new CallHistory();
    history.load('ss', '!!Order!!,Call,Sect,State,CK,UserText,\nW1AW,CT,CT,72,ARRL\n');
    expect(history.pick()).toMatchObject({ call: 'W1AW', exch1: 'A', exch2: '72 CT' });
  });
});
