import { PresenceType } from '../../../core/models/presence.model';

export interface DayCell {
  /** 'YYYY-MM-DD' */
  key: string;
  dayNum: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  selected: boolean;
  type: PresenceType | null;
  ariaLabel: string;
}

export interface WeekdayHeader {
  index: number;
  label: string;
  fullLabel: string;
  allSelected: boolean;
}
