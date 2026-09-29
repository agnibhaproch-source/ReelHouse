# 15 — State & Providers

## Zustand stores
- `stores/cursor.ts` — `mode`, `label`, `color`, `setMode(mode, label?)`, `reset()`
- `stores/ui.ts` — `reducedMotion`, `soundOn`, `navHidden`, `activePreviewId`, `transitioning`
- `stores/profile.ts` — current profile (hydrated from Supabase in 51)

Persist `reducedMotion` and `soundOn` to localStorage.

## TanStack Query
- Default `staleTime` 5 min, `gcTime` 30 min, no refetch on window focus.
- Query keys factory: `qk.movie(id)`, `qk.search(q)`, `qk.discover(params)`.
- Prefetch detail on card hover intent (≥ 150ms hover) — wired in 22.

## Acceptance
- [ ] Stores typed and unit-tested
- [ ] React Query Devtools in dev only
