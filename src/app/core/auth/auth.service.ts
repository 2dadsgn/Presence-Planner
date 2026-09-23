import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { environment } from '../../../environments/environment';
import { AppUser } from '../models/user.model';

const MOCK_USER: AppUser = {
  id: 'mock-user',
  displayName: 'Daniele Lubrano',
  email: 'daniele.lubrano@intecsengineering.it',
  team: 'Intecs Engineering S.p.a.',
  initials: 'DL',
};

/**
 * Wraps MSAL (Microsoft Entra ID / "sign in with Microsoft") sign-in.
 *
 * While environment.useMockAuth is true, this signs the user in locally
 * without contacting Microsoft, so the app is runnable before an Azure AD
 * app registration exists. Set useMockAuth to false and fill in
 * environment.msal once IT has registered the app.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly msal = inject(MsalService);
  private readonly router = inject(Router);

  readonly user = signal<AppUser | null>(this.restoreMockSession());

  get isLoggedIn(): boolean {
    if (environment.useMockAuth) {
      return this.user() !== null;
    }
    return this.msal.instance.getAllAccounts().length > 0;
  }

  /** Starts the Microsoft sign-in flow (or the mock flow in dev). */
  login(): void {
    if (environment.useMockAuth) {
      sessionStorage.setItem('mockUser', JSON.stringify(MOCK_USER));
      this.user.set(MOCK_USER);
      this.router.navigateByUrl('/calendar');
      return;
    }

    this.msal
      .loginPopup({ scopes: environment.apiScopes })
      .subscribe({
        next: (result) => {
          this.msal.instance.setActiveAccount(result.account);
          this.user.set(this.toAppUser(result.account));
          this.router.navigateByUrl('/calendar');
        },
        error: (err) => console.error('Microsoft sign-in failed', err),
      });
  }

  logout(): void {
    if (environment.useMockAuth) {
      sessionStorage.removeItem('mockUser');
      this.user.set(null);
      this.router.navigateByUrl('/login');
      return;
    }

    this.msal.logoutRedirect({
      postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
    });
  }

  private toAppUser(account: AccountInfo): AppUser {
    const name = account.name ?? account.username;
    const initials = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return {
      id: account.homeAccountId,
      displayName: name,
      email: account.username,
      initials,
    };
  }

  private restoreMockSession(): AppUser | null {
    if (!environment.useMockAuth) return null;
    const raw = sessionStorage.getItem('mockUser');
    return raw ? (JSON.parse(raw) as AppUser) : null;
  }
}
