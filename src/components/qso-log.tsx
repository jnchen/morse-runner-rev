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
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="p-2">UTC</th>
            <th>{t('call')}</th>
            <th>{t(field1?.labelKey ?? 'exchange')}</th>
            <th>{t(field2?.labelKey ?? 'exchange')}</th>
            <th>PFX</th>
            <th>CHK</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {qsos.length === 0 ? (
            <tr><td colSpan={6} className="p-6 text-center text-slate-500">{t('emptyLog')}</td></tr>
          ) : qsos.map((qso, index) => (
            <tr key={`${qso.time}-${index}`} className="border-t border-slate-800 odd:bg-slate-900/40">
              <td className="p-2">{new Date(qso.time * 1000).toISOString().substring(11, 19)}</td>
              <td>{qso.call}</td>
              <td>{qso.exch1}</td>
              <td>{qso.exch2}</td>
              <td>{qso.pfx}</td>
              <td className={qso.err === '   ' ? 'text-emerald-400' : 'text-red-400'}>{qso.err.trim()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
