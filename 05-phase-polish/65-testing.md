# 65 — Testing

## Unit (Vitest)
TMDB client + schemas, image helpers, stores, recommendation ranking, hooks (useMotionPrefs).

## Component (Testing Library)
Button states, Modal focus trap, Search combobox keyboard, Card keyboard behavior, Rating.

## E2E (Playwright)
- Guest: home loads → open card → detail → play trailer → close
- Search by keyboard (`/`, type, arrows, Enter)
- Signup → create profile → add to list → reload → still there
- Reduced motion emulation: no smooth scroll, native cursor
- Mobile viewport flows

## Visual regression
Playwright screenshots of styleguide + key pages (animations disabled via reduced-motion).

## CI
GitHub Actions: lint, typecheck, unit, e2e on PR. Block merge on failure.

## Acceptance
- [ ] ≥ 80% coverage on `lib/` and `stores/`
- [ ] CI green
