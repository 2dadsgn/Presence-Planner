import {
  IPublicClientApplication,
  InteractionType,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import {
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
} from '@azure/msal-angular';
import { environment } from '../../../environments/environment';

/** Builds the MSAL client used by the whole app (real Microsoft sign-in path). */
export function msalInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.msal.clientId,
      authority: environment.msal.authority,
      redirectUri: environment.msal.redirectUri,
      postLogoutRedirectUri: environment.msal.postLogoutRedirectUri,
    },
    cache: {
      cacheLocation: 'localStorage',
    },
    system: {
      loggerOptions: {
        loggerCallback: () => {},
        logLevel: LogLevel.Warning,
        piiLoggingEnabled: false,
      },
    },
  });
}

/** Config for MsalGuard, used if routes are protected by MSAL directly instead of authGuard. */
export function msalGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: environment.apiScopes },
  };
}

/**
 * Attaches an access token to calls made to presence-planner-api, so its
 * "azuread" profile can validate who's calling. Requesting environment.apiScopes
 * here means those scopes must include one exposed by the API's own app
 * registration (not just Microsoft Graph's User.Read) — see that project's
 * README, "Connecting real Microsoft/Entra ID sign-in".
 */
/**
 * IMPORTANT: this map is only populated when useMockAuth is false. MsalInterceptor
 * is registered globally (app.config.ts) regardless of the auth mode, and it
 * silently tries to acquire a token for any request whose URL matches an entry
 * here. In mock-auth mode we never call loginPopup/loginRedirect, so the MSAL
 * instance has no active account — acquireTokenSilent then hangs waiting on a
 * token that can never be issued, which makes every /api/* call (e.g. /api/me)
 * stall forever with no next/error/complete notification. Leaving the map empty
 * in mock mode means MsalInterceptor has nothing to match and simply passes the
 * request through untouched to devUserInterceptor / the backend.
 */
export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  if (!environment.useMockAuth) {
    protectedResourceMap.set(`${environment.apiBaseUrl}/*`, environment.apiScopes);
  }
  return { interactionType: InteractionType.Popup, protectedResourceMap };
}
