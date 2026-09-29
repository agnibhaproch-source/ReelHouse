# 26 — Browse by Genre & Language

## `/browse/[genre]` and `/language/[code]`
- Header: huge Fraunces genre name, background = slow crossfading collage of top 6 backdrops in that genre, darkened.
- Sort chips: Popular, Top rated, Newest, A–Z.
- Filter drawer: year range slider, rating slider, language (for genre pages), runtime.
- Grid (auto-fill, min 160px). Infinite scroll with sentinel. Items reveal in batches.
- Changing sort/filter: grid reorders with GSAP Flip (items glide to new positions, new ones fade/scale in, removed ones scale out).

## Genre index
`/browse` shows all genres as big typographic tiles; hover reveals a poster fan behind the word (3 posters rotate out like cards in hand).

## Acceptance
- [ ] Filters in URL search params
- [ ] Flip animation holds 60fps with 60 items (fallback to fade if > 60)
