# 21 — Hero Billboard

## Content
Rotate through top 5 trending movies with a good backdrop + English logo. Server-rendered first slide.

## Layout
- Full-bleed backdrop (`original`), `100svh`, bottom gradient into `--bg-void`, side vignette.
- Bottom-left: movie **logo image** (fallback: Fraunces title), 2-line overview, meta (year, rating, runtime, genres), buttons "Play trailer" (primary) and "More info" (secondary).
- Bottom-right: slide indicators as thin film-frame bars with a fill progress (8s per slide).
- Mute/unmute icon if trailer autoplay (stretch goal).

## Motion
- First load (after preloader): backdrop scales 1.15 → 1 over 1.8s `ease-reel`; logo reveals by clip-path left→right; overview lines rise via SplitText masks (stagger 60ms); buttons pop with `ease-snap`.
- Slide change: current backdrop shutter-wipes out (two bars meet in middle) → next backdrop revealed; text exits upward then new text enters. (WebGL displacement version in 37.)
- Parallax: backdrop moves at 0.4× scroll; text block at 0.8× and fades out by 60% scroll.
- Mouse parallax: backdrop shifts ±12px following pointer (gsap.quickTo, 0.8s).
- Progress bar pauses when hovered or tab hidden (`visibilitychange`).
- Keyboard: ←/→ change slides when hero focused.

## Acceptance
- [ ] LCP is the hero image, priority-loaded, < 2.5s on 4G throttling
- [ ] No layout shift when logo loads (reserve box)
- [ ] Auto-advance stops on hover/focus/hidden tab
