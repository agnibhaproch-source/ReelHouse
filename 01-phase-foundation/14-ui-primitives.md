# 14 — UI Primitives (static first, motion added in Phase 03)

Build with full state coverage. Motion hooks are stubbed now and wired in 33/34.

| Component | Variants | States |
|---|---|---|
| `Button` | primary (violet), secondary (glass), ghost, icon | idle, hover, active, focus, disabled, loading |
| `Pill` / `Chip` | genre, filter (toggle) | selected, unselected, focus |
| `Input` | text, search | empty, filled, focus, error, disabled |
| `Modal` | center, sheet (mobile), fullscreen (trailer) | open, closing |
| `Tooltip` | top/bottom | |
| `Toast` | success, error, info | enter, exit |
| `Rating` | stars / ring percentage | |
| `Avatar` | profile | |
| `Skeleton` | card, row, hero, text | shimmer |

Rules:
- Buttons use `<button>`; links use `<Link>`. Never div-buttons.
- Primary button label = exact action ("Play trailer", "Add to my list").
- Modal: focus trap, Esc closes, restores focus, `aria-modal`, body scroll lock via Lenis `stop()`.
- Add all to `/styleguide`.

## Acceptance
- [ ] Every component + state visible in styleguide
- [ ] Keyboard-only walkthrough of styleguide works
- [ ] axe DevTools: zero violations on styleguide
