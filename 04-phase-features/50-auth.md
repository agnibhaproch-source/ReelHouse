# 50 — Authentication (Supabase)

## Methods
Email + password, magic link, Google OAuth.

## Pages
`/login`, `/signup`, `/forgot-password`, `/auth/callback`.

## Design
- Split screen: left = slow-moving wall of posters (3 columns scrolling opposite directions, infinite, tilted −8°); right = form panel (glass on `--bg-aisle`).
- Entry via film-burn transition (37).
- Inputs with floating labels (39); password strength meter bar fills with color stages; show/hide eye blinks.
- Submit button morph (34). Errors: plain, specific ("That email already has an account. Log in instead.").

## Tech
- `@supabase/ssr` for cookies; middleware refreshes session.
- Protected routes: `/my-list`, `/profiles`, `/account` → redirect to `/login?next=`.
- Zod schemas shared client/server.

## Acceptance
- [ ] Session persists across refresh
- [ ] OAuth callback returns to `next` path
- [ ] Rate-limit feedback shown clearly
