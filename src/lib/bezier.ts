import { clamp } from './utils';

/** cubic-bezier(x1, y1, x2, y2) → easing function (Newton–Raphson on x, then solve y). */
export function bezier([x1, y1, x2, y2]: readonly number[]): (t: number) => number {
  const cx = 3 * (x1 as number);
  const bx = 3 * ((x2 as number) - (x1 as number)) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * (y1 as number);
  const by = 3 * ((y2 as number) - (y1 as number)) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = sx(t) - x;
      const dx = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-5 || Math.abs(dx) < 1e-6) break;
      t -= d / dx;
    }
    return sy(clamp(t, 0, 1));
  };
}
