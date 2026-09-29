# 01 — Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | Next.js (App Router, latest stable) + React 19 + TypeScript strict | SSR/ISR for SEO, server components for TMDB |
| Package manager | pnpm (corepack) | Fast, strict |
| Node | LTS via fnm | |
| Styling | Tailwind CSS v4 + CSS custom properties + CSS Modules for complex parts | |
| Timelines / scroll | GSAP 3 + ScrollTrigger + SplitText + Flip + CustomEase + `@gsap/react` | Lusion-class standard; plugins are free |
| Component state motion | Motion (`motion/react`) | Layout, presence, gestures |
| Smooth scroll | Lenis | Synced with ScrollTrigger |
| WebGL | three + @react-three/fiber + @react-three/drei + GLSL | Hero distortion, ripple, film burn |
| Data | TMDB API v3 + TanStack Query (client) + fetch cache (server) | |
| Auth + DB | Supabase (Auth + Postgres + RLS) | |
| Client state | Zustand | Cursor, sound, UI flags |
| Audio | Howler.js | UI sound sprite |
| Color extraction | `fast-average-color` (server) | Card glow color |
| Forms | React Hook Form + Zod | |
| Tests | Vitest + Testing Library + Playwright | |
| Quality | ESLint + Prettier + Husky + lint-staged | |
| Deploy | Vercel | |

## Rules
- No AOS, animate.css, jQuery.
- GSAP owns scroll + timelines. Motion owns component state + layout. Never both on the same element property.
- Every new dependency gets one line in `docs/DECISIONS.md`.
