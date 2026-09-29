# 62 — Responsive & Touch

Breakpoints: 360, 480, 768, 1024, 1280, 1536, 1920+.

| Area | Mobile adaptation |
|---|---|
| Navbar | Bottom tab bar (Home, Search, My list, Profile) with sliding active pill |
| Hero | Portrait poster crop, logo centered, swipe between slides |
| Rows | Native scroll-snap, 2.3 cards visible |
| Card preview | Long-press → bottom sheet (drag to dismiss with velocity) |
| Pinned scenes | Replaced with simple reveals |
| Cursor | Off |
| Hover effects | Replaced with press feedback |
| Trailer | Fullscreen, rotate hint |

- Use `svh/dvh` units; safe-area insets on bottom bar.
- Haptics: `navigator.vibrate(8)` on add-to-list (Android, if supported).
- Test on real iPhone Safari + Android Chrome.

## Acceptance
- [ ] No horizontal page overflow at 360px
- [ ] All flows complete on touch
