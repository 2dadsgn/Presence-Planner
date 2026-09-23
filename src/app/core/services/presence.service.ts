import { Injectable, signal } from '@angular/core';
import { PresenceAssignments, DateKey } from '../models/presence.model';

const STORAGE_PREFIX = 'presence-planner:assignments';

/**
 * Holds the current user's day -> presence type assignments.
 *
 * This is a mock/local implementation backed by localStorage so the app is
 * usable end-to-end without a backend. Swap the body of load()/persist()
 * for real HTTP calls (e.g. via HttpClient) to connect it to an API —
 * the public signal-based interface used by the components does not need
 * to change.
 */
@Injectable({ providedIn: 'root' })
export class PresenceService {
  /** date key ('YYYY-MM-DD') -> presence type id */
  readonly assignments = signal<PresenceAssignments>({});

  /** Whether there are changes not yet saved via save(). */
  readonly dirty = signal(false);

  private currentKey: string | null = null;

  /** Loads the assignments for the given calendar month (0-based month index). */
  loadMonth(year: number, month: number): void {
    const key = this.storageKey(year, month);
    this.currentKey = key;
    const raw = localStorage.getItem(key);
    this.assignments.set(raw ? (JSON.parse(raw) as PresenceAssignments) : {});
    this.dirty.set(false);
  }

  setMany(dateKeys: DateKey[], typeId: string): void {
    const next = { ...this.assignments() };
    dateKeys.forEach((d) => (next[d] = typeId));
    this.assignments.set(next);
    this.dirty.set(true);
  }

  clearMany(dateKeys: DateKey[]): void {
    const next = { ...this.assignments() };
    dateKeys.forEach((d) => delete next[d]);
    this.assignments.set(next);
    this.dirty.set(true);
  }

  /** Persists the currently loaded month. */
  save(): void {
    if (!this.currentKey) return;
    localStorage.setItem(this.currentKey, JSON.stringify(this.assignments()));
    this.dirty.set(false);
  }

  private storageKey(year: number, month: number): string {
    return `${STORAGE_PREFIX}:${year}-${String(month + 1).padStart(2, '0')}`;
  }
}
