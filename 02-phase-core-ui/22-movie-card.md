# 22 — Movie Card (the most important component)

## Static
- Poster 2:3, radius 6px, `next/image` w342, blur placeholder.
- Below (visible on hover only on desktop, always on mobile): title, year, rating ring.
- Badges: "New" (amber) if release < 30 days; rank number (big Fraunces numeral outline) for Top 10 rows.

## Hover (desktop, pointer: fine)
Stage 1 — immediate (0ms):
- Card lifts: `scale 1.06`, `translateZ` via 3D tilt following pointer (max 8°), `ease-reel` 400ms.
- Glow: pseudo-element with dominant poster color, blur 40px, opacity 0 → 0.55.
- Glare: diagonal white gradient follows pointer (CSS vars `--mx`, `--my`).
- Neighbours in row shift away 12px (Flip or transform on siblings).
- Cursor → `play` mode with label "Preview".

Stage 2 — after 450ms hover intent:
- Card expands into **preview panel** (Motion `layoutId`, portal to body to escape overflow): backdrop replaces poster, logo/title, buttons (play, add to list, like, more), match %, runtime, 3 genres.
- Prefetch detail data.
- Optional muted trailer autoplay after 1.5s (stretch).

Leave: everything reverses, interruptible at any point.

## Click
- Press: scale 0.97 (`ease-snap`), ripple from click point (34).
- Navigate to `/movie/[id]` with **shared-element transition**: poster flies into detail page poster position (35).

## Focus (keyboard)
Same as Stage 1 minus tilt; Enter opens detail; Space opens preview.

## Touch
No hover states. Tap → navigate. Long-press → preview sheet.

## Loading
Skeleton with shimmer sweep matching card size.

## Acceptance
- [ ] Hover in/out rapidly 20 times — no stuck states
- [ ] Preview never clipped by row overflow
- [ ] Tilt disabled with reduced motion
- [ ] 60fps with 40 cards on screen (performance panel)
