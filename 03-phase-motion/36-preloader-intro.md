# 36 — Preloader & First-Visit Intro

## Sequence (first visit per session only; ≤ 2.8s total; skippable)
1. Black screen, grain visible. Projector hum sound (if sound on — off by default until user interacts; see 40).
2. **Countdown leader**: circle with crosshair; sweeping arc (conic-gradient) counts 3 → 2 → 1, numerals in Fraunces, slight flicker. Arc progress is tied to REAL loading progress (fonts + hero image + critical data), minimum 1.2s.
3. At 100%: circle scales to 0 → white projector flash (opacity 0 → 0.9 → 0, 250ms).
4. Wordmark "Reelhouse" chars reveal and exit upward.
5. Screen opens as shutter → hero intro timeline (21) begins.

## Returning visits (same session)
Skip to a 400ms fade.

## Skip
"Skip intro" text button bottom-right after 600ms; Esc also skips.

## Rules
- Must not delay LCP measurement badly: render hero underneath, preloader is an overlay.
- Reduced motion → simple 300ms fade.
- `sessionStorage` flag `intro-seen`.

## Acceptance
- [ ] Progress reflects actual asset loading
- [ ] Skippable by mouse and keyboard
- [ ] Never shows on client-side navigations
