import { useTranslation } from 'react-i18next';
import { CONTEST_LIST, type ContestId } from '../engine/contest-defs';
import type { UserSettings } from '../types';
import { Range } from './ui/range';

interface StationPanelProps {
  settings: UserSettings;
  volume: number;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
  onVolumeChange: (volume: number) => void;
}

interface NumericSettingKey {
  key: keyof Pick<UserSettings, 'wpm' | 'pitch' | 'bandwidth'>;
  labelKey: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
}

const NUMERIC_SETTINGS: NumericSettingKey[] = [
  { key: 'wpm', labelKey: 'speed', unit: 'WPM', min: 10, max: 120 },
  { key: 'pitch', labelKey: 'pitch', unit: 'Hz', min: 300, max: 1000, step: 25 },
  { key: 'bandwidth', labelKey: 'bandwidth', unit: 'Hz', min: 100, max: 1000, step: 50 },
];

export function StationPanel({ settings, volume, onSettingsChange, onVolumeChange }: StationPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">{t('station')}</h2>
      </header>
      <div className="panel-body space-y-3">
      <label className="block text-sm">
        {t('callsign')}
        <input
          value={settings.call}
          autoCapitalize="characters"
          onChange={(event) => onSettingsChange({ call: event.target.value.toUpperCase().replace(/[^A-Z0-9/]/g, '') })}
          className="control-input mt-1 h-9 px-2.5 font-mono text-xs uppercase"
        />
      </label>
      {NUMERIC_SETTINGS.map(({ key, labelKey, unit, min, max, step }) => (
        <div key={key}>
          <Range
            label={t(labelKey)}
            value={`${settings[key]} ${unit}`}
            min={min}
            max={max}
            step={step}
            current={settings[key]}
            onChange={(value) => onSettingsChange({ [key]: value } as Partial<UserSettings>)}
          />
        </div>
      ))}
      <div>
        <Range
          label={t('volume')}
          value={`${Math.round(volume * 100)}%`}
          min={0}
          max={100}
          current={Math.round(volume * 100)}
          onChange={(value) => onVolumeChange(value / 100)}
        />
      </div>
      </div>
    </section>
  );
}

export function ContestSettingsPanel({
  settings,
  contest,
  onContestChange,
  onSettingsChange,
}: {
  settings: UserSettings;
  contest: ContestId;
  onContestChange: (contest: ContestId) => void;
  onSettingsChange: (patch: Partial<UserSettings>) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">{t('contest')}</h2>
      </header>
      <div className="panel-body space-y-3">
      <label className="block text-sm">
        {t('contestType')}
        <select
          value={contest}
          onChange={(event) => onContestChange(event.target.value as ContestId)}
          className="control-input mt-1 h-9 px-2.5 text-xs"
        >
          {CONTEST_LIST.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div><Range label={t('activity')} value={String(settings.activity)} min={1} max={20} current={settings.activity} onChange={(value) => onSettingsChange({ activity: value })} /></div>
      <div><Range label={t('duration')} value={`${settings.duration} min`} min={1} max={120} current={settings.duration} onChange={(value) => onSettingsChange({ duration: value })} /></div>
      <div className="grid grid-cols-2 gap-1.5">
        {(['qsk', 'qrn', 'qrm', 'qsb', 'flutter', 'lids'] as const).map((key) => (
          <label key={key} className="setting-check flex min-h-9 cursor-pointer items-center gap-2 rounded border border-slate-800 bg-black/30 px-2 text-[11px] text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100">
            <input type="checkbox" checked={settings[key]} onChange={(event) => onSettingsChange({ [key]: event.target.checked } as Partial<UserSettings>)} />
            {t(key)}
          </label>
        ))}
      </div>
      </div>
    </section>
  );
}
