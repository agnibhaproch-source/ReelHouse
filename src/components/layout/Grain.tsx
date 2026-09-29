'use client';

import { useUiStore } from '@/stores/ui';

/** Animated film grain (~4% by default, settings slider 0–100). Replaced by the WebGL grain when on. */
export function Grain() {
  const grain = useUiStore((s) => s.grain);
  return (
    <div
      aria-hidden="true"
      className="grain"
      data-grain
      style={{ display: grain === 0 ? 'none' : undefined }}
    />
  );
}
