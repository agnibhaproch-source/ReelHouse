# 23 — Carousel Rows

## Rows on home (in order)
Trending now · Top 10 today (ranked) · Popular in India · New releases · Top rated · by language (Hindi, Tamil, Telugu, Malayalam, Korean, Japanese) · by genre (Action, Comedy, Horror, Sci-fi, Romance, Animation, Thriller) · Because you liked X (after 53) · Continue exploring (after 56).

## Behavior
- Horizontal scroll with native scroll-snap on touch; on desktop, arrow buttons + drag (pointer events with inertia) + trackpad horizontal wheel.
- Arrow buttons appear on row hover (fade + slide 8px), magnetic (33).
- Page by visible width with `ease-projector` 800ms.
- Cursor over row track → `drag` mode ("Drag").
- While dragging: cards skew by velocity (max 6°), spring back on release.
- Page indicator: small bars top-right of row.
- Sprocket strip: optional perforated edge line above row, scrolls at 1.2× for parallax.
- Lazy-load row data when within 600px of viewport (IntersectionObserver), render skeleton row until then.
- Infinite: rows load next page when reaching end.

## Row title
Fraunces h2; hover reveals "See all" link sliding in from the left with arrow icon drawing (stroke-dashoffset).

## Scroll entrance
Rows reveal as they enter: title clip-path reveal, cards stagger up 40px + fade (max 8 staggered, rest instant).

## Acceptance
- [ ] Works with mouse, trackpad, keyboard (Tab through cards, arrows scroll), touch
- [ ] Drag doesn't trigger card click (distance threshold 6px)
- [ ] Only visible rows fetch data
