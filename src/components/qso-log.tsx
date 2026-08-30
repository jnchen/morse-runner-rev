import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CwReviewPlayer } from '../engine/cw-review-player';
import { actualAnswerText, hasActualAnswer, isReviewFieldWrong, reviewFields } from '../engine/qso-review';
import type { ContestDefinition } from '../engine/contest-defs';
import type { Qso } from '../types';

interface QsoLogProps {
  contestDefinition: ContestDefinition;
  qsos: Qso[];
  reviewWpm: number;
  reviewFrequency: number;
  reviewVolume: number;
}

const VERIFIED = '   ';
const REVIEW_WPM_FLOOR = 12;

function formatTime(time: number) {
  return new Date(time * 1000).toISOString().substring(11, 19);
}

function qsoKey(qso: Qso, index: number) {
  return `${qso.time}:${index}`;
}

function hasReviewTarget(qso: Qso) {
  return hasActualAnswer(qso);
}

export function QsoLog({ contestDefinition, qsos, reviewWpm, reviewFrequency, reviewVolume }: QsoLogProps) {
  const { t } = useTranslation();
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const playerRef = useRef<CwReviewPlayer | null>(null);
  const field1 = contestDefinition.fields[0];
  const field2 = contestDefinition.fields[1];

  useEffect(() => {
    const player = new CwReviewPlayer();
    playerRef.current = player;
    const stop = () => setPlayingKey(null);
    player.onEnded = stop;
    return () => {
      player.onEnded = null;
      player.stop();
    };
  }, []);

  useEffect(() => () => playerRef.current?.stop(), []);

  const stopReplay = useCallback(() => {
    playerRef.current?.stop();
    setPlayingKey(null);
  }, []);

  const replay = useCallback((key: string, qso: Qso) => {
    const text = actualAnswerText(qso);
    if (!text) return;
    setPlayingKey(key);
    playerRef.current?.play(text, {
      wpm: Math.max(REVIEW_WPM_FLOOR, reviewWpm),
      frequency: reviewFrequency,
      volume: reviewVolume,
    }).catch(() => setPlayingKey(null));
  }, [reviewFrequency, reviewVolume, reviewWpm]);

  const renderDetails = (qso: Qso, key: string, close: () => void) => {
    const answerAvailable = hasReviewTarget(qso);
    const rows = reviewFields(qso, contestDefinition.fields).map((field) => ({
      key: field.labelKey === 'call' ? 'call' : field.key,
      label: t(field.labelKey),
      copied: field.copied,
      actual: field.actual,
      wrong: answerAvailable && isReviewFieldWrong(field),
    }));

    const errorCode = qso.err.trim();
    const errorKey = errorCode === 'NIL' ? 'errorNil'
      : errorCode === 'DUP' ? 'errorDuplicate'
      : errorCode === 'RST' ? 'errorRst'
      : errorCode === 'NR' ? 'errorNr'
      : errorCode === 'EX1' ? 'errorExchange1'
      : errorCode === 'EX2' ? 'errorExchange2'
      : null;

    return (
      <div className="min-w-0 space-y-3 border-emerald-500/40 bg-slate-950/80 px-3 py-3 font-sans text-xs sm:px-4 sm:text-sm">
        <div className="min-w-0 break-words rounded border border-red-900/70 bg-red-950/30 px-3 py-2 text-red-200">
          <b className="font-mono">{errorCode || t('correctEntry')}</b>
          {errorKey && <span className="ml-2">{t(errorKey)}</span>}
        </div>

        {answerAvailable ? (
          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded border border-slate-800 bg-slate-900/70 p-3">
              <div className="mb-2 font-sans text-[11px] uppercase tracking-wide text-slate-500">{t('youCopied')}</div>
              <dl className="space-y-1 font-mono">
                {rows.map((row) => (
                  <div key={row.key} className="flex min-w-0 items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-slate-500">{row.label}</dt>
                    <dd className={`min-w-0 break-all text-right ${row.wrong ? 'text-red-400' : 'text-slate-200'}`}>{row.copied || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="min-w-0 rounded border border-emerald-900/70 bg-emerald-950/20 p-3">
              <div className="mb-2 font-sans text-[11px] uppercase tracking-wide text-emerald-400">{t('correctAnswer')}</div>
              <dl className="space-y-1 font-mono">
                {rows.map((row) => (
                  <div key={row.key} className="flex min-w-0 items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-emerald-600">{row.label}</dt>
                    <dd className="min-w-0 break-all text-right text-emerald-200">{row.actual || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        ) : (
          <p className="rounded border border-slate-800 bg-slate-900/70 p-3 text-slate-400">{t('noCorrectAnswer')}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!answerAvailable || playingKey === key}
            onClick={() => replay(key, qso)}
            className="min-h-11 rounded bg-emerald-600 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-emerald-500 active:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('replayCorrectAnswer')}
          </button>
          {playingKey && (
            <button
              type="button"
              onClick={stopReplay}
              className="min-h-11 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium hover:bg-slate-800"
            >
              {t('stopReplay')}
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className="min-h-11 rounded border border-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          >
            {t('close')}
          </button>
        </div>
      </div>
    );
  };
  return (
    <>
      <div className="sm:hidden">
        {qsos.length === 0 ? (
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-500">{t('emptyLog')}</div>
        ) : (
          <ol className="space-y-2">
            {qsos.map((qso, index) => {
              const valid = qso.err === VERIFIED;
              const key = qsoKey(qso, index);
              const expanded = expandedKey === key;
              return (
                <li
                  key={key}
                  className={`overflow-hidden rounded-lg border bg-slate-900 font-mono text-sm ${valid ? 'border-slate-800' : 'border-red-900/70'}`}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => { setExpandedKey(expanded ? null : key); if (expanded) stopReplay(); }}
                    className="flex min-h-11 w-full items-start justify-between gap-3 p-3 text-left transition hover:bg-slate-800/60"
                  >
                    <span className={`min-w-0 break-all text-base font-semibold ${valid ? 'text-slate-100' : 'text-red-300'}`}>{qso.call}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-slate-400">
                      <span className={valid ? 'text-emerald-400' : 'text-red-400'}>{qso.err.trim()}</span>
                      <span aria-hidden>▾</span>
                      <span>{formatTime(qso.time)}</span>
                    </span>
                  </button>
                  {expanded && renderDetails(qso, key, () => setExpandedKey(null))}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-slate-800 sm:block">
        <table className="w-full min-w-[640px] text-left text-sm">
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
            ) : qsos.map((qso, index) => {
              const valid = qso.err === VERIFIED;
              const key = qsoKey(qso, index);
              const expanded = expandedKey === key;
              return (
                <Fragment key={key}>
                  <tr
                    onClick={() => { setExpandedKey(expanded ? null : key); if (expanded) stopReplay(); }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={expanded}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setExpandedKey(expanded ? null : key);
                        if (expanded) stopReplay();
                      }
                    }}
                    className={`cursor-pointer border-t border-slate-800 outline-none odd:bg-slate-900/40 hover:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 ${expanded ? 'bg-slate-800/70' : ''}`}
                  >
                    <td className="p-2">{formatTime(qso.time)}</td>
                    <td className={valid ? '' : 'text-red-300'}>{qso.call}</td>
                    <td>{qso.exch1}</td>
                    <td>{qso.exch2}</td>
                    <td>{qso.pfx}</td>
                    <td className={valid ? 'text-emerald-400' : 'text-red-400'}>{qso.err.trim()}</td>
                  </tr>
                  {expanded && (
                    <tr key={`${key}-details`}>
                      <td colSpan={6} className="p-0">{renderDetails(qso, key, () => setExpandedKey(null))}</td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}