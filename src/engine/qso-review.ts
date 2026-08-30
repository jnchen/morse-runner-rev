import type { ExchangeField } from './contest-defs';
import type { Qso } from '../types';

export interface ReviewField extends ExchangeField {
  copied: string;
  actual: string;
}

function normalize(value: string, field?: ExchangeField) {
  const result = value.trim().toUpperCase();
  if (!field || !result) return result;
  if (field.type === 'rst') {
    if (/^5N[NT]?$/.test(result) || result === '5NN') return '599';
    const numeric = Number(result);
    return Number.isFinite(numeric) && result.length <= 3 ? String(numeric) : result;
  }
  if (['serial', 'number', 'zone'].includes(field.type)) {
    const numeric = Number(result);
    return Number.isFinite(numeric) ? String(numeric) : result;
  }
  return result.replace(/\s+/g, ' ');
}

export function hasActualAnswer(qso: Pick<Qso, 'trueCall' | 'trueExch1' | 'trueExch2'>): boolean {
  return Boolean(qso.trueCall.trim() || qso.trueExch1.trim() || qso.trueExch2.trim());
}

export function actualAnswerText(qso: Pick<Qso, 'trueCall' | 'trueExch1' | 'trueExch2'>): string {
  return [qso.trueCall, qso.trueExch1, qso.trueExch2]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' ');
}

export function reviewFields(
  qso: Pick<Qso, 'call' | 'exch1' | 'exch2' | 'trueCall' | 'trueExch1' | 'trueExch2'>,
  fields: ExchangeField[],
): ReviewField[] {
  const callField: ReviewField = {
    key: 'exch1',
    type: 'text',
    labelKey: 'call',
    default: '',
    copied: qso.call,
    actual: qso.trueCall,
  };
  const exchangeFields = fields.map((field) => ({
    ...field,
    copied: field.key === 'exch1' ? qso.exch1 : qso.exch2,
    actual: field.key === 'exch1' ? qso.trueExch1 : qso.trueExch2,
  }));
  return [callField, ...exchangeFields];
}

export function isReviewFieldWrong(field: ReviewField): boolean {
  return normalize(field.copied, field.labelKey === 'call' ? undefined : field) !== normalize(field.actual, field.labelKey === 'call' ? undefined : field);
}