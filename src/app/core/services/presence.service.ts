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
 * Two backends, chosen by environment.useBroswerCache:
 *  - mock: localStorage only, per-browser — fine for trying the UI, but
 *    there is no "other people" for a team/policy check to work against.
 *  - real (default once apiBaseUrl/useBroswerCache are set): presence-planner-api
 *    is the source of truth — assign()/clear() persist immediately there
 *    (the API has no separate draft/save state) and every server-confirmed
 *    response is *also* mirrored into localStorage. That cache is never
 *    read from as long as the backend answers, but if loadMonth()'s request
 *    fails (offline, API down, a refresh mid-request) it's used as a
 *    fallback so the last validated selections are still shown instead of a
 *    blank month. It only ever holds what the backend already validated —
 *    never an unconfirmed/optimistic write — so it can't show the user
 *    something the server rejected.
 *
 * `dirty` here means "a write is in flight" (real backend) or "a change
 * hasn't been flushed to localStorage yet" (mock); save() is a no-op in
 * the real case, kept only so the calendar page's button/text don't need
 * to differ between the two modes.
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
    this.currentKey = this.storageKey(year, month);

    if (environment.useBroswerCache) {
      const raw = localStorage.getItem(this.currentKey);
      this.assignments.set(raw ? (JSON.parse(raw) as PresenceAssignments) : {});
      this.dirty.set(false);
      return;
    }

    this.http
      .get<MonthResponse>(`${environment.apiBaseUrl}/api/presence`, {
        params: { year, month: month + 1 }, // backend months are 1-based
      })
      .pipe(
        tap((res) => this.persistCache(res.assignments)),
        catchError(() => {
          // Backend unreachable/erroring: fall back to the last
          // server-confirmed snapshot for this month instead of showing
          // a blank calendar. If nothing was ever cached, assignments()
          // just stays empty.
          const raw = localStorage.getItem(this.currentKey!);
          const cached = raw ? (JSON.parse(raw) as PresenceAssignments) : {};
          return of<MonthResponse>({ month: '', assignments: cached });
        }),
      )
      .subscribe((res) => this.assignments.set(res.assignments));
  }

  setMany(dateKeys: DateKey[], typeId: string): void {
    if (dateKeys.length === 0) return;
    //save to browser cache
    if (environment.useBroswerCache) {
      const next = { ...this.assignments() };
      dateKeys.forEach((d) => (next[d] = typeId));
      this.assignments.set(next);
      this.persistCache(next);
      this.dirty.set(false);
      return;
    }

    this.dirty.set(true);
    //send to backend
    this.http
      .post<MonthResponse>(`${environment.apiBaseUrl}/api/presence/assign`, {
        dates: dateKeys,
        type: typeId,
      })
      .pipe(
        tap((res) => {
          this.assignments.set(res.assignments);
          // Only ever cache what the backend has validated — never the
          // optimistic pre-request state — so a reload after a rejected
          // write can't resurrect something the server didn't accept.
          this.persistCache(res.assignments);
        }),
        catchError(() => {
          // Leave the previous server-confirmed state (and its cache) in
          // place on failure.
          return of(null);
        }),
      )
      .subscribe(() => this.dirty.set(false));
  }

  clearMany(dateKeys: DateKey[]): void {
    if (dateKeys.length === 0) return;

    if (environment.useBroswerCache) {
      const next = { ...this.assignments() };
      dateKeys.forEach((d) => delete next[d]);
      this.assignments.set(next);
      this.persistCache(next);
      this.dirty.set(false);
      return;
    }

    this.dirty.set(true);
    this.http
      .post<MonthResponse>(`${environment.apiBaseUrl}/api/presence/clear`, { dates: dateKeys })
      .pipe(
        tap((res) => {
          this.assignments.set(res.assignments);
          this.persistCache(res.assignments);
        }),
        catchError(() => of(null)),
      )
      .subscribe(() => this.dirty.set(false));
  }

  /**
   * With the real API every change is already saved (and cached) as it
   * happens, so this has nothing left to do there — kept so the calendar
   * page's "Save month" button and dirty-state text keep working
   * unchanged across both modes.
   */
  save(): void {
    if (environment.useBroswerCache) {
      //TODO invia i dati salvati al backend
      //TODO need to check in with backend and high light days that are in conflict
      this.persistCache(this.assignments());
    }
    this.dirty.set(false);
  }

  /** Mirrors a known-good (server-confirmed, or mock) snapshot into localStorage. */
  private persistCache(assignments: PresenceAssignments): void {
    if (!this.currentKey) return;
    localStorage.setItem(this.currentKey, JSON.stringify(assignments));
  }

  private storageKey(year: number, month: number): string {
    return `${STORAGE_PREFIX}:${year}-${String(month + 1).padStart(2, '0')}`;
  }
}
