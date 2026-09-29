# 60 — Accessibility

- WCAG 2.2 AA target. Contrast: `--text-dim` on `--bg-void` ≥ 4.5:1 (verify; adjust if not).
- Reduced motion mode fully audited: no parallax, no smooth scroll, no tilt, no WebGL motion, native cursor, crossfade transitions.
- Keyboard: every feature usable; logical tab order; carousels support arrow keys; visible focus everywhere; no focus lost after transitions.
- Screen readers: landmarks (`header`, `nav`, `main`, `footer`), row titles as `h2`, cards as links with accessible names ("Dune: Part Two, 2024, rated 8.2"), live region for toasts and route changes.
- Images: posters `alt="{title} poster"`; decorative backdrops `alt=""`.
- Hit targets ≥ 44px on touch.
- Tools: axe, Lighthouse a11y 100, VoiceOver (macOS) manual pass, keyboard-only pass.

## Acceptance
- [ ] Lighthouse Accessibility = 100 on home, detail, search
- [ ] Complete a "find movie → add to list → play trailer" flow with keyboard only and VoiceOver
