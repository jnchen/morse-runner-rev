import { describe, expect, it } from 'vitest';
import { normalizeCallsign, normalizeExchange, normalizeStationCallsign } from '../src/components/inputs/normalize';

describe('input normalization', () => {
  it('normalizes callsigns for contest entry', () => {
    expect(normalizeCallsign('w4lm')).toBe('W4LM');
    expect(normalizeCallsign(' W4/LM? ')).toBe('W4/LM?');
    expect(normalizeCallsign('W4-LM#')).toBe('W4LM');
  });

  it('normalizes station callsigns without query markers', () => {
    expect(normalizeStationCallsign('ve3nea')).toBe('VE3NEA');
    expect(normalizeStationCallsign('VE3/NEA?')).toBe('VE3/NEA');
  });

  it('normalizes and limits exchange text', () => {
    expect(normalizeExchange(' 5nn / 123 ', 12)).toBe(' 5NN / 123 ');
    expect(normalizeExchange('a'.repeat(20), 16)).toBe('A'.repeat(16));
  });
});
