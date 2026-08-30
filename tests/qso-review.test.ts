import { describe, expect, it } from 'vitest';
import { actualAnswerText, hasActualAnswer, isReviewFieldWrong, reviewFields } from '../src/engine/qso-review';
import type { Qso } from '../src/types';

function qso(trueCall: string, trueExch1 = '', trueExch2 = ''): Pick<Qso, 'trueCall' | 'trueExch1' | 'trueExch2'> {
  return { trueCall, trueExch1, trueExch2 };
}

describe('QSO review data', () => {
  it('builds replay text from the actual station fields', () => {
    expect(actualAnswerText(qso('N0AX', '5NN', '123'))).toBe('N0AX 5NN 123');
  });

  it('omits empty fields', () => {
    expect(actualAnswerText(qso('K3LR', '', '14'))).toBe('K3LR 14');
  });

  it('disables review when a NIL entry has no matching station', () => {
    expect(hasActualAnswer(qso(''))).toBe(false);
    expect(actualAnswerText(qso(''))).toBe('');
  });

  it('allows review when any actual field exists', () => {
    expect(hasActualAnswer(qso('', '5NN', ''))).toBe(true);
  });

  it('compares copied and actual fields with contest normalization', () => {
    const fields = reviewFields(
      { call: 'N0AX', exch1: '599', exch2: '42', trueCall: 'N0AX', trueExch1: '5NN', trueExch2: '42' },
      [
        { key: 'exch1', type: 'rst', labelKey: 'rst', default: '5NN' },
        { key: 'exch2', type: 'serial', labelKey: 'nr', default: '1' },
      ],
    );
    expect(fields.map((field) => field.labelKey)).toEqual(['call', 'rst', 'nr']);
    expect(fields.map((field) => isReviewFieldWrong(field))).toEqual([false, false, false]);
  });
});