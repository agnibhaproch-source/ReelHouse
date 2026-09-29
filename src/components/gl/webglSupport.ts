/** Low-end / unsupported detection (spec 37): ≤4 cores, ≤4GB, or no WebGL2 → CSS fallbacks. */
export function canUseWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  if ((nav.hardwareConcurrency ?? 8) <= 4) return false;
  if ((nav.deviceMemory ?? 8) <= 4) return false;
  try {
    const c = document.createElement('canvas');
    const ok = Boolean(c.getContext('webgl2'));
    return ok;
  } catch {
    return false;
  }
}
