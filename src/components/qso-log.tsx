import { useTranslation } from 'react-i18next';
import type { ContestDefinition } from '../engine/contest-defs';
import type { Qso } from '../types';

interface QsoLogProps {
  contestDefinition: ContestDefinition;
  qsos: Qso[];
}

function formatTime(time: number) {
  return new Date(time * 1000).toISOString().substring(11, 19);
}

export function QsoLog({ contestDefinition, qsos }: QsoLogProps) {
  const { t } = useTranslation();
  const field1 = contestDefinition.fields[0];
  const field2 = contestDefinition.fields[1];

  return (
    <>
      <div className="sm:hidden">
        {qsos.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-500">
            {t('emptyLog')}
          </div>
        ) : (
          <ol className="space-y-2">
            {qsos.map((qso, index) => {
              const valid = qso.err === '   ';
              return (
                <li
                  key={`${qso.time}-${index}`}
                  className="rounded-lg border border-slate-800 bg-slate-900 p-3 font-mono text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="min-w-0 break-all text-base font-semibold text-slate-100">{qso.call}</span>
                    <span className="shrink-0 text-xs text-slate-400">{formatTime(qso.time)}</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1 text-xs">
                    <dt className="text-slate-500">{t(field1?.labelKey ?? 'exchange')}</dt>
                    <dd className="break-all text-slate-200">{qso.exch1}</dd>
                    <dt className="text-slate-500">{t(field2?.labelKey ?? 'exchange')}</dt>
                    <dd className="break-all text-slate-200">{qso.exch2}</dd>
                    <dt className="text-slate-500">PFX</dt>
                    <dd className="break-all text-slate-200">{qso.pfx}</dd>
                    <dt className="text-slate-500">CHK</dt>
                    <dd className={valid ? 'text-emerald-400' : 'text-red-400'}>{qso.err.trim()}</dd>
                  </dl>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-800 sm:block">
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
                <td className="p-2">{formatTime(qso.time)}</td>
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
    </>
  );
}
