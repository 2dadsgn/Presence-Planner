import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { PresenceService } from '../../core/services/presence.service';
import {
  buildMonthGrid,
  isSameDay,
  isWeekend,
  toDateKey,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  WEEKDAY_LABELS_FULL,
} from '../../core/services/date-utils';
import { PRESENCE_TYPES, PresenceType } from '../../core/models/presence.model';
import { DayCell, WeekdayHeader } from './models/day-cell.model';
import { CalendarGridComponent } from './components/calendar-grid/calendar-grid.component';
import { AssignPanelComponent } from './components/assign-panel/assign-panel.component';
import { SummaryPanelComponent, SummaryRow } from './components/summary-panel/summary-panel.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [CalendarGridComponent, AssignPanelComponent, SummaryPanelComponent],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private readonly auth = inject(AuthService);
  private readonly presence = inject(PresenceService);

  readonly user = this.auth.user;
  readonly presenceTypes: PresenceType[] = PRESENCE_TYPES;

  private readonly today = new Date();
  private readonly viewYear = signal(this.today.getFullYear());
  private readonly viewMonth = signal(this.today.getMonth());

  /** date keys of the days currently selected on the grid, not yet applied. */
  private readonly selectedKeys = signal<Set<string>>(new Set());
  readonly pendingTypeId = signal<string>(PRESENCE_TYPES[0].id);

  constructor() {
    this.presence.loadMonth(this.viewYear(), this.viewMonth());
  }

  readonly monthLabel = computed(
    () => `${MONTH_LABELS[this.viewMonth()]} ${this.viewYear()}`,
  );

  readonly monthGrid = computed(() => buildMonthGrid(this.viewYear(), this.viewMonth()));

  readonly dayCells = computed<DayCell[]>(() => {
    const assignments = this.presence.assignments();
    const selected = this.selectedKeys();
    const month = this.viewMonth();

    return this.monthGrid().map((date) => {
      const key = toDateKey(date);
      const inMonth = date.getMonth() === month;
      const typeId = assignments[key];
      const type = typeId ? (this.presenceTypes.find((t) => t.id === typeId) ?? null) : null;
      const weekend = isWeekend(date);
      const isToday = isSameDay(date, this.today);

      const weekdayFull = WEEKDAY_LABELS_FULL[(date.getDay() + 6) % 7];
      const ariaLabel = inMonth
        ? `${weekdayFull} ${date.getDate()} ${MONTH_LABELS[date.getMonth()]}${
            type ? ', ' + type.label : ', non impostato'
          }`
        : 'Fuori dal mese';

      return {
        key,
        dayNum: date.getDate(),
        inMonth,
        isToday,
        isWeekend: weekend,
        selected: inMonth && selected.has(key),
        type,
        ariaLabel,
      };
    });
  });

  readonly weeks = computed<DayCell[][]>(() => {
    const cells = this.dayCells();
    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  });

  readonly weekdayHeaders = computed<WeekdayHeader[]>(() => {
    const selected = this.selectedKeys();
    return WEEKDAY_LABELS.map((label, index) => {
      const columnCells = this.weeks()
        .map((week) => week[index])
        .filter((c) => c.inMonth);
      const allSelected = columnCells.length > 0 && columnCells.every((c) => selected.has(c.key));
      return {
        index,
        label,
        fullLabel: WEEKDAY_LABELS_FULL[index],
        allSelected,
      };
    });
  });

  readonly selectedCount = computed(() => this.selectedKeys().size);

  readonly selectedSummary = computed(() => {
    const keys = [...this.selectedKeys()].sort();
    return keys
      .map((k) => {
        const [y, m, d] = k.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        return `${WEEKDAY_LABELS[(date.getDay() + 6) % 7]} ${d}`;
      })
      .join(' · ');
  });

  readonly summaryRows = computed<SummaryRow[]>(() => {
    const assignments = this.presence.assignments();
    const inMonthKeys = this.dayCells()
      .filter((c) => c.inMonth)
      .map((c) => c.key);
    return this.presenceTypes.map((type) => ({
      type,
      count: inMonthKeys.filter((k) => assignments[k] === type.id).length,
    }));
  });

  readonly unsetWorkdaysCount = computed(() => {
    const assignments = this.presence.assignments();
    return this.dayCells().filter((c) => c.inMonth && !c.isWeekend && !assignments[c.key]).length;
  });

  readonly dirty = this.presence.dirty;

  // -- interactions -----------------------------------------------------

  onDayToggle(day: DayCell): void {
    const next = new Set(this.selectedKeys());
    if (next.has(day.key)) next.delete(day.key);
    else next.add(day.key);
    this.selectedKeys.set(next);
  }

  onWeekdayToggle(header: WeekdayHeader): void {
    const columnKeys = this.weeks()
      .map((week) => week[header.index])
      .filter((c) => c.inMonth)
      .map((c) => c.key);

    const next = new Set(this.selectedKeys());
    if (header.allSelected) {
      columnKeys.forEach((k) => next.delete(k));
    } else {
      columnKeys.forEach((k) => next.add(k));
    }
    this.selectedKeys.set(next);
  }

  selectEmptyWorkdays(): void {
    const assignments = this.presence.assignments();
    const keys = this.dayCells()
      .filter((c) => c.inMonth && !c.isWeekend && !assignments[c.key])
      .map((c) => c.key);
    this.selectedKeys.set(new Set(keys));
  }

  clearSelection(): void {
    this.selectedKeys.set(new Set());
  }

  onPendingTypeChange(typeId: string): void {
    this.pendingTypeId.set(typeId);
  }

  applyToSelection(): void {
    this.presence.setMany([...this.selectedKeys()], this.pendingTypeId());
    this.selectedKeys.set(new Set());
  }

  clearSelectionValue(): void {
    this.presence.clearMany([...this.selectedKeys()]);
    this.selectedKeys.set(new Set());
  }

  goToPreviousMonth(): void {
    this.shiftMonth(-1);
  }

  goToNextMonth(): void {
    this.shiftMonth(1);
  }

  goToToday(): void {
    this.viewYear.set(this.today.getFullYear());
    this.viewMonth.set(this.today.getMonth());
    this.selectedKeys.set(new Set());
    this.presence.loadMonth(this.viewYear(), this.viewMonth());
  }

  private shiftMonth(delta: number): void {
    let year = this.viewYear();
    let month = this.viewMonth() + delta;
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    this.viewYear.set(year);
    this.viewMonth.set(month);
    this.selectedKeys.set(new Set());
    this.presence.loadMonth(year, month);
  }

  saveMonth(): void {
    this.presence.save();
  }

  signOut(): void {
    this.auth.logout();
  }
}
