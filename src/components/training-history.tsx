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
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-semibold">{t('trainingHistory')}</h2>
        <button type="button" disabled={!results.length} onClick={onClear} className="min-h-9 rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800 disabled:opacity-40">{t('resetHistory')}</button>
      </div>
      {results.length === 0 ? (
        <p className="text-sm text-slate-500">{t('noTrainingResults')}</p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {results.map((result) => (
            <li key={result.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{CONTESTS[result.contest].name} · {t(result.mode)}</div>
                <div className="text-xs text-slate-500">
                  {new Date(result.startedAt).toISOString().replace('T', ' ').slice(0, 16)} UTC · {result.score} · {result.qsoCount} QSO
                </div>
              </div>
              <button type="button" onClick={() => onRestore(result)} className="shrink-0 min-h-9 rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800">{t('restore')}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
