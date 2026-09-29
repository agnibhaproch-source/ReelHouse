# 68 — Final QA Checklist (ship gate)

## Motion
- [ ] Custom cursor works in every mode; restores after every navigation
- [ ] Smooth scroll + all pinned scenes solid after resize
- [ ] Every button, link, card, chip, icon has hover + focus + press animation
- [ ] Page transitions on every route, shared poster card → detail
- [ ] Preloader first visit only, skippable
- [ ] WebGL on/off both perfect
- [ ] Reduced motion mode fully calm
- [ ] Every item in `39-micro-interactions.md` present

## Content
- [ ] Real TMDB posters/backdrops/logos everywhere, zero broken images
- [ ] Language rows populated (hi, ta, te, ml, kn, ko, ja, en…)
- [ ] TMDB + JustWatch attribution visible

## Quality
- [ ] Lighthouse: Perf ≥ 90 desktop / ≥ 80 mobile, A11y 100, SEO 100, Best practices 100
- [ ] 60fps recordings of home scroll, card hover, transition
- [ ] Keyboard-only and VoiceOver passes
- [ ] Safari, Chrome, Firefox, Edge; iOS Safari; Android Chrome
- [ ] No console errors or warnings

## Portfolio
- [ ] 60-second showcase video
- [ ] README + LinkedIn post draft
- [ ] Case study page on your portfolio
