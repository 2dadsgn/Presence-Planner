import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * While environment.useMockAuth is on, there's no real Microsoft token to
 * attach to API calls — so the backend can't know who's calling from that
 * alone. This mirrors presence-planner-api's own dev mock-auth (see its
 * README): it sends the signed-in mock user's identity as plain headers,
 * which that API's dev profile trusts instead of a JWT. Once useMockAuth
 * is false, MsalInterceptor (registered alongside this one) attaches a
 * real access token instead, and this interceptor does nothing.
 */
export const devUserInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockAuth) {
    return next(req);
  }

  const auth = inject(AuthService);
  const user = auth.user();
  if (!user || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        'X-Debug-User-Email': user.email,
        'X-Debug-User-Name': user.displayName,
      },
    }),
  );
};
