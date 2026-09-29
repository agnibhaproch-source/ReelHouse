import { cn } from '@/lib/utils';

/** Rolling duplicate label: current slides up, copy slides in from below (spec 33). */
export function RollText({ children, className }: { children: string; className?: string }) {
  return (
    <span className={cn('roll', className)}>
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
