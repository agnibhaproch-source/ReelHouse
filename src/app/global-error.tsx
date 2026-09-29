'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/monitoring';
import '@/styles/globals.css';

/** Last-resort boundary when the root layout itself fails (spec 64). */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, { boundary: 'global', digest: error.digest });
  }, [error]);
  return (
    <html lang="en">
      <body className="bg-void text-reel grid min-h-svh place-items-center p-6 text-center">
        <div className="flex max-w-lg flex-col items-center gap-4">
          <h1 className="font-display text-h1">Something broke in the projection room.</h1>
          <p className="text-dim">Reload the page to try again.</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-pill bg-violet text-void min-h-11 px-6 font-semibold"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
