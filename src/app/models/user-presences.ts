export interface UserPresences {
  presences: day[]
}

export enum Presence {
  office = 0,
  remote=1,
  vacation=2,
  client=3,
}

export interface day{
  day: Date;
  status: Presence;
}


export const STRING_TO_PRESENCE_MAP: Record<string, Presence> = {
  office: Presence.office,
  remote: Presence.remote,
  vacation: Presence.vacation,
  client: Presence.client,

} as const;
