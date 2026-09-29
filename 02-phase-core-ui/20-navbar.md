# 20 — Navbar

## Layout
Left: wordmark "Reelhouse" (Fraunces). Center: Home · Movies by genre (mega menu) · Languages (mega menu) · My list. Right: search icon, sound toggle, motion toggle, profile avatar.

## Behavior
- Transparent over hero; after 80px scroll → `--bg-void` at 70% + `backdrop-filter: blur(16px)` + bottom hairline fades in (animate a pseudo-element's opacity).
- Hides on scroll down (translateY −100%, `ease-shutter`, 300ms), reveals on scroll up (`ease-reel`, 450ms). Driven by Lenis direction.
- Active link: a thin cyan underline that **slides** between links (Motion `layoutId`).
- Link hover: text rolls — current label slides up, duplicate slides in from below (overflow hidden, 2 stacked spans).
- Mega menu: opens with shutter wipe (clip-path inset from top), items stagger 40ms, each genre shows a tiny poster collage fading in.
- Wordmark hover: Fraunces `SOFT` 0→100 and `wght` 600→800 over 400ms.
- Search icon click: icon morphs into an expanding input (width via scaleX on a wrapper + clip-path), focus auto.
- Profile avatar: dropdown with spring scale from top-right origin.
- Mobile (<768px): hamburger → full-screen menu; lines animate into an X; links reveal with SplitText line masks.

## Acceptance
- [ ] Hide/reveal never flickers at page top
- [ ] Underline slides smoothly between any two links
- [ ] Mega menus fully keyboard operable (arrow keys, Esc)
- [ ] Mobile menu traps focus
