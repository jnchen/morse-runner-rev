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
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,2.2fr)_minmax(0,0.7fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-slate-500">{t('call')}</span>
          <input
            ref={callRef}
            value={call}
            inputMode="text"
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(event) => onCallChange(event.target.value.toUpperCase().replace(/[^A-Z0-9/?]/g, ''))}
            placeholder="W1AW"
            className="field-input h-11 px-3 text-lg tracking-[0.08em] sm:h-10 sm:text-base"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-slate-500">{t(field1?.labelKey ?? 'exchange')}</span>
          <input
            ref={exch1Ref}
            value={exch1}
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(event) => onExch1Change(event.target.value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, 12))}
            placeholder="5NN"
            className="field-input h-11 px-2 text-center text-base sm:h-10"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold tracking-[0.14em] text-slate-500">{t(field2?.labelKey ?? 'exchange')}</span>
          <input
            ref={exch2Ref}
            value={exch2}
            autoCapitalize="characters"
            spellCheck={false}
            onChange={(event) => onExch2Change(event.target.value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, 16))}
            placeholder="001"
            className="field-input h-11 px-2 text-center text-base sm:h-10"
          />
        </label>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={onSave} className="btn btn-primary h-10 flex-1 px-3 text-sm">{t('save')}</button>
        <button type="button" onClick={onClear} className="btn h-10 px-4 text-sm">{t('clear')}</button>
      </div>
      <p className="mt-2 hidden text-slate-500">{t('keyboardHint')}</p>
    </div>
  );
}
