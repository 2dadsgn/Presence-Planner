export const environment = {
  production: false,

  // Microsoft Entra ID (Azure AD) app registration values.
  // Ask your IT/identity team to register this app and give you these values.
  msal: {
    clientId: 'YOUR_AZURE_AD_APPLICATION_CLIENT_ID',
    // Use your tenant ID for a single-tenant app, or 'organizations' / 'common' as needed.
    authority: 'https://login.microsoftonline.com/YOUR_AZURE_AD_TENANT_ID',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
  },

  // API scopes to request on login / attach to outgoing API calls.
  apiScopes: ['User.Read'],

  // When true, skips real Microsoft sign-in and logs in a fake user.
  // Useful for local development/demo before Azure AD is configured.
  // Set to false once environment.msal.clientId is filled in.
  useMockAuth: true,
};
