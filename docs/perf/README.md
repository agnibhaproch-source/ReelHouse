# Performance records

Store production Lighthouse runs and Chrome Performance recordings here (spec 61/67):

- `lighthouse-home-desktop.json`, `lighthouse-home-mobile.json`, `lighthouse-detail.json`, `lighthouse-search.json`
- `trace-home-scroll.json`, `trace-card-hover.json`, `trace-transition.json`

```bash
pnpm build && pnpm start
npx lighthouse http://localhost:3000 --preset=desktop --output=json --output-path=docs/perf/lighthouse-home-desktop.json
npx lighthouse http://localhost:3000 --form-factor=mobile --output=json --output-path=docs/perf/lighthouse-home-mobile.json
```

Budgets: first-load JS ≤ 200 KB gzip on home excluding three.js (lazy), LCP < 2.5s, INP < 200ms, CLS < 0.05, 60fps scroll/hover.

## Current measurement (2026-09-29, production build, fixtures mode)

Home, modern browsers, gzip -9 of every script the HTML references (the 38 KB `noModule` polyfill is excluded):
**≈ 332 KB**, including chunks that load asynchronously after hydration (cursor, overlays).

| Part | ≈ gzip |
|---|---|
| React DOM + Next runtime/router | 112 KB |
| GSAP core + ScrollTrigger + SplitText + CustomEase | 52 KB |
| Motion (`m` + LazyMotion; `domMax` features load async) | 43 KB |
| App code, Lenis, TanStack Query, Zustand | ~125 KB |

Already applied: three.js only via dynamic imports (0 KB on first load), Supabase loaded on demand and
absent when accounts aren't configured (−65 KB), Flip imported only by the grid, Howler loaded after
the user enables sound, React Query devtools in development only.

**Budget gap:** spec 61 asks for ≤ 200 KB. React/Next plus the mandated GSAP + Motion + Lenis stack
alone is ~210 KB, so reaching the target means cutting spec features. The next candidates are
loading SplitText lazily (hero intro only), deferring the cursor/overlay chunks with `requestIdleCallback`, and
moving the preview/trailer layers behind first interaction.
