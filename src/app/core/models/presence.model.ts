/** One selectable value a day can be assigned. Extend or reorder this list to change the field list. */
export interface PresenceType {
  id: string;
  label: string;
  /** Text/icon colour used on chips and dots. */
  fg: string;
  /** Background colour used on chips. */
  bg: string;
  /** Solid colour used for legend dots and the selected-option dot. */
  dot: string;
}

export const PRESENCE_TYPES: PresenceType[] = [
  { id: 'office', label: 'Ufficio', fg: '#0b4a9e', bg: '#dce8ff', dot: '#1a66d1' },
  { id: 'remote', label: 'Smart-Working', fg: '#00574b', bg: '#cdefe8', dot: '#00897b' },
  { id: 'vacation', label: 'Ferie/PAR', fg: '#6b4100', bg: '#ffe3b3', dot: '#e69500' },
  { id: 'client', label: 'Cliente', fg: '#8c1d18', bg: '#ffdad6', dot: '#d93025' },
];

/** date key format: 'YYYY-MM-DD' */
export type DateKey = string;

/** Map of date -> assigned presence type id, for one user. */
export type PresenceAssignments = Record<DateKey, string>;
