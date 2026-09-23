# Presence Planner

An Angular app to plan weekly/monthly presence (Office, Remote, Vacation,
Sick leave, Day off) on a calendar, with sign-in via your organization's
Microsoft account (the same one used for Teams/Microsoft 365).

## What's inside

- **Login** (`src/app/features/login`) — a "Sign in with Microsoft" button
  that starts the Microsoft Entra ID (Azure AD) sign-in flow via MSAL.
- **Calendar** (`src/app/features/calendar`) — a month grid where you can:
  - click a day to select it, or click a weekday header (MON, TUE…) to
    select every occurrence of that weekday in the month
  - "Select empty workdays" to select every weekday with no value yet
  - pick a value from the list (Office / Remote / Vacation / Sick leave /
    Day off) and apply it to the current selection, or clear a value
  - see a summary of counts per value and how many workdays are still unset
  - "Save month" persists the month's assignments
- Route guard (`src/app/core/auth/auth.guard.ts`) blocks `/calendar` unless
  signed in, redirecting to `/login`.

The list of values lives in `src/app/core/models/presence.model.ts`
(`PRESENCE_TYPES`) — add, remove or recolor entries there.

## Running it locally

```bash
npm install
npm start
```

Then open http://localhost:4200.

By default the app runs in **mock sign-in mode** (`environment.useMockAuth =
true` in `src/environments/environment.ts`), so you can try it immediately
without an Azure AD app registration — "Sign in with Microsoft" just signs
in a sample user.

## Connecting real Microsoft / Entra ID sign-in

1. Ask your IT/identity team to register this app in **Microsoft Entra ID**
   (Azure AD) — an "App registration" with a **Single-page application**
   (SPA) platform and a redirect URI of `http://localhost:4200` for local
   dev (plus your production URL later).
2. Fill in the values they give you in `src/environments/environment.ts`
   (and `environment.prod.ts` for production):
   ```ts
   msal: {
     clientId: '...',       // Application (client) ID
     authority: 'https://login.microsoftonline.com/<tenant-id>',
     redirectUri: 'http://localhost:4200',
     postLogoutRedirectUri: 'http://localhost:4200/login',
   }
   ```
3. Set `useMockAuth: false`.
4. Restart the app. The "Sign in with Microsoft" button now opens the real
   Microsoft sign-in popup, and users authenticate with their company
   credentials — no separate password is ever stored by this app.

All the MSAL wiring (guard config, token interceptor for calling your own
API, popup login) is already in place in `src/app/core/auth/`.

## Persisting assignments to a real backend

Assignments are currently stored in the browser (`localStorage`) via
`PresenceService` (`src/app/core/services/presence.service.ts`) so the app
works without a backend. To connect a real API, replace the body of
`loadMonth()` and `save()` with `HttpClient` calls — the rest of the app
(calendar grid, side panel, summary) only depends on the service's public
signals (`assignments`, `dirty`) and methods, so no other file needs to
change. Since the MSAL interceptor is already registered, calls to any URL
listed in `msalInterceptorConfigFactory()`
(`src/app/core/auth/msal-factories.ts`) will automatically get the user's
access token attached.

## Project structure

```
src/app/
  core/
    auth/         MSAL setup, auth service, route guard
    models/       PresenceType, AppUser
    services/     PresenceService (data), date-utils
  features/
    login/        Login page
    calendar/      Calendar page + its sub-components
      components/
        calendar-grid/   month grid (presentational)
        assign-panel/    value picker + apply/clear
        summary-panel/   per-value counts
```

## Build

```bash
npm run build
```

Outputs to `dist/presence-planner/`.
