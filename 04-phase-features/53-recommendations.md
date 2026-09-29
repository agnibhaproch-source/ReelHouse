# 53 — Recommendations

## Sources
1. TMDB `/movie/{id}/recommendations` for last 5 watchlisted/liked titles → merge, dedupe, rank by frequency × popularity.
2. Genre affinity: count genres in likes/watchlist → `discover` with top 2 genres.
3. Language affinity: dominant original_language → language row.

## Rows generated
"Because you added X", "More [genre] for you", "Popular in [language]".

## Tech
Server action computes and caches per profile (revalidate 6h). Exclude titles already in list.

## Acceptance
- [ ] New profile gets sensible default rows (trending) with no errors
- [ ] Rows update after adding 3+ titles
