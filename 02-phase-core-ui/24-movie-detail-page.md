# 24 — Movie Detail Page `/movie/[id]`

## Sections (scroll order)
1. **Backdrop hero** — full-bleed backdrop, ambient light tinted by dominant color bleeding into page background; poster, logo/title, tagline, meta, rating ring, genres, buttons (Play trailer, Add to list, Rate, Share).
2. **Overview** — large Fraunces paragraph that reveals word-by-word as you scroll (opacity 0.15 → 1 tied to scroll).
3. **Cast** — horizontal strip of circular portraits; hover: portrait scales, name slides up, character name fades in; click → `/person/[id]`.
4. **Trailers & clips** — thumbnails grid; hover: thumbnail zoom + play icon pulses; click → trailer player (54).
5. **Details** — director, writers, budget, revenue, release dates, language, runtime. Numbers count up when visible.
6. **Where to watch** — TMDB watch providers for user region (IN default) with provider logos + JustWatch attribution.
7. **Reviews** — TMDB reviews + site reviews (55).
8. **Gallery** — backdrops in a horizontal pinned scroll scene (vertical scroll drives horizontal movement).
9. **More like this** — recommendations row.

## Motion
- Entry via shared poster transition from card (35).
- Backdrop: slow Ken Burns (scale 1 → 1.08 over 20s, ambient L3).
- Section headings: SplitText char reveal.
- Rating ring draws its stroke on enter.

## Data
Server component; `generateMetadata` with OG image (backdrop). `generateStaticParams` for top 100 trending; ISR 24h.

## Acceptance
- [ ] Handles missing backdrop/logo/trailer/cast gracefully
- [ ] OG preview correct when shared
- [ ] Gallery pin releases cleanly on mobile (disable pin < 768px)
