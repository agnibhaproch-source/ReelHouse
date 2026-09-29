# 56 — History & "Continue Exploring"

- Track viewed detail pages and played trailers per profile: `history(profile_id, movie_id, kind, at)`.
- Home row "Continue exploring": last 12 viewed; cards show a thin progress-style line indicating trailer watched %.
- "Remove from row" via card menu (fades and closes gap).
- Settings → clear history (confirm dialog).
- Guests: localStorage only.

## Acceptance
- [ ] Row hidden when empty
- [ ] Clearing history updates home without reload
