import { Skeleton, TextSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading settings" className="mx-auto max-w-3xl px-gutter pt-32">
      <Skeleton className="mb-8 h-16 w-60" />
      <Skeleton className="mb-8 h-11 w-full" />
      <TextSkeleton lines={4} />
    </div>
  );
}
