import { useTranslation } from 'react-i18next';
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

export function ExchangeInput({
  contestDefinition, call, exch1, exch2, callRef, exch1Ref, exch2Ref,
  onCallChange, onExch1Change, onExch2Change, onSave, onClear,
}: ExchangeInputProps) {
  const { t } = useTranslation();
  const field1 = contestDefinition.fields[0];
  const field2 = contestDefinition.fields[1];

  return (
    <div>
      <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(3.25rem,minmax(0,0.8fr))] gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
        <input
          ref={callRef}
          value={call}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onCallChange(event.target.value.toUpperCase().replace(/[^A-Z0-9/?]/g, ''))}
          placeholder={t('call')}
          className="min-h-12 rounded border border-slate-800 bg-slate-950 px-3 py-3 font-mono text-lg uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
        />
        <input
          ref={exch1Ref}
          value={exch1}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onExch1Change(event.target.value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, 12))}
          placeholder={t(field1?.labelKey ?? 'exchange')}
          className="min-h-12 rounded border border-slate-800 bg-slate-950 px-2 py-3 text-center font-mono uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
        />
        <input
          ref={exch2Ref}
          value={exch2}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => onExch2Change(event.target.value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, 16))}
          placeholder={t(field2?.labelKey ?? 'exchange')}
          className="col-span-2 min-h-12 rounded border border-slate-800 bg-slate-950 px-3 py-3 text-center font-mono uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 sm:col-span-1"
        />
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button type="button" onClick={onSave} className="min-h-11 rounded bg-emerald-600 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-500 active:bg-emerald-400">{t('save')}</button>
        <button type="button" onClick={onClear} className="min-h-11 rounded border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 active:bg-slate-800">{t('clear')}</button>
      </div>
      <p className="mt-2 hidden text-xs text-slate-500 sm:block">{t('keyboardHint')}</p>
    </div>
  );
}
