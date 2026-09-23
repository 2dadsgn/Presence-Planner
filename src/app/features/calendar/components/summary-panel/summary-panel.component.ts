import { Component, input } from '@angular/core';
import { PresenceType } from '../../../../core/models/presence.model';

export interface SummaryRow {
  type: PresenceType;
  count: number;
}

@Component({
  selector: 'app-summary-panel',
  standalone: true,
  templateUrl: './summary-panel.component.html',
  styleUrl: './summary-panel.component.scss',
})
export class SummaryPanelComponent {
  readonly monthLabel = input.required<string>();
  readonly rows = input.required<SummaryRow[]>();
  readonly unsetCount = input.required<number>();
}
