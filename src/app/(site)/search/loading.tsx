import { GridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading" className="px-gutter pt-32">
      <Skeleton className="mb-10 h-20 w-72" />
      <GridSkeleton count={12} />
    </div>
  );
}
