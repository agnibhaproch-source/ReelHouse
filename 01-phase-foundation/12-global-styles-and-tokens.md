# 12 — Global Styles & Tokens

## Tasks
1. `src/styles/tokens.css` — every token from `02-design-system.md` and `03-motion-language.md` as CSS custom properties on `:root`.
2. Tailwind v4 `@theme` mapping so `bg-void`, `text-reel`, `ease-reel`, `duration-base` etc. exist.
3. `globals.css`:
   - `color-scheme: dark`, `background: var(--bg-void)`, font smoothing
   - Custom `::selection` (violet bg, reel text)
   - Custom scrollbar (thin, `--line` track, violet thumb on hover) — hidden when Lenis active
   - `:focus-visible` ring token
   - `html.reduced-motion *` → transitions/animations ≤ 1ms except opacity crossfades
4. `src/lib/gsap.ts` — register ScrollTrigger, SplitText, Flip, CustomEase; create named eases matching tokens; export `gsap`. Import once in a client provider.
5. `useMotionPrefs()` — reads `matchMedia('(prefers-reduced-motion: reduce)')` + Zustand `ui.reducedMotion`; toggles `html.reduced-motion`; exposes `{ reduced }`.
6. `/styleguide` page: swatches, type scale, eases visualized as moving dots, duration comparisons.

## Acceptance
- [ ] Changing a token updates both CSS and Tailwind classes
- [ ] Styleguide shows every token
- [ ] Toggling OS reduced motion flips `html.reduced-motion` live
