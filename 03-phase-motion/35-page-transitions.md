# 35 — Page Transitions

## Default transition: "Shutter"
1. Link click → cursor `loading` mode.
2. Two panels (top & bottom, `--bg-seat`) close to the center line (`ease-shutter`, 500ms). A thin cyan light line flashes at the seam.
3. Route loads behind (Next `router.push`; wait for new page `useEffect` ready signal).
4. Panels open (`ease-reel`, 700ms); new page's intro timeline starts at 60% of open.

Implementation: `TransitionLayer` fixed overlay + `TransitionLink` component that intercepts navigation; or View Transitions API (`next/view-transitions` / `document.startViewTransition`) with CSS fallback. Pick one, document in DECISIONS.md.

## Shared-element: card → detail
- On card click, capture poster rect; clone poster into overlay; navigate; on detail mount, animate clone to detail poster rect (GSAP Flip or View Transition `view-transition-name: poster-{id}`); crossfade to real element.
- Backdrop fades in behind while poster flies.

## Back navigation
Reverse: detail poster flies back to its card if card is in viewport; otherwise default shutter.

## Special transitions
- Into trailer player → letterbox bars + dim (54).
- Into auth pages → film burn WebGL dissolve (37).

## Rules
- Total perceived transition ≤ 1.2s.
- Never block navigation if animation fails (timeout fallback 1.5s).
- Reduced motion → 200ms crossfade.
- Update `document.title` and move focus to `<h1>` after transition; announce via aria-live.

## Acceptance
- [ ] Browser back/forward works mid-transition
- [ ] Rapid double-click on links doesn't stack transitions
- [ ] Shared poster lands pixel-aligned
