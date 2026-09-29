import type { ReactNode } from 'react';
import { TmdbAttribution } from '@/components/layout/TmdbAttribution';

/** Auth + profile picker chrome: no navbar/footer, but TMDB attribution stays visible (spec 28). */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <div className="pointer-events-auto fixed right-4 bottom-4 z-[5] max-md:hidden">
        <TmdbAttribution className="max-w-xs text-[0.7rem]" />
      </div>
    </>
  );
}
