import { useTranslation } from 'react-i18next';
import { downloadAdif } from '../engine/adif';
import { downloadCabrillo } from '../engine/cabrillo';
import type { ContestDefinition } from '../engine/contest-defs';
import type { Qso, UserSettings } from '../types';

interface TrainingResultsProps {
  contest: ContestDefinition;
  settings: UserSettings;
  qsos: Qso[];
  startedAt: Date;
}

export function TrainingResults({ contest, settings, qsos, startedAt }: TrainingResultsProps) {
  const { t } = useTranslation();
  const disabled = !qsos.length;

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => downloadAdif({ contest: contest.id, settings, qsos, startedAt })}
        className="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800 disabled:opacity-40"
      >
        {t('exportAdif')}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => downloadCabrillo({ contest: contest.id, settings, qsos, startedAt })}
        className="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800 disabled:opacity-40"
      >
        {t('exportCabrillo')}
      </button>
    </div>
  );
}
