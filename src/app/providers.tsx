'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useState, type ReactNode } from 'react';
import '@/lib/gsap';
import { SmoothScrollProvider } from '@/components/motion/SmoothScrollProvider';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { SettingsSync } from '@/components/providers/SettingsSync';

const Devtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(() => import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools), { ssr: false })
    : () => null;

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <SessionProvider>
        <SmoothScrollProvider>
          <SettingsSync />
          {children}
        </SmoothScrollProvider>
      </SessionProvider>
      <Devtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
