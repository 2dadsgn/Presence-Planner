import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { CreateExceptionRequest, TeamException, TeamMember, TeamSummary } from '../../core/models/team.model';
import { ProfileService } from '../../core/services/profile.service';
import { TeamService } from '../../core/services/team.service';

/**
 * Pagina riservata ai manager: imposta il minimo di giorni in ufficio a
 * settimana per il team e gestisce le eccezioni per singola persona.
 * Raggiungibile solo tramite managerGuard (vedi app.routes.ts) — ogni
 * chiamata qui viene comunque riverificata lato server (TeamService
 * .assertManagesTeam sull'API).
 */
@Component({
  selector: 'app-team-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './team-settings.component.html',
  styleUrl: './team-settings.component.scss',
})
export class TeamSettingsComponent {
  private readonly teamService = inject(TeamService);
  private readonly profileService = inject(ProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.auth.user;

  readonly team = signal<TeamSummary | null>(null);
  readonly members = signal<TeamMember[]>([]);
  readonly exceptions = signal<TeamException[]>([]);

  readonly loading = signal(true);
  readonly policyDraft = signal(0);
  readonly savingPolicy = signal(false);
  readonly policySaved = signal(false);

  readonly showForm = signal(false);
  readonly formUserId = signal<number | null>(null);
  readonly formExempt = signal(false);
  readonly formMinDays = signal(0);
  readonly formStartDate = signal(this.today());
  readonly formEndDate = signal('');
  readonly formReason = signal('');
  readonly formError = signal('');
  readonly submitting = signal(false);

  constructor() {
    this.teamService.getMyTeam().subscribe({
      next: (team) => {
        this.team.set(team);
        this.policyDraft.set(team.minOfficeDaysPerWeek);
        this.loadMembersAndExceptions(team.id);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadMembersAndExceptions(teamId: number): void {
    this.teamService.getMembers(teamId).subscribe((members) => {
      this.members.set(members);
      if (members.length > 0 && this.formUserId() === null) {
        this.formUserId.set(members[0].id);
      }
    });
    this.teamService
      .getExceptions(teamId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe((exceptions) => this.exceptions.set(exceptions));
  }

  memberName(userId: number): string {
    return this.members().find((m) => m.id === userId)?.displayName ?? `#${userId}`;
  }

  savePolicy(): void {
    const team = this.team();
    if (!team) return;
    this.savingPolicy.set(true);
    this.policySaved.set(false);
    this.teamService
      .updatePolicy(team.id, this.policyDraft())
      .pipe(finalize(() => this.savingPolicy.set(false)))
      .subscribe({
        next: (updated) => {
          this.team.set({ ...team, minOfficeDaysPerWeek: updated.minOfficeDaysPerWeek });
          this.policySaved.set(true);
          this.profileService.refresh();
        },
      });
  }

  openForm(): void {
    this.formExempt.set(false);
    this.formMinDays.set(this.team()?.minOfficeDaysPerWeek ?? 0);
    this.formStartDate.set(this.today());
    this.formEndDate.set('');
    this.formReason.set('');
    this.formError.set('');
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  submitException(): void {
    const team = this.team();
    const userId = this.formUserId();
    if (!team || userId === null) return;

    const reason = this.formReason().trim();
    if (!reason) {
      this.formError.set('Indica un motivo per questa eccezione.');
      return;
    }
    const endDate = this.formEndDate().trim();
    if (endDate && endDate < this.formStartDate()) {
      this.formError.set('La data di fine non può essere precedente alla data di inizio.');
      return;
    }

    const request: CreateExceptionRequest = {
      userId,
      minOfficeDaysPerWeek: this.formExempt() ? null : this.formMinDays(),
      startDate: this.formStartDate(),
      endDate: endDate || null,
      reason,
    };

    this.formError.set('');
    this.submitting.set(true);
    this.teamService
      .createException(team.id, request)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (created) => {
          this.exceptions.set([...this.exceptions(), created]);
          this.showForm.set(false);
        },
        error: () => this.formError.set("Impossibile salvare l'eccezione. Riprova."),
      });
  }

  deleteException(exception: TeamException): void {
    const team = this.team();
    if (!team) return;
    this.teamService.deleteException(team.id, exception.id).subscribe(() => {
      this.exceptions.set(this.exceptions().filter((e) => e.id !== exception.id));
    });
  }

  backToCalendar(): void {
    this.router.navigateByUrl('/calendar');
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
