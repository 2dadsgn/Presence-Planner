import { DateKey } from '../models/presence.model';

/** Formats a Date as a 'YYYY-MM-DD' key, independent of locale/timezone display. */
export function toDateKey(date: Date): DateKey {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True for Sat/Sun. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const WEEKDAY_LABELS_FULL = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
];

export const MONTH_LABELS = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

/** Builds a 6x7 grid of Dates (Monday-start) covering the given month, including lead/trail days. */
export function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // getDay(): 0=Sun..6=Sat. Convert to Monday-start offset (0=Mon..6=Sun).
  const leadOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - leadOffset);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return days;
}
