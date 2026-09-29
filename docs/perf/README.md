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
