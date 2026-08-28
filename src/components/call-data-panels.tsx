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
      <section className="panel">
        <header className="panel-header">
          <h2 className="panel-title">{t('callHistory')}</h2>
          <span className="font-mono text-[10px] text-slate-500">{historyCount ? t('callsLoaded', { count: historyCount }) : t('historyFallback')}</span>
        </header>
        <div className="panel-body">
          <p className="mb-2 font-mono text-[11px] text-slate-500">{contest.historyFile ?? t('usesMaster')}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => historyFileRef.current?.click()} className="btn min-h-9 px-3 text-xs">{t('importHistory')}</button>
            <button type="button" onClick={onResetCallHistory} className="btn min-h-9 px-3 text-xs">{t('resetHistory')}</button>
            <input ref={historyFileRef} type="file" accept=".txt,.TXT,.list,.LIST" className="hidden" onChange={(event) => onImportCallHistory(event.target.files?.[0])} />
          </div>
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <h2 className="panel-title">{t('callList')}</h2>
          <span className="font-mono text-[10px] text-slate-500">{callCount ? t('callsLoaded', { count: callCount }) : t('callsFallback')}</span>
        </header>
        <div className="panel-body">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => callFileRef.current?.click()} className="btn min-h-9 px-3 text-xs">{t('importMaster')}</button>
            <button type="button" onClick={onResetCallList} className="btn min-h-9 px-3 text-xs">{t('resetCalls')}</button>
            <input ref={callFileRef} type="file" accept=".dta,.DTA" className="hidden" onChange={(event) => onImportCallList(event.target.files?.[0])} />
          </div>
        </div>
      </section>
    </>
  );
}
