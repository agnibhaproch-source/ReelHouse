# 28 — Footer

- Giant "Reelhouse" wordmark spanning full width at bottom, revealed as you scroll to the end (translateY + clip-path, parallax slower than page) — the "end credits" moment.
- Columns: Browse, Languages, Account, About. Links roll on hover (same as navbar).
- TMDB attribution logo + disclaimer (required).
- "Back to top" button: magnetic; click → Lenis `scrollTo(0)` with `ease-projector` 1.6s while a film reel icon spins.
- Credits-style scrolling line: "Built by Agni" etc. as a slow marquee (pauses on hover).

## Acceptance
- [ ] Attribution visible on every page
- [ ] Back-to-top respects reduced motion (instant jump)
