# 25 — Search

## Entry points
Navbar icon, `/` key, `Cmd/Ctrl+K`.

## Overlay search (command palette style)
- Opens as fullscreen dim + centered panel; letterbox bars slide in top/bottom.
- Input with large Fraunces placeholder cycling example queries (typewriter effect).
- Debounce 250ms → `/api/tmdb/search/multi`. Results grouped: Movies, People.
- Results stagger in (30ms); arrow keys move highlight (highlight bar slides with `layoutId`); Enter navigates.
- Recent searches (localStorage) with remove animation (collapse height via Motion).
- Empty state: "No matches for 'xyz'. Try a title, actor, or director." + trending suggestions.

## `/search?q=` page
Full results grid with filters (genre, year, language, rating) as chips; infinite scroll; grid items animate position on filter change (Flip).

## Acceptance
- [ ] Race conditions handled (abort previous request)
- [ ] Fully keyboard operable, `role="combobox"` / `listbox` ARIA
- [ ] URL reflects query and filters (shareable)
