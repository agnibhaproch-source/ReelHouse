# 41 — Loading & Skeleton States

- Skeletons mirror final layout exactly (card, row, hero, detail header, cast strip, text lines).
- Shimmer: diagonal light sweep (translateX gradient, 1.6s loop) — reads as projector light passing.
- Route `loading.tsx` shows skeletons, not spinners.
- Button loading: label crossfades to a mini film-reel spinner.
- Infinite scroll: 6 skeleton cards appended; replaced with Flip crossfade when data arrives.
- Suspense boundaries per row so slow rows don't block others.
- Reduced motion: static skeletons, no shimmer.

## Acceptance
- [ ] Zero CLS when skeleton → content (Lighthouse CLS < 0.05)
- [ ] Every async surface has a skeleton
