import { Component, input, output } from '@angular/core';
import { DayCell, WeekdayHeader } from '../../models/day-cell.model';

/**
 * Purely presentational month grid. All date/assignment computation lives in
 * the container (CalendarPageComponent); this component just renders the
 * cells it's given and emits which day/weekday header was clicked.
 */
@Component({
  selector: 'app-calendar-grid',
  standalone: true,
  templateUrl: './calendar-grid.component.html',
  styleUrl: './calendar-grid.component.scss',
})
export class CalendarGridComponent {
  readonly weekdayHeaders = input.required<WeekdayHeader[]>();
  /** 6 rows of 7 days each (Monday-start), including lead/trail days from adjacent months. */
  readonly weeks = input.required<DayCell[][]>();

  readonly dayToggle = output<DayCell>();
  readonly weekdayToggle = output<WeekdayHeader>();

  onDayClick(day: DayCell): void {
    if (!day.inMonth) return;
    this.dayToggle.emit(day);
  }
}
