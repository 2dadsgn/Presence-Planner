import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
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
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    ...msalProviders,
  ],
};
