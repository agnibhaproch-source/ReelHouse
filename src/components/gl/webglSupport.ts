let cached: boolean | undefined;

/**
 * Low-end / unsupported detection (spec 37): ≤4 cores, ≤4GB, or no WebGL2 → CSS fallbacks.
 * Probed once per page load; the probe context is released so it doesn't count toward the
 * browser's live-context limit (~16), which would otherwise evict the real effects' contexts.
 */
export function canUseWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  if (cached !== undefined) return cached;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4) return (cached = false);
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return (cached = Boolean(gl));
  } catch {
    return (cached = false);
  }
}
