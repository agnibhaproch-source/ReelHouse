# 61 — Performance

## Budgets
- JS first load (home) ≤ 200KB gzip excluding three.js (lazy)
- LCP < 2.5s, INP < 200ms, CLS < 0.05
- 60fps during scroll and hover

## Tactics
- three/R3F dynamically imported after idle and only if WebGL enabled.
- GSAP plugins imported where used; SplitText only on client.
- `next/image` with correct `sizes`; posters `loading="lazy"` except first row.
- Server components for all TMDB fetches; client islands only for interactive parts.
- `content-visibility: auto` on offscreen rows.
- `will-change` added on hover-start, removed on end (not permanent).
- Debounce resize; single rAF loop for cursor + pointer effects.
- Preconnect `image.tmdb.org`.
- Bundle analyzer; Chrome performance panel recordings saved in `docs/perf/`.

## Acceptance
- [ ] Budgets met on production build
- [ ] No long tasks > 50ms during scroll
