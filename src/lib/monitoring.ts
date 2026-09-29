/**
 * Error monitoring hook-point (spec 66). Wire Sentry here when NEXT_PUBLIC_SENTRY_DSN is set
 * (`@sentry/nextjs` + `instrumentation.ts`); until then errors go to the console with context.
 */
export function captureError(error: unknown, context: Record<string, unknown> = {}): void {
  console.error('[reelhouse]', error, context);
}
