const RIDE_DATE_FORMAT: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
};

/** Same "12 июл, 14:30" format used on every ride/booking card. */
export function formatRideDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', RIDE_DATE_FORMAT);
}
