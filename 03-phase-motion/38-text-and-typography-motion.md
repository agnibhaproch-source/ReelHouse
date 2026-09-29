# 38 — Text & Typography Motion

## Primitives
- `<SplitHeading>` — SplitText lines in masks; words or chars rise with 30ms stagger; re-split on resize (`autoSplit`).
- `<ScrambleText>` — characters scramble through random glyphs before settling (used for meta like runtime, "Loading").
- `<Typewriter>` — search placeholder cycle.
- `<VariableHover>` — Fraunces `wght`/`SOFT` interpolation toward pointer proximity per character (proximity effect, like a magnifier).
- `<Marquee>` — infinite, velocity-reactive, pause on hover.
- `<Counter>` — numbers roll like an odometer (each digit is a vertical strip).

## Where used
| Place | Effect |
|---|---|
| Page h1s | SplitHeading chars |
| Section h2s | SplitHeading words |
| Hero overview | lines |
| Detail overview | ScrubText (32) |
| Ratings, runtime, revenue | Counter |
| Footer wordmark | VariableHover |
| 404 title | ScrambleText loop |

## Rules
- Split text keeps accessible text: original in `aria-label`, splits `aria-hidden`.
- Never split body paragraphs longer than 3 lines by char (perf) — use lines.

## Acceptance
- [ ] Screen reader reads headings normally
- [ ] No layout shift after split
