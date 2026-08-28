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
      <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
        <input
          ref={callRef}
          value={call}
          inputMode="text"
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) => onCallChange(event.target.value.toUpperCase().replace(/[^A-Z0-9/?]/g, ''))}
          placeholder={t('call')}
          className="rounded bg-slate-950 px-3 py-3 font-mono text-lg uppercase outline-none ring-emerald-500 focus:ring-2"
        />
        <input
          ref={exch1Ref}
          value={exch1}
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) => onExch1Change(event.target.value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, 12))}
          placeholder={t(field1?.labelKey ?? 'exchange')}
          className="rounded bg-slate-950 px-3 py-3 text-center font-mono uppercase outline-none"
        />
        <input
          ref={exch2Ref}
          value={exch2}
          autoCapitalize="characters"
          spellCheck={false}
          onChange={(event) => onExch2Change(event.target.value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, 16))}
          placeholder={t(field2?.labelKey ?? 'exchange')}
          className="rounded bg-slate-950 px-3 py-3 text-center font-mono uppercase outline-none"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={onSave} className="flex-1 rounded bg-emerald-600 py-2 text-sm font-semibold hover:bg-emerald-500">{t('save')}</button>
        <button type="button" onClick={onClear} className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('clear')}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">{t('keyboardHint')}</p>
    </div>
  );
}
