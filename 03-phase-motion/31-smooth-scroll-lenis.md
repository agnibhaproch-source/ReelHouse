# 31 — Smooth Scroll (Lenis)

## Setup
- `SmoothScrollProvider` (client): `new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true, syncTouch: false })`.
- Drive with GSAP ticker: `gsap.ticker.add(t => lenis.raf(t*1000))`, `gsap.ticker.lagSmoothing(0)`.
- `lenis.on('scroll', ScrollTrigger.update)`.
- Expose via context + `useLenis()`: `scrollTo`, `stop`, `start`, `velocity`, `direction`.

## Integrations
- Modals/menus call `lenis.stop()` on open, `start()` on close.
- Horizontal carousels: add `data-lenis-prevent` to allow their own horizontal scroll.
- Anchor links use `lenis.scrollTo(target, { offset: -80, duration: 1.2, easing: projector })`.
- Route change → `lenis.scrollTo(0, { immediate: true })` after transition covers screen.

## Global velocity effects
- CSS var `--scroll-velocity` updated each frame (clamped −1…1) — used by rows (skew) and grain (intensity).
- Scroll progress bar: 2px cyan line at top, scaleX = progress.

## Disable when
Reduced motion or touch device → native scroll; ScrollTrigger still works.

## Acceptance
- [ ] No double-scroll or jitter with pinned sections
- [ ] Browser back restores scroll position correctly
- [ ] Ctrl+F and anchor jumps still work
