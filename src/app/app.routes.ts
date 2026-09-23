import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { managerGuard } from './core/auth/manager.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/calendar/calendar-page.component').then(
        (m) => m.CalendarPageComponent,
      ),
  },
  {
    path: 'team-settings',
    canActivate: [authGuard, managerGuard],
    loadComponent: () =>
      import('./features/team-settings/team-settings.component').then(
        (m) => m.TeamSettingsComponent,
      ),
  },
  { path: '**', redirectTo: 'login' },
];
