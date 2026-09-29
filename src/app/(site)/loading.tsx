import { HeroSkeleton, RowSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <HeroSkeleton />
      <div className="-mt-[12vh] max-md:-mt-4">
        <RowSkeleton />
        <RowSkeleton />
      </div>
    </div>
  );
}
