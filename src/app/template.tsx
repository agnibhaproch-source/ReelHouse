'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { signalPageReady } from '@/lib/transition';

/** Re-mounts per navigation; tells the TransitionLayer the new route is on screen (spec 35). */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  useEffect(() => {
    signalPageReady(pathname);
  }, [pathname]);
  return <>{children}</>;
}
