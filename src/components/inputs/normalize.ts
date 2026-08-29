export const normalizeCallsign = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9/?]/g, '');

export const normalizeStationCallsign = (value: string) =>
  value.toUpperCase().replace(/[^A-Z0-9/]/g, '');

export const normalizeExchange = (value: string, maxLength: number) =>
  value.toUpperCase().replace(/[^A-Z0-9 /.]/g, '').slice(0, maxLength);
