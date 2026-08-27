import type { Qso, UserSettings } from '../types';
import { CONTESTS, type ContestId } from './contest-defs';

export interface AdifExportOptions {
  contest: ContestId;
  settings: UserSettings;
  qsos: Qso[];
  startedAt?: Date;
}

function adifDate(date: Date) {
  return `${String(date.getUTCFullYear()).padStart(4, '0')}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(date.getUTCDate()).padStart(2, '0')}`;
}

function adifTime(date: Date) {
  return `${String(date.getUTCHours()).padStart(2, '0')}${String(date.getUTCMinutes()).padStart(2, '0')}${String(date.getUTCSeconds()).padStart(2, '0')}`;
}

function field(name: string, value: string | number) {
  return `<${name.toUpperCase()}:${String(value).length}>${value}`;
}

export function exportAdif({ contest, settings, qsos, startedAt = new Date() }: AdifExportOptions): string {
  const definition = CONTESTS[contest];
  const header = [
    field('adif_ver', '3.1.4'),
    field('programid', 'MORSE_RUNNER_WEB'),
    field('contest', definition.name),
    field('station_callsign', settings.call),
    field('operator', settings.call),
    field('mode', 'CW'),
    field('gridsquare', ''),
    '<eor>',
  ].join('\n');

  const records = qsos.map((qso, index) => {
    const time = new Date(startedAt.getTime() + qso.time * 1000);
    const fields = [
      field('call', qso.call),
      field('qso_date', adifDate(time)),
      field('time_on', adifTime(time)),
      field('mode', 'CW'),
      field('rst_sent', qso.exch1),
      field('stx', qso.exch2),
      field('rst_rcvd', qso.trueExch1 || qso.exch1),
      field('srx', qso.trueExch2 || qso.exch2),
      field('contest_id', definition.name),
      field('app_mrw_qso_index', index + 1),
      field('app_mrw_error', qso.err.trim()),
      '<eor>',
    ];
    return fields.join('\n');
  });

  return [header, ...records].join('\n\n') + '\n';
}

export function downloadAdif(options: AdifExportOptions) {
  const blob = new Blob([exportAdif(options)], { type: 'text/adif' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const date = (options.startedAt ?? new Date()).toISOString().slice(0, 19).replace(/[:T]/g, '-');
  anchor.href = url;
  anchor.download = `morse-runner-web-${options.contest}-${date}.adi`;
  anchor.click();
  URL.revokeObjectURL(url);
}
