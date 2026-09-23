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

/** Attaches an access token to calls made to your own API. Add your API's URL here. */
export function msalInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // Example: protectedResourceMap.set('https://api.yourcompany.com/', environment.apiScopes);
  return { interactionType: InteractionType.Popup, protectedResourceMap };
}
