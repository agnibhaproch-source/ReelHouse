# 40 — Sound Design

## Rules
- **Off by default.** Enabled via navbar toggle (speaker icon animates sound waves). Preference persisted.
- Never autoplay audio before user gesture.
- Master volume 0.35; each sound ≤ 300ms except ambient.
- Sound is its own setting (independent of reduced motion). Mute when tab is hidden.

## Sound sprite (`public/sounds/ui.webm` + `.mp3` fallback) via Howler
| Name | Trigger |
|---|---|
| `tick` | card hover (throttled 80ms) — soft film-advance click |
| `press` | button press |
| `whoosh` | page transition shutter |
| `pop` | add to list |
| `projector` | preloader + trailer open (looping hum, fades) |
| `error` | form error |
| `toggle` | switches |

Source: create or license royalty-free sounds (e.g., freesound.org CC0). Document licenses in `docs/CREDITS.md`.

## Acceptance
- [ ] Zero sound before explicit toggle
- [ ] No audio overlap cacophony (limit concurrent instances to 3)
