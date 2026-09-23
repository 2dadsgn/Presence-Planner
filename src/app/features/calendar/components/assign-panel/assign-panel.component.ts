import { Component, input, output, signal } from '@angular/core';
import { PresenceType } from '../../../../core/models/presence.model';

/**
 * "Assign to selection" card: a dropdown of presence types plus Apply /
 * Remove-value actions for the currently selected days. The dropdown's
 * open/closed state is purely local UI state, so it lives here rather than
 * in the container.
 */
@Component({
  selector: 'app-assign-panel',
  standalone: true,
  templateUrl: './assign-panel.component.html',
  styleUrl: './assign-panel.component.scss',
})
export class AssignPanelComponent {
  readonly presenceTypes = input.required<PresenceType[]>();
  readonly pendingTypeId = input.required<string>();
  readonly selectedCount = input.required<number>();
  readonly selectedSummary = input<string>('');

  readonly pendingTypeChange = output<string>();
  readonly apply = output<void>();
  readonly clearValue = output<void>();

  readonly menuOpen = signal(false);

  get hasSelection(): boolean {
    return this.selectedCount() > 0;
  }

  get pendingType(): PresenceType | undefined {
    return this.presenceTypes().find((t) => t.id === this.pendingTypeId());
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  pick(type: PresenceType): void {
    this.pendingTypeChange.emit(type.id);
    this.menuOpen.set(false);
  }

  onApply(): void {
    if (!this.hasSelection) return;
    this.apply.emit();
    this.menuOpen.set(false);
  }

  onClearValue(): void {
    if (!this.hasSelection) return;
    this.clearValue.emit();
    this.menuOpen.set(false);
  }
}
