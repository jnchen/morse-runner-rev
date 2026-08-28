import { useTranslation } from 'react-i18next';
import type { ContestDefinition } from '../engine/contest-defs';
import type { UserSettings } from '../types';

interface ContestDefinitionPanelProps {
  contest: ContestDefinition;
  settings: UserSettings;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
}

export function ContestDefinitionPanel({ contest, settings, onSettingsChange }: ContestDefinitionPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <h2 className="mb-3 font-semibold">{t('contestExchange')}</h2>
      <div className="grid gap-2">
        {contest.fields.map((field) => (
          <label key={field.key} className="block text-sm">
            {t(field.labelKey)}
            <input
              value={field.key === 'exch1' ? settings.exchange1 : settings.exchange2}
              onChange={(event) => onSettingsChange(
                field.key === 'exch1'
                  ? { exchange1: event.target.value.toUpperCase() }
                  : { exchange2: event.target.value.toUpperCase() },
              )}
              className="mt-1 w-full rounded bg-slate-950 px-3 py-2 font-mono uppercase"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
