# 13 — Routing & Layout Shell

## Tasks
1. Create all routes from `04-project-structure.md` as stubs with a heading.
2. `app/layout.tsx`: fonts, `<Providers>` (QueryClient, motion prefs, Lenis, cursor, sound), `<Grain/>`, `<Navbar/>`, `<Footer/>`, `<CursorRoot/>` placeholder, `<TransitionLayer/>` placeholder.
3. `app/template.tsx` wraps children for page transitions (implemented in 35).
4. `loading.tsx` per route (skeletons from 41) and `error.tsx` (from 64) placeholders.
5. `not-found.tsx` placeholder (designed in 64).
6. Metadata template: `%s — Reelhouse`.
7. Skip link: "Skip to content" → `#main`.

## Acceptance
- [ ] Every route resolves
- [ ] Skip link visible on first Tab
- [ ] Layout doesn't re-mount between client navigations (verify with a console log)
