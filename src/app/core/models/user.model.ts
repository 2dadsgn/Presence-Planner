export interface AppUser {
  id: string;
  displayName: string;
  email: string;
  /** e.g. team or department name shown under the user's name. */
  team?: string;
  initials: string;
}
