import { cn } from '@/lib/utils';

/** Skeletons mirror final layout exactly (spec 41). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton', className)} />;
}

export function CardSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('aspect-[2/3] w-full', className)} />;
}

export function RowSkeleton({ title = true, count = 7 }: { title?: boolean; count?: number }) {
  return (
    <div className="py-5" aria-hidden="true">
      {title && <Skeleton className="ml-gutter mb-4 h-8 w-56" />}
      <div className="px-gutter flex gap-3 overflow-hidden">
        {Array.from({ length: count }, (_, i) => (
          <CardSkeleton
            key={i}
            className="w-[42vw] shrink-0 sm:w-[30vw] md:w-[22vw] lg:w-[17vw] xl:w-[13.5vw]"
          />
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div aria-hidden="true" className="bg-seat relative h-svh w-full overflow-hidden">
      <div className="skeleton absolute inset-0 rounded-none" />
      <div className="left-gutter absolute bottom-[14vh] flex w-[min(90vw,560px)] flex-col gap-4">
        <Skeleton className="h-24 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-2 flex gap-3">
          <Skeleton className="rounded-pill h-11 w-40" />
          <Skeleton className="rounded-pill h-11 w-32" />
        </div>
      </div>
    </div>
  );
}

export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true" className="flex flex-col gap-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function DetailHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="bg-seat relative min-h-[88svh] w-full">
      <div className="skeleton absolute inset-0 rounded-none" />
      <div className="inset-x-gutter absolute bottom-12 flex items-end gap-8">
        <Skeleton className="hidden aspect-[2/3] w-64 md:block" />
        <div className="flex flex-1 flex-col gap-4">
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-3">
            <Skeleton className="rounded-pill h-11 w-40" />
            <Skeleton className="rounded-pill h-11 w-36" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CastSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="px-gutter flex gap-5 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex w-28 shrink-0 flex-col items-center gap-2">
          <Skeleton className="size-28 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
