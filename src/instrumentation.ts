import type { Instrumentation } from 'next';
import { sentryOptions } from '@/lib/sentry-options';

const DSN = sentryOptions.dsn;

/** Server + edge error monitoring (spec 66). A no-op unless NEXT_PUBLIC_SENTRY_DSN is set. */
export async function register() {
  if (!DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    ...sentryOptions,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  if (!DSN) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(err, request, context);
};
