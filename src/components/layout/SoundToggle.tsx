'use client';

import { useUiStore } from '@/stores/ui';
import { play, primeSound } from '@/lib/sound';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

/** Speaker icon whose waves animate when sound is on (spec 40). Off by default. */
export function SoundToggle({ className }: { className?: string }) {
  const on = useUiStore((s) => s.soundOn);
  const toggle = useUiStore((s) => s.toggle);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      data-cursor="link"
      onClick={() => {
        toggle('soundOn');
        track('sound_toggle', { on: !on });
        if (!on) {
          primeSound();
          setTimeout(() => void play('toggle'), 50);
        }
      }}
      className={cn(
        'text-reel duration-fast hover:bg-reel/10 grid size-11 place-items-center rounded-full transition-colors',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" fillOpacity="0.15" />
        {on ? (
          <>
            <path
              d="M15.5 9.5a3.5 3.5 0 0 1 0 5"
              className="origin-left animate-[sound-wave_1.2s_var(--ease-reel)_infinite]"
            />
            <path
              d="M18 7a7 7 0 0 1 0 10"
              className="origin-left animate-[sound-wave_1.2s_var(--ease-reel)_0.2s_infinite]"
            />
          </>
        ) : (
          <path d="m16 10 4 4m0-4-4 4" />
        )}
      </svg>
    </button>
  );
}
