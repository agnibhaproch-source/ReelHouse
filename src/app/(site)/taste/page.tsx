import type { Metadata } from 'next';
import { TasteProfile } from '@/components/movie/TasteProfile';

export const metadata: Metadata = {
  title: 'Your taste',
  description: 'The genres, languages and decades you gravitate to.',
  robots: { index: false },
};

export default function TastePage() {
  return <TasteProfile />;
}
