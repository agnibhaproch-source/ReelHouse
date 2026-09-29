# 02 — Design System

## Identity: "The Projection Room"
A dark theatre. Light comes from the screen (content) and spills onto the UI. Accents are neon-marquee tones. Everything else stays quiet so posters carry the color.

## Color tokens
| Token | Hex | Use |
|---|---|---|
| `--bg-void` | `#08080d` | Page background |
| `--bg-seat` | `#12121a` | Raised surfaces |
| `--bg-aisle` | `#1c1c27` | Inputs, modals |
| `--line` | `#2a2a3a` | Hairlines |
| `--text-reel` | `#EDE8DF` | Primary text (warm projector white) |
| `--text-dim` | `#8C8A9B` | Secondary text |
| `--marquee-violet` | `#8B5CFF` | Primary accent, CTAs, focus |
| `--marquee-cyan` | `#3FE0FF` | Progress, links, secondary accent |
| `--projector-amber` | `#FFB547` | Ratings, "new" |
| `--danger` | `#FF4D6D` | Errors, remove |

Gradients represent light, not decoration: radial spotlights appear only where the cursor or focus is.

## Typography
- **Display:** Fraunces (variable: wght, opsz, SOFT). Titles and headings. Weight + SOFT animate on hover.
- **UI/body:** Manrope (variable).
- Load with `next/font/google`, `display: swap`.

| Token | Size |
|---|---|
| `--fs-hero` | `clamp(3rem, 8vw, 8.5rem)` |
| `--fs-h1` | `clamp(2.25rem, 5vw, 4.5rem)` |
| `--fs-h2` | `clamp(1.5rem, 3vw, 2.5rem)` |
| `--fs-h3` | `1.25rem` |
| `--fs-body` | `1rem`, line-height 1.6 |
| `--fs-small` | `0.8125rem` |

Rules: sentence case. No all-caps labels. Body ≤ 70ch.

## Spacing & radius
- 4px grid: `--space-1` (4px) … `--space-12` (96px).
- Radius by hierarchy: poster `6px`, modal `16px`, pill `999px`, hero `0`.

## Elevation
No grey drop shadows. A hovered card glows with its poster's dominant color (see 33).

## Texture
- Animated film grain overlay, ~4% opacity, `pointer-events: none`.
- Vignette on hero and modals.

## Deliverable
`src/styles/tokens.css` mapped into Tailwind v4 `@theme`. A `/styleguide` route showing every token, type style, and component state.
