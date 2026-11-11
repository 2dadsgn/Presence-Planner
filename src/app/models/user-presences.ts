
export interface UserPresences {
  presences: Day[]
}

export enum Presence {
  office = "office",
  remote= "remote",
  vacation=  "vacation",
  client= "client",
  notSet= "notset",
}

export interface Day{
  date: string;
  type: Presence;
}


export const STRING_TO_PRESENCE_MAP: Record<string, Presence> = {
  office: Presence.office,
  remote: Presence.remote,
  vacation: Presence.vacation,
  client: Presence.client,
  notset: Presence.notSet,

} as const;
