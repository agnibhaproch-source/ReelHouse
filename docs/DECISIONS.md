# Decisions

One line per dependency (spec 01), then the architectural calls that deviate from or interpret the spec.

## Dependencies

| Package                                                            | Why                                                                                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `next@16` / `react@19`                                             | App Router, server components, ISR, `proxy.ts` (Next 16's rename of middleware).                                   |
| `typescript@6`                                                     | Strict mode. TS 7 (native) is out, but `typescript-eslint` only supports `<6.1`.                                   |
| `tailwindcss@4` + `@tailwindcss/postcss`                           | Utility styling; `@theme inline` maps onto the CSS tokens so a token change updates classes.                       |
| `tailwind-merge` + `clsx`                                          | `cn()` helper. Extended with our font-size tokens so `text-small` never evicts `text-void`.                        |
| `gsap` + `@gsap/react`                                             | Timelines, ScrollTrigger, SplitText, Flip, CustomEase (all free since 3.13). Every tween lives in `useGSAP`.       |
| `lenis`                                                            | Smooth scroll, driven by the GSAP ticker and synced with ScrollTrigger.                                            |
| `motion`                                                           | Component state, presence and layout (`layoutId` indicators, sheets, toasts). Never animates a property GSAP owns. |
| `three`                                                            | Raw three.js for every WebGL effect (hero displacement, film burn, grain, dust, gallery planes).                   |
| `zustand`                                                          | Client UI state (cursor, ui/settings, profile, toasts, preview, trailer).                                          |
| `@tanstack/react-query` (+ devtools in dev)                        | Client data, optimistic mutations with rollback, infinite rows and grids.                                          |
| `zod`                                                              | Validates every TMDB response and form input (shared client/server schemas).                                       |
| `react-hook-form` + `@hookform/resolvers`                          | Auth and review forms.                                                                                             |
| `@supabase/supabase-js` + `@supabase/ssr`                          | Auth + Postgres + RLS; cookie sessions refreshed in `proxy.ts`.                                                    |
| `fast-average-color-node` + `sharp`                                | Dominant poster colour (card glow, ambient light) + base64 blur placeholders, computed server-side.                |
| `howler`                                                           | UI sound sprite (loaded lazily, only after the user enables sound).                                                |
| `lucide-react`                                                     | Icon set (ISC).                                                                                                    |
| `server-only`                                                      | Guarantees the TMDB token stays out of client bundles.                                                             |
| `@vercel/analytics` + `@vercel/speed-insights`                     | Web Vitals + custom events; rendered only on Vercel.                                                               |
| `raw-loader`                                                       | Imports `.glsl` shader files as strings (Turbopack rule + webpack `asset/source`).                                 |
| `vitest`, `@testing-library/*`, `jsdom`, `@vitest/coverage-v8`     | Unit + component tests; ≥ 80% coverage on `lib/` and `stores/` enforced by thresholds.                             |
| `@playwright/test` + `@axe-core/playwright`                        | E2E, mobile, visual regression and axe accessibility checks.                                                       |
| `eslint@9` + `eslint-config-next`                                  | Flat config (Next 16 dropped `next lint`). ESLint 10 isn't supported by the React plugin yet.                      |
| `prettier` + `prettier-plugin-tailwindcss`, `husky`, `lint-staged` | Formatting and the pre-commit hook.                                                                                |

## Architecture

- **Page transitions — custom `TransitionLayer`, not the View Transitions API.** GSAP gives us the shutter, film-burn and shared-poster flight in every browser with one code path, a 1.5s timeout that never blocks navigation, no stacking on double clicks, and a clean abort on back/forward. `template.tsx` signals when the new route is mounted.
- **Shared poster.** The card's rendered `<img>` is cloned into the overlay and flown to `[data-shared-poster]` on the detail page. The reverse flight on back navigation uses the detail poster rect remembered in `lastDetail`.
- **React Three Fiber was dropped.** Spec 01 lists R3F/drei. Each effect here is a single full-screen or DOM-synced pass that needs precise disposal and on-demand rendering, and R3F 9 with three 0.186 logs a `THREE.Clock` deprecation warning on every page (spec 68: no console warnings). Raw three.js is smaller and quieter.
- **Offline demo fixtures.** Without `TMDB_READ_TOKEN` (or with `TMDB_FIXTURES=1`) the data layer serves a catalogue of 90 real films (`lib/tmdb/fixture-catalogue.ts`: title, year, language, genres, director, one-line synopsis) so the site, CI and Playwright run without secrets. Runtimes, ratings and exact dates are approximate; there is no artwork, cast, reviews, availability or release calendar offline — inventing those for real films would mislead. A banner says so.
- **Guests are first-class.** One `Repo` interface with two backends: localStorage for guests (and when Supabase isn't configured) and Supabase with RLS for signed-in users. Guest list items are offered for merge after sign-in. Watchlist writes queue while offline and replay on reconnect.
- **Kids profiles.** A `rh-kids` cookie makes every server TMDB call use `discover` with certification ≤ U/A and horror/thriller/crime/war excluded. The proxy filters list responses as a second layer, and the detail page shows a guard for anything that slips through.
- **Rendering modes.** Detail and person pages are ISR (24h; top 100 trending pre-rendered). Home, browse, language and search read viewer cookies (language, region, kids), so they render per request while TMDB `fetch` results stay cached (1h lists, 24h details, 7d genres).
- **Tokens in two places, one source of truth.** `tokens.css` is canonical, and `lib/tokens.ts` mirrors the numbers GSAP and WebGL need. `tests/unit/tokens.test.ts` fails if they drift.
- **`--text-dim`.** The spec value `#8C8A9B` already passes AA (5.9:1 on `--bg-void`, 5.0:1 on `--bg-aisle`), so it is unchanged. Primary buttons use dark text on violet (4.8:1) because light text there is only 3.4:1.
- **Reveal animations use opacity, never `visibility`.** Content that hasn't scrolled into view stays keyboard-focusable, and focusing it reveals it instantly.
- **Search filters on `/search`** are client-side facets over the loaded results, because TMDB's search endpoint can't filter by genre or language. They still live in the URL.
- **Sound.** No licensed samples. `scripts/generate-sounds.mjs` synthesises the sprite procedurally (original work, CC0) into `public/sounds/ui.wav`. The spec's `.webm`/`.mp3` pair needs ffmpeg; WAV plays everywhere Howler does. Re-encode it if bundle size matters.
- **TMDB logo.** The footer shows a neutral "TMDB" text badge plus the required disclaimer. Drop the official logo from themoviedb.org/about/logos-attribution into `public/` before launch.
- **Monitoring.** `lib/monitoring.ts` is the single capture point. Sentry (`@sentry/nextjs` 11) is installed but stays dormant without `NEXT_PUBLIC_SENTRY_DSN`, and is loaded by dynamic import so it costs nothing in the first-load bundle. Its `dataCollection` options turn off user info, cookies, headers, bodies and query strings, and the client SDK doesn't start under Do Not Track / GPC. Source maps upload only when `SENTRY_AUTH_TOKEN` is set.
- **Bundle.** Motion uses `LazyMotion` with `m` components (features load async); Supabase is a dynamic import exposed through `useSession().sb`. See `docs/perf/README.md` for the measured first load and the remaining gap to the 200 KB budget.
- **Recommendations** are a server action. Seeds (list + likes) come from the client because guests have no server-side data. The TMDB calls behind them are cached for 6h per seed.
