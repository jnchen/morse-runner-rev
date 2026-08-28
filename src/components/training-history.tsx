import { useTranslation } from 'react-i18next';
import { CONTESTS } from '../engine/contest-defs';
import type { TrainingResult } from '../stores/training-results-store';

interface TrainingHistoryProps {
  results: TrainingResult[];
  onRestore: (result: TrainingResult) => void;
  onClear: () => void;
}

export function TrainingHistory({ results, onRestore, onClear }: TrainingHistoryProps) {
  const { t } = useTranslation();

  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">{t('trainingHistory')}</h2>
        <button type="button" disabled={!results.length} onClick={onClear} className="btn min-h-8 px-2 text-[10px]">{t('resetHistory')}</button>
      </header>
      <div className="panel-body">
      {results.length === 0 ? (
        <p className="text-xs text-slate-500">{t('noTrainingResults')}</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {results.map((result) => (
            <li key={result.id} className="flex items-center justify-between gap-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="truncate font-medium">{CONTESTS[result.contest].name} · {t(result.mode)}</div>
                <div className="text-xs text-slate-500">
                  {new Date(result.startedAt).toISOString().replace('T', ' ').slice(0, 16)} UTC · {result.score} · {result.qsoCount} QSO
                </div>
              </div>
              <button type="button" onClick={() => onRestore(result)} className="btn min-h-8 shrink-0 px-2 text-[10px]">{t('restore')}</button>
            </li>
          ))}
        </ul>
      )}
      </div>
    </section>
  );
}
