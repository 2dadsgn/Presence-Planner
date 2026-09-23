import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { IPublicClientApplication } from '@azure/msal-browser';
import {
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
  MsalBroadcastService,
  MsalGuard,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';

import { routes } from './app.routes';
import {
  msalGuardConfigFactory,
  msalInstanceFactory,
  msalInterceptorConfigFactory,
} from './core/auth/msal-factories';
import { devUserInterceptor } from './core/auth/dev-user.interceptor';

// MSAL (real Microsoft sign-in) providers. These are always wired up —
// AuthService injects MsalService regardless of environment.useMockAuth,
// it just doesn't call it while mock auth is on — so flipping that flag
// off (and filling in environment.msal) is all it takes to switch to real
// Microsoft/Entra ID sign-in. No other code changes needed.
const msalProviders = [
  { provide: MSAL_INSTANCE, useFactory: msalInstanceFactory },
  { provide: MSAL_GUARD_CONFIG, useFactory: msalGuardConfigFactory },
  { provide: MSAL_INTERCEPTOR_CONFIG, useFactory: msalInterceptorConfigFactory },
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
  // Required since MSAL v3: the PublicClientApplication must finish its own
  // async initialize() before it's used — MsalInterceptor and MsalService
  // both wait on it internally, and every HTTP call (even to endpoints
  // MSAL doesn't protect) hangs forever without this, since MsalInterceptor
  // sits in front of all of them.
  provideAppInitializer(() => {
    const msalInstance = inject(MSAL_INSTANCE) as IPublicClientApplication;
    return msalInstance.initialize();
  }),
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // devUserInterceptor runs first (functional interceptors run in array
    // order), then MsalInterceptor (registered as an HTTP_INTERCEPTORS
    // provider below) — only one of the two ever actually adds a header,
    // depending on environment.useMockAuth.
    provideHttpClient(withInterceptors([devUserInterceptor]), withInterceptorsFromDi()),
    ...msalProviders,
  ],
};
