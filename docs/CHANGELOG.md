# Changelog

## 0.1.0 — 2026-09-29

First complete build of the spec (phases 00–05).

- **Foundation (10–15):** Next 16 + TS strict, design tokens mapped into Tailwind v4, GSAP eases, `useMotionPrefs`, TMDB data layer with zod validation, typed errors, 429 retry, server-only token, whitelisted client proxy, image loader, dominant colour + blur placeholders, offline fixtures, Zustand stores, TanStack Query.
- **Core UI (20–28):** navbar with mega menus, sliding underline, hide-on-scroll and mobile menu; hero billboard; movie card with tilt, glow, glare and preview panel; carousel rows (drag with inertia, velocity skew, lazy and infinite); detail page (ambient light, overview scrub, cast, trailers, facts, providers, reviews, pinned gallery, recommendations); search palette and results page; genre and language browse with Flip; person page with scroll-drawn filmography; footer credits.
- **Motion (30–41):** cinema cursor (7 modes, velocity stretch, magnetic, trail, spotlight); Lenis; scroll primitives and home scroll story; hover inventory; press feedback everywhere; shutter, poster and film-burn transitions; preloader; WebGL (hero displacement, film burn, grain/gate weave/light leaks, dust, gallery bend + ripple); text motion; every micro-interaction; sound sprite; skeletons.
- **Features (50–57):** Supabase auth (password, magic link, Google), profiles (max 5, kids mode), watchlist (optimistic, offline queue, guest merge, drag reorder), recommendations, trailer player, ratings and reviews, history, settings.
- **Polish (60–68):** axe-clean key pages, reduced-motion audit, responsive bottom tabs, SEO (metadata, JSON-LD, sitemap, robots, dynamic OG), designed 404 and error boundaries, unit/component/E2E/axe/visual tests, CI, security headers, revalidate endpoint.
