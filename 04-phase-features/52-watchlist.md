# 52 — My List (Watchlist)

## DB
`watchlist(profile_id, movie_id int, added_at, primary key(profile_id, movie_id))`
Store minimal movie snapshot (title, poster_path) to render without TMDB call.

## UX
- Add/remove from card preview, detail page, trailer player (feedback in 34).
- Optimistic updates via TanStack Query mutation with rollback.
- `/my-list`: grid with sort (recently added, title, rating); drag to reorder (custom order column) with smooth reflow; remove with Flip collapse + undo toast.
- Empty state: "Your list is empty. Add movies with the + button on any title." + trending row.
- Guest users: store in localStorage; merge into account on login (dialog: "Keep the 4 titles you saved?").

## Acceptance
- [ ] Works offline (queued) and syncs later
- [ ] No duplicate entries after merge
