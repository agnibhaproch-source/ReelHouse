# 55 — Reviews & Ratings

## DB
`ratings(profile_id, movie_id, score smallint 1–10, created_at)`
`reviews(id, profile_id, movie_id, body text ≤ 2000, spoiler bool, created_at, updated_at)`
`review_likes(review_id, profile_id)`

## UX
- Rate: 5 stars (half-steps) with hover preview; animated fill (34).
- Site average vs TMDB average shown as two rings.
- Write review in a sheet modal; spoiler toggle blurs text until clicked (blur 8px → 0 reveal).
- Reviews list: TMDB reviews + site reviews tabs; "Read more" expands; like with heart burst.
- Moderation: profanity filter + report button; server-side length validation.

## Acceptance
- [ ] Users can edit/delete only their own reviews (RLS)
- [ ] XSS-safe rendering (plain text, no HTML)
