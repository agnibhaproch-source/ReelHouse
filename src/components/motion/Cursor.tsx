'use client';

import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { EASES, DUR } from '@/lib/tokens';
import { isCursorMode, useCursorStore, type CursorMode } from '@/stores/cursor';
import { useMotionPrefs } from '@/hooks/useMotionPrefs';

const BASE = 100; // ring drawn at 100px, scaled per mode
const SIZE: Record<CursorMode, number> = {
  default: 40,
  link: 24,
  play: 88,
  drag: 72,
  text: 0,
  hidden: 0,
  loading: 56,
  magnetic: 40,
};
const TRAIL = 6;
const TAU = { dot: 0.02, ring: 0.35 / 3, spot: 0.6 / 3 }; // time constants ≈ quickTo durations (~3τ to settle)

const ringVariants: Variants = Object.fromEntries(
  (Object.keys(SIZE) as CursorMode[]).map((m) => [
    m,
    {
      scale: SIZE[m] / BASE,
      opacity: m === 'hidden' || m === 'text' || m === 'magnetic' ? 0 : 1,
      transition: { duration: 0.3, ease: EASES.reel },
    },
  ]),
);

/** Pick the cursor mode from the element under the pointer (event delegation, spec 30). */
function modeFor(target: EventTarget | null): { mode: CursorMode; label: string | null } {
  if (!(target instanceof Element)) return { mode: 'default', label: null };
  const explicit = target.closest<HTMLElement>('[data-cursor]');
  if (explicit) {
    const m = explicit.dataset.cursor;
    if (isCursorMode(m)) return { mode: m, label: explicit.dataset.cursorLabel ?? null };
  }
  if (target.closest('iframe, video')) return { mode: 'hidden', label: null };
  if (
    target.closest(
      'input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true]',
    )
  )
    return { mode: 'text', label: null };
  if (
    target.closest(
      'a, button, [role=button], [role=tab], [role=switch], [role=option], label, select, summary',
    )
  )
    return { mode: 'link', label: null };
  if (target.closest('main p')) return { mode: 'text', label: null };
  return { mode: 'default', label: null };
}

/**
 * Film-inspired cursor: exact dot, lagging sprocket reel ring with velocity stretch + spin,
 * contextual label, violet spotlight, and a 6-frame afterimage trail. One rAF loop drives all.
 */
