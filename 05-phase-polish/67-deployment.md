# 67 — Deployment

- Vercel production on `main`; previews on PRs.
- Env vars set per environment; TMDB token server-only.
- Supabase: migrations in `supabase/migrations`, applied via CLI; separate dev and prod projects.
- Custom domain + HTTPS; security headers (CSP allowing image.tmdb.org, youtube-nocookie.com, supabase), `Referrer-Policy`, `Permissions-Policy`.
- ISR revalidation verified; on-demand revalidate endpoint (secret-protected).
- README with screenshots, GIFs of cursor/hover/transitions, tech stack, architecture diagram, and TMDB attribution.

## Acceptance
- [ ] Production Lighthouse run saved to `docs/perf/`
- [ ] securityheaders.com grade A
