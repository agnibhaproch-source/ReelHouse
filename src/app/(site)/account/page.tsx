import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AccountSettings } from '@/components/auth/AccountSettings';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };

export default function AccountPage() {
  return (
    <Suspense>
      <AccountSettings />
    </Suspense>
  );
}
