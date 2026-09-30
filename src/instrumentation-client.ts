// Client error monitoring (spec 66). Loaded only when a DSN is configured, and never under
// Do Not Track / Global Privacy Control. No personal data is sent (see sentry-options).
import { sentryOptions } from '@/lib/sentry-options';

function dnt(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.doNotTrack === '1' || n.globalPrivacyControl === true;
}

if (sentryOptions.dsn && !dnt()) {
  void import('@sentry/nextjs').then((Sentry) =>
    Sentry.init({
      ...sentryOptions,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    }),
  );
}
