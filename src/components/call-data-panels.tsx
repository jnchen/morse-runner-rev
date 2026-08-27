import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ContestDefinition } from '../engine/contest-defs';

interface CallDataPanelsProps {
  contest: ContestDefinition;
  callCount: number;
  historyCount: number;
  onImportCallList: (file: File | undefined) => void;
  onResetCallList: () => void;
  onImportCallHistory: (file: File | undefined) => void;
  onResetCallHistory: () => void;
}

export function CallDataPanels({
  contest, callCount, historyCount, onImportCallList, onResetCallList, onImportCallHistory, onResetCallHistory,
}: CallDataPanelsProps) {
  const { t } = useTranslation();
  const historyFileRef = useRef<HTMLInputElement>(null);
  const callFileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">{t('callHistory')}</h2>
          <span className="text-xs text-slate-400">{historyCount ? t('callsLoaded', { count: historyCount }) : t('historyFallback')}</span>
        </div>
        <p className="mb-3 text-xs text-slate-400">{contest.historyFile ?? t('usesMaster')}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => historyFileRef.current?.click()} className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('importHistory')}</button>
          <button type="button" onClick={onResetCallHistory} className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('resetHistory')}</button>
          <input ref={historyFileRef} type="file" accept=".txt,.TXT,.list,.LIST" className="hidden" onChange={(event) => onImportCallHistory(event.target.files?.[0])} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-semibold">{t('callList')}</h2>
          <span className="text-xs text-slate-400">{callCount ? t('callsLoaded', { count: callCount }) : t('callsFallback')}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => callFileRef.current?.click()} className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('importMaster')}</button>
          <button type="button" onClick={onResetCallList} className="rounded border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800">{t('resetCalls')}</button>
          <input ref={callFileRef} type="file" accept=".dta,.DTA" className="hidden" onChange={(event) => onImportCallList(event.target.files?.[0])} />
        </div>
      </section>
    </>
  );
}
