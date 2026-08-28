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
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3 sm:p-4">
      <h2 className="mb-3 font-semibold">{t('station')}</h2>
      <label className="block text-sm">
        {t('callsign')}
        <input
          value={settings.call}
          autoCapitalize="characters"
          onChange={(event) => onSettingsChange({ call: event.target.value.toUpperCase().replace(/[^A-Z0-9/]/g, '') })}
          className="mt-1 w-full min-h-11 rounded bg-slate-950 px-3 py-2 font-mono uppercase"
        />
      </label>
      {NUMERIC_SETTINGS.map(({ key, labelKey, unit, min, max, step }) => (
        <div className="mt-3" key={key}>
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
      <div className="mt-3">
        <Range
          label={t('volume')}
          value={`${Math.round(volume * 100)}%`}
          min={0}
          max={100}
          current={Math.round(volume * 100)}
          onChange={(value) => onVolumeChange(value / 100)}
        />
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
    <section className="rounded-lg border border-slate-800 bg-slate-900 p-3 sm:p-4">
      <h2 className="mb-3 font-semibold">{t('contest')}</h2>
      <label className="block text-sm">
        {t('contestType')}
        <select
          value={contest}
          onChange={(event) => onContestChange(event.target.value as ContestId)}
          className="mt-1 w-full min-h-11 rounded bg-slate-950 px-3 py-2 text-sm"
        >
          {CONTEST_LIST.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <div className="mt-3"><Range label={t('activity')} value={String(settings.activity)} min={1} max={20} current={settings.activity} onChange={(value) => onSettingsChange({ activity: value })} /></div>
      <div className="mt-3"><Range label={t('duration')} value={`${settings.duration} min`} min={1} max={120} current={settings.duration} onChange={(value) => onSettingsChange({ duration: value })} /></div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {(['qsk', 'qrn', 'qrm', 'qsb', 'flutter', 'lids'] as const).map((key) => (
          <label key={key} className="flex items-center gap-2 rounded border border-slate-800 px-2 py-1">
            <input type="checkbox" checked={settings[key]} onChange={(event) => onSettingsChange({ [key]: event.target.checked } as Partial<UserSettings>)} />
            {t(key)}
          </label>
        ))}
      </div>
    </section>
  );
}
