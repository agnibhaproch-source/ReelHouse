# Reelhouse — Master Build Spec

A cinematic movie-discovery website (Netflix / Hotstar class) with Lusion-level motion: custom film cursor, smooth scroll, scroll-driven scenes, hover/click/page-transition animation on every surface.

## How to use these files
1. Work strictly in order. Never skip a phase — later files assume earlier ones exist.
2. Feed ONE file at a time to your AI coding agent (e.g. Claude Code in VS Code). Start each session with:
   > Read `00-overview/*` fully. Then implement `<file>` exactly. Do not implement anything from other phase files. When done, run the file's Acceptance Checklist and report each item as pass/fail.
3. Commit after every file: `git commit -m "feat(<file-id>): ..."`.
4. Do not start the next file until every checklist item passes.

## File map
| Phase | Files | Goal |
|---|---|---|
| 00 Overview | 00–06 | Vision, stack, design system, motion language, structure, rules |
| 01 Foundation | 10–15 | Repo, TMDB data layer, tokens, routing, primitives, state |
| 02 Core UI | 20–28 | Navbar, hero, card, rows, detail page, search, browse, footer |
| 03 Motion | 30–41 | Cursor, smooth scroll, scroll scenes, hover, click, transitions, preloader, WebGL, text, micro-interactions, sound, loading |
| 04 Features | 50–57 | Auth, profiles, watchlist, recs, trailer player, reviews, history, settings |
| 05 Polish | 60–68 | A11y, perf, mobile, SEO, errors, testing, analytics, deploy, final QA |

## Estimated timeline (solo, part-time)
- Phase 00–01: 2 weeks
- Phase 02: 3–4 weeks
- Phase 03: 4–6 weeks (the hard, fun part)
- Phase 04: 3–4 weeks
- Phase 05: 2–3 weeks
Total: ~3.5–5 months.

## Legal note on movie images
All posters, backdrops, logos and trailers come from the **TMDB API** (free, requires attribution) and **YouTube embeds**. Never scrape Netflix/Hotstar or rehost images. See `11-tmdb-data-layer.md`.
