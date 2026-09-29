# 04 — Project Structure

```
reelhouse/
├─ src/
│  ├─ app/
│  │  ├─ (site)/
│  │  │  ├─ page.tsx                 # Home
│  │  │  ├─ movie/[id]/page.tsx
│  │  │  ├─ browse/[genre]/page.tsx
│  │  │  ├─ language/[code]/page.tsx
│  │  │  ├─ search/page.tsx
│  │  │  ├─ person/[id]/page.tsx
│  │  │  └─ my-list/page.tsx
│  │  ├─ (auth)/login | signup | profiles
│  │  ├─ styleguide/page.tsx
│  │  ├─ api/                        # TMDB proxy route handlers
│  │  ├─ layout.tsx
│  │  └─ template.tsx                # page transition wrapper
│  ├─ components/
│  │  ├─ ui/       # Button, Pill, Input, Modal, Tooltip, Toast
│  │  ├─ movie/    # MovieCard, Row, Hero, Rating, CastStrip
│  │  ├─ layout/   # Navbar, Footer, Grain, Letterbox
│  │  ├─ motion/   # Cursor, SmoothScroll, Reveal, SplitHeading, Magnetic
│  │  └─ gl/       # HeroCanvas, CardRipple, FilmBurn
│  ├─ lib/ (tmdb/, supabase/, gsap.ts, sound.ts)
│  ├─ hooks/ (useMotionPrefs, useLenis, useCursor, useDominantColor)
│  ├─ stores/ (cursor.ts, ui.ts, sound.ts)
│  ├─ styles/ (tokens.css, globals.css)
│  └─ shaders/ (*.glsl)
├─ public/ (sounds/, og/)
├─ tests/ (unit/, e2e/)
└─ docs/ (DECISIONS.md, CHANGELOG.md)
```
One component per file. Hooks `useX`. CSS Modules only when Tailwind can't express it.
