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
    <section className="panel">
      <header className="panel-header"><h2 className="panel-title">{t('contestExchange')}</h2></header>
      <div className="panel-body grid gap-2">
        {contest.fields.map((field) => (
          <label key={field.key} className="block text-[11px] text-slate-400">
            {t(field.labelKey)}
            <input
              value={field.key === 'exch1' ? settings.exchange1 : settings.exchange2}
              onChange={(event) => onSettingsChange(
                field.key === 'exch1'
                  ? { exchange1: event.target.value.toUpperCase() }
                  : { exchange2: event.target.value.toUpperCase() },
              )}
              className="control-input mt-1 h-9 px-2.5 font-mono text-xs uppercase"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
