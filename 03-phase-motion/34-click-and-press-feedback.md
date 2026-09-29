# 34 — Click & Press Feedback

## Global
- `<Pressable>` wrapper / `usePress()` hook: on pointerdown scale 0.96 (`ease-snap`, 120ms); on pointerup spring to 1.
- **Projector ripple**: circle expands from click point inside element (clip-path circle, 500ms), color = element accent at 25%.
- Cursor flash (30).
- Optional sound tick (40).

## Specific moments
| Action | Feedback |
|---|---|
| Add to my list | plus morphs to check (SVG path morph); 6 tiny confetti "film frames" burst; toast "Added to my list" |
| Remove from list | check morphs to plus; card collapses out of grid (Flip); toast with "Undo" |
| Like / rate | stars fill sequentially with overshoot; rating ring animates to new value |
| Play trailer | button text slides out, spinner reel spins, then letterbox transition into player |
| Share | icon shoots up; "Link copied" toast |
| Toggle (sound/motion) | knob slides with spring; track color crossfade |
| Tabs | active indicator slides (layoutId) |
| Submit form | button width morphs into circle spinner → check or shake on error |
| Error | element shakes (x: 0,-8,8,-6,6,0 over 400ms) + red hairline flash |

## Rules
- Feedback appears ≤ 100ms after input (optimistic UI).
- Double-click never double-submits (disable during pending).

## Acceptance
- [ ] Every button in the app uses Pressable
- [ ] Optimistic updates roll back visibly on failure
