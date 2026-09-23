import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateExceptionRequest,
  PolicyUpdate,
  TeamException,
  TeamMember,
  TeamSummary,
} from '../models/team.model';

/** Manager-only team administration: policy and per-person exceptions. */
@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getMyTeam(): Observable<TeamSummary> {
    return this.http.get<TeamSummary>(`${this.base}/api/teams/mine`);
  }

  getMembers(teamId: number): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.base}/api/teams/${teamId}/members`);
  }

  updatePolicy(teamId: number, minOfficeDaysPerWeek: number): Observable<PolicyUpdate> {
    return this.http.put<PolicyUpdate>(`${this.base}/api/teams/${teamId}/policy`, {
      minOfficeDaysPerWeek,
    });
  }

  getExceptions(teamId: number): Observable<TeamException[]> {
    return this.http.get<TeamException[]>(`${this.base}/api/teams/${teamId}/exceptions`);
  }

  createException(teamId: number, request: CreateExceptionRequest): Observable<TeamException> {
    return this.http.post<TeamException>(`${this.base}/api/teams/${teamId}/exceptions`, request);
  }

  deleteException(teamId: number, exceptionId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/api/teams/${teamId}/exceptions/${exceptionId}`);
  }
}
