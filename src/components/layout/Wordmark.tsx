import { cn } from '@/lib/utils';

/** "Reelhouse" in Fraunces; SOFT 0→100 and wght 600→800 on hover (spec 20). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display duration-base ease-reel text-[1.6rem] leading-none tracking-tight transition-[font-variation-settings] [font-variation-settings:"SOFT"_0,"wght"_600,"opsz"_72] group-hover/wm:[font-variation-settings:"SOFT"_100,"wght"_800,"opsz"_72] group-focus-visible/wm:[font-variation-settings:"SOFT"_100,"wght"_800,"opsz"_72]',
        className,
      )}
    >
      Reel<span className="text-violet">house</span>
    </span>
  );
}
