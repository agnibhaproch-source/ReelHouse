import { GridSkeleton, Skeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="bg-seat px-gutter relative flex min-h-[62svh] items-end pb-12">
        <Skeleton className="h-28 w-2/3 max-w-2xl" />
      </div>
      <div className="px-gutter pt-8">
        <GridSkeleton count={18} />
      </div>
    </div>
  );
}
