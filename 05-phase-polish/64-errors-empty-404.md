# 64 — Errors, Empty States & 404

- **404:** "This reel is missing." Film strip with a torn frame; ScrambleText title; search input + trending row. Cursor wanders to show "Lost".
- **500 / error.tsx:** "Something broke in the projection room." Retry button (calls `reset()`), link home. Log to monitoring.
- **TMDB down:** cached content shown with banner "Showing saved results. Live data is unavailable right now."
- **Empty states:** list, search, history, reviews — each with one clear action.
- Error copy: states what happened + what to do. No apologies, no vague "Oops".

## Acceptance
- [ ] Every route has an error boundary
- [ ] Simulated TMDB failure doesn't white-screen
