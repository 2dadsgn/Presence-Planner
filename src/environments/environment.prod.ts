export const environment = {
  production: true,

  msal: {
    clientId: 'YOUR_AZURE_AD_APPLICATION_CLIENT_ID',
    authority: 'https://login.microsoftonline.com/YOUR_AZURE_AD_TENANT_ID',
    redirectUri: 'https://YOUR_PRODUCTION_DOMAIN',
    postLogoutRedirectUri: 'https://YOUR_PRODUCTION_DOMAIN/login',
  },

  company_signature: 'Intecs Engineering S.p.a. - Developed by Team DC',

  apiScopes: ['User.Read'],

  useMockAuth: false,

  apiBaseUrl: 'https://YOUR_API_DOMAIN',
  useMockApi: false,
};
