'use client';

import { useEffect } from 'react';
import { captureError } from '@/lib/monitoring';
import '@/styles/globals.css';

/** Last-resort boundary when the root layout itself fails (spec 64). */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureError(error, { boundary: 'global', digest: error.digest });
  }, [error]);
  return (
    <html lang="en">
      <body className="grid min-h-svh place-items-center bg-void p-6 text-center text-reel">
        <div className="flex max-w-lg flex-col items-center gap-4">
          <h1 className="font-display text-h1">Something broke in the projection room.</h1>
          <p className="text-dim">Reload the page to try again.</p>
          <button type="button" onClick={reset} className="min-h-11 rounded-pill bg-violet px-6 font-semibold text-void">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
