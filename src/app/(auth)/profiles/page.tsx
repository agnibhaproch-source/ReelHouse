import type { Metadata } from 'next';
import { ProfilePicker } from '@/components/auth/ProfilePicker';

export const metadata: Metadata = { title: 'Who’s watching?', robots: { index: false } };

export default function ProfilesPage() {
  return <ProfilePicker />;
}
