# 10 — Repo Setup

## Tasks
1. `pnpm create next-app@latest reelhouse --ts --app --src-dir --eslint --tailwind --import-alias "@/*"`
2. Enable `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` in tsconfig.
3. Install: `gsap @gsap/react lenis motion zustand @tanstack/react-query three @react-three/fiber @react-three/drei howler zod react-hook-form @supabase/supabase-js @supabase/ssr fast-average-color-node clsx tailwind-merge lucide-react`
4. Dev: `prettier prettier-plugin-tailwindcss husky lint-staged vitest @testing-library/react @testing-library/jest-dom jsdom @playwright/test @types/three @types/howler`
5. Scripts: `dev`, `build`, `start`, `lint`, `typecheck` (`tsc --noEmit`), `test`, `test:e2e`, `format`.
6. Husky pre-commit → lint-staged (eslint --fix, prettier).
7. `.env.example`: `TMDB_READ_TOKEN=`, `NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=`, `NEXT_PUBLIC_SITE_URL=`.
8. `next.config.ts`: `images.remotePatterns` for `image.tmdb.org`; `formats: ['image/avif','image/webp']`.
9. Create `docs/DECISIONS.md` and `docs/CHANGELOG.md`.
10. GitHub repo + Vercel project linked (preview deploys per PR).

## Acceptance
- [ ] `pnpm dev` runs with no warnings
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm test` pass (placeholder test)
- [ ] Pre-commit hook blocks badly formatted code
- [ ] Vercel preview URL loads
