/**
 * Shared Sentry init options (spec 66): errors only at a low trace rate, and no personal data —
 * no user info, cookies, headers, bodies or query strings leave the app.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  },
};
