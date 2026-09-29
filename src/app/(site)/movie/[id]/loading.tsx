import { CastSkeleton, DetailHeaderSkeleton, TextSkeleton, RowSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading movie">
      <DetailHeaderSkeleton />
      <div className="mx-auto max-w-5xl px-gutter py-20">
        <TextSkeleton lines={4} />
      </div>
      <CastSkeleton />
      <RowSkeleton />
    </div>
  );
}
