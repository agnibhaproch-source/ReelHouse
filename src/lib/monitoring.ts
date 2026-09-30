/**
 * Single error-capture point used by every error boundary (spec 66). Forwards to Sentry when
 * NEXT_PUBLIC_SENTRY_DSN is configured (loaded lazily); always logs with context.
 */
export function captureError(error: unknown, context: Record<string, unknown> = {}): void {
  console.error('[reelhouse]', error, context);
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  void import('@sentry/nextjs')
    .then((Sentry) => Sentry.captureException(error, { extra: context }))
    .catch(() => {});
}
