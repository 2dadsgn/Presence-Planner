import {HttpClient} from '@angular/common/http';
import {inject, Injectable, signal} from '@angular/core';
import {catchError, of, tap} from 'rxjs';
import {environment} from '../../../environments/environment';
import {DateKey, PresenceAssignments} from '../models/presence.model';
import {Presence, STRING_TO_PRESENCE_MAP, UserPresences} from '../../models/user-presences';
import {toDateKey} from './date-utils';

const STORAGE_PREFIX = 'presence-planner:assignments';


/**
 * Holds the current user's day -> presence type assignments for the
 * currently loaded month.
 *
 * Two backends, chosen by environment.useBrowserCache:
 *  - mock: localStorage only, per-browser — fine for trying the UI, but
 *    there is no "other people" for a team/policy check to work against.
 *  - real (default once apiBaseUrl/useBrowserCache are set): presence-planner-api
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
@Injectable({providedIn: 'root'})
export class PresenceService {
  /** date key ('YYYY-MM-DD') -> presence type id */
  readonly assignments = signal<PresenceAssignments>({});
  /** True while a save (mock: none, real: an in-flight request) hasn't settled. */
  readonly dirty = signal(false);
  private readonly http = inject(HttpClient);
  private currentKey: string | null = null;
  private currentYear = 0;
  private currentMonth = 0;

  loadMonth(year: number, month: number): void {
    this.currentYear = year;
    this.currentMonth = month;
    this.currentKey = this.storageKey(year, month);

    // if (environment.useBrowserCache) {
    //   const raw = localStorage.getItem(this.currentKey);
    //   this.assignments.set(raw ? (JSON.parse(raw) as PresenceAssignments) : {});
    //   this.dirty.set(false);
    //   return;
    // }

    this.persistCache(this.withNotSetDefault(year, month));

    this.http
      .get<UserPresences>(`${environment.apiBaseUrl}/api/presence`, {
        params: {year, month: month + 1}, // backend months are 1-based
      })
      .pipe(
        tap((res) => {
          this.persistCache(Object.fromEntries(res.presences.map((entry)=>[entry.date,entry.type])))}
        ),
        catchError(() => {
          // Backend unreachable/erroring: fall back to the last
          // server-confirmed snapshot for this month instead of showing
          // a blank calendar. If nothing was ever cached, assignments()
          // just stays empty.
          const raw = localStorage.getItem(this.currentKey!);
          const cached = raw ? (JSON.parse(raw) as UserPresences) : {};
          return of<UserPresences>(<UserPresences>{presences: cached});
        }),
      )
      .subscribe((res) => this.assignments.set(Object.fromEntries(res!.presences.map((entry)=>[entry.date,entry.type]))));
  }

  setMany(dateKeys: DateKey[], typeId: string): void {
    if (dateKeys.length === 0) return;

    const next = {...this.assignments()};
    dateKeys.forEach((d) => (next[d] = typeId));
    this.assignments.set(next);

    //save to browser cache
    if (environment.useBrowserCache) {
      this.persistCache(next);
    }
    this.dirty.set(true);
    return;
  }

  clearMany(dateKeys: DateKey[]): void {
    if (dateKeys.length === 0) return;

    const next = {...this.assignments()};
    dateKeys.forEach((d) => next[d]= Presence.notSet);
    this.assignments.set(next);

    if (environment.useBrowserCache) {
      this.persistCache(next);
    }

    this.dirty.set(true);
    return;
  }

  /**
   * With the real API every change is already saved (and cached) as it
   * happens, so this has nothing left to do there — kept so the calendar
   * page's "Save month" button and dirty-state text keep working
   * unchanged across both modes.
   */
  save(): void {
    if (environment.useBrowserCache) {
      // invia i dati salvati al backend
      //TODO need to check in with backend and high light days that are in conflict
      this.sendForValidation();
      this.dirty.set(false);
      this.persistCache(this.assignments());
    }
    this.dirty.set(false);
  }

  private withNotSetDefault(year : number, month: number) {
    var mappedMonth : PresenceAssignments = {};

    const numDays = new Date(year, month,0).getDate();

    for (let i = 1; i <= numDays; i++) {
      mappedMonth[toDateKey(new Date(year,month,i))]= Presence.notSet;
    }

    return {...mappedMonth};
  }


  private sendForValidation(): void {
    this.http
      .post<UserPresences>(`${environment.apiBaseUrl}/api/presence/assign`,
        this.translateToDTO()
      )
      .pipe(
        tap((res:UserPresences) => {
          const mappedData = Object.fromEntries(res.presences.map((entry)=>[entry.date,entry.type]))
          this.assignments.set(mappedData);
          // Only ever cache what the backend has validated — never the
          // optimistic pre-request state — so a reload after a rejected
          // write can't resurrect something the server didn't accept.
          this.persistCache(mappedData);
        }),
        catchError(() => {
          // Leave the previous server-confirmed state (and its cache) in
          // place on failure.
          return of(null);
        }),
      )
      .subscribe(() => this.dirty.set(false));
  }

  private translateToDTO(): { presences: { date: string; type: Presence }[] } {
    //transform record of assignments to array of day type elements
    const temp = Object.entries(this.assignments()).map(
      ([date, status]:[string,string]) => {
        return {
          date: date,
          type: STRING_TO_PRESENCE_MAP[status],
        }
      });


    return {
      presences:temp,
    }

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
