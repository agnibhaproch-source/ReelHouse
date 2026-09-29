# 03 — Motion Language (read before ANY animation work)

Everything animates — with hierarchy, so it feels directed instead of noisy.

## Motion hierarchy
| Level | Examples | Budget |
|---|---|---|
| L1 Moments | Preloader, hero reveal, page transitions | One at a time, ≤ 1.6s |
| L2 Responses | Hover, press, open/close, drag | Always, 150–500ms |
| L3 Ambient | Grain, cursor trail, parallax, marquee | Continuous, subtle |

Never run two L1 moments at once.

## Easing tokens (GSAP CustomEase + CSS vars)
| Name | Curve | Use |
|---|---|---|
| `ease-projector` | `cubic-bezier(0.77, 0, 0.175, 1)` | Transitions, big reveals |
| `ease-reel` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrances |
| `ease-shutter` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exits |
| `ease-snap` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Buttons, toggles |
| spring | stiffness 300, damping 30 | Motion layout/presence |

## Durations
`--dur-instant 120ms` · `--dur-fast 220ms` · `--dur-base 400ms` · `--dur-slow 700ms` · `--dur-cinematic 1200ms`

## Principles
1. Animate `transform`, `opacity`, `clip-path` only. Glows = pseudo-element opacity.
2. Interruptible: hovers reverse smoothly mid-flight (`gsap.quickTo`, springs).
3. Velocity-aware: Lenis scroll velocity drives row skew; pointer velocity drives cursor stretch.
4. Staggers 30–60ms, max 8 items, then group.
5. Exits ≈ 70% of entrance duration.
6. Reduced motion (OS setting OR in-app toggle) → crossfades only, no parallax, no smooth scroll, native cursor. Central hook: `useMotionPrefs()`.

## Film vocabulary (reuse these, don't invent random effects)
- **Shutter wipe** — bars close/open
- **Projector flicker** — 2–3 opacity pulses on reveal
- **Letterbox** — top/bottom bars slide in for focus modes
- **Sprocket strip** — perforated edge on carousels
- **Film burn** — WebGL dissolve between pages
- **Countdown leader** — 3-2-1 circle for preloader
