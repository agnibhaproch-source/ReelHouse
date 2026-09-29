import { RowSkeleton, Skeleton, TextSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading person" className="pt-32">
      <div className="px-gutter mx-auto grid max-w-7xl gap-10 md:grid-cols-[320px_1fr] md:items-end">
        <Skeleton className="rounded-modal aspect-[2/3] w-[min(60vw,320px)]" />
        <Skeleton className="h-24 w-3/4" />
      </div>
      <div className="px-gutter mx-auto max-w-4xl py-10">
        <TextSkeleton lines={5} />
      </div>
      <RowSkeleton />
    </div>
  );
}
