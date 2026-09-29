import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchResults } from '@/components/movie/SearchResults';
import { GridSkeleton } from '@/components/ui/Skeleton';

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search: ${q.slice(0, 60)}` : 'Search',
    robots: { index: false, follow: true },
    alternates: { canonical: '/search' },
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-gutter pt-32"><GridSkeleton count={12} /></div>}>
      <SearchResults />
    </Suspense>
  );
}
