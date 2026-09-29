'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { captureError } from '@/lib/monitoring';

/** Route error boundary (spec 64): what happened + what to do, retry via reset(). */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: 'site', digest: error.digest });
  }, [error]);
  return (
    <div className="px-gutter mx-auto flex min-h-[70svh] max-w-xl flex-col items-center justify-center gap-5 pt-24 text-center">
      <p className="font-display text-h1">Something broke in the projection room.</p>
      <p className="text-dim">This page failed to load. Try again, or head back to the lobby.</p>
      <div className="flex gap-3">
        <Button onClick={reset} icon={<RotateCcw />} iconAnim="spin">
          Try again
        </Button>
        <Button href="/" variant="secondary">
          Go home
        </Button>
      </div>
      {error.digest && <p className="text-dim text-[0.7rem]">Reference: {error.digest}</p>}
    </div>
  );
}
