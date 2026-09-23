import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PresenceAssignments, DateKey } from '../models/presence.model';

const STORAGE_PREFIX = 'presence-planner:assignments';

interface MonthResponse {
  month: string;
  assignments: PresenceAssignments;
}

/**
 * Holds the current user's day -> presence type assignments for the
 * currently loaded month.
 *
 * Two backends, chosen by environment.useMockApi:
 *  - mock (default): localStorage, per-browser only — fine for trying the
 *    UI, but there is no "other people" for a team/policy check to work
 *    against.
 *  - real: presence-planner-api. assign()/clear() persist immediately
 *    (the API has no separate draft/save state), so `dirty` here really
 *    just means "a write is in flight" and save() is a no-op kept only so
 *    the calendar page doesn't need to change.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  private readonly http = inject(HttpClient);

  /** date key ('YYYY-MM-DD') -> presence type id */
  readonly assignments = signal<PresenceAssignments>({});

  /** True while a save (mock: none, real: an in-flight request) hasn't settled. */
  readonly dirty = signal(false);

  private currentKey: string | null = null;
  private currentYear = 0;
  private currentMonth = 0;

  loadMonth(year: number, month: number): void {
    this.currentYear = year;
    this.currentMonth = month;

    if (environment.useMockApi) {
      const key = this.storageKey(year, month);
      this.currentKey = key;
      const raw = localStorage.getItem(key);
      this.assignments.set(raw ? (JSON.parse(raw) as PresenceAssignments) : {});
      this.dirty.set(false);
      return;
    }

    this.http
      .get<MonthResponse>(`${environment.apiBaseUrl}/api/presence`, {
        params: { year, month: month + 1 }, // backend months are 1-based
      })
      .pipe(catchError(() => of<MonthResponse>({ month: '', assignments: {} })))
      .subscribe((res) => this.assignments.set(res.assignments));
  }

  setMany(dateKeys: DateKey[], typeId: string): void {
    if (dateKeys.length === 0) return;

    if (environment.useMockApi) {
      const next = { ...this.assignments() };
      dateKeys.forEach((d) => (next[d] = typeId));
      this.assignments.set(next);
      this.persistMock();
      return;
    }

    this.dirty.set(true);
    this.http
      .post<MonthResponse>(`${environment.apiBaseUrl}/api/presence/assign`, {
        dates: dateKeys,
        type: typeId,
      })
      .pipe(
        tap((res) => this.assignments.set(res.assignments)),
        catchError(() => {
          // Leave the previous server-confirmed state in place on failure.
          return of(null);
        }),
      )
      .subscribe(() => this.dirty.set(false));
  }

  clearMany(dateKeys: DateKey[]): void {
    if (dateKeys.length === 0) return;

    if (environment.useMockApi) {
      const next = { ...this.assignments() };
      dateKeys.forEach((d) => delete next[d]);
      this.assignments.set(next);
      this.persistMock();
      return;
    }

    this.dirty.set(true);
    this.http
      .post<MonthResponse>(`${environment.apiBaseUrl}/api/presence/clear`, { dates: dateKeys })
      .pipe(
        tap((res) => this.assignments.set(res.assignments)),
        catchError(() => of(null)),
      )
      .subscribe(() => this.dirty.set(false));
  }

  /**
   * With the real API every change is already saved when it happens, so
   * this has nothing left to do — kept so the calendar page's "Save
   * month" button and dirty-state text keep working unchanged.
   */
  save(): void {
    if (environment.useMockApi) {
      this.persistMock();
    }
    this.dirty.set(false);
  }

  private persistMock(): void {
    if (!this.currentKey) return;
    localStorage.setItem(this.currentKey, JSON.stringify(this.assignments()));
    this.dirty.set(false);
  }

  private storageKey(year: number, month: number): string {
    return `${STORAGE_PREFIX}:${year}-${String(month + 1).padStart(2, '0')}`;
  }
}
