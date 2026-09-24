import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeResponse } from '../models/team.model';

/**
 * The signed-in user's profile from the backend (/api/me): their team
 * membership and, importantly, whether they manage a team. This is the
 * one place that decides "is this person a manager" — the manager route
 * guard and the calendar page's "Manage team" link both read it from here
 * rather than each making their own assumption.
 *
 * Requires presence-planner-api to be running: if it isn't reachable (e.g.
 * environment.useBroswerCache is true and no backend is up), profile() stays
 * null and the app simply behaves as if the user manages no team — no
 * crash, the manager-only UI just doesn't appear.
 */
@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);

  readonly profile = signal<MeResponse | null>(null);
  private inFlight: Observable<MeResponse | null> | null = null;

  get isManager(): boolean {
    return this.profile()?.managedTeam != null;
  }

  /** Loads /api/me once and caches it; safe to call from multiple guards/components. */
  ensureLoaded(): Observable<MeResponse | null> {
    const current = this.profile();
    if (current) return of(current);
    if (this.inFlight) return this.inFlight;

    const obs = this.http.get<MeResponse>(`${environment.apiBaseUrl}/api/me`).pipe(
      tap((me) => this.profile.set(me)),
      catchError(() => of(null)),
      shareReplay(1),
    );
    this.inFlight = obs;
    return obs;
  }

  /** Forces a fresh read, e.g. after saving a policy change that alters managedTeam. */
  refresh(): void {
    this.profile.set(null);
    this.inFlight = null;
    this.ensureLoaded().subscribe();
  }
}
