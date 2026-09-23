export interface TeamSummary {
  id: number;
  name: string;
  minOfficeDaysPerWeek: number;
}

export interface MeResponse {
  id: number;
  email: string;
  displayName: string;
  team: TeamSummary | null;
  managedTeam: TeamSummary | null;
}

export interface TeamMember {
  id: number;
  email: string;
  displayName: string;
}

export interface PolicyUpdate {
  minOfficeDaysPerWeek: number;
}

export interface TeamException {
  id: number;
  userId: number;
  userDisplayName: string;
  minOfficeDaysPerWeek: number | null;
  startDate: string;
  endDate: string | null;
  reason: string;
  createdByDisplayName: string;
}

export interface CreateExceptionRequest {
  userId: number;
  minOfficeDaysPerWeek: number | null;
  startDate: string;
  endDate: string | null;
  reason: string;
}
