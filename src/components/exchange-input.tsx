import { useTranslation } from 'react-i18next';
import { NormalizedInput } from './inputs/normalized-input';
import { normalizeCallsign, normalizeExchange } from './inputs/normalize';
import type { ContestDefinition } from '../engine/contest-defs';

interface ExchangeInputProps {
  contestDefinition: ContestDefinition;
  call: string;
  exch1: string;
  exch2: string;
  callRef: React.RefObject<HTMLInputElement | null>;
  exch1Ref: React.RefObject<HTMLInputElement | null>;
  exch2Ref: React.RefObject<HTMLInputElement | null>;
  onCallChange: (value: string) => void;
  onExch1Change: (value: string) => void;
  onExch2Change: (value: string) => void;
  onSave: () => void;
  onClear: () => void;
}

const inputClassName = 'w-full min-w-0 min-h-12 rounded border border-slate-800 bg-slate-950 px-3 py-3 font-mono text-lg uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40';

export function ExchangeInput({
  contestDefinition, call, exch1, exch2, callRef, exch1Ref, exch2Ref,
  onCallChange, onExch1Change, onExch2Change, onSave, onClear,
}: ExchangeInputProps) {
  const { t } = useTranslation();
  const field1 = contestDefinition.fields[0];
  const field2 = contestDefinition.fields[1];

  return (
    <div>
      <div className="exchange-grid grid grid-cols-[minmax(0,1fr)_4rem_4.5rem] gap-2">
        <NormalizedInput
          ref={callRef}
          value={call}
          normalize={normalizeCallsign}
          onValueChange={onCallChange}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('call')}
          data-exchange-field="call"
          className={inputClassName}
        />
        <NormalizedInput
          ref={exch1Ref}
          value={exch1}
          normalize={(value) => normalizeExchange(value, 12)}
          onValueChange={onExch1Change}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t(field1?.labelKey ?? 'exchange')}
          data-exchange-field="rst"
          className={`${inputClassName} px-2 text-center`}
        />
        <NormalizedInput
          ref={exch2Ref}
          value={exch2}
          normalize={(value) => normalizeExchange(value, 16)}
          onValueChange={onExch2Change}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t(field2?.labelKey ?? 'exchange')}
          data-exchange-field="nr"
          className={`${inputClassName} px-2 text-center`}
        />
      </div>
      <div className="exchange-actions mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button type="button" onClick={onSave} className="min-h-11 rounded bg-emerald-600 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-500 active:bg-emerald-400">{t('save')}</button>
        <button type="button" onClick={onClear} className="min-h-11 rounded border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 active:bg-slate-800">{t('clear')}</button>
      </div>
      <p className="mt-2 hidden text-xs text-slate-500 sm:block">{t('keyboardHint')}</p>
    </div>
  );
}