export function Cursor() {
  const { cursorEnabled } = useMotionPrefs();
  const mode = useCursorStore((s) => s.mode);
  const label = useCursorStore((s) => s.label);
  const magnet = useCursorStore((s) => s.magnet);
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [flashes, setFlashes] = useState<{ id: number; x: number; y: number }[]>([]);

  const dotRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const stretchRef = useRef<HTMLDivElement>(null);
  const spinRef = useRef<SVGSVGElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLDivElement | null)[]>([]);
  const magnetRef = useRef(magnet);

  useEffect(() => {
    magnetRef.current = magnet;
  }, [magnet]);

  // Reset on navigation so a mode never gets stuck.
  useEffect(() => {
    const s = useCursorStore.getState();
    if (!s.locked) s.reset();
  }, [pathname]);

  // Hide system cursor only after mount; restore instantly when disabled.
  useEffect(() => {
    if (!cursorEnabled) return;
    const root = document.documentElement;
    root.classList.add('has-custom-cursor');
    return () => root.classList.remove('has-custom-cursor');
  }, [cursorEnabled]);

  useEffect(() => {
    if (!cursorEnabled) return;
    const p = { x: -100, y: -100 };
    const dot = { ...p };
    const ring = { ...p };
    const spot = { ...p };
    const trail = Array.from({ length: TRAIL }, () => ({ ...p }));
    let angle = 0;
    let spin = 0;
    let last = performance.now();
    let raf = 0;
    let has = false;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      p.x = e.clientX;
      p.y = e.clientY;
      if (!has) {
        has = true;
        dot.x = ring.x = spot.x = p.x;
        dot.y = ring.y = spot.y = p.y;
        trail.forEach((t) => ((t.x = p.x), (t.y = p.y)));
        setVisible(true);
      }
    };
    let wander = false;
    const onOver = (e: PointerEvent) => {
      wander = e.target instanceof Element && Boolean(e.target.closest('[data-cursor-wander]'));
      const { mode: m, label: l } = modeFor(e.target);
      useCursorStore.getState().setMode(m, l);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      setPressed(true);
    };
    const onUp = () => {
      setPressed(false);
      setFlashes((f) => [...f.slice(-2), { id: performance.now(), x: ring.x, y: ring.y }]);
    };
    const onLeave = () => setVisible(false);
    const onEnter = () => has && setVisible(true);

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const k = (tau: number) => 1 - Math.exp(-dt / tau);
      const mg = magnetRef.current;
      const drift = wander && !mg ? 46 : 0;
      const tx = mg ? mg.x + mg.width / 2 : p.x + Math.sin(t / 700) * drift;
      const ty = mg ? mg.y + mg.height / 2 : p.y + Math.cos(t / 900) * drift;

      dot.x += (p.x - dot.x) * k(TAU.dot);
      dot.y += (p.y - dot.y) * k(TAU.dot);
      const px = ring.x;
      const py = ring.y;
      ring.x += (tx - ring.x) * k(TAU.ring);
      ring.y += (ty - ring.y) * k(TAU.ring);
      spot.x += (p.x - spot.x) * k(TAU.spot);
      spot.y += (p.y - spot.y) * k(TAU.spot);

      const vx = (ring.x - px) / Math.max(dt, 1e-3);
      const vy = (ring.y - py) / Math.max(dt, 1e-3);
      const v = Math.hypot(vx, vy);
      if (v > 20) angle = Math.atan2(vy, vx) * (180 / Math.PI);
      const stretch = mg ? 1 : 1 + Math.min(v / 1500, 0.4);
      spin = (spin + dt * (30 + Math.min(v, 3000) * 0.12)) % 360; // 12s/turn at rest

      if (dotRef.current)
        dotRef.current.style.transform = `translate3d(${dot.x}px,${dot.y}px,0) translate(-50%,-50%)`;
      if (posRef.current) posRef.current.style.transform = `translate3d(${ring.x}px,${ring.y}px,0)`;
      if (stretchRef.current)
        stretchRef.current.style.transform = `rotate(${angle}deg) scaleX(${stretch}) scaleY(${2 - stretch}) rotate(${-angle}deg)`;
      if (spinRef.current) spinRef.current.style.transform = `rotate(${spin}deg)`;
      if (spotRef.current)
        spotRef.current.style.transform = `translate3d(${spot.x}px,${spot.y}px,0) translate(-50%,-50%)`;
      for (let i = 0; i < TRAIL; i++) {
        const prev = i === 0 ? dot : (trail[i - 1] as { x: number; y: number });
        const cur = trail[i] as { x: number; y: number };
        cur.x += (prev.x - cur.x) * k(0.035);
        cur.y += (prev.y - cur.y) * k(0.035);
        const el = trailRefs.current[i];
        if (el) el.style.transform = `translate3d(${cur.x}px,${cur.y}px,0) translate(-50%,-50%)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.documentElement.addEventListener('pointerenter', onEnter);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.removeEventListener('pointerenter', onEnter);
    };
  }, [cursorEnabled]);

  if (!cursorEnabled || typeof document === 'undefined') return null;

  const effectiveMode: CursorMode = magnet ? 'magnetic' : mode;
  const showDot = !['link', 'play', 'hidden', 'magnetic', 'loading'].includes(effectiveMode);

  return createPortal(
    <div
      data-cursor-root
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-(--z-cursor) overflow-hidden"
      style={{ contain: 'strict' }}
    >
      {/* Spotlight */}
      <div
        ref={spotRef}
        className="duration-slow absolute top-0 left-0 size-[500px] rounded-full mix-blend-screen transition-opacity"
        style={{
          background: 'radial-gradient(circle, rgb(139 92 255 / 0.08), transparent 65%)',
          opacity: visible ? 1 : 0,
          willChange: 'transform',
        }}
      />
      {/* Afterimage trail */}
      {Array.from({ length: TRAIL }, (_, i) => (
        <div
          key={i}
          ref={(n) => {
            trailRefs.current[i] = n;
          }}
          className="bg-reel duration-fast absolute top-0 left-0 size-1.5 rounded-full transition-opacity"
          style={{
            opacity: visible && showDot ? 0.22 * (1 - i / TRAIL) : 0,
            willChange: 'transform',
          }}
        />
      ))}
      {/* Ring */}
      <div ref={posRef} className="absolute top-0 left-0" style={{ willChange: 'transform' }}>
        <motion.div
          initial={false}
          animate={{ scale: visible ? 1 : 0, opacity: visible ? 1 : 0 }}
          transition={{ duration: DUR.base, ease: EASES.reel }}
        >
          <div ref={stretchRef}>
            <motion.div
              className="relative -translate-x-1/2 -translate-y-1/2"
              style={{ width: BASE, height: BASE }}
              variants={ringVariants}
              initial={false}
              animate={effectiveMode}
            >
              <motion.div
                animate={{ scale: pressed ? 0.8 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="size-full"
              >
                <svg
                  ref={spinRef}
                  viewBox="0 0 100 100"
                  className="size-full overflow-visible"
                  style={{ willChange: 'transform' }}
                >
                  <defs>
                    <mask id="rh-sprockets">
                      <rect width="100" height="100" fill="white" />
                      {Array.from({ length: 8 }, (_, i) => {
                        const a = (i / 8) * Math.PI * 2;
                        return (
                          <rect
                            key={i}
                            x={50 + 44 * Math.cos(a) - 3}
                            y={50 + 44 * Math.sin(a) - 4}
                            width="6"
                            height="8"
                            rx="1.5"
                            fill="black"
                            transform={`rotate(${(a * 180) / Math.PI + 90} ${50 + 44 * Math.cos(a)} ${50 + 44 * Math.sin(a)})`}
                          />
                        );
                      })}
                    </mask>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    mask="url(#rh-sprockets)"
                    className="duration-base transition-[fill,fill-opacity]"
                    fill={
                      effectiveMode === 'play'
                        ? 'var(--text-reel)'
                        : effectiveMode === 'link'
                          ? 'var(--marquee-violet)'
                          : 'transparent'
                    }
                    fillOpacity={effectiveMode === 'link' ? 0.2 : 1}
                    stroke="var(--text-reel)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                  {effectiveMode === 'loading' && (
                    <circle
                      cx="50"
                      cy="50"
                      r="36"
                      fill="none"
                      stroke="var(--marquee-cyan)"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      pathLength={1}
                      strokeDasharray="0.25 0.75"
                      className="origin-center animate-[reel-spin_0.9s_linear_infinite]"
                    />
                  )}
                </svg>
              </motion.div>
            </motion.div>
          </div>
          {/* Contextual content (not stretched or spun) */}
          <AnimatePresence>
            {(effectiveMode === 'play' || effectiveMode === 'drag') && (
              <motion.div
                key={effectiveMode}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6, transition: { duration: DUR.instant } }}
                transition={{ duration: 0.3, ease: EASES.reel }}
                className="absolute top-0 left-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 text-[11px] font-bold tracking-wide whitespace-nowrap"
              >
                {effectiveMode === 'play' ? (
                  <span className="text-ink flex flex-col items-center">
                    <Play className="size-4" fill="currentColor" />
                    {label ?? 'Play'}
                  </span>
                ) : (
                  <span className="text-reel flex items-center gap-1">
                    <ChevronLeft className="size-3 animate-[drag-left_1.2s_var(--ease-reel)_infinite]" />
                    {label ?? 'Drag'}
                    <ChevronRight className="size-3 animate-[drag-right_1.2s_var(--ease-reel)_infinite]" />
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      {/* Magnetic frame */}
      <AnimatePresence>
        {magnet && (
          <motion.div
            key="magnet"
            className="border-reel/80 absolute rounded-full border"
            initial={{ opacity: 0, scale: 1.3 }}
            animate={{
              opacity: 1,
              scale: 1,
              left: magnet.x - 6,
              top: magnet.y - 6,
              width: magnet.width + 12,
              height: magnet.height + 12,
              borderRadius: magnet.radius + 6,
            }}
            exit={{ opacity: 0, scale: 1.2, transition: { duration: DUR.fast } }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </AnimatePresence>
      {/* Text caret */}
      <AnimatePresence>
        {effectiveMode === 'text' && visible && (
          <motion.div
            key="caret"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0"
            ref={undefined}
          >
            <CaretFollower />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dot */}
      <div ref={dotRef} className="absolute top-0 left-0" style={{ willChange: 'transform' }}>
        <motion.div
          className="bg-reel size-1.5 rounded-full"
          animate={{ scale: pressed ? 1.6 : showDot ? 1 : 0, opacity: visible && showDot ? 1 : 0 }}
          transition={{ duration: 0.3, ease: EASES.reel }}
        />
      </div>
      {/* Release flash */}
      {flashes.map(({ id, x, y }) => (
        <motion.div
          key={id}
          className="border-reel absolute size-10 rounded-full border"
          style={{ left: x - 20, top: y - 20 }}
          initial={{ scale: 1, opacity: 0.4 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: DUR.slow, ease: EASES.reel }}
          onAnimationComplete={() => setFlashes((f) => f.filter((fl) => fl.id !== id))}
        />
      ))}
    </div>,
    document.body,
  );
}

/** 2×24 blinking vertical caret that follows the pointer while over text. */
function CaretFollower() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (ref.current)
        ref.current.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0) translate(-50%,-50%)`;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  return (
    <div
      ref={ref}
      className="rounded-pill bg-violet h-6 w-0.5 animate-[caret-blink_1s_steps(1)_infinite]"
    />
  );
}
