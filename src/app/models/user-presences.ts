export interface UserPresences {
  month: number;
  year: number;
  presences: day[]
}

export enum Presence {
  office = 0,
  remote=1,
  vacation=2
}

export interface day{
  day: number;
  status: Presence;
}
