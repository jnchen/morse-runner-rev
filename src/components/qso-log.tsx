import { useTranslation } from 'react-i18next';
import type { ContestDefinition } from '../engine/contest-defs';
import type { Qso } from '../types';

interface QsoLogProps {
  contestDefinition: ContestDefinition;
  qsos: Qso[];
}

export function QsoLog({ contestDefinition, qsos }: QsoLogProps) {
  const { t } = useTranslation();
  const field1 = contestDefinition.fields[0];
  const field2 = contestDefinition.fields[1];

  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">{t('log')}</h2>
        <span className="font-mono text-[11px] text-slate-500">{qsos.length} QSO</span>
      </header>
      <div className="max-h-[400px] overflow-auto">
        <table className="log-table text-left text-xs">
          <thead className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="text-left">UTC</th>
              <th className="text-left">{t('call')}</th>
              <th className="text-left">{t(field1?.labelKey ?? 'exchange')}</th>
              <th className="text-left">{t(field2?.labelKey ?? 'exchange')}</th>
              <th className="text-left">PFX</th>
              <th className="text-right">CHK</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {qsos.length === 0 ? (
              <tr><td colSpan={6} className="py-7 text-center text-slate-600">{t('emptyLog')}</td></tr>
            ) : qsos.map((qso, index) => (
              <tr key={`${qso.time}-${index}`}>
                <td className="text-slate-500">{new Date(qso.time * 1000).toISOString().substring(11, 19)}</td>
                <td className="font-semibold text-slate-100">{qso.call}</td>
                <td className="text-slate-300">{qso.exch1}</td>
                <td className="text-slate-300">{qso.exch2}</td>
                <td className="text-slate-400">{qso.pfx}</td>
                <td className={`text-right font-semibold ${qso.err === '   ' ? 'text-emerald-400' : 'text-red-400'}`}>{qso.err.trim()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
