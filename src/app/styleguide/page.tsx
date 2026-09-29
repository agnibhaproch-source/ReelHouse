import type { Metadata } from 'next';
import { Styleguide } from '@/components/styleguide/Styleguide';

export const metadata: Metadata = {
  title: 'Styleguide',
  description: 'Every Reelhouse token, type style, easing, component and state.',
  robots: { index: false },
};

export default function StyleguidePage() {
  return <Styleguide />;
}
