# 32 — Scroll-Driven Animations

## Reusable primitives (`components/motion/`)
| Component | Effect |
|---|---|
| `<Reveal>` | fade + translateY 40px, `ease-reel`, once, start `top 85%` |
| `<RevealMask>` | clip-path inset reveal (image wipes open) |
| `<SplitReveal>` | SplitText lines/words/chars rising from masks |
| `<Parallax speed>` | y offset relative to scroll |
| `<ScrubText>` | words brighten 0.15 → 1 opacity scrubbed by scroll |
| `<Counter>` | number counts up on enter |
| `<PinScene>` | pins a section, exposes a scrubbed timeline |
| `<HorizontalScene>` | vertical scroll → horizontal translate |

All use `useGSAP` + ScrollTrigger, respect `useMotionPrefs` (reduced = instant, opacity-only).

## Home page scroll story
1. Hero: parallax out (21).
2. Rows reveal (23).
3. **"Now showing" pinned scene** between rows: pin a section; scroll scrubs a 3D stack of 5 posters that fan out, rotate, and settle into a line; background shifts through each poster's dominant color.
4. **Top 10**: huge outlined numerals parallax at different speed than posters.
5. **Genre wall**: grid of genre words; scroll velocity skews the wall; hovering a word lights it.
6. **Language marquee**: two opposing infinite marquees of language names; speed and direction react to scroll velocity.
7. Footer credits reveal (28).

## Performance rules
- `ScrollTrigger.batch` for card grids.
- `invalidateOnRefresh: true`; refresh after fonts + images load.
- Kill all triggers on route change (useGSAP scope handles it).
- Pins disabled < 768px (use `ScrollTrigger.matchMedia` / `gsap.matchMedia`).

## Acceptance
- [ ] `markers: true` debug mode behind `?debug=scroll`
- [ ] Resizing window doesn't break pinned scenes
- [ ] No triggers leak after 10 navigations (check `ScrollTrigger.getAll().length`)
